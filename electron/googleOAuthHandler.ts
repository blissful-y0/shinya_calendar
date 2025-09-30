import { createServer, IncomingMessage, ServerResponse } from 'http';
import { BrowserWindow } from 'electron';

const PORT = 8080;
let server: ReturnType<typeof createServer> | null = null;
let authWindow: BrowserWindow | null = null;

export function startOAuthServer(mainWindow: BrowserWindow): Promise<string> {
  return new Promise((resolve, reject) => {
    // 이미 서버가 실행 중이면 종료
    if (server) {
      server.close();
    }

    // 이전 인증 창이 있으면 닫기
    if (authWindow && !authWindow.isDestroyed()) {
      authWindow.close();
    }

    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '', `http://localhost:${PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>인증 실패</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 2px 20px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
              }
              h1 { color: #d32f2f; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
              .error {
                background: #ffebee;
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
                color: #c62828;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ 인증 실패</h1>
              <p>구글 계정 인증에 실패했습니다.</p>
              <div class="error">오류: ${error}</div>
              <p style="margin-top: 20px;">이 창은 자동으로 닫힙니다...</p>
            </div>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
          </html>
        `);

        // 인증 창 닫기
        setTimeout(() => {
          if (authWindow && !authWindow.isDestroyed()) {
            authWindow.close();
            authWindow = null;
          }
        }, 3000);

        if (server) {
          server.close();
          server = null;
        }
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>인증 성공</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 50px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
                animation: slideUp 0.3s ease-out;
              }
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              h1 {
                color: #4caf50;
                margin-bottom: 20px;
                font-size: 32px;
              }
              p {
                color: #666;
                line-height: 1.8;
                font-size: 16px;
              }
              .success-icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">✅</div>
              <h1>인증 완료!</h1>
              <p>구글 계정 인증이 성공적으로 완료되었습니다.</p>
              <p style="margin-top: 20px; font-size: 14px; color: #999;">
                이 창은 자동으로 닫힙니다...
              </p>
            </div>
          </body>
          </html>
        `);

        // 인증 창 닫기
        setTimeout(() => {
          if (authWindow && !authWindow.isDestroyed()) {
            authWindow.close();
            authWindow = null;
          }
        }, 2000);

        // 서버 종료
        if (server) {
          server.close();
          server = null;
        }

        resolve(code);
        return;
      }

      // 다른 요청은 무시
      res.writeHead(404);
      res.end();
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`포트 ${PORT}가 이미 사용 중입니다.`));
      } else {
        reject(err);
      }
    });

    server.listen(PORT, () => {
      console.log(`OAuth redirect server listening on http://localhost:${PORT}`);
    });

    // OAuth 창이 닫히면 서버도 정리
    if (authWindow) {
      authWindow.on('closed', () => {
        authWindow = null;
        if (server) {
          server.close();
          server = null;
        }
      });
    }
  });
}

export function openAuthWindow(authUrl: string): BrowserWindow {
  // 이전 인증 창이 있으면 닫기
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.close();
  }

  authWindow = new BrowserWindow({
    width: 600,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: '구글 계정 로그인',
    autoHideMenuBar: true,
  });

  authWindow.loadURL(authUrl);

  return authWindow;
}

export function stopOAuthServer() {
  if (server) {
    server.close();
    server = null;
  }
}