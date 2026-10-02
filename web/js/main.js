// Starts Mooncart and routes every button press to whatever is on screen: the game picker,
// the running game, the in-game menu or the library.

import { native } from './native.js';
import { settings, library } from './store.js';
import { ConsoleView } from './consoleview.js';
import { SelectScreen, GameMenu, playBoot, toast } from './screen.js';
import { GameHost } from './game.js';
import { LibraryView } from './library-ui.js';
import { closeMenus } from './menu.js';
import { dialogOpen, closeTopDialog } from './dialogs.js';
import { setSoundsEnabled, unlockAudio, sfx } from './sound.js';
import { installIcons } from './icons.js';

const VERSION = '0.1.0';
const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);

async function start() {
  installIcons();
  await settings.load();
  await library.load();
  setSoundsEnabled(settings.get('sounds'));

  const touch = params.has('touch') ? params.get('touch') !== '0' : native.platform === 'android' || matchMedia('(pointer: coarse)').matches;
  const fill = params.has('fill') ? params.get('fill') !== '0' : native.platform === 'android' || touch;

  const view = new ConsoleView({ canvas: $('art'), screen: $('screen'), pads: $('pads') });
  const game = new GameHost({ stage: $('stage'), loading: $('loading'), flash: $('flash'), library });
  game.getRect = () => view.screenRect;
  const gameMenu = new GameMenu($('overlay'));
  const picker = new SelectScreen($('select'), {
    library, settings, native,
    onLaunch: (id) => launch(id),
    onOpenMenu: () => openLibrary(),
  });
  const lib = new LibraryView($('library'), {
    library, game, version: VERSION,
    onClose: (folder) => libraryClosed(folder),
    onPlay: (id) => { lib.close(); launch(id); },
  });

  const own = (k) => (game.playing && game.playing.opts ? game.playing.opts[k] : undefined);
  const shapeNow = () => own('shape') || settings.get('shape');
  const frameNow = () => (own('frame') ?? settings.get('frame'));
  const configure = () => view.configure({
    theme: settings.get('theme'), name: settings.get('name'), frame: frameNow(), shape: shapeNow(), touch, fill,
  });
  configure();
  native.setOrientation(settings.get('orientation'));
  native.setKeymap(game.keymap());

  settings.events.on('change', (patch) => {
    if ('sounds' in patch) setSoundsEnabled(patch.sounds);
    if (['theme', 'name', 'frame', 'shape'].some((k) => k in patch)) configure();
    if ('orientation' in patch && !(game.playing && game.playing.opts && game.playing.opts.orientation)) native.setOrientation(patch.orientation);
    if ('keymap' in patch) native.setKeymap(game.keymap());
    if (('sort' in patch) && picker.visible) picker.render();
  });
  library.events.on('change', () => { if (picker.visible) picker.render(); });

  game.events.on('starting', (item) => {
    picker.hide();
    view.busy = true;
    view.setCart(item.name, true);
    view.setLed('blink');
    sfx('insert');
    configure();
    document.title = item.name + ' — Mooncart';
  });
  game.events.on('loaded', (item) => {
    view.setLed('on');
    if (!frameNow() && !item.toldBack) { toast('Game menu: the phone’s Back button'); item.toldBack = true; }
  });
  game.events.on('stopped', () => {
    view.busy = false;
    view.setCart(null);
    view.setLed('on');
    configure();
    document.title = 'Mooncart';
  });

  async function launch(id) {
    unlockAudio();
    gameMenu.close();
    await game.launch(id);
  }

  async function quitToList() {
    gameMenu.close();
    const it = game.playing;
    await game.quit();
    picker.show(it && library.exists(it.id) ? it.parent : undefined);
    if (it) picker.pick(it.id);
  }

  function openLibrary() {
    if (lib.isOpen) return;
    gameMenu.close();
    sfx('open');
    if (game.playing) game.setHidden(true);
    lib.open(picker.folder);
  }

  function libraryClosed(folder) {
    if (game.playing) {
      game.setHidden(false);
      game.focus();
    } else {
      picker.show(folder);
    }
  }

  async function openGameMenu() {
    if (!game.playing || gameMenu.open) return;
    const frameOn = frameNow();
    const choice = await gameMenu.show(game.playing.name, [
      { label: 'Keep playing', value: 'resume' },
      { label: 'Restart the game', value: 'restart' },
      { label: frameOn ? 'Hide the console for this game' : 'Show the console for this game', value: 'frame' },
      { label: 'Library', value: 'library' },
      { label: 'Quit to the game list', value: 'quit' },
    ]);
    switch (choice) {
      case 'restart': await game.restart(); break;
      case 'frame':
        library.setOpts(game.playing.id, { frame: !frameOn === settings.get('frame') ? null : !frameOn });
        configure();
        game.focus();
        toast(frameOn ? 'Console hidden. Game menu: the phone’s Back button.' : 'Console shown');
        break;
      case 'library': openLibrary(); break;
      case 'quit': await quitToList(); break;
      default: game.focus(); break;
    }
  }

  // ---------------------------------------------------------------- routing
  function route(btn, down, source) {
    if (lib.isOpen || dialogOpen()) return;
    if (down && source === 'touch' && settings.get('haptics')) native.vibrate(8);
    if (gameMenu.open) { if (down) gameMenu.input(btn); return; }
    if (game.playing) {
      if (btn === 'home') { if (down) openGameMenu(); return; }
      if (btn === 'menu') { if (down) openLibrary(); return; }
      game.button(btn, down);
      return;
    }
    if (!down) return;
    unlockAudio();
    if (btn === 'menu') return openLibrary();
    if (btn === 'home') { if (picker.folder !== library.root) { sfx('back'); picker.show(library.root); } return; }
    picker.input(btn);
  }

  view.events.on('button', (btn, down, source) => route(btn, down, source));
  // a Bluetooth or USB controller (the phone sends every button here; the game gets keys through route)
  native.on('pad', (e) => {
    if (!e || !e.btn) return;
    view.setPressed(e.btn, e.down);
    route(e.btn, e.down, 'pad');
  });
  // F1 / F4 / F5 / F11 on a keyboard plugged into the phone
  native.on('shortcut', (e) => {
    const name = e && e.name;
    if (name === 'menu') { if (lib.isOpen) lib.close(); else openLibrary(); }
    else if (name === 'home' && game.playing) openGameMenu();
    else if (name === 'restart' && game.playing) game.restart();
    else if (name === 'frame') settings.set({ frame: !settings.get('frame') });
  });
  // start a game by its name (used by the phone test: am start ... --es launch "Bogmire")
  native.on('launch', (e) => {
    const name = String((e && e.name) || '').toLowerCase();
    const g = library.games().find((x) => x.name.toLowerCase() === name) || library.games().find((x) => x.name.toLowerCase().includes(name));
    if (!g) return toast('No game called “' + name + '”');
    if (lib.isOpen) lib.close();
    launch(g.id);
  });
  // a game opened from the phone's file manager ("Open with Mooncart")
  native.on('opened', async (picked) => {
    const added = await library.addPicked(picked, library.root);
    if (!added.length) return;
    toast(`Added “${added[0].name}” to the library`);
    if (!game.playing && !lib.isOpen) { picker.show(library.root); picker.pick(added[0].id); }
  });

  const KEY_BTN = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'a', ' ': 'a', z: 'a', Z: 'a', Escape: 'b', Backspace: 'b', x: 'b', X: 'b', Tab: 'select', m: 'menu', M: 'menu' };
  addEventListener('keydown', (e) => {
    if (e.key === 'F1') { e.preventDefault(); lib.isOpen ? lib.close() : openLibrary(); return; }
    if (e.key === 'F11') { e.preventDefault(); settings.set({ frame: !settings.get('frame') }); return; }
    if (lib.isOpen || dialogOpen()) return;
    if (e.key === 'F4') { e.preventDefault(); if (game.playing) openGameMenu(); return; }
    if (e.key === 'F5') { e.preventDefault(); if (game.playing) game.restart(); return; }
    if (game.playing && !gameMenu.open) return;
    const btn = KEY_BTN[e.key];
    if (!btn) return;
    e.preventDefault();
    if (!e.repeat || ['up', 'down', 'left', 'right'].includes(btn)) { view.setPressed(btn, true); route(btn, true, 'key'); }
  });
  addEventListener('keyup', (e) => { const btn = KEY_BTN[e.key]; if (btn) view.setPressed(btn, false); });
  // keep typing going to the game after a tap on the console's plastic
  addEventListener('focus', () => { if (game.playing && !gameMenu.open && !lib.isOpen && !dialogOpen()) setTimeout(() => game.focus(), 0); });
  addEventListener('pointerdown', () => unlockAudio(), { once: true, capture: true });

  // the phone's Back button: step back one level; at the top, Android puts Mooncart away
  window.mooncartBack = () => {
    if (dialogOpen()) return closeTopDialog();
    if (document.querySelector('.dropdown')) { closeMenus(); return true; }
    if (lib.isOpen) return lib.back();
    if (gameMenu.open) { gameMenu.close(null); game.focus(); return true; }
    if (game.playing) { openGameMenu(); return true; }
    if (picker.back()) return true;
    return false;
  };
  window.mooncart = { version: VERSION, library, settings, game, picker, lib, view, launch, openLibrary, openGameMenu, quitToList };

  // ---------------------------------------------------------------- go
  native.ready();
  if (settings.get('boot') && !params.has('noboot')) await playBoot($('boot'), settings.get('name'));
  const folder = settings.get('folder');
  picker.show(folder && library.exists(folder) ? folder : library.root);
  document.body.classList.add('ready');
}

addEventListener('error', (e) => console.error('Mooncart error:', e.message, e.filename, e.lineno));
start().catch((e) => {
  console.error(e);
  document.body.append(Object.assign(document.createElement('pre'), { className: 'fatal', textContent: 'Mooncart could not start:\n' + (e && e.stack || e) }));
});
