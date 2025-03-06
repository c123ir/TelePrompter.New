/**
 * یک پیاده‌سازی ساده و جایگزین برای سیستم لاگینگ
 * این فایل فقط برای رفع خطاهای کامپایل ساخته شده است
 */

interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
  details?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private subscribers: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    console.log('سیستم لاگینگ ساده راه‌اندازی شد');
  }

  // ثبت خطا
  error(message: string, source: string, details?: any): void {
    this.addLog('error', message, source, details);
    console.error(`[${source}] ${message}`, details || '');
  }

  // ثبت هشدار
  warn(message: string, source: string, details?: any): void {
    this.addLog('warn', message, source, details);
    console.warn(`[${source}] ${message}`, details || '');
  }

  // ثبت اطلاعات عادی
  info(message: string, source: string, details?: any): void {
    this.addLog('info', message, source, details);
    console.info(`[${source}] ${message}`, details || '');
  }

  // ثبت اطلاعات دیباگ
  debug(message: string, source: string, details?: any): void {
    this.addLog('debug', message, source, details);
    console.debug(`[${source}] ${message}`, details || '');
  }

  // اشتراک‌گذاری لاگ‌ها
  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // دریافت تمامی لاگ‌ها
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  // پاک کردن لاگ‌ها
  clearLogs(): void {
    this.logs = [];
    this.notifySubscribers();
    console.log('لاگ‌ها پاک شدند');
  }

  // کپی لاگ‌ها به کلیپ‌بورد
  copyLogsToClipboard(): void {
    try {
      const logText = this.logs
        .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`)
        .join('\n');
      
      navigator.clipboard.writeText(logText).then(() => {
        console.log('لاگ‌ها کپی شدند');
      });
    } catch (error) {
      console.error('خطا در کپی کردن لاگ‌ها:', error);
    }
  }

  private addLog(level: string, message: string, source: string, details?: any): void {
    const timestamp = new Date().toLocaleTimeString('fa-IR');
    const newLog: LogEntry = {
      timestamp,
      level,
      source,
      message,
      details
    };

    this.logs.unshift(newLog);
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback([...this.logs]));
  }
}

export const logger = new Logger(); 