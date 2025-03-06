"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class Logger {
    static instance;
    logs = [];
    logFile;
    maxLogsInMemory = 1000;
    logToConsole = true;
    logToFile = false;
    constructor() {
        // تنظیم مسیر فایل لاگ
        const logDir = process.env.LOG_DIR || path_1.default.join(os_1.default.tmpdir(), 'teleprompter-logs');
        // اطمینان از وجود دایرکتوری لاگ
        if (!fs_1.default.existsSync(logDir)) {
            try {
                fs_1.default.mkdirSync(logDir, { recursive: true });
            }
            catch (error) {
                console.error('خطا در ایجاد دایرکتوری لاگ:', error);
            }
        }
        // تنظیم فایل لاگ با تاریخ فعلی
        const today = new Date().toISOString().split('T')[0];
        this.logFile = path_1.default.join(logDir, `server-${today}.log`);
        // تنظیم لاگ به فایل اگر متغیر محیطی LOG_TO_FILE تنظیم شده باشد
        this.logToFile = process.env.LOG_TO_FILE === 'true';
        this.info('سیستم لاگینگ سرور راه‌اندازی شد', 'Logger');
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    formatDate(date) {
        return `${date.toISOString()}`;
    }
    addLog(level, message, source, details) {
        const logEntry = {
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
                fs_1.default.appendFileSync(this.logFile, logText);
            }
            catch (error) {
                console.error('خطا در نوشتن لاگ در فایل:', error);
            }
        }
    }
    info(message, source, details) {
        this.addLog('info', message, source, details);
    }
    warn(message, source, details) {
        this.addLog('warn', message, source, details);
    }
    error(message, source, details) {
        this.addLog('error', message, source, details);
    }
    debug(message, source, details) {
        this.addLog('debug', message, source, details);
    }
    getAllLogs() {
        return [...this.logs];
    }
    clearLogs() {
        this.logs = [];
        this.info('لاگ‌ها پاک شدند', 'Logger');
    }
    getSystemInfo() {
        const systemInfo = {
            platform: os_1.default.platform(),
            arch: os_1.default.arch(),
            cpus: os_1.default.cpus().length,
            freeMemory: os_1.default.freemem(),
            totalMemory: os_1.default.totalmem(),
            uptime: os_1.default.uptime(),
            hostname: os_1.default.hostname(),
            nodeVersion: process.version,
            env: process.env.NODE_ENV || 'development'
        };
        return systemInfo;
    }
}
exports.Logger = Logger;
// صادر کردن نمونه منحصربه‌فرد
exports.logger = Logger.getInstance();
