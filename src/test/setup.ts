import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron API
global.electronAPI = {
  store: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  showNotification: vi.fn(),
  openFolderDialog: vi.fn(),
  getPlatform: vi.fn(() => 'darwin'),
  minimizeWindow: vi.fn(),
  maximizeWindow: vi.fn(),
  closeWindow: vi.fn(),
  isMaximized: vi.fn(() => false),
  onAppBeforeQuit: vi.fn(),
  removeAppBeforeQuitListener: vi.fn(),
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));