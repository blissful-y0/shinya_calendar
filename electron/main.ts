import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import os from 'os';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // macOS 특정 설정
  const isMac = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // 폰트 렌더링 최적화
      webgl: true,
      experimentalFeatures: true
    },
    // 커스텀 타이틀바를 위해 기본 타이틀바 숨김
    titleBarStyle: 'hidden',
    // macOS에서 트래픽 라이트 버튼 위치 조정
    trafficLightPosition: { x: 15, y: 13 },
    backgroundColor: '#faf8f5',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});