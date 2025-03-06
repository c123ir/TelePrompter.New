/**
 * @file taskOrchestratorCore.ts
 * @description پیاده‌سازی هسته اصلی دستیار هوشمند با استفاده از localStorage
 */

import {
  Task,
  TaskType,
  TaskPriority,
  TaskStatus,
  Screenshot,
  CodeSnippet,
  AssistantSettings,
  TaskOrchestratorCore
} from './types';

// کلیدهای ذخیره‌سازی در localStorage
const STORAGE_KEYS = {
  TASKS: 'smart-assistant-tasks',
  SCREENSHOTS: 'smart-assistant-screenshots',
  CODE_SNIPPETS: 'smart-assistant-snippets',
  SETTINGS: 'smart-assistant-settings',
};

// تنظیمات پیش‌فرض
const DEFAULT_SETTINGS: AssistantSettings = {
  storageType: 'localStorage',
  autoCapture: false,
  captureHotkey: 'Alt+S',
  showAssistantHotkey: 'Alt+A',
  theme: 'light',
  language: 'fa',
};

/**
 * تولید یک شناسه یکتا
 * @returns شناسه یکتا
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * پیاده‌سازی هسته دستیار با استفاده از localStorage
 */
export class LocalStorageTaskOrchestrator implements TaskOrchestratorCore {
  /**
   * بارگیری داده‌ها از localStorage
   * @param key کلید ذخیره‌سازی
   * @param defaultValue مقدار پیش‌فرض در صورت عدم وجود داده
   * @returns داده‌های بارگیری شده
   */
  private loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        // تبدیل تاریخ‌های ذخیره شده به شیء Date
        const parsed = JSON.parse(data, (key, value) => {
          if (key === 'createdAt' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        });
        return parsed;
      }
      return defaultValue;
    } catch (error) {
      console.error(`خطا در بارگیری داده‌ها از localStorage با کلید ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * ذخیره داده‌ها در localStorage
   * @param key کلید ذخیره‌سازی
   * @param data داده‌های مورد نظر
   */
  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`خطا در ذخیره داده‌ها در localStorage با کلید ${key}:`, error);
    }
  }

  /**
   * مدیریت تسک‌ها
   */
  taskManager = {
    /**
     * ثبت یک تسک جدید
     * @param taskData داده‌های تسک جدید
     * @returns شناسه تسک ثبت شده
     */
    registerTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>): Promise<string> => {
      const tasks = this.loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
      
      const newTask: Task = {
        ...taskData,
        id: generateId(),
        createdAt: new Date(),
        status: TaskStatus.TODO,
      };
      
      tasks.push(newTask);
      this.saveToStorage(STORAGE_KEYS.TASKS, tasks);
      
      return newTask.id!;
    },
    
    /**
     * به‌روزرسانی یک تسک موجود
     * @param id شناسه تسک
     * @param taskData داده‌های جدید
     * @returns تسک به‌روز شده
     */
    updateTask: async (id: string, taskData: Partial<Task>): Promise<Task> => {
      const tasks = this.loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
      
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex === -1) {
        throw new Error(`تسک با شناسه ${id} یافت نشد`);
      }
      
      const updatedTask: Task = {
        ...tasks[taskIndex],
        ...taskData,
        updatedAt: new Date(),
      };
      
      tasks[taskIndex] = updatedTask;
      this.saveToStorage(STORAGE_KEYS.TASKS, tasks);
      
      return updatedTask;
    },
    
    /**
     * تغییر وضعیت یک تسک
     * @param id شناسه تسک
     * @param status وضعیت جدید
     * @returns نتیجه عملیات
     */
    updateTaskStatus: async (id: string, status: TaskStatus): Promise<boolean> => {
      try {
        await this.taskManager.updateTask(id, { status });
        return true;
      } catch (error) {
        console.error(`خطا در تغییر وضعیت تسک ${id}:`, error);
        return false;
      }
    },
    
    /**
     * دریافت فهرست تسک‌ها بر اساس اولویت
     * @returns آرایه‌ای از تسک‌ها
     */
    getTasksByPriority: async (): Promise<Task[]> => {
      const tasks = this.loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
      
      // مرتب‌سازی بر اساس اولویت (از بیشترین به کمترین)
      return [...tasks].sort((a, b) => {
        const priorityOrder = {
          [TaskPriority.CRITICAL]: 0,
          [TaskPriority.HIGH]: 1,
          [TaskPriority.MEDIUM]: 2,
          [TaskPriority.LOW]: 3,
        };
        
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    },
    
    /**
     * دریافت فهرست تسک‌ها بر اساس نوع
     * @param type نوع تسک
     * @returns آرایه‌ای از تسک‌ها
     */
    getTasksByType: async (type: TaskType): Promise<Task[]> => {
      const tasks = this.loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
      
      return tasks.filter(task => task.type === type);
    },
  };
  
  /**
   * مدیریت اسکرین‌شات‌ها
   */
  screenshotManager = {
    /**
     * گرفتن اسکرین‌شات از صفحه فعلی
     * @returns داده‌های اسکرین‌شات
     */
    captureScreenshot: async (): Promise<Screenshot> => {
      // در فاز 1، اسکرین‌شات به‌صورت شبیه‌سازی شده است
      // در فاز 2، از html2canvas استفاده خواهد شد
      
      // تولید یک تصویر ساده برای نمایش
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // پر کردن پس‌زمینه
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // افزودن متن
        ctx.fillStyle = '#333';
        ctx.font = '20px Arial';
        ctx.fillText('اسکرین‌شات شبیه‌سازی شده (فاز 1)', 10, 30);
        ctx.fillText(`زمان: ${new Date().toLocaleString()}`, 10, 60);
        
        // افزودن یک مستطیل
        ctx.strokeStyle = '#4a6cf7';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 100, 700, 400);
      }
      
      return {
        dataUrl: canvas.toDataURL('image/png'),
        createdAt: new Date(),
      };
    },
    
    /**
     * ذخیره اسکرین‌شات
     * @param screenshot داده‌های اسکرین‌شات
     * @returns شناسه اسکرین‌شات ذخیره شده
     */
    saveScreenshot: async (screenshot: Screenshot): Promise<string> => {
      const screenshots = this.loadFromStorage<Screenshot[]>(STORAGE_KEYS.SCREENSHOTS, []);
      
      const newScreenshot: Screenshot = {
        ...screenshot,
        id: generateId(),
      };
      
      screenshots.push(newScreenshot);
      this.saveToStorage(STORAGE_KEYS.SCREENSHOTS, screenshots);
      
      return newScreenshot.id!;
    },
    
    /**
     * دریافت اسکرین‌شات با شناسه
     * @param id شناسه اسکرین‌شات
     * @returns داده‌های اسکرین‌شات
     */
    getScreenshot: async (id: string): Promise<Screenshot | null> => {
      const screenshots = this.loadFromStorage<Screenshot[]>(STORAGE_KEYS.SCREENSHOTS, []);
      
      return screenshots.find(screenshot => screenshot.id === id) || null;
    },
  };
  
  /**
   * مدیریت قطعات کد
   */
  codeSnippetManager = {
    /**
     * ذخیره یک قطعه کد
     * @param snippet داده‌های قطعه کد
     * @returns شناسه قطعه کد ذخیره شده
     */
    saveCodeSnippet: async (snippet: CodeSnippet): Promise<string> => {
      const snippets = this.loadFromStorage<CodeSnippet[]>(STORAGE_KEYS.CODE_SNIPPETS, []);
      
      const newSnippet: CodeSnippet = {
        ...snippet,
        id: generateId(),
      };
      
      snippets.push(newSnippet);
      this.saveToStorage(STORAGE_KEYS.CODE_SNIPPETS, snippets);
      
      return newSnippet.id!;
    },
    
    /**
     * دریافت قطعه کد با شناسه
     * @param id شناسه قطعه کد
     * @returns داده‌های قطعه کد
     */
    getCodeSnippet: async (id: string): Promise<CodeSnippet | null> => {
      const snippets = this.loadFromStorage<CodeSnippet[]>(STORAGE_KEYS.CODE_SNIPPETS, []);
      
      return snippets.find(snippet => snippet.id === id) || null;
    },
  };
  
  /**
   * تنظیمات
   */
  settings = {
    /**
     * دریافت تنظیمات فعلی
     * @returns تنظیمات دستیار
     */
    getSettings: async (): Promise<AssistantSettings> => {
      return this.loadFromStorage<AssistantSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    },
    
    /**
     * به‌روزرسانی تنظیمات
     * @param settings تنظیمات جدید
     * @returns نتیجه عملیات
     */
    updateSettings: async (settings: Partial<AssistantSettings>): Promise<boolean> => {
      try {
        const currentSettings = await this.settings.getSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        
        this.saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
        return true;
      } catch (error) {
        console.error('خطا در به‌روزرسانی تنظیمات:', error);
        return false;
      }
    },
  };
} 