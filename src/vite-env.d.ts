/// <reference types="vite/client" />

interface ElectronAPI {
  getAppPath: () => Promise<string>;
  resizeWindow: (width: number, height: number) => Promise<{ width: number; height: number }>;
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
}

interface Window {
  electronAPI: ElectronAPI;
}