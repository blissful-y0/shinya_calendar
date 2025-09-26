/// <reference types="vite/client" />

interface ElectronAPI {
  getAppPath: () => Promise<string>;
  resizeWindow: (width: number, height: number) => Promise<{ width: number; height: number }>;
  onAppBeforeQuit: (callback: () => void) => void;
  removeAppBeforeQuitListener: (callback: () => void) => void;
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    has: (key: string) => Promise<boolean>;
  };
}

interface Window {
  electronAPI: ElectronAPI;
}