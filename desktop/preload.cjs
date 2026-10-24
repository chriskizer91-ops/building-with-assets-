// Only the console page gets this (games run in frames, which don't): a way to quit the app.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mooncartDesktop', { quit: () => ipcRenderer.send('mooncart-quit') });
