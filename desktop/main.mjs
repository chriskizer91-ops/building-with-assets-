// Mooncart for Windows (and Mac or Linux): the console in its own window, no web browser.
//
// It runs the same small server the desktop tests use (tools/dev-server.mjs) inside the app,
// on this computer only, so every game gets its own address (http://<save slot>.localhost:47390/)
// and its saves stay its own, the way the phone gives each game https://<slot>.mooncart.invalid/.
// Never change the port: a game's saves belong to its address, port included.
//
// Nothing here reaches the internet: every request that isn't for this computer is cancelled.

import { app, BrowserWindow, Menu, session, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = 47390;

if (!app.requestSingleInstanceLock()) app.quit();

// *.localhost always means this computer, over IPv4 (the server listens on 127.0.0.1 only)
app.commandLine.appendSwitch('host-resolver-rules', 'MAP localhost 127.0.0.1, MAP *.localhost 127.0.0.1');

// what happened, for fixing it: %APPDATA%\Mooncart\mooncart-log.txt
const logFile = () => path.join(app.getPath('userData'), 'mooncart-log.txt');
function log(...a) {
  const line = new Date().toISOString() + ' ' + a.map(String).join(' ') + '\n';
  try { fs.mkdirSync(path.dirname(logFile()), { recursive: true }); fs.appendFileSync(logFile(), line); } catch {}
}
// if it can't start, say so and quit, rather than staying open with no window (which blocks the next try)
function fail(e) {
  log('could not start:', e && e.stack || e);
  try { dialog.showErrorBox('Mooncart could not start', String(e && e.message || e) + '\n\nDetails are in ' + logFile()); } catch {}
  app.exit(1);
}
process.on('uncaughtException', fail);

// the built-in games sit next to the app (resources/collection), or in build/collection when testing
const collection = process.env.MOONCART_COLLECTION || [path.join(process.resourcesPath || '', 'collection'), path.join(HERE, 'collection'), path.join(HERE, '..', 'build', 'collection')]
  .find((p) => fs.existsSync(path.join(p, 'collection.json'))) || path.join(HERE, 'collection');

process.env.PORT = String(PORT);
process.env.MOONCART_HOST = '127.0.0.1';
process.env.MOONCART_DESKTOP = '1';
process.env.MOONCART_COLLECTION = collection;
process.env.MOONCART_DATA = path.join(app.getPath('userData'), 'library');

let win = null;

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  // airplane mode for the app: only this computer's own addresses, and pages made in memory
  const local = /^(https?|wss?):\/\/([a-z0-9-]+\.)?localhost(:\d+)?\//i;
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => {
    const ok = local.test(d.url) || /^(data|blob|about|devtools|chrome-extension|file):/i.test(d.url);
    if (!ok) console.log('[mooncart] internet blocked: ' + d.url.slice(0, 120));
    cb({ cancel: !ok });
  });
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(['fullscreen', 'pointerLock', 'clipboard-sanitized-write', 'media'].includes(perm)));

  const server = path.join(HERE, 'tools', 'dev-server.mjs');
  // a file address, not a path: on Windows import() can't take C:\...
  await import(pathToFileURL(fs.existsSync(server) ? server : path.join(HERE, '..', 'tools', 'dev-server.mjs')).href);
  log('started; games from', collection);

  win = new BrowserWindow({
    width: 1280, height: 760, minWidth: 480, minHeight: 320,
    backgroundColor: '#0b0a16', title: 'Mooncart', autoHideMenuBar: true, show: false,
    icon: path.join(HERE, 'icon.png'),
    webPreferences: { preload: path.join(HERE, 'preload.cjs'), contextIsolation: true, sandbox: false, backgroundThrottling: false },
  });
  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', (e) => e.preventDefault());
  // games open no other windows; links to websites go nowhere (no internet)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => { if (!local.test(url)) e.preventDefault(); });
  // F11 or Alt+Enter: full screen. Ctrl+Shift+I: the developer tools, for fixing a game.
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.control && input.shift && input.key.toLowerCase() === 'i') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  await loadConsole();
}).catch(fail);

async function loadConsole(tries = 40) {
  try { await win.loadURL(`http://localhost:${PORT}/`); }
  catch (e) { if (tries > 0) { await new Promise((r) => setTimeout(r, 250)); return loadConsole(tries - 1); } throw e; }
}

ipcMain.on('mooncart-quit', () => app.quit());

app.on('window-all-closed', () => app.quit());
