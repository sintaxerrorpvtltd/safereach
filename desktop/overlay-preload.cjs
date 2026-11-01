const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pokiOverlay', Object.freeze({
  onHello: callback => { ipcRenderer.on('poki:hello', (_event, value) => callback(value)); }
}));
