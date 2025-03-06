/**
 * @file types.ts
 * @description تعریف انواع داده‌های مورد استفاده در دستیار هوشمند توسعه
 */

/**
 * انواع تسک‌های قابل ثبت در سیستم
 */
export enum TaskType {
  BUG = 'BUG',           // باگ در کد
  FEATURE = 'FEATURE',   // قابلیت جدید
  REFACTOR = 'REFACTOR', // بازنویسی کد
  OPTIMIZATION = 'OPTIMIZATION', // بهینه‌سازی
  DOCUMENTATION = 'DOCUMENTATION', // مستندسازی
  IDEA = 'IDEA',         // ایده‌ای برای آینده
}

/**
 * سطوح اولویت تسک‌ها
 */
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * وضعیت‌های ممکن برای یک تسک
 */
export enum TaskStatus {
  TODO = 'TODO',         // نیاز به انجام
  IN_PROGRESS = 'IN_PROGRESS', // در حال انجام
  COMPLETED = 'COMPLETED', // تکمیل شده
  DEFERRED = 'DEFERRED', // به تعویق افتاده
}

/**
 * ساختار داده برای یک تسک
 */
export interface Task {
  id?: string; // شناسه یکتا (در صورت ذخیره)
  title: string; // عنوان تسک
  description?: string; // توضیحات
  type: TaskType; // نوع تسک
  priority: TaskPriority; // اولویت
  status: TaskStatus; // وضعیت
  createdAt: Date; // زمان ایجاد
  updatedAt?: Date; // زمان آخرین به‌روزرسانی
  
  // اطلاعات مرتبط با کد
  relatedComponent?: string; // کامپوننت مرتبط
  relatedFilePath?: string; // مسیر فایل مرتبط
  lineNumbers?: string; // شماره خط‌های مرتبط
  
  // اطلاعات اضافی
  tags?: string[]; // برچسب‌ها
  screenshot?: string; // آدرس تصویر اسکرین‌شات (در صورت وجود)
  assignedTo?: string; // شخص مسئول
}

/**
 * ساختار داده برای یک اسکرین‌شات
 */
export interface Screenshot {
  id?: string; // شناسه یکتا
  dataUrl: string; // داده تصویر به صورت Base64
  createdAt: Date; // زمان ایجاد
  annotation?: string; // توضیحات روی تصویر
  relatedTaskId?: string; // تسک مرتبط
}

/**
 * ساختار داده برای یک قطعه کد
 */
export interface CodeSnippet {
  id?: string; // شناسه یکتا
  code: string; // متن کد
  language: string; // زبان برنامه‌نویسی
  filePath?: string; // مسیر فایل
  lineStart?: number; // شماره خط شروع
  lineEnd?: number; // شماره خط پایان
  createdAt: Date; // زمان ایجاد
  relatedTaskId?: string; // تسک مرتبط
}

/**
 * تنظیمات دستیار هوشمند
 */
export interface AssistantSettings {
  storageType: 'localStorage' | 'indexedDB' | 'server'; // نوع ذخیره‌سازی
  autoCapture: boolean; // آیا اسکرین‌شات خودکار فعال باشد
  captureHotkey: string; // کلید میانبر اسکرین‌شات
  showAssistantHotkey: string; // کلید میانبر نمایش دستیار
  theme: 'light' | 'dark' | 'system'; // تم ظاهری
  language: string; // زبان رابط کاربری
}

/**
 * رابط برنامه‌نویسی هسته مرکزی دستیار
 */
export interface TaskOrchestratorCore {
  /**
   * مدیریت تسک‌ها
   */
  taskManager: {
    /**
     * ثبت یک تسک جدید
     * @param task داده‌های تسک جدید
     * @returns شناسه تسک ثبت شده
     */
    registerTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => Promise<string>;
    
    /**
     * به‌روزرسانی یک تسک موجود
     * @param id شناسه تسک
     * @param taskData داده‌های جدید
     * @returns تسک به‌روز شده
     */
    updateTask: (id: string, taskData: Partial<Task>) => Promise<Task>;
    
    /**
     * تغییر وضعیت یک تسک
     * @param id شناسه تسک
     * @param status وضعیت جدید
     * @returns نتیجه عملیات
     */
    updateTaskStatus: (id: string, status: TaskStatus) => Promise<boolean>;
    
    /**
     * دریافت فهرست تسک‌ها بر اساس اولویت
     * @returns آرایه‌ای از تسک‌ها
     */
    getTasksByPriority: () => Promise<Task[]>;
    
    /**
     * دریافت فهرست تسک‌ها بر اساس نوع
     * @param type نوع تسک
     * @returns آرایه‌ای از تسک‌ها
     */
    getTasksByType: (type: TaskType) => Promise<Task[]>;
  };
  
  /**
   * مدیریت اسکرین‌شات‌ها
   */
  screenshotManager: {
    /**
     * گرفتن اسکرین‌شات از صفحه فعلی
     * @returns داده‌های اسکرین‌شات
     */
    captureScreenshot: () => Promise<Screenshot>;
    
    /**
     * ذخیره اسکرین‌شات
     * @param screenshot داده‌های اسکرین‌شات
     * @returns شناسه اسکرین‌شات ذخیره شده
     */
    saveScreenshot: (screenshot: Screenshot) => Promise<string>;
    
    /**
     * دریافت اسکرین‌شات با شناسه
     * @param id شناسه اسکرین‌شات
     * @returns داده‌های اسکرین‌شات
     */
    getScreenshot: (id: string) => Promise<Screenshot | null>;
  };
  
  /**
   * مدیریت قطعات کد
   */
  codeSnippetManager: {
    /**
     * ذخیره یک قطعه کد
     * @param snippet داده‌های قطعه کد
     * @returns شناسه قطعه کد ذخیره شده
     */
    saveCodeSnippet: (snippet: CodeSnippet) => Promise<string>;
    
    /**
     * دریافت قطعه کد با شناسه
     * @param id شناسه قطعه کد
     * @returns داده‌های قطعه کد
     */
    getCodeSnippet: (id: string) => Promise<CodeSnippet | null>;
  };
  
  /**
   * تنظیمات
   */
  settings: {
    /**
     * دریافت تنظیمات فعلی
     * @returns تنظیمات دستیار
     */
    getSettings: () => Promise<AssistantSettings>;
    
    /**
     * به‌روزرسانی تنظیمات
     * @param settings تنظیمات جدید
     * @returns نتیجه عملیات
     */
    updateSettings: (settings: Partial<AssistantSettings>) => Promise<boolean>;
  };
} 