import fs from 'fs';
import path from 'path';
import os from 'os';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  details?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private logFile: string;
  private maxLogsInMemory: number = 1000;
  private logToConsole: boolean = true;
  private logToFile: boolean = false;

  private constructor() {
    // تنظیم مسیر فایل لاگ
    const logDir = process.env.LOG_DIR || path.join(os.tmpdir(), 'teleprompter-logs');
    
    // اطمینان از وجود دایرکتوری لاگ
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (error) {
        console.error('خطا در ایجاد دایرکتوری لاگ:', error);
      }
    }
    
    // تنظیم فایل لاگ با تاریخ فعلی
    const today = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logDir, `server-${today}.log`);
    
    // تنظیم لاگ به فایل اگر متغیر محیطی LOG_TO_FILE تنظیم شده باشد
    this.logToFile = process.env.LOG_TO_FILE === 'true';
    
    this.info('سیستم لاگینگ سرور راه‌اندازی شد', 'Logger');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatDate(date: Date): string {
    return `${date.toISOString()}`;
  }

  private addLog(level: LogEntry['level'], message: string, source: string, details?: any): void {
    const logEntry: LogEntry = {
      timestamp: this.formatDate(new Date()),
      level,
      message,
      source,
      details
    };

    // افزودن به آرایه لاگ‌ها با رعایت محدودیت حافظه
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift(); // حذف قدیمی‌ترین لاگ
    }
    
    // نمایش در کنسول اگر فعال باشد
    if (this.logToConsole) {
      const detailsStr = details ? JSON.stringify(details) : '';
      switch (level) {
        case 'info':
          console.info(`[${logEntry.timestamp}] [${source}] ${message}`, detailsStr);
          break;
        case 'warn':
          console.warn(`[${logEntry.timestamp}] [${source}] ${message}`, detailsStr);
          break;
        case 'error':
          console.error(`[${logEntry.timestamp}] [${source}] ${message}`, detailsStr);
          break;
        case 'debug':
          console.debug(`[${logEntry.timestamp}] [${source}] ${message}`, detailsStr);
          break;
      }
    }
    
    // نوشتن در فایل اگر فعال باشد
    if (this.logToFile) {
      try {
        const logText = `[${logEntry.timestamp}] [${level.toUpperCase()}] [${source}] ${message} ${details ? JSON.stringify(details) : ''}\n`;
        fs.appendFileSync(this.logFile, logText);
      } catch (error) {
        console.error('خطا در نوشتن لاگ در فایل:', error);
      }
    }
  }

  public info(message: string, source: string, details?: any): void {
    this.addLog('info', message, source, details);
  }

  public warn(message: string, source: string, details?: any): void {
    this.addLog('warn', message, source, details);
  }

  public error(message: string, source: string, details?: any): void {
    this.addLog('error', message, source, details);
  }

  public debug(message: string, source: string, details?: any): void {
    this.addLog('debug', message, source, details);
  }

  public getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.info('لاگ‌ها پاک شدند', 'Logger');
  }

  public getSystemInfo(): any {
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      uptime: os.uptime(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development'
    };
    
    return systemInfo;
  }
}

// صادر کردن نمونه منحصربه‌فرد
export const logger = Logger.getInstance(); 