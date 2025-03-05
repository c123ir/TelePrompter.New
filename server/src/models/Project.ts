import { v4 as uuidv4 } from 'uuid';

/**
 * مدل داده پروژه تله‌پرامپتر
 */
export class Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  
  // متن تله‌پرامپتر
  text: string;
  
  // تنظیمات نمایش
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  textAlign: 'right' | 'center' | 'left';
  isMirrored: boolean;
  lineHeight: number; // فاصله بین خطوط
  
  // تنظیمات اسکرول
  scrollSpeed: number;
  isScrolling: boolean;
  startPosition: number;
  
  // تنظیمات ابعاد
  prompterWidth: number;
  prompterHeight: number;
  
  // تنظیمات شروع تاخیری
  startDelay: number;
  useStartDelay: boolean;
  
  // وضعیت فعلی
  isActive: boolean;
  
  // کاربران متصل به این پروژه
  connectedClients: Set<string>;

  constructor(name: string, text: string = 'متن پیش‌فرض تله‌پرامپتر...') {
    this.id = uuidv4();
    this.name = name;
    this.text = text;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // تنظیمات نمایش پیش‌فرض
    this.fontSize = 36;
    this.fontFamily = '"Vazirmatn", sans-serif';
    this.textColor = '#ffffff';
    this.backgroundColor = '#000000';
    this.textAlign = 'right';
    this.isMirrored = false;
    this.lineHeight = 1.8; // مقدار پیش‌فرض فاصله بین خطوط
    
    // تنظیمات اسکرول پیش‌فرض
    this.scrollSpeed = 1; // مقدار کم برای سرعت آهسته پیش‌فرض
    this.isScrolling = false;
    this.startPosition = 0;
    
    // تنظیمات سایز
    this.prompterWidth = 800;
    this.prompterHeight = 600;
    
    // تنظیمات تاخیر شروع
    this.startDelay = 3;
    this.useStartDelay = false;
    
    // وضعیت فعال بودن و اتصالات
    this.isActive = true;
    this.connectedClients = new Set<string>();
  }

  // به‌روزرسانی تنظیمات پروژه
  updateSettings(settings: Partial<Project>): void {
    // به‌روزرسانی فیلدهای مختلف بر اساس تنظیمات ورودی
    Object.assign(this, settings);
    this.updatedAt = new Date();
  }

  // اضافه کردن یک کلاینت به پروژه
  addClient(clientId: string): void {
    this.connectedClients.add(clientId);
  }

  // حذف یک کلاینت از پروژه
  removeClient(clientId: string): void {
    this.connectedClients.delete(clientId);
  }

  // تعداد کاربران متصل
  get clientCount(): number {
    return this.connectedClients.size;
  }

  // شروع اسکرول
  startScrolling(): void {
    this.isScrolling = true;
    this.updatedAt = new Date();
  }

  // توقف اسکرول
  stopScrolling(): void {
    this.isScrolling = false;
    this.updatedAt = new Date();
  }

  // تغییر سرعت اسکرول
  setScrollSpeed(speed: number): void {
    this.scrollSpeed = speed;
    this.updatedAt = new Date();
  }

  // تبدیل به یک آبجکت ساده برای ارسال به کلاینت
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      text: this.text,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      textColor: this.textColor,
      backgroundColor: this.backgroundColor,
      textAlign: this.textAlign,
      isMirrored: this.isMirrored,
      lineHeight: this.lineHeight,
      scrollSpeed: this.scrollSpeed,
      isScrolling: this.isScrolling,
      startPosition: this.startPosition,
      prompterWidth: this.prompterWidth,
      prompterHeight: this.prompterHeight,
      startDelay: this.startDelay,
      useStartDelay: this.useStartDelay,
      isActive: this.isActive,
      clientCount: this.clientCount
    };
  }
}

/**
 * مدیریت پروژه‌ها
 */
export class ProjectManager {
  private projects: Map<string, Project>;

  constructor() {
    this.projects = new Map<string, Project>();
  }

  // ایجاد پروژه جدید
  createProject(name: string, text?: string): Project {
    const project = new Project(name, text);
    this.projects.set(project.id, project);
    return project;
  }

  // دریافت پروژه با شناسه
  getProject(id: string): Project | undefined {
    const project = this.projects.get(id);
    if (!project) {
      console.log(`پروژه‌ای با شناسه ${id} یافت نشد. تعداد کل پروژه‌ها: ${this.projects.size}`);
      if (this.projects.size > 0) {
        console.log(`شناسه‌های پروژه‌های موجود: ${Array.from(this.projects.keys()).join(', ')}`);
      }
    }
    return project;
  }

  // دریافت لیست همه پروژه‌ها
  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  // به‌روزرسانی پروژه
  updateProject(id: string, settings: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (project) {
      project.updateSettings(settings);
      return project;
    }
    return undefined;
  }

  // حذف پروژه
  deleteProject(id: string): boolean {
    if (!this.projects.has(id)) {
      console.log(`تلاش برای حذف پروژه‌ای که وجود ندارد: ${id}`);
      return false;
    }
    
    return this.projects.delete(id);
  }

  // اضافه کردن کلاینت به پروژه
  addClientToProject(projectId: string, clientId: string): boolean {
    const project = this.projects.get(projectId);
    if (project) {
      project.addClient(clientId);
      return true;
    }
    return false;
  }

  // حذف کلاینت از پروژه
  removeClientFromProject(projectId: string, clientId: string): boolean {
    const project = this.projects.get(projectId);
    if (project) {
      project.removeClient(clientId);
      return true;
    }
    return false;
  }

  // یافتن پروژه‌ای که کلاینت به آن متصل است
  findProjectByClientId(clientId: string): Project | undefined {
    for (const project of this.projects.values()) {
      if (project.connectedClients.has(clientId)) {
        return project;
      }
    }
    return undefined;
  }
} 