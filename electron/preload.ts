import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  resizeWindow: (width: number, height: number) => ipcRenderer.invoke('resize-window', width, height),

  // 앱 종료 전 이벤트 리스너
  onAppBeforeQuit: (callback: () => void) => ipcRenderer.on('app-before-quit', callback),
  removeAppBeforeQuitListener: (callback: () => void) => ipcRenderer.removeListener('app-before-quit', callback),

  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store-delete', key),
    clear: () => ipcRenderer.invoke('store-clear'),
    has: (key: string) => ipcRenderer.invoke('store-has', key)
  }
});