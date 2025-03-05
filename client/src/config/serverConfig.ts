/**
 * تنظیمات اتصال به سرور
 * این فایل تنظیمات مربوط به اتصال با سرور را مدیریت می‌کند
 * و به صورت خودکار در محیط توسعه و تولید کار می‌کند
 */

// تنظیمات پیش‌فرض سرور
const DEV_SERVER = 'http://localhost:4444';

// آدرس IP سرور شما (برای دسترسی از شبکه محلی)
const NETWORK_SERVER = 'http://123.123.1.23:4444';

// تشخیص URL سرور بر اساس محیط اجرایی
export const getServerUrl = (): string => {
  // اگر REACT_APP_SERVER_URL در .env تنظیم شده باشد، از آن استفاده می‌کنیم
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }

  // بررسی متغیر محیطی برای استفاده از آدرس شبکه
  if (process.env.REACT_APP_USE_NETWORK === 'true') {
    return NETWORK_SERVER;
  }

  // اگر در حالت تولید هستیم
  if (process.env.NODE_ENV === 'production') {
    // تلاش برای استفاده از آدرس IP واقعی سرور
    try {
      const currentHost = window.location.hostname;
      const serverPort = process.env.REACT_APP_SERVER_PORT || '4444';
      // اگر در HTTPS هستیم، از پروتکل HTTPS استفاده می‌کنیم
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      return `${protocol}//${currentHost}:${serverPort}`;
    } catch (e) {
      console.warn('خطا در تشخیص آدرس سرور:', e);
      return DEV_SERVER; // بازگشت به آدرس پیش‌فرض در صورت خطا
    }
  }

  // در محیط توسعه، از آدرس پیش‌فرض استفاده می‌کنیم
  // برای استفاده از شبکه محلی، NETWORK_SERVER را برگردانید
  return DEV_SERVER;
};

// تنظیمات Socket.IO - افزایش تنظیمات برای پایداری بیشتر
export const socketConfig = {
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity, // تلاش نامحدود برای اتصال مجدد
  timeout: 20000,
  transports: ['websocket', 'polling'], // تلاش برای وب‌سوکت، سپس برگشت به polling
  autoConnect: true,
  forceNew: true,
  path: '/socket.io' // اطمینان از استفاده از مسیر پیش‌فرض
};

export default getServerUrl; 