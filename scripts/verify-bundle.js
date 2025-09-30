const fs = require("fs");
const path = require("path");

/**
 * 빌드된 앱 번들이 필요한 모든 파일을 포함하고 있는지 검증하는 AfterPack 훅
 * macOS 앱 번들에서 실행 파일이 누락되는 등의 문제를 방지합니다
 */
exports.default = async function (context) {
  const { appOutDir, packager, electronPlatformName } = context;

  console.log("\n=== 번들 무결성 검증 ===");
  console.log("플랫폼:", electronPlatformName);
  console.log("출력 디렉터리:", appOutDir);

  if (electronPlatformName === "darwin") {
    // macOS의 경우, 앱 번들 구조를 검증
    const appName = packager.appInfo.productFilename;
    const appPath = path.join(appOutDir, `${appName}.app`);
    const contentsPath = path.join(appPath, "Contents");
    const macOSPath = path.join(contentsPath, "MacOS");
    const executablePath = path.join(macOSPath, appName);

    console.log("앱 번들 확인 중:", appPath);

    // 컨텐츠 디렉토리 검증
    if (!fs.existsSync(contentsPath)) {
      throw new Error(`Contents 디렉터리를 찾을 수 없습니다: ${contentsPath}`);
    }

    // MacOS 디렉토리 검증
    if (!fs.existsSync(macOSPath)) {
      throw new Error(`MacOS 디렉터리를 찾을 수 없습니다: ${macOSPath}`);
    }

    // 실행 파일 검증
    if (!fs.existsSync(executablePath)) {
      throw new Error(`실행 파일을 찾을 수 없습니다: ${executablePath}`);
    }

    // 실행 파일 권한 검증
    const stats = fs.statSync(executablePath);
    const isExecutable = (stats.mode & 0o111) !== 0;

    if (!isExecutable) {
      console.warn(
        `경고: 실행 파일에 적절한 권한이 없을 수 있습니다: ${executablePath}`
      );
    }

    console.log("✓ MacOS 디렉터리 존재");
    console.log("✓ 실행 파일 존재:", executablePath);
    console.log("✓ 파일 크기:", (stats.size / 1024 / 1024).toFixed(2), "MB");

    // Info.plist 검증
    const infoPlistPath = path.join(contentsPath, "Info.plist");
    if (!fs.existsSync(infoPlistPath)) {
      throw new Error(`Info.plist를 찾을 수 없습니다: ${infoPlistPath}`);
    }
    console.log("✓ Info.plist 존재");

    // Resources 디렉토리 검증
    const resourcesPath = path.join(contentsPath, "Resources");
    if (!fs.existsSync(resourcesPath)) {
      console.warn(
        `경고: Resources 디렉터리를 찾을 수 없습니다: ${resourcesPath}`
      );
    } else {
      console.log("✓ Resources 디렉터리 존재");
    }
  }

  console.log("=== 번들 검증이 성공적으로 완료되었습니다 ===\n");
};
