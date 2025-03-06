# مستندات پروژه دستیار هوشمند

## مقدمه
این مستندات شامل توضیحاتی درباره طراحی، پیاده‌سازی و قابلیت‌های دستیار هوشمندی است که برای پروژه تله‌پرامپتر توسعه داده شده است. این دستیار به توسعه‌دهندگان کمک می‌کند تا تسک‌ها، باگ‌ها و ایده‌های خود را در حین توسعه مدیریت کنند.

## ساختار پروژه
پروژه دستیار هوشمند در چندین فاز توسعه داده شده است. در فاز اول، زیرساخت‌های پایه و قابلیت‌های اصلی پیاده‌سازی شده‌اند.

### فایل‌های اصلی:
1. **types.ts**: تعریف انواع داده‌ها و ساختارهای مورد نیاز
2. **taskOrchestratorCore.ts**: منطق اصلی و هسته‌ی دستیار هوشمند
3. **FloatingAssistant.tsx**: رابط کاربری دستیار شناور
4. **README.md**: راهنمای استفاده و نصب
5. **TaskManagementPanel.tsx** (در حال توسعه): پنل مدیریت پیشرفته تسک‌ها

## قابلیت‌های فعلی

### 1. مدیریت تسک‌ها
- ایجاد تسک‌های جدید با عنوان، توضیحات، نوع و اولویت
- نمایش تسک‌های موجود بر اساس اولویت
- ذخیره‌سازی تسک‌ها در localStorage مرورگر

### 2. قابلیت اسکرین‌شات
- گرفتن اسکرین‌شات از صفحه (در حال حاضر شبیه‌سازی شده)
- ذخیره‌سازی اسکرین‌شات‌ها در localStorage
- نمایش اسکرین‌شات‌های ذخیره شده در بخش گالری

### 3. کلیدهای میانبر
- `Shift+Alt+A`: نمایش/مخفی کردن دستیار هوشمند
- `Shift+Alt+S`: گرفتن اسکرین‌شات

### 4. صادرات داده‌ها
- امکان دانلود تمام داده‌های ذخیره شده (تسک‌ها، اسکرین‌شات‌ها و تنظیمات) به صورت فایل JSON

### 5. رابط کاربری چند بخشی
- بخش مدیریت تسک‌ها
- بخش نمایش اسکرین‌شات‌ها
- امکان جابجایی بین بخش‌ها از طریق تب‌های نوار منو

## تغییرات و بهبودهای اخیر

### 1. بهینه‌سازی کد
- استفاده از `useCallback` و `useMemo` برای بهینه‌سازی عملکرد
- رفع خطاهای ESLint
- بهبود مدیریت وابستگی‌ها در هوک‌های `useEffect`

### 2. بهبود رابط کاربری
- افزودن نوار منو برای جابجایی بین بخش‌ها
- طراحی گالری برای نمایش اسکرین‌شات‌ها
- بهبود دکمه‌های پانل پایین

### 3. بهبود تجربه کاربری
- بهبود کلیدهای میانبر
- امکان دانلود داده‌ها به صورت فایل JSON
- مشاهده تاریخ و توضیحات اسکرین‌شات‌ها

## برنامه‌های آینده (فاز 2)

### 1. پنل مدیریت پیشرفته
- افزودن قابلیت چک‌لیست برای تسک‌ها
- امکان ویرایش و حذف تسک‌ها
- نمایش پیشرفت تسک‌ها
- بخش ثبت نظر نهایی

### 2. قابلیت جستجوی پیشرفته
- جستجو در تسک‌ها بر اساس عنوان، توضیحات، تگ‌ها و سایر معیارها
- فیلترهای پیشرفته برای مرتب‌سازی نتایج

### 3. بهبود قابلیت اسکرین‌شات
- گرفتن اسکرین‌شات واقعی (به جای شبیه‌سازی)
- امکان انتخاب ناحیه خاص از صفحه برای اسکرین‌شات
- افزودن یادداشت و نشانه‌گذاری روی اسکرین‌شات‌ها

### 4. بهبود ذخیره‌سازی داده‌ها
- پشتیبان‌گیری خودکار
- امکان همگام‌سازی با سرور یا سرویس‌های ابری
- ذخیره‌سازی داده‌ها به فرمت‌های مختلف

## نحوه استفاده

### نصب
1. فایل‌های موجود در پوشه `SmartAssistant` را به پوشه `components` پروژه خود کپی کنید
2. کامپوننت `FloatingAssistant` را در فایل اصلی خود (`App.tsx`) وارد کنید:
```jsx
import { FloatingAssistant } from './components/SmartAssistant/FloatingAssistant';

function App() {
  return (
    <div className="App">
      {/* سایر کامپوننت‌های برنامه */}
      <FloatingAssistant />
    </div>
  );
}
```

### استفاده از دستیار
1. با کلیک روی آیکون دستیار (💡) یا فشردن کلیدهای میانبر `Shift+Alt+A`، دستیار را باز کنید
2. در تب "تسک‌ها"، می‌توانید تسک‌های جدید ایجاد کنید
3. در تب "اسکرین‌شات‌ها"، می‌توانید اسکرین‌شات‌های ذخیره شده را مشاهده کنید
4. با کلیک روی دکمه "صادرات داده‌ها"، می‌توانید تمام داده‌ها را به صورت فایل JSON دانلود کنید

## تیم توسعه
این پروژه توسط تیم توسعه تله‌پرامپتر طراحی و پیاده‌سازی شده است.

## لایسنس
تمامی حقوق این پروژه محفوظ است.

### Smart Assistant Integration
The application includes a smart assistant that helps developers manage tasks, bugs, and ideas directly within the development environment. The assistant provides features like:
- Task management with priority levels
- Screenshot capture and annotation
- Code snippet storage
- Quick access via keyboard shortcuts
- Local storage for data persistence

### AI Capabilities and Future Roadmap
The smart assistant is designed to evolve with advanced AI capabilities:

1. **Intelligent Task Analysis**:
   - Pattern recognition for similar issues
   - Automated task prioritization
   - Smart task categorization

2. **Context Preservation**:
   - Maintaining development context across sessions
   - Learning from previous decisions
   - Smart suggestions based on historical data

3. **Development Phases**:
   - Phase 1: Core functionality with localStorage (Current)
   - Phase 2: Advanced features with Node.js microservice
   - Phase 3: AI integration and complete system unification

4. **Technical Challenges and Solutions**:
   - Performance: Web Workers for background processing
   - Integration: Modular design with Observer pattern
   - Storage: IndexedDB for local storage with server sync 