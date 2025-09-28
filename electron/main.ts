import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "path";
import os from "os";
import Store from "electron-store";

// Electron Store 초기화
const store = new Store();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // macOS 특정 설정
  const isMac = process.platform === "darwin";
  const isWindows = process.platform === "win32";

  // 저장된 창 상태 복원
  const savedWindowState = store.get("windowState") as any;
  const defaultBounds = {
    width: 1400,
    height: 900,
    x: undefined,
    y: undefined,
  };

  const windowState = savedWindowState
    ? {
        width: Math.max(savedWindowState.width || defaultBounds.width, 1024),
        height: Math.max(savedWindowState.height || defaultBounds.height, 576),
        x: savedWindowState.x,
        y: savedWindowState.y,
      }
    : defaultBounds;

  mainWindow = new BrowserWindow({
    ...windowState,
    minWidth: 1024,
    minHeight: 576,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // 폰트 렌더링 최적화
      webgl: true,
      experimentalFeatures: true,
    },
    // Windows에서는 menu hide, macOS에서는 hidden 사용
    ...(isWindows ? { frame:true, autoHideMenuBar: true  } : { titleBarStyle: "hidden" }),
    // macOS에서 트래픽 라이트 버튼 위치 조정
    ...(isMac ? { trafficLightPosition: { x: 15, y: 13 } } : {}),
    backgroundColor: "#faf8f5",
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      // 저장된 창 상태 복원
      if (savedWindowState) {
        if (savedWindowState.isMaximized) {
          mainWindow.maximize();
        }
        if (savedWindowState.isFullScreen) {
          mainWindow.setFullScreen(true);
        }
      }
      mainWindow.show();
    }
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 앱 종료 전에 현재 상태 저장 요청
  mainWindow.on("close", (e) => {
    if (mainWindow) {
      // 현재 창 상태 저장
      const bounds = mainWindow.getBounds();
      store.set("windowState", {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: mainWindow.isFullScreen(),
      });

      mainWindow.webContents.send("app-before-quit");
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Store API handlers
ipcMain.handle("store-get", (_, key: string) => {
  return store.get(key);
});

ipcMain.handle("store-set", (_, key: string, value: any) => {
  store.set(key, value);
});

ipcMain.handle("store-delete", (_, key: string) => {
  store.delete(key);
});

ipcMain.handle("store-clear", () => {
  store.clear();
});

ipcMain.handle("store-has", (_, key: string) => {
  return store.has(key);
});

ipcMain.handle("get-app-path", () => {
  return app.getPath("userData");
});

// Window control handlers
ipcMain.handle("minimize-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle("maximize-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("close-window", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle("is-maximized", () => {
  if (mainWindow) {
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle("get-platform", () => {
  return process.platform;
});

// Notification handler with error handling
ipcMain.handle(
  "show-notification",
  async (
    _,
    options: {
      title: string;
      body: string;
      icon?: string;
      silent?: boolean;
    }
  ) => {
    try {
      if (!Notification.isSupported()) {
        console.log("Notifications not supported on this system");
        return false;
      }

      // Create notification with platform-specific handling
      const notificationOptions: Electron.NotificationConstructorOptions = {
        title: options.title,
        body: options.body,
        silent: options.silent || false,
      };

      // Add icon only if provided and valid
      if (options.icon) {
        notificationOptions.icon = options.icon;
      }

      const notification = new Notification(notificationOptions);

      // Show notification
      notification.show();

      // Handle click event
      notification.on("click", () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.focus();
        }
      });

      // Handle errors
      notification.on("failed", (event, error) => {
        console.error("Notification failed:", error);
      });

      return true;
    } catch (error) {
      console.error("Error showing notification:", error);
      return false;
    }
  }
);

// Window resize API handler
ipcMain.handle("resize-window", (_, width: number, height: number) => {
  if (mainWindow) {
    const currentBounds = mainWindow.getBounds();

    // 화면 중앙에 위치하도록 x, y 좌표 계산
    const { screen } = require("electron");
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;

    const x = Math.round((screenWidth - width) / 2);
    const y = Math.round((screenHeight - height) / 2);

    // 최소/최대 크기 제한 확인
    const minWidth = 1024;
    const minHeight = 576;
    const maxWidth = primaryDisplay.bounds.width;
    const maxHeight = primaryDisplay.bounds.height;

    const finalWidth = Math.max(minWidth, Math.min(width, maxWidth));
    const finalHeight = Math.max(minHeight, Math.min(height, maxHeight));

    mainWindow.setBounds(
      {
        x,
        y,
        width: finalWidth,
        height: finalHeight,
      },
      true
    );

    return { width: finalWidth, height: finalHeight };
  }

  throw new Error("Main window is not available");
});
