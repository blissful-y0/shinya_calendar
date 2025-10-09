import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getAppPath: () => ipcRenderer.invoke("get-app-path"),
  resizeWindow: (width: number, height: number) =>
    ipcRenderer.invoke("resize-window", width, height),

  // 윈도우 컨트롤
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  isMaximized: () => ipcRenderer.invoke("is-maximized"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),

  // 앱 종료 전 이벤트 리스너
  onAppBeforeQuit: (callback: () => void) =>
    ipcRenderer.on("app-before-quit", callback),
  removeAppBeforeQuitListener: (callback: () => void) =>
    ipcRenderer.removeListener("app-before-quit", callback),

  store: {
    get: (key: string) => ipcRenderer.invoke("store-get", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("store-set", key, value),
    delete: (key: string) => ipcRenderer.invoke("store-delete", key),
    clear: () => ipcRenderer.invoke("store-clear"),
    has: (key: string) => ipcRenderer.invoke("store-has", key),
  },

  // Notification API
  showNotification: (options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
  }) => ipcRenderer.invoke("show-notification", options),

  // Google OAuth API
  googleOAuth: {
    start: () => ipcRenderer.invoke("google-oauth-start"),
    stop: () => ipcRenderer.invoke("google-oauth-stop"),
  },
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),

  // 앱 버전 가져오기
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // Auto Update API
  autoUpdater: {
    checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
    downloadUpdate: () => ipcRenderer.invoke("download-update"),
    installUpdate: () => ipcRenderer.invoke("install-update"),

    // 업데이트 이벤트 리스너
    onCheckingForUpdate: (callback: () => void) => {
      ipcRenderer.on("checking-for-update", callback);
      return () => ipcRenderer.removeListener("checking-for-update", callback);
    },
    onUpdateAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on("update-available", (_event, info) => callback(info));
      return () => ipcRenderer.removeListener("update-available", callback);
    },
    onUpdateNotAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on("update-not-available", (_event, info) => callback(info));
      return () => ipcRenderer.removeListener("update-not-available", callback);
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on("download-progress", (_event, progress) =>
        callback(progress)
      );
      return () => ipcRenderer.removeListener("download-progress", callback);
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
      ipcRenderer.on("update-downloaded", (_event, info) => callback(info));
      return () => ipcRenderer.removeListener("update-downloaded", callback);
    },
    onUpdateError: (callback: (error: any) => void) => {
      ipcRenderer.on("update-error", (_event, error) => callback(error));
      return () => ipcRenderer.removeListener("update-error", callback);
    },
  },
});
