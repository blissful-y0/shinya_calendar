const fs = require("fs");
const path = require("path");

/**
 * AfterPack hook to verify that the built app bundle contains all required files
 * This prevents issues like missing executable files in the macOS app bundle
 */
exports.default = async function (context) {
  const { appOutDir, packager, electronPlatformName } = context;

  console.log("\n=== Verifying bundle integrity ===");
  console.log("Platform:", electronPlatformName);
  console.log("Output directory:", appOutDir);

  if (electronPlatformName === "darwin") {
    // For macOS, verify the app bundle structure
    const appName = packager.appInfo.productFilename;
    const appPath = path.join(appOutDir, `${appName}.app`);
    const contentsPath = path.join(appPath, "Contents");
    const macOSPath = path.join(contentsPath, "MacOS");
    const executablePath = path.join(macOSPath, appName);

    console.log("Checking app bundle:", appPath);

    // 컨텐츠 디렉토리 검증
    if (!fs.existsSync(contentsPath)) {
      throw new Error(`Contents directory not found: ${contentsPath}`);
    }

    // MacOS 디렉토리 검증
    if (!fs.existsSync(macOSPath)) {
      throw new Error(`MacOS directory not found: ${macOSPath}`);
    }

    // 실행 파일 검증
    if (!fs.existsSync(executablePath)) {
      throw new Error(`Executable file not found: ${executablePath}`);
    }

    // 실행 파일 권한 검증
    const stats = fs.statSync(executablePath);
    const isExecutable = (stats.mode & 0o111) !== 0;

    if (!isExecutable) {
      console.warn(
        `Warning: Executable file may not have proper permissions: ${executablePath}`
      );
    }

    console.log("✓ MacOS directory exists");
    console.log("✓ Executable file exists:", executablePath);
    console.log("✓ File size:", (stats.size / 1024 / 1024).toFixed(2), "MB");

    // Info.plist 검증
    const infoPlistPath = path.join(contentsPath, "Info.plist");
    if (!fs.existsSync(infoPlistPath)) {
      throw new Error(`Info.plist not found: ${infoPlistPath}`);
    }
    console.log("✓ Info.plist exists");

    // Resources 디렉토리 검증
    const resourcesPath = path.join(contentsPath, "Resources");
    if (!fs.existsSync(resourcesPath)) {
      console.warn(`Warning: Resources directory not found: ${resourcesPath}`);
    } else {
      console.log("✓ Resources directory exists");
    }
  }

  console.log("=== Bundle verification completed successfully ===\n");
};
