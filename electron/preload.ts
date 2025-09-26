import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  storage: {
    save: (key: string, data: any) => ipcRenderer.invoke('storage-save', key, data),
    load: (key: string) => ipcRenderer.invoke('storage-load', key),
    delete: (key: string) => ipcRenderer.invoke('storage-delete', key)
  }
});