/**
 * 버전 관리 유틸리티
 */

// Electron API로부터 현재 버전 가져오기
export const getCurrentVersion = async (): Promise<string> => {
  try {
    if (window.electronAPI?.getAppVersion) {
      const version = await window.electronAPI.getAppVersion();
      return version;
    }
    return "1.0.1"; // 폴백 버전
  } catch (error) {
    console.error("Failed to get app version:", error);
    return "1.0.1"; // 폴백 버전
  }
};

/**
 * GitHub API를 통해 최신 릴리즈 버전 확인
 */
export const getLatestVersion = async (): Promise<{
  version: string;
  url: string;
  publishedAt: string;
} | null> => {
  try {
    const response = await fetch(
      "https://api.github.com/repos/blissful-y0/shinya_calendar/releases/latest"
    );

    if (!response.ok) {
      console.error("Failed to fetch latest version:", response.statusText);
      return null;
    }

    const data = await response.json();

    return {
      version: data.tag_name.replace(/^v/, ""), // "v1.0.2" -> "1.0.2"
      url: data.html_url,
      publishedAt: data.published_at,
    };
  } catch (error) {
    console.error("Error fetching latest version:", error);
    return null;
  }
};

/**
 * 두 버전을 비교 (semver 형식)
 * @returns 1: v1이 더 큼, -1: v2가 더 큼, 0: 같음
 */
export const compareVersions = (v1: string, v2: string): number => {
  const v1Parts = v1.split(".").map(Number);
  const v2Parts = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const part1 = v1Parts[i] || 0;
    const part2 = v2Parts[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
};

/**
 * 새로운 버전이 있는지 확인
 */
export const checkForUpdates = async (): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  url?: string;
}> => {
  const currentVersion = await getCurrentVersion();
  const latest = await getLatestVersion();

  if (!latest) {
    return {
      hasUpdate: false,
      currentVersion,
    };
  }

  const hasUpdate = compareVersions(latest.version, currentVersion) > 0;

  return {
    hasUpdate,
    currentVersion,
    latestVersion: latest.version,
    url: latest.url,
  };
};
