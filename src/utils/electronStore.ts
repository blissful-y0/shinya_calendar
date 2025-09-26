// Electron Store를 사용하는 유틸리티 함수들

// Electron 환경인지 체크
const isElectron = () => {
  return typeof window !== "undefined" && window.electronAPI !== undefined;
};

// Store 유틸리티 함수들
export const electronStore = {
  async get(key: string): Promise<any> {
    if (isElectron()) {
      try {
        return await window.electronAPI.store.get(key);
      } catch (error) {
        console.error("Error getting from electron store:", error);
        // 폴백으로 localStorage 사용
        return localStorage.getItem(key)
          ? JSON.parse(localStorage.getItem(key)!)
          : null;
      }
    }
    // Electron이 아닌 환경에서는 localStorage 사용
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  async set(key: string, value: any): Promise<void> {
    if (isElectron()) {
      try {
        await window.electronAPI.store.set(key, value);
        // localStorage에도 백업으로 저장
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error("Error setting to electron store:", error);
        localStorage.setItem(key, JSON.stringify(value));
      }
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  async delete(key: string): Promise<void> {
    if (isElectron()) {
      try {
        await window.electronAPI.store.delete(key);
        localStorage.removeItem(key);
      } catch (error) {
        console.error("Error deleting from electron store:", error);
        localStorage.removeItem(key);
      }
    } else {
      localStorage.removeItem(key);
    }
  },

  async has(key: string): Promise<boolean> {
    if (isElectron()) {
      try {
        return await window.electronAPI.store.has(key);
      } catch (error) {
        console.error("Error checking electron store:", error);
        return localStorage.getItem(key) !== null;
      }
    }
    return localStorage.getItem(key) !== null;
  },

  async clear(): Promise<void> {
    if (isElectron()) {
      try {
        await window.electronAPI.store.clear();
        localStorage.clear();
      } catch (error) {
        console.error("Error clearing electron store:", error);
        localStorage.clear();
      }
    } else {
      localStorage.clear();
    }
  },
};
