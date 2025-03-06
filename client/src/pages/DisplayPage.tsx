import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert, 
  Snackbar, 
  CircularProgress, 
  Button 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import { createSocketConnection, type Socket } from '../utils/socketUtil';
// وارد کردن تنظیمات سرور از فایل پیکربندی
import getServerUrl, { socketConfig } from '../config/serverConfig';

// آدرس سرور Socket.io
const SOCKET_SERVER = process.env.REACT_APP_SERVER_URL || 'http://localhost:4444';

// تعریف تایپ پروژه
interface Project {
  id: string;
  name: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  textAlign: 'right' | 'center' | 'left';
  isMirrored: boolean;
  scrollSpeed: number;
  isScrolling: boolean;
  startPosition: number;
  prompterWidth: number;
  prompterHeight: number;
  startDelay: number;
  useStartDelay: boolean;
  isActive: boolean;
  clientCount: number;
  lineHeight: number; // فاصله بین خطوط
}

const DisplayPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const prompterRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // وضعیت پروژه
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // وضعیت اتصال
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>('');
  
  // وضعیت پیام‌ها
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // وضعیت شمارش معکوس
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number>(0);
  
  // محاسبه سرعت اسکرول
  const calculateScrollSpeed = (speed: number) => {
    // تبدیل سرعت از مقیاس 0-5 به میلی‌ثانیه‌ای برای استفاده در اسکرول
    // هرچه سرعت بیشتر، باید زمان بین اسکرول‌ها کمتر باشد (سریع‌تر)
    
    // اگر سرعت صفر باشد، مقدار بسیار بزرگی برگردان که عملاً هیچ حرکتی نکند
    if (speed === 0) return 10000; // مقدار بسیار بزرگ برای عدم حرکت
    
    // ایجاد بازه بسیار گسترده‌تر: 
    // سرعت 5 (حداکثر) = 50 میلی‌ثانیه (معادل سرعت متوسط قبلی)
    // سرعت 1 (حداقل غیر صفر) = 250 میلی‌ثانیه (بسیار آهسته‌تر از قبل)
    // سرعت 0.2 = 500 میلی‌ثانیه (فوق العاده آهسته)
    
    return 250 - (speed * 40);
  };
  
  // نمایش پیام
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  
  // شروع اسکرول
  const startScrolling = () => {
    if (!project || !prompterRef.current) return;
    
    // اگر قبلاً در حال اسکرول هستیم، آن را متوقف کنیم
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    
    // ایجاد فاصله زمانی جدید برای اسکرول
    const speed = calculateScrollSpeed(project.scrollSpeed);
    scrollIntervalRef.current = setInterval(() => {
      if (prompterRef.current) {
        prompterRef.current.scrollTop += 1;
      }
    }, speed);
  };
  
  // توقف اسکرول
  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };
  
  // تنظیم موقعیت اسکرول
  const setScrollPosition = (position: number) => {
    if (!prompterRef.current) return;
    
    // تبدیل درصد به پیکسل
    const scrollHeight = prompterRef.current.scrollHeight - prompterRef.current.clientHeight;
    const scrollPosition = (position / 100) * scrollHeight;
    
    prompterRef.current.scrollTop = scrollPosition;
  };
  
  // تابع debounce برای جلوگیری از اجرای زیاد یک تابع
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: any[]) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  
  // تنظیم ResizeObserver با debounce
  const setupResizeObserver = useCallback(() => {
    if (!prompterRef.current) return;
    
    // پاکسازی observer قبلی
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    
    const handleResize = debounce(() => {
      if (!prompterRef.current || !project) return;
      
      // تنظیم مجدد موقعیت اسکرول
      if (project.startPosition > 0) {
        setScrollPosition(project.startPosition);
      }
      
      // اگر در حال اسکرول هستیم، بازنشانی آن
      if (project.isScrolling) {
        stopScrolling();
        setTimeout(() => {
          startScrolling();
        }, 100);
      }
    }, 100);
    
    try {
      const observer = new ResizeObserver((entries) => {
        // تاخیر در اجرای عملیات پس از تغییر سایز
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
        
        resizeTimeoutRef.current = setTimeout(() => {
          handleResize();
        }, 100);
      });
      
      observer.observe(prompterRef.current);
      resizeObserverRef.current = observer;
    } catch (error) {
      console.error('خطا در راه‌اندازی ResizeObserver:', error);
    }
  }, [project]);
  
  // نصب و پاکسازی ResizeObserver
  useEffect(() => {
    if (project && prompterRef.current) {
      setupResizeObserver();
    }
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [project, setupResizeObserver]);
  
  // اتصال به سرور و پیوستن به پروژه به عنوان نمایش‌دهنده
  useEffect(() => {
    let socketInstance: Socket | null = null;
    
    const connectToServer = () => {
      try {
        console.log("تلاش برای اتصال به سرور...");
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:4444';
        
        // تنظیمات پیشرفته برای اتصال پایدارتر
        const socketInstance = createSocketConnection(serverUrl, {
          timeout: 30000, // افزایش مهلت زمانی اتصال به 30 ثانیه
          reconnectionAttempts: 10, // افزایش تعداد تلاش‌های اتصال مجدد
          query: {
            projectId,
            role: 'display'
          }
        });
        
        socketInstance.on('connect', () => {
          console.log("به سرور متصل شدیم");
          setIsOnline(true);
          setConnectionError(null);
          
          // پیوستن به اتاق پروژه با نقش نمایش‌دهنده
          socketInstance.emit('join-project', { projectId, role: 'display' });
          
          // درخواست اطلاعات پروژه
          socketInstance.emit('get-project', projectId);
        });
        
        socketInstance.on('connect_error', (error: Error) => {
          console.error('خطا در اتصال به سرور:', error);
          setConnectionError(`خطا در اتصال به سرور: ${error.message}`);
          setIsOnline(false);
          setOpenSnackbar(true);
          showSnackbar(`خطا در اتصال به سرور: ${error.message}`, 'error');
        });
        
        socketInstance.on('disconnect', (reason: string) => {
          setIsOnline(false);
          setOpenSnackbar(true);
          showSnackbar('اتصال به سرور قطع شد', 'error');
          console.log('ارتباط با سرور قطع شد:', reason);
          
          // توقف اسکرول در صورت قطع ارتباط
          stopScrolling();
        });
        
        // به‌روزرسانی تنظیمات پروژه
        socketInstance.on('project-settings-updated', (data: { projectId: string, settings: Partial<Project> }) => {
          if (data.projectId === projectId) {
            setProject(prev => {
              if (!prev) return null;
              
              // بررسی تغییر سرعت اسکرول
              const newProject = { ...prev, ...data.settings };
              if (prev.scrollSpeed !== newProject.scrollSpeed && newProject.isScrolling) {
                // اگر در حال اسکرول هستیم و سرعت تغییر کرده، اسکرول را با سرعت جدید شروع کنیم
                stopScrolling();
                setTimeout(() => {
                  startScrolling();
                }, 50);
              }
              
              return newProject;
            });
          }
        });
        
        // دریافت متن به‌روز شده
        socketInstance.on('text-updated', (data: { projectId: string, text: string }) => {
          if (data.projectId === projectId) {
            setProject(prev => {
              if (!prev) return null;
              return { ...prev, text: data.text };
            });
          }
        });
        
        // تنظیم موقعیت اسکرول
        socketInstance.on('set-scroll-position', (data: { projectId: string, position: number }) => {
          if (data.projectId === projectId) {
            setScrollPosition(data.position);
            setProject(prev => {
              if (!prev) return null;
              return { ...prev, startPosition: data.position };
            });
          }
        });
        
        // وقتی اسکرول شروع می‌شود
        socketInstance.on('scrolling-started', (id: string) => {
          if (id === projectId) {
            setProject(prev => {
              if (!prev) return null;
              return { ...prev, isScrolling: true };
            });
            startScrolling();
          }
        });
        
        // وقتی اسکرول متوقف می‌شود
        socketInstance.on('scrolling-stopped', (id: string) => {
          if (id === projectId) {
            setProject(prev => {
              if (!prev) return null;
              return { ...prev, isScrolling: false };
            });
            stopScrolling();
          }
        });
        
        // در حال شمارش معکوس
        socketInstance.on('countdown-started', (data: { projectId: string, seconds: number }) => {
          if (data.projectId === projectId) {
            setIsCountingDown(true);
            setCountdownValue(data.seconds);
          }
        });
        
        // پایان شمارش معکوس
        socketInstance.on('countdown-finished', (id: string) => {
          if (id === projectId) {
            setIsCountingDown(false);
          }
        });
        
        // دریافت خطا
        socketInstance.on('error', (errorData: any) => {
          console.error('خطای دریافتی از سرور:', errorData);
          
          // بررسی نوع داده خطا و نمایش پیام مناسب
          let errorMessage = 'خطایی در ارتباط با سرور رخ داد';
          
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData && typeof errorData === 'object') {
            // اگر خطا یک آبجکت است، سعی می‌کنیم پیام خطا را استخراج کنیم
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = typeof errorData.error === 'string' 
                ? errorData.error 
                : JSON.stringify(errorData.error);
            } else {
              // اگر ساختار خطا ناشناخته است، کل آبجکت را به رشته تبدیل می‌کنیم
              try {
                errorMessage = `خطای سرور: ${JSON.stringify(errorData)}`;
              } catch (e) {
                errorMessage = 'خطای ناشناخته از سرور دریافت شد';
              }
            }
          }
          
          // نمایش پیام خطا به کاربر
          showSnackbar(errorMessage, 'error');
        });
        
        // پاسخ پینگ از سرور
        socketInstance.on('pong', (latency: number) => {
          console.log('پاسخ پونگ از سرور دریافت شد. تاخیر:', Date.now() - latency, 'میلی‌ثانیه');
        });
        
        setSocket(socketInstance);
        return socketInstance;
      } catch (error) {
        console.error('خطا در اتصال به سرور:', error);
        setConnectionError('خطا در اتصال به سرور. لطفا دوباره تلاش کنید.');
        showSnackbar('خطا در اتصال به سرور', 'error');
        return null;
      }
    };
    
    // ایجاد اتصال به سرور
    socketInstance = connectToServer();
    
    // پاکسازی
    return () => {
      if (socketInstance) {
        // ترک پروژه در هنگام خروج
        if (projectId) {
          socketInstance.emit('leave-project', { projectId });
          console.log(`پروژه ${projectId} را ترک کردیم`);
        }
        
        socketInstance.disconnect();
        console.log('اتصال به سرور قطع شد');
      }
      
      // پاکسازی سایر منابع
      // اطمینان از پاکسازی ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [projectId, navigate]);
  
  // بستن اسنک‌بار
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  // اگر در حال بارگذاری هستیم
  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          در حال بارگذاری نمایش‌دهنده...
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          در حال اتصال به سرور و دریافت اطلاعات پروژه
        </Typography>

        {connectionError && (
          <Alert severity="error" sx={{ mt: 2, maxWidth: '80%' }}>
            {connectionError}
          </Alert>
        )}
        
        <Button 
          variant="outlined" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          تلاش مجدد
        </Button>
      </Box>
    );
  }
  
  // اگر خطایی رخ داده است
  if (error || !project) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3
      }}>
        <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            خطا در بارگذاری نمایش‌دهنده
          </Typography>
          <Typography variant="body1">
            {error || 'پروژه مورد نظر یافت نشد یا قابل دسترسی نیست.'}
          </Typography>
          {connectionError && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {connectionError}
            </Typography>
          )}
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
          >
            تلاش مجدد
          </Button>
          <Button 
            component={RouterLink} 
            to="/" 
            variant="outlined" 
            startIcon={<HomeIcon />}
          >
            بازگشت به صفحه اصلی
          </Button>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        height: '100vh', 
        width: '100vw', 
        overflow: 'hidden',
        backgroundColor: project.backgroundColor,
        color: project.textColor,
        position: 'relative'
      }}
    >
      {/* شمارش معکوس */}
      {isCountingDown && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '20px',
            borderRadius: '50%',
            width: '100px',
            height: '100px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '48px',
            fontWeight: 'bold'
          }}
        >
          {countdownValue}
        </Box>
      )}
      
      {/* وضعیت اتصال */}
      {!isOnline && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0,
            backgroundColor: 'error.main',
            color: 'white',
            padding: '4px 8px',
            textAlign: 'center',
            zIndex: 1000
          }}
        >
          قطع ارتباط با سرور - تلاش برای اتصال مجدد...
        </Box>
      )}
      
      {/* محتوای اصلی پرامپتر */}
      <Box 
        sx={{ 
          height: '100%',
          width: `${project.prompterWidth}%`,
          margin: '0 auto',
          overflowY: 'auto',
          // حذف اسکرول‌بار
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          transform: project.isMirrored ? 'scaleX(-1)' : 'none'
        }}
        ref={prompterRef}
      >
        <Box 
          sx={{ 
            padding: '100vh 16px 100vh 16px', 
            textAlign: project.textAlign,
            fontSize: `${project.fontSize}px`,
            fontFamily: project.fontFamily || 'IRANSans, Tahoma, Arial',
            lineHeight: project.lineHeight
          }}
        >
          {/* متن پرامپتر */}
          {project.text.split('\n').map((line, index) => (
            <Typography 
              key={index} 
              component="div" 
              sx={{ 
                fontSize: 'inherit',
                fontFamily: 'inherit',
                whiteSpace: 'pre-wrap'
              }}
            >
              {line || <br />}
            </Typography>
          ))}
        </Box>
      </Box>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbarSeverity} onClose={handleCloseSnackbar}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DisplayPage; 