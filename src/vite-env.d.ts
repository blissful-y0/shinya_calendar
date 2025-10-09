/// <reference types="vite/client" />

interface ElectronAPI {
  getAppPath: () => Promise<string>;
  resizeWindow: (
    width: number,
    height: number
  ) => Promise<{ width: number; height: number }>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  getPlatform: () => Promise<string>;
  onAppBeforeQuit: (callback: () => void) => void;
  removeAppBeforeQuitListener: (callback: () => void) => void;
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    has: (key: string) => Promise<boolean>;
  };
  showNotification: (options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
  }) => Promise<boolean>;
  googleOAuth: {
    start: () => Promise<{ success: boolean; code?: string; error?: string }>;
    stop: () => Promise<void>;
  };
  openExternal: (url: string) => Promise<void>;
  getAppVersion: () => Promise<string>;
  autoUpdater: {
    checkForUpdates: () => Promise<{
      available: boolean;
      updateInfo?: any;
      message?: string;
      error?: string;
    }>;
    downloadUpdate: () => Promise<{
      success: boolean;
      message?: string;
      error?: string;
    }>;
    installUpdate: () => Promise<{
      success: boolean;
      message?: string;
      error?: string;
    }>;
    onCheckingForUpdate: (callback: () => void) => () => void;
    onUpdateAvailable: (callback: (info: any) => void) => () => void;
    onUpdateNotAvailable: (callback: (info: any) => void) => () => void;
    onDownloadProgress: (callback: (progress: any) => void) => () => void;
    onUpdateDownloaded: (callback: (info: any) => void) => () => void;
    onUpdateError: (callback: (error: any) => void) => () => void;
  };
}

interface Window {
  electronAPI: ElectronAPI;
}
