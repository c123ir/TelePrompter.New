import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface TeleprompterViewProps {
  text: string;
  fontSize: number;
  speed: number;
  mirror: boolean;
  backgroundColor: string;
  textColor: string;
  alignment: 'left' | 'center' | 'right';
  isScrolling: boolean;
  fontFamily: string;
  width: number;
  height: number;
  position: { x: number, y: number };
  startDelay: number; // تاخیر شروع (به ثانیه)
  lineHeight: number; // فاصله بین خطوط
}

const TeleprompterView: React.FC<TeleprompterViewProps> = ({
  text,
  fontSize,
  speed,
  mirror,
  backgroundColor,
  textColor,
  alignment,
  isScrolling,
  fontFamily,
  width,
  height,
  position,
  startDelay,
  lineHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [actuallyScrolling, setActuallyScrolling] = useState<boolean>(false);
  const touchStartRef = useRef<number | null>(null);
  const lastScrollPosition = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  
  // تشخیص دستگاه موبایل
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
  
  // مدیریت شمارش معکوس و شروع اسکرول
  useEffect(() => {
    if (isScrolling && startDelay > 0) {
      setCountdown(startDelay);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setActuallyScrolling(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(timer);
      };
    } else if (isScrolling) {
      setActuallyScrolling(true);
    } else {
      setActuallyScrolling(false);
      setCountdown(0);
      // وقتی اسکرول متوقف می‌شود، انیمیشن را هم متوقف کنیم
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [isScrolling, startDelay]);

  // منطق اسکرول خودکار با استفاده از requestAnimationFrame
  useEffect(() => {
    if (!actuallyScrolling || !containerRef.current || !contentRef.current) return;
    
    let lastTime = performance.now();
    let scrollPos = scrollTop;
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      // محاسبه میزان اسکرول بر اساس سرعت
      // speed صفر یا خیلی کم باعث توقف یا حرکت خیلی آهسته می‌شود
      if (speed <= 0.1) return;
      
      // سرعت اسکرول با توجه به سایز متن و سرعت تنظیم شده
      const scrollSpeed = (delta / 1000) * speed * 50;
      scrollPos += scrollSpeed;
      
      // اگر به انتهای متن رسیدیم، اسکرول را متوقف کنیم
      if (contentRef.current && containerRef.current) {
        const maxScroll = contentRef.current.scrollHeight - containerRef.current.clientHeight;
        if (scrollPos >= maxScroll + 200) {
          // 200 پیکسل اضافی برای اطمینان از نمایش کامل همه متن
          setActuallyScrolling(false);
          return;
        }
      }
      
      // به‌روزرسانی موقعیت اسکرول
      setScrollTop(scrollPos);
      if (containerRef.current) {
        containerRef.current.scrollTop = scrollPos;
      } else {
        // توقف انیمیشن اگر المان وجود نداشته باشد
        setActuallyScrolling(false);
        return;
      }
      
      // ادامه انیمیشن
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // شروع انیمیشن
    animationRef.current = requestAnimationFrame(animate);
    
    // پاکسازی
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [actuallyScrolling, speed]);

  // استایل‌های CSS
  const containerStyle = {
    width: `${width}%`,
    height: `${height}%`,
    overflow: 'auto',
    backgroundColor,
    color: textColor,
    padding: isMobile ? '10px' : '20px',
    position: 'relative' as const,
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    WebkitOverflowScrolling: 'touch', // بهبود اسکرول در iOS
    overscrollBehavior: 'contain' as const, // جلوگیری از اسکرول صفحه در پشت
    scrollBehavior: 'smooth',
    msOverflowStyle: 'none', // برای IE و Edge
    scrollbarWidth: 'none' as const, // برای Firefox
    '&::-webkit-scrollbar': {
      display: 'none', // برای Chrome و Safari
    },
  };

  // استایل متن با فونت‌سایز مشخص
  const textStyle = {
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily || 'Vazirmatn, Arial, sans-serif',
    lineHeight: lineHeight || 1.8,
    textAlign: alignment,
    direction: 'rtl' as const,
  };

  // استایل کانتینر متن
  const contentStyle = {
    transform: mirror ? 'scaleX(-1)' : 'none',
    padding: '100vh 0', // فضای خالی برای اسکرول نرم در ابتدا و انتها
  };

  // رویدادهای لمسی برای موبایل
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      // اگر اسکرول خودکار فعال است، با لمس کاربر متوقف شود
      if (actuallyScrolling) {
        setActuallyScrolling(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
      
      // ذخیره موقعیت شروع لمس
      touchStartRef.current = e.touches[0].clientY;
      lastScrollPosition.current = container.scrollTop;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartRef.current === null || !container) return;
      
      // محاسبه میزان حرکت
      const touchY = e.touches[0].clientY;
      const diff = touchStartRef.current - touchY;
      
      // اعمال حرکت به اسکرول
      container.scrollTop = lastScrollPosition.current + diff;
      setScrollTop(container.scrollTop);
    };
    
    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };
    
    // اسکرول با ماوس
    const handleWheel = (e: WheelEvent) => {
      if (!container) return;
      
      // اگر اسکرول خودکار فعال است، با چرخش ماوس متوقف شود
      if (actuallyScrolling) {
        setActuallyScrolling(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
      
      // اسکرول دستی
      const newScrollTop = container.scrollTop + e.deltaY;
      container.scrollTop = newScrollTop;
      setScrollTop(newScrollTop);
    };
    
    // افزودن گوش‌دهنده‌های رویداد
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel);
    
    // پاکسازی
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [actuallyScrolling]);

  return (
    <Box 
      ref={containerRef} 
      sx={containerStyle}
      className="teleprompter-container mobile-scroll-area"
    >
      {countdown > 0 && (
        <Box 
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '120px',
            fontWeight: 'bold',
            zIndex: 10,
            opacity: 0.8,
            color: textColor,
          }}
        >
          {countdown}
        </Box>
      )}
      <div
        ref={contentRef}
        style={contentStyle}
        className="teleprompter-content"
      >
        {text.split('\n').map((paragraph, index) => (
          <div key={index} style={textStyle as any}>
            {paragraph || ' '}
          </div>
        ))}
      </div>
    </Box>
  );
};

export default TeleprompterView; 