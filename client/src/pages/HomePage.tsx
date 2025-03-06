import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Box, Alert, Snackbar, Fab, useMediaQuery, useTheme, Drawer, IconButton, Typography, Badge, Button, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import TeleprompterView from '../components/TeleprompterView';
import SettingsPanel from '../components/SettingsPanel';
import ServerStatus from '../components/ServerStatus';
import { createSocketConnection, type Socket } from '../utils/socketUtil';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import BarChartIcon from '@mui/icons-material/BarChart';
import HomeIcon from '@mui/icons-material/Home';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SpeedIcon from '@mui/icons-material/Speed';

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

const HomePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // تشخیص دستگاه موبایل
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // وضعیت پروژه
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // وضعیت اتصال
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>('');
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [activeConnections, setActiveConnections] = useState<number>(0);
  const [connectionTime, setConnectionTime] = useState<Date | undefined>(undefined);
  const [lastPingTime, setLastPingTime] = useState<number | undefined>(undefined);
  
  // وضعیت‌های UI
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  
  // مرجع برای سوکت
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // مرجع برای زمان شروع اسکرول
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [countdownValue, setCountdownValue] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  
  // اتصال به سرور و پیوستن به پروژه
  useEffect(() => {
    if (!projectId) {
      // اگر شناسه پروژه نیست، به صفحه انتخاب پروژه برگردیم
      navigate('/');
      return;
    }
    
    const setupSocketConnection = () => {
      if (socket) {
        socket.disconnect();
      }

      // ایجاد اتصال جدید به سرور با استفاده از شناسه پروژه انتخاب شده
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:4444';
      
      // تنظیمات پیشرفته برای اتصال پایدارتر
      const newSocket = createSocketConnection(serverUrl, {
        timeout: 30000, // افزایش مهلت زمانی اتصال به 30 ثانیه
        reconnectionAttempts: 10, // افزایش تعداد تلاش‌های اتصال مجدد
        query: {
          projectId: projectId,
          role: 'controller'
        }
      });
      
      newSocket.on('connect', () => {
        setIsOnline(true);
        setConnectionTime(new Date());
        setConnectionError('');
        setReconnectAttempts(0);
        console.log('به سرور متصل شدیم');
        
        // پیوستن به پروژه
        newSocket.emit('join-project', projectId);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('خطا در اتصال به سرور:', error);
        setConnectionError(`خطا در اتصال به سرور: ${error.message}`);
        setIsOnline(false);
        setOpenSnackbar(true);
        
        // افزایش تعداد تلاش‌های اتصال مجدد
        setReconnectAttempts(prev => prev + 1);
      });
      
      newSocket.on('disconnect', (reason) => {
        setIsOnline(false);
        setOpenSnackbar(true);
        showSnackbar('اتصال به سرور قطع شد', 'error');
        console.log('ارتباط با سرور قطع شد:', reason);
      });
      
      // دریافت اطلاعات پروژه
      newSocket.on('project-data', (projectData: Project) => {
        setProject(projectData);
        setLoading(false);
        showSnackbar(`پروژه "${projectData.name}" بارگذاری شد`, 'success');
      });
      
      // به‌روزرسانی تنظیمات پروژه
      newSocket.on('project-settings-updated', (data: { projectId: string, settings: Partial<Project> }) => {
        if (data.projectId === projectId) {
          setProject(prev => {
            if (!prev) return null;
            return { ...prev, ...data.settings };
          });
        }
      });
      
      // دریافت متن به‌روز شده
      newSocket.on('text-updated', (data: { projectId: string, text: string }) => {
        if (data.projectId === projectId) {
          setProject(prev => {
            if (!prev) return null;
            return { ...prev, text: data.text };
          });
        }
      });
      
      // وقتی اسکرول شروع می‌شود
      newSocket.on('scrolling-started', (id: string) => {
        if (id === projectId) {
          setProject(prev => {
            if (!prev) return null;
            return { ...prev, isScrolling: true };
          });
          showSnackbar('اسکرول متن شروع شد', 'info');
        }
      });
      
      // وقتی اسکرول متوقف می‌شود
      newSocket.on('scrolling-stopped', (id: string) => {
        if (id === projectId) {
          setProject(prev => {
            if (!prev) return null;
            return { ...prev, isScrolling: false };
          });
          showSnackbar('اسکرول متن متوقف شد', 'info');
        }
      });
      
      // پیوستن کاربر جدید
      newSocket.on('client-joined', (data: { projectId: string, clientId: string }) => {
        if (data.projectId === projectId) {
          showSnackbar('کاربر جدیدی به پروژه پیوست', 'info');
        }
      });
      
      // خروج کاربر
      newSocket.on('client-left', (data: { projectId: string, clientId: string }) => {
        if (data.projectId === projectId) {
          showSnackbar('یکی از کاربران پروژه را ترک کرد', 'info');
        }
      });
      
      // دریافت تعداد اتصالات
      newSocket.on('connection-count', (count: number) => {
        setActiveConnections(count);
      });
      
      // دریافت پینگ
      newSocket.on('pong', (ms: number) => {
        setLastPingTime(ms);
      });
      
      // دریافت خطا
      newSocket.on('error', (errorData: any) => {
        console.error('خطای دریافتی از سرور:', errorData);
        showSnackbar(errorData.message || 'خطایی رخ داد', 'error');
      });
      
      setSocket(newSocket);
      return newSocket;
    };
    
    // ایجاد اتصال به سرور
    const socketInstance = setupSocketConnection();
    
    // پاکسازی
    return () => {
      if (socketInstance) {
        // ترک پروژه قبل از قطع اتصال
        socketInstance.emit('leave-project', projectId);
        socketInstance.disconnect();
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [projectId, navigate]);
  
  // تلاش مجدد برای اتصال
  useEffect(() => {
    if (!isOnline && reconnectAttempts < maxReconnectAttempts && reconnectAttempts > 0) {
      reconnectTimerRef.current = setTimeout(() => {
        console.log(`تلاش مجدد برای اتصال (${reconnectAttempts}/${maxReconnectAttempts})...`);
        // تلاش مجدد برای اتصال
        if (socket) {
          socket.connect();
        }
      }, 5000); // فاصله 5 ثانیه بین تلاش‌ها
    }
    
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [isOnline, reconnectAttempts, maxReconnectAttempts, socket]);
  
  // اتصال مجدد دستی
  const handleReconnect = () => {
    console.log('تلاش برای اتصال مجدد...');
    if (socket) {
      socket.connect();
    }
  };
  
  // تغییر متن
  const handleTextChange = (newText: string) => {
    if (!socket || !isOnline || !project) return;
    
    // به‌روزرسانی محلی
    setProject(prev => {
      if (!prev) return null;
      return { ...prev, text: newText };
    });
    
    // ارسال به سرور
    socket.emit('update-text', {
      projectId: projectId,
      text: newText
    });
  };
  
  // ارسال تنظیمات به سرور
  const sendSettingsToServer = (settings: Partial<Project>) => {
    if (!socket || !isOnline || !projectId) return;
    
    socket.emit('update-project-settings', {
      projectId,
      settings
    });
  };
  
  // شروع اسکرول
  const handleStartScrolling = () => {
    if (!socket || !isOnline || !project) return;
    
    if (project.useStartDelay && project.startDelay > 0) {
      // شروع شمارش معکوس
      setCountdownValue(project.startDelay);
      setIsCountingDown(true);
      
      let remainingSeconds = project.startDelay;
      
      const intervalId = setInterval(() => {
        remainingSeconds -= 1;
        setCountdownValue(remainingSeconds);
        
        if (remainingSeconds <= 0) {
          clearInterval(intervalId);
          setIsCountingDown(false);
          
          // ارسال درخواست شروع اسکرول به سرور
          socket.emit('start-scrolling', projectId);
        }
      }, 1000);
      
      scrollTimerRef.current = intervalId;
    } else {
      // شروع بدون تاخیر
      socket.emit('start-scrolling', projectId);
    }
  };
  
  // توقف اسکرول
  const handleStopScrolling = () => {
    if (!socket || !isOnline || !project) return;
    
    // توقف شمارش معکوس اگر در حال انجام است
    if (isCountingDown && scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      setIsCountingDown(false);
    }
    
    // ارسال درخواست توقف اسکرول به سرور
    socket.emit('stop-scrolling', projectId);
  };
  
  // تغییر تنظیمات
  const handleSettingChange = <K extends keyof Project>(key: K, value: Project[K]) => {
    if (!project) return;
    
    // به‌روزرسانی محلی
    setProject(prev => {
      if (!prev) return null;
      return { ...prev, [key]: value };
    });
    
    // ارسال به سرور
    sendSettingsToServer({ [key]: value } as Partial<Project>);
  };
  
  // نمایش پیام
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  
  // بستن اسنک‌بار
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  // بازکردن/بستن پنل تنظیمات در موبایل
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // برای وقتی که در حال اسکرول هستیم، پنل تنظیمات را ببندیم
  useEffect(() => {
    if (project?.isScrolling && isMobile) {
      setDrawerOpen(false);
    }
  }, [project?.isScrolling, isMobile]);
  
  // اگر در حال بارگذاری هستیم
  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          در حال بارگذاری پروژه...
        </Typography>
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
            خطا در بارگذاری پروژه
          </Typography>
          <Typography variant="body1">
            {error || 'پروژه مورد نظر یافت نشد یا قابل دسترسی نیست.'}
          </Typography>
        </Alert>
        <Button 
          component={RouterLink} 
          to="/" 
          variant="contained" 
          startIcon={<HomeIcon />}
        >
          بازگشت به صفحه اصلی
        </Button>
      </Box>
    );
  }
  
  // پنل تنظیمات
  const settingsPanel = (
    <SettingsPanel
      fontSize={project.fontSize}
      setFontSize={(value) => handleSettingChange('fontSize', value)}
      speed={project.scrollSpeed}
      setSpeed={(value) => handleSettingChange('scrollSpeed', value)}
      mirror={project.isMirrored}
      setMirror={(value) => handleSettingChange('isMirrored', value)}
      backgroundColor={project.backgroundColor}
      setBackgroundColor={(value) => handleSettingChange('backgroundColor', value)}
      textColor={project.textColor}
      setTextColor={(value) => handleSettingChange('textColor', value)}
      alignment={project.textAlign}
      setAlignment={(value) => handleSettingChange('textAlign', value)}
      isScrolling={project.isScrolling}
      setIsScrolling={(value) => {
        if (value) {
          handleStartScrolling();
        } else {
          handleStopScrolling();
        }
      }}
      text={project.text}
      setText={handleTextChange}
      fontFamily={project.fontFamily}
      setFontFamily={(value) => handleSettingChange('fontFamily', value)}
      width={project.prompterWidth}
      setWidth={(value) => handleSettingChange('prompterWidth', value)}
      height={project.prompterHeight}
      setHeight={(value) => handleSettingChange('prompterHeight', value)}
      position={{ x: 50, y: project.startPosition }}
      setPosition={(pos) => handleSettingChange('startPosition', pos.y)}
      startDelay={project.startDelay}
      setStartDelay={(value) => handleSettingChange('startDelay', value)}
      useStartDelay={project.useStartDelay}
      setUseStartDelay={(value) => handleSettingChange('useStartDelay', value)}
      lineHeight={project.lineHeight}
      setLineHeight={(value) => handleSettingChange('lineHeight', value)}
    />
  );
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h6" component="div">
          {project.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ServerStatus 
            isConnected={isOnline}
            activeConnections={activeConnections}
            serverUrl={SOCKET_SERVER}
            reconnect={handleReconnect}
            connectionError={connectionError === null ? undefined : connectionError}
            reconnectAttempts={reconnectAttempts}
            maxReconnectAttempts={maxReconnectAttempts}
            lastPingTime={lastPingTime}
            connectionTime={connectionTime}
          />
          <Button
            component={RouterLink}
            to="/"
            startIcon={<HomeIcon />}
            size="small"
            sx={{ ml: 1 }}
          >
            لیست پروژه‌ها
          </Button>
        </Box>
      </Box>
      
      {/* نوار کنترل اسکرول */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        p: 1, 
        bgcolor: 'background.paper', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        {!project.isScrolling ? (
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartScrolling}
            disabled={!isOnline || isCountingDown}
          >
            {isCountingDown ? `شروع در ${countdownValue} ثانیه...` : 'شروع اسکرول'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={handleStopScrolling}
            disabled={!isOnline}
          >
            توقف اسکرول
          </Button>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <SpeedIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">
            سرعت: {project.scrollSpeed}
          </Typography>
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

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* نمایش تنظیمات بر اساس نوع دستگاه */}
        {isMobile ? (
          <>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={handleDrawerToggle}
              sx={{
                '& .MuiDrawer-paper': { 
                  width: '85%',
                  boxSizing: 'border-box',
                  height: '100%' 
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <IconButton onClick={handleDrawerToggle}>
                  <CloseIcon />
                </IconButton>
              </Box>
              {settingsPanel}
            </Drawer>
            
            {/* دکمه شناور برای باز کردن پنل تنظیمات در موبایل */}
            <Fab
              color="primary"
              aria-label="تنظیمات"
              sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
              onClick={handleDrawerToggle}
            >
              <SettingsIcon />
            </Fab>
            
            {/* نمایش تمام صفحه در موبایل */}
            <Box sx={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
              <TeleprompterView
                text={project.text}
                fontSize={project.fontSize}
                speed={project.scrollSpeed}
                mirror={project.isMirrored}
                backgroundColor={project.backgroundColor}
                textColor={project.textColor}
                alignment={project.textAlign}
                isScrolling={project.isScrolling}
                fontFamily={project.fontFamily}
                width={project.prompterWidth}
                height={project.prompterHeight}
                position={{ x: 50, y: project.startPosition }}
                startDelay={0} // شمارش معکوس در سطح بالاتر مدیریت می‌شود
                lineHeight={project.lineHeight}
              />
            </Box>
          </>
        ) : (
          <Grid container sx={{ height: '100vh' }}>
            <Grid item xs={12} md={4} sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
              {settingsPanel}
            </Grid>
            <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TeleprompterView
                text={project.text}
                fontSize={project.fontSize}
                speed={project.scrollSpeed}
                mirror={project.isMirrored}
                backgroundColor={project.backgroundColor}
                textColor={project.textColor}
                alignment={project.textAlign}
                isScrolling={project.isScrolling}
                fontFamily={project.fontFamily}
                width={project.prompterWidth}
                height={project.prompterHeight}
                position={{ x: 50, y: project.startPosition }}
                startDelay={0} // شمارش معکوس در سطح بالاتر مدیریت می‌شود
                lineHeight={project.lineHeight}
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default HomePage; 