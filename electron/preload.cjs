// Preload script for Electron desktop application
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
});
