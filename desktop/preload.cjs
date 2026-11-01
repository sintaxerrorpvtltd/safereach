const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pokiDesktop', Object.freeze({
  setEnabled: value => ipcRenderer.invoke('poki:enabled', value),
  showHello: value => ipcRenderer.invoke('poki:show', value)
}));
