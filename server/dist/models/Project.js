"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectManager = exports.Project = void 0;
const uuid_1 = require("uuid");
/**
 * مدل داده پروژه تله‌پرامپتر
 */
class Project {
    id;
    name;
    createdAt;
    updatedAt;
    // متن تله‌پرامپتر
    text;
    // تنظیمات نمایش
    fontSize;
    fontFamily;
    textColor;
    backgroundColor;
    textAlign;
    isMirrored;
    lineHeight; // فاصله بین خطوط
    // تنظیمات اسکرول
    scrollSpeed;
    isScrolling;
    startPosition;
    // تنظیمات ابعاد
    prompterWidth;
    prompterHeight;
    // تنظیمات شروع تاخیری
    startDelay;
    useStartDelay;
    // وضعیت فعلی
    isActive;
    // کاربران متصل به این پروژه
    connectedClients;
    constructor(name, text = 'متن پیش‌فرض تله‌پرامپتر...') {
        this.id = (0, uuid_1.v4)();
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
        this.connectedClients = new Set();
    }
    // به‌روزرسانی تنظیمات پروژه
    updateSettings(settings) {
        // به‌روزرسانی فیلدهای مختلف بر اساس تنظیمات ورودی
        Object.assign(this, settings);
        this.updatedAt = new Date();
    }
    // اضافه کردن یک کلاینت به پروژه
    addClient(clientId) {
        this.connectedClients.add(clientId);
    }
    // حذف یک کلاینت از پروژه
    removeClient(clientId) {
        this.connectedClients.delete(clientId);
    }
    // تعداد کاربران متصل
    get clientCount() {
        return this.connectedClients.size;
    }
    // شروع اسکرول
    startScrolling() {
        this.isScrolling = true;
        this.updatedAt = new Date();
    }
    // توقف اسکرول
    stopScrolling() {
        this.isScrolling = false;
        this.updatedAt = new Date();
    }
    // تغییر سرعت اسکرول
    setScrollSpeed(speed) {
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
exports.Project = Project;
/**
 * مدیریت پروژه‌ها
 */
class ProjectManager {
    projects;
    constructor() {
        this.projects = new Map();
    }
    // ایجاد پروژه جدید
    createProject(name, text) {
        const project = new Project(name, text);
        this.projects.set(project.id, project);
        return project;
    }
    // دریافت پروژه با شناسه
    getProject(id) {
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
    getAllProjects() {
        return Array.from(this.projects.values());
    }
    // به‌روزرسانی پروژه
    updateProject(id, settings) {
        const project = this.projects.get(id);
        if (project) {
            project.updateSettings(settings);
            return project;
        }
        return undefined;
    }
    // حذف پروژه
    deleteProject(id) {
        if (!this.projects.has(id)) {
            console.log(`تلاش برای حذف پروژه‌ای که وجود ندارد: ${id}`);
            return false;
        }
        return this.projects.delete(id);
    }
    // اضافه کردن کلاینت به پروژه
    addClientToProject(projectId, clientId) {
        const project = this.projects.get(projectId);
        if (project) {
            project.addClient(clientId);
            return true;
        }
        return false;
    }
    // حذف کلاینت از پروژه
    removeClientFromProject(projectId, clientId) {
        const project = this.projects.get(projectId);
        if (project) {
            project.removeClient(clientId);
            return true;
        }
        return false;
    }
    // یافتن پروژه‌ای که کلاینت به آن متصل است
    findProjectByClientId(clientId) {
        for (const project of this.projects.values()) {
            if (project.connectedClients.has(clientId)) {
                return project;
            }
        }
        return undefined;
    }
}
exports.ProjectManager = ProjectManager;
