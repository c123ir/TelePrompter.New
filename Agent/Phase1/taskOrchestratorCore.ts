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
  theme: 'system',
  language: 'fa',
};

/**
 * ایجاد شناسه یکتا
 * @returns یک شناسه یکتا
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * پیاده‌سازی دستیار هوشمند با localStorage
 */
export class LocalStorageTaskOrchestrator implements TaskOrchestratorCore {
  /**
   * بارگذاری داده‌ها از localStorage
   * @param key کلید ذخیره‌سازی
   * @param defaultValue مقدار پیش‌فرض در صورت عدم وجود داده
   * @returns داده‌های بارگذاری شده
   */
  private loadFromStorage<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    if (!data) {
      return defaultValue;
    }
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing data from localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * ذخیره داده‌ها در localStorage
   * @param key کلید ذخیره‌سازی
   * @param data داده‌های جدید
   */
  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
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
      
      return newTask.id as string;
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
        throw new Error(`Task with id ${id} not found`);
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
      const tasks = this.loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
      
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex === -1) {
        return false;
      }
      
      tasks[taskIndex].status = status;
      tasks[taskIndex].updatedAt = new Date();
      
      this.saveToStorage(STORAGE_KEYS.TASKS, tasks);
      
      return true;
    },
    
    /**
     * دریافت فهرست تسک‌ها بر اساس اولویت
     * @returns آرایه‌ای از تسک‌ها
     */
    getTasksByPriority: async (): Promise<Task[]> => {
      const tasks = this.loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
      
      // مرتب‌سازی بر اساس اولویت
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
      // در این نسخه اولیه، تنها یک متد جایگزین ارائه می‌شود
      // در نسخه‌های بعدی از html2canvas برای عملکرد واقعی استفاده خواهد شد
      
      return {
        id: generateId(),
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', // یک تصویر خالی 1x1 پیکسل
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
        id: screenshot.id || generateId(),
        createdAt: screenshot.createdAt || new Date(),
      };
      
      screenshots.push(newScreenshot);
      this.saveToStorage(STORAGE_KEYS.SCREENSHOTS, screenshots);
      
      return newScreenshot.id as string;
    },
    
    /**
     * دریافت اسکرین‌شات با شناسه
     * @param id شناسه اسکرین‌شات
     * @returns داده‌های اسکرین‌شات
     */
    getScreenshot: async (id: string): Promise<Screenshot | null> => {
      const screenshots = this.loadFromStorage<Screenshot[]>(STORAGE_KEYS.SCREENSHOTS, []);
      
      const screenshot = screenshots.find(s => s.id === id);
      return screenshot || null;
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
        id: snippet.id || generateId(),
        createdAt: snippet.createdAt || new Date(),
      };
      
      snippets.push(newSnippet);
      this.saveToStorage(STORAGE_KEYS.CODE_SNIPPETS, snippets);
      
      return newSnippet.id as string;
    },
    
    /**
     * دریافت قطعه کد با شناسه
     * @param id شناسه قطعه کد
     * @returns داده‌های قطعه کد
     */
    getCodeSnippet: async (id: string): Promise<CodeSnippet | null> => {
      const snippets = this.loadFromStorage<CodeSnippet[]>(STORAGE_KEYS.CODE_SNIPPETS, []);
      
      const snippet = snippets.find(s => s.id === id);
      return snippet || null;
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
     * @param newSettings تنظیمات جدید
     * @returns نتیجه عملیات
     */
    updateSettings: async (newSettings: Partial<AssistantSettings>): Promise<boolean> => {
      try {
        const currentSettings = await this.settings.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        this.saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
        return true;
      } catch (error) {
        console.error('Error updating settings:', error);
        return false;
      }
    },
  };
} 