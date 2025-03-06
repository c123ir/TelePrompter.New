# دستیار هوشمند توسعه - فاز 1

این پروژه یک دستیار هوشمند برای توسعه‌دهندگان است که به شما کمک می‌کند تسک‌ها، باگ‌ها و ایده‌های خود را مدیریت کنید.

## قابلیت‌های فاز 1

- ثبت و مدیریت تسک‌ها با اولویت‌های مختلف
- گرفتن اسکرین‌شات از صفحه (در این نسخه به صورت شبیه‌سازی شده)
- ذخیره قطعات کد مرتبط با تسک‌ها
- دسترسی سریع با کلیدهای میانبر
- ذخیره‌سازی محلی با localStorage

## پیش‌نیازها

- React 16.8 یا بالاتر
- TypeScript 4.0 یا بالاتر

## نصب در پروژه تله‌پرامپتر

برای اضافه کردن دستیار هوشمند به پروژه تله‌پرامپتر، مراحل زیر را دنبال کنید:

1. فایل‌های موجود در پوشه `Phase1` را به پوشه `src/components/SmartAssistant` در پروژه React خود کپی کنید.

2. در فایل اصلی اپلیکیشن (مثلاً `App.tsx`)، کامپوننت `FloatingAssistant` را وارد کنید:

   ```tsx
   import FloatingAssistant from './components/SmartAssistant/FloatingAssistant';
   
   function App() {
     return (
       <div className="App">
         {/* سایر کامپوننت‌های برنامه */}
         
         {/* دستیار هوشمند */}
         <FloatingAssistant />
       </div>
     );
   }
   ```

3. اطمینان حاصل کنید که دسترسی به `localStorage` در مرورگر فعال است.

## استفاده از دستیار هوشمند

### کلیدهای میانبر

- `Alt + A`: نمایش/مخفی کردن دستیار
- `Alt + S`: گرفتن اسکرین‌شات

### ثبت تسک جدید

1. دستیار را با کلیک روی آیکون آن یا فشردن `Alt + A` باز کنید.
2. فرم "ثبت تسک" را پر کنید.
3. دکمه "ثبت تسک" را کلیک کنید.

### مشاهده تسک‌ها

تسک‌های فعال به صورت خودکار در پنل دستیار نمایش داده می‌شوند. آن‌ها بر اساس اولویت مرتب شده‌اند.

### گرفتن اسکرین‌شات

1. دکمه "اسکرین‌شات" را کلیک کنید یا کلید میانبر `Alt + S` را فشار دهید.
2. اسکرین‌شات گرفته شده در حافظه محلی ذخیره می‌شود.

## ساختار کد

### `types.ts`

تعریف انواع داده‌های مورد استفاده در دستیار هوشمند، شامل تسک‌ها، اسکرین‌شات‌ها و قطعات کد.

### `taskOrchestratorCore.ts`

پیاده‌سازی هسته اصلی دستیار هوشمند با استفاده از localStorage برای ذخیره‌سازی داده‌ها.

### `FloatingAssistant.tsx`

کامپوننت React برای رابط کاربری دستیار، شامل آیکون شناور و پنل مدیریت تسک‌ها.

## توسعه آینده (فاز 2)

- پیاده‌سازی واقعی اسکرین‌شات با `html2canvas`
- ذخیره‌سازی داده‌ها در `IndexedDB` برای حجم بیشتر
- افزودن قابلیت جستجو در تسک‌ها
- بهبود رابط کاربری و افزودن قابلیت شخصی‌سازی

## گزارش مشکلات

اگر مشکلی در استفاده از دستیار هوشمند پیدا کردید، لطفاً آن را در تب Issues گزارش دهید.

## مستندات فنی

برای اطلاعات بیشتر در مورد هر یک از توابع و کلاس‌ها، لطفاً به توضیحات JSDoc در کد مراجعه کنید.

## پیاده‌سازی انتخاب منطقه تصویر در فاز 2

این قابلیت را می‌توانیم در فاز 2 به شکل زیر پیاده‌سازی کنیم:

1. **مکانیزم انتخاب منطقه**: وقتی کاربر دکمه اسکرین‌شات را کلیک می‌کند، یک لایه شفاف روی کل صفحه نمایش داده می‌شود که به کاربر اجازه می‌دهد با دراگ کردن، منطقه مورد نظر را انتخاب کند.

2. **ابزارهای مورد نیاز**:
   - `html2canvas` برای گرفتن اسکرین‌شات از کل صفحه
   - یک کامپوننت `RegionSelector` برای امکان انتخاب بخش خاصی از تصویر

3. **نحوه کارکرد**:
   - ابتدا اسکرین‌شات کامل گرفته می‌شود
   - سپس کاربر می‌تواند منطقه مورد نظر را انتخاب کند
   - بعد از انتخاب، فقط آن بخش از تصویر برش داده و ذخیره می‌شود

## پیش‌نمایش کد برای فاز 2

اینجا یک نمونه اولیه از کدی که می‌توانیم در فاز 2 برای این قابلیت پیاده‌سازی کنیم:

```typescript
// کامپوننت انتخاب منطقه
const RegionSelector: React.FC<{
  screenshotDataUrl: string;
  onRegionSelected: (regionData: {x: number, y: number, width: number, height: number}) => void;
  onCancel: () => void;
}> = ({ screenshotDataUrl, onRegionSelected, onCancel }) => {
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [endPoint, setEndPoint] = useState<{x: number, y: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartPoint({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setEndPoint({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (startPoint && endPoint) {
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      
      // اگر منطقه مناسبی انتخاب شده باشد
      if (width > 10 && height > 10) {
        onRegionSelected({ x, y, width, height });
      }
    }
  };
  
  // محاسبه مستطیل انتخاب شده
  const selectionRect = startPoint && endPoint ? {
    left: Math.min(startPoint.x, endPoint.x),
    top: Math.min(startPoint.y, endPoint.y),
    width: Math.abs(endPoint.x - startPoint.x),
    height: Math.abs(endPoint.y - startPoint.y)
  } : null;
  
  return (
    <div 
      className="region-selector-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <img src={screenshotDataUrl} className="screenshot-preview" />
      {selectionRect && (
        <div 
          className="selection-rectangle"
          style={{
            left: selectionRect.left + 'px',
            top: selectionRect.top + 'px',
            width: selectionRect.width + 'px',
            height: selectionRect.height + 'px'
          }}
        />
      )}
      <div className="control-buttons">
        <button onClick={onCancel}>انصراف</button>
      </div>
    </div>
  );
};
```

## تغییرات لازم در `screenshotManager`

همچنین نیاز به تغییراتی در بخش `screenshotManager` در فایل `taskOrchestratorCore.ts` خواهیم داشت:

```typescript
screenshotManager = {
  // کد موجود...
  
  captureScreenshot: async () => {
    try {
      // گرفتن اسکرین‌شات کامل با html2canvas
      const canvas = await html2canvas(document.body);
      const fullScreenshot = canvas.toDataURL('image/png');
      
      // از اینجا به بعد، پنجره انتخاب منطقه را نمایش می‌دهیم
      // و نتیجه آن را در یک Promise برمی‌گردانیم
      
      return new Promise<Screenshot>((resolve) => {
        // نمایش کامپوننت انتخاب منطقه و دریافت ناحیه انتخاب شده
        // سپس برش تصویر و ذخیره آن
      });
    } catch (error) {
      console.error('خطا در گرفتن اسکرین‌شات:', error);
      // یک تصویر خالی به عنوان پلن B
      return {
        dataUrl: 'data:image/png;base64,...',
        createdAt: new Date()
      };
    }
  },
  
  // سایر متدها...
};
```

## آیا می‌خواهید همین الآن فاز 1 را نصب کنیم؟

می‌توانیم بلافاصله فاز 1 را نصب و راه‌اندازی کنیم و همزمان روی برنامه‌ریزی برای پیاده‌سازی قابلیت انتخاب منطقه تصویر در فاز 2 کار کنیم. آیا می‌خواهید با دستورات نصب فاز 1 شروع کنیم؟