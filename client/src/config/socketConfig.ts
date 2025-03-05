/**
 * تنظیمات پیش‌فرض برای اتصال‌های Socket.io
 */
export const socketConfig = {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  transports: ['websocket', 'polling'] as string[],
  upgrade: true,
  forceNew: false,
  multiplex: false
};

/**
 * تنظیمات پیش‌فرض برای اتصال‌های Socket.io در حالت اشکال‌زدایی
 */
export const debugSocketConfig = {
  ...socketConfig,
  debug: true
};

/**
 * دریافت تنظیمات سوکت بر اساس محیط اجرا
 */
export const getSocketConfig = (isDebug: boolean = false) => {
  if (isDebug || process.env.REACT_APP_DEBUG_SOCKET === 'true') {
    return debugSocketConfig;
  }
  return socketConfig;
};

export default socketConfig; 