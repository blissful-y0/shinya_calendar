import { app, BrowserWindow, ipcMain, Notification, shell } from "electron";
import path from "path";
import os from "os";
import Store from "electron-store";
import { readFileSync } from "fs";
import { autoUpdater } from "electron-updater";
import {
  startOAuthServer,
  stopOAuthServer,
  openAuthWindow,
} from "./googleOAuthHandler";

// Electron Store 초기화
const store = new Store();

let mainWindow: BrowserWindow | null = null;

// 런타임 에러 디버깅을 위한 핸들러 추가
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
});

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
    ...(isWindows
      ? { frame: true, autoHideMenuBar: true }
      : { titleBarStyle: "hidden" }),
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
    // Production: dist-electron과 dist는 같은 레벨에 위치
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
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

// Google OAuth 핸들러
ipcMain.handle("google-oauth-start", async (_) => {
  if (!mainWindow) {
    throw new Error("Main window is not available");
  }

  try {
    const code = await startOAuthServer(mainWindow);
    return { success: true, code };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("google-oauth-stop", () => {
  stopOAuthServer();
});

ipcMain.handle("open-external", (_, url: string) => {
  // OAuth URL인 경우 Electron 창으로 열기
  if (url.includes("accounts.google.com/o/oauth2")) {
    openAuthWindow(url);
  } else {
    shell.openExternal(url);
  }
});

// 앱 버전 가져오기 (package.json에서)
ipcMain.handle("get-app-version", () => {
  try {
    // Production: app.asar 내부에서 접근 시 __dirname 기준으로 찾기
    let packageJsonPath = path.join(__dirname, "..", "package.json");

    // app.asar로 패키징된 경우를 위한 대체 경로
    if (!require("fs").existsSync(packageJsonPath)) {
      packageJsonPath = path.join(
        process.resourcesPath,
        "app.asar",
        "package.json"
      );
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version;
  } catch (error) {
    console.error("Failed to read app version:", error);
    return "1.1.0"; // 폴백 버전
  }
});

// ============================================================
// Auto Updater 설정
// ============================================================

// 로그 레벨 설정
autoUpdater.logger = require("electron-log");
(autoUpdater.logger as any).transports.file.level = "info";

// 자동 다운로드 비활성화 (사용자에게 선택권 제공)
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// 업데이트 체크 중 에러 처리
autoUpdater.on("error", (error) => {
  console.error("Update error:", error);
  if (mainWindow) {
    mainWindow.webContents.send("update-error", {
      message: error.message,
    });
  }
});

// 업데이트 확인 중
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
  if (mainWindow) {
    mainWindow.webContents.send("checking-for-update");
  }
});

// 업데이트 사용 가능
autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info);
  if (mainWindow) {
    mainWindow.webContents.send("update-available", {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  }
});

// 업데이트 없음
autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available:", info);
  if (mainWindow) {
    mainWindow.webContents.send("update-not-available", {
      version: info.version,
    });
  }
});

// 다운로드 진행상황
autoUpdater.on("download-progress", (progressObj) => {
  console.log(
    `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
  );
  if (mainWindow) {
    mainWindow.webContents.send("download-progress", {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond,
    });
  }
});

// 다운로드 완료
autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded:", info);
  if (mainWindow) {
    mainWindow.webContents.send("update-downloaded", {
      version: info.version,
    });
  }
});

// IPC 핸들러: 업데이트 체크
ipcMain.handle("check-for-updates", async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      available: result?.updateInfo ? true : false,
      updateInfo: result?.updateInfo,
    };
  } catch (error: any) {
    console.error("Error checking for updates:", error);
    return { available: false, error: error.message };
  }
});

// IPC 핸들러: 업데이트 다운로드
ipcMain.handle("download-update", async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error: any) {
    console.error("Error downloading update:", error);
    return { success: false, error: error.message };
  }
});

// IPC 핸들러: 업데이트 설치 및 재시작
ipcMain.handle("install-update", () => {
  try {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (error: any) {
    console.error("Error installing update:", error);
    return { success: false, error: error.message };
  }
});

// 앱이 준비되면 자동으로 업데이트 체크
app.on("ready", () => {
  // 앱 시작 3초 후 업데이트 체크 (초기 로딩 후, 조용하게 백그라운드에서 실행)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("Auto update check failed on startup:", error);
    });
  }, 3000);
});
