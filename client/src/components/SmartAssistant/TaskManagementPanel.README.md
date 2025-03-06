# راهنمای کامپوننت TaskManagementPanel

این کامپوننت برای مدیریت پیشرفته تسک‌ها در دستیار هوشمند توسعه داده شده است. با استفاده از این کامپوننت، کاربران می‌توانند تسک‌های موجود را مدیریت کنند، وضعیت و اولویت آن‌ها را تغییر دهند و در صورت نیاز تسک‌ها را حذف کنند.

## ویژگی‌ها

- نمایش لیست تسک‌ها با جزئیات کامل
- امکان تغییر وضعیت تسک‌ها (انجام نشده، در حال انجام، انجام شده، به تعویق افتاده)
- امکان تغییر اولویت تسک‌ها (کم، متوسط، زیاد، بحرانی)
- امکان حذف تسک‌ها
- نمایش تاریخ ایجاد تسک‌ها
- نمایش نوع تسک (باگ، قابلیت جدید، بازنویسی، بهینه‌سازی، مستندسازی، ایده)

## طریقه استفاده

کامپوننت `TaskManagementPanel` به سه prop نیاز دارد:

```typescript
interface TaskManagementPanelProps {
  tasks: Task[];                                         // آرایه‌ای از تسک‌ها
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;  // تابع به‌روزرسانی تسک
  onTaskDelete: (taskId: string) => void;                // تابع حذف تسک
}
```

### استفاده در FloatingAssistant

این کامپوننت در حال حاضر در `FloatingAssistant.tsx` به عنوان یکی از تب‌های دستیار استفاده شده است. کاربران می‌توانند با کلیک روی تب "مدیریت پیشرفته" به این بخش دسترسی پیدا کنند.

### نمونه کد استفاده

```tsx
import TaskManagementPanel from './TaskManagementPanel';

// ... در کامپوننت والد ...

// تابع به‌روزرسانی تسک
const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
  try {
    await orchestrator.taskManager.updateTask(taskId, updates);
    // بارگیری مجدد تسک‌ها
    await loadTasks();
  } catch (error) {
    console.error('خطا در به‌روزرسانی تسک:', error);
  }
};

// تابع حذف تسک
const handleTaskDelete = async (taskId: string) => {
  try {
    if (window.confirm('آیا از حذف این تسک اطمینان دارید؟')) {
      // کد حذف تسک
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  } catch (error) {
    console.error('خطا در حذف تسک:', error);
  }
};

// استفاده از کامپوننت
return (
  <TaskManagementPanel 
    tasks={tasks}
    onTaskUpdate={handleTaskUpdate}
    onTaskDelete={handleTaskDelete}
  />
);
```

## استایل‌ها

این کامپوننت از کلاس‌های CSS زیر استفاده می‌کند:

- `.task-management-panel`: کانتینر اصلی
- `.task-list`: لیست تسک‌ها
- `.task-item`: هر آیتم تسک
- `.task-header`: هدر تسک شامل عنوان و نشانگر اولویت
- `.priority-badge`: نشانگر اولویت تسک
- `.task-meta`: متا دیتای تسک شامل نوع، وضعیت و تاریخ
- `.task-actions`: دکمه‌های عملیات روی تسک

## برنامه‌های آینده

در فاز بعدی توسعه، قابلیت‌های زیر به این کامپوننت اضافه خواهند شد:

- امکان جستجو و فیلتر تسک‌ها
- افزودن چک‌لیست به تسک‌ها
- نمایش پیشرفت تسک‌ها
- ویرایش کامل مشخصات تسک‌ها
- امکان دسته‌بندی تسک‌ها با برچسب
- نمایش اسکرین‌شات‌های مرتبط با هر تسک 