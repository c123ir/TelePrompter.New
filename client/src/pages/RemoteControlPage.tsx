import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Slider,
  Button, 
  Alert, 
  Snackbar, 
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tab,
  Tabs,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import HomeIcon from '@mui/icons-material/Home';
import SpeedIcon from '@mui/icons-material/Speed';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import FlipIcon from '@mui/icons-material/Flip';
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing';
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

// نوع تب فعال
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// پنل تب
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ overflowX: 'hidden' }}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const RemoteControlPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // وضعیت تب‌ها
  const [tabValue, setTabValue] = useState<number>(0);
  
  // وضعیت پروژه
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // وضعیت اتصال
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>('');
  const [connectedViewers, setConnectedViewers] = useState<number>(0);
  
  // وضعیت پیام‌ها
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // وضعیت شمارش معکوس
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number>(0);
  
  // تغییر تب
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // نمایش پیام
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  
  // اتصال به سرور و پیوستن به پروژه به عنوان کنترل‌کننده
  useEffect(() => {
    if (!projectId) {
      // اگر شناسه پروژه نیست، به صفحه انتخاب پروژه برگردیم
      navigate('/');
      return;
    }
    
    const setupSocketConnection = () => {
      try {
        // بررسی وجود و قطع اتصال قبلی
        if (socket && socket.connected) {
          console.log('قطع اتصال قبلی از سرور...');
          socket.disconnect();
          setSocket(null);
        }
        
        console.log('تلاش برای اتصال به سرور:', SOCKET_SERVER);
        
        // ایجاد اتصال سوکت با تنظیمات بهبود یافته
        const socketInstance = createSocketConnection(SOCKET_SERVER, {
          timeout: 30000, // افزایش مهلت زمانی اتصال به 30 ثانیه
          reconnectionAttempts: 10, // افزایش تعداد تلاش‌های اتصال مجدد
          query: {
            projectId,
            role: 'remote-control'
          }
        });
        setSocket(socketInstance);
        
        if (process.env.REACT_APP_DEBUG_SOCKET === 'true') {
          console.log('حالت اشکال‌زدایی سوکت فعال است.');
          (window as any).debugSocket = socketInstance;
        }
        
        socketInstance.on('connect', () => {
          console.log('به سرور متصل شدیم با آیدی:', socketInstance.id);
          console.log('آدرس سرور:', SOCKET_SERVER);
          setIsOnline(true);
          setConnectionError('');
          
          // پینگ سرور برای تست اتصال
          socketInstance.emit('ping', Date.now(), () => {
            console.log('پینگ سرور موفقیت‌آمیز بود');
          });
          
          // پیوستن به پروژه به عنوان کنترل‌کننده
          console.log('درخواست پیوستن به پروژه:', projectId);
          if (projectId) {
            // ارسال به صورت آبجکت
            const joinData = {
              projectId: projectId,
              role: 'controller'
            };
            console.log('داده‌های ارسالی به سرور برای پیوستن:', joinData);
            
            // ارسال درخواست پیوستن به پروژه
            socketInstance.emit('join-project', joinData, (response: any) => {
              if (response && response.success) {
                console.log('با موفقیت به پروژه پیوستیم. پاسخ:', response);
              } else {
                console.error('خطا در پیوستن به پروژه:', response);
              }
            });
            
            // درخواست دریافت اطلاعات پروژه
            socketInstance.emit('get-project', { projectId }, (response: any) => {
              if (response && !response.error) {
                console.log('اطلاعات پروژه دریافت شد:', response);
                setProject(response);
                setLoading(false);
                showSnackbar(`پروژه "${response.name}" بارگذاری شد`, 'success');
              } else {
                console.error('خطا در دریافت اطلاعات پروژه:', response);
              }
            });
          }
        });
        
        socketInstance.on('connect_error', (error) => {
          console.error('خطا در اتصال به سرور:', error);
          setConnectionError(`خطا در اتصال به سرور: ${error.message}`);
          setIsOnline(false);
          setOpenSnackbar(true);
          showSnackbar(`خطا در اتصال به سرور: ${error.message}`, 'error');
        });
        
        socketInstance.on('disconnect', (reason) => {
          setIsOnline(false);
          setOpenSnackbar(true);
          showSnackbar('اتصال به سرور قطع شد', 'error');
          console.log('ارتباط با سرور قطع شد:', reason);
        });
        
        // تعداد بیننده‌های متصل
        socketInstance.on('viewer-count', (count: number) => {
          setConnectedViewers(count);
        });
        
        // به‌روزرسانی تنظیمات پروژه
        socketInstance.on('project-settings-updated', (data: { projectId: string, settings: Partial<Project> }) => {
          if (data.projectId === projectId) {
            setProject(prev => {
              if (!prev) return null;
              return { ...prev, ...data.settings };
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
        
        // وقتی اسکرول شروع می‌شود
        socketInstance.on('scrolling-started', (id: string) => {
          if (id === projectId) {
            setProject(prev => {
              if (!prev) return null;
              return { ...prev, isScrolling: true };
            });
            showSnackbar('اسکرول متن شروع شد', 'info');
          }
        });
        
        // وقتی اسکرول متوقف می‌شود
        socketInstance.on('scrolling-stopped', (id: string) => {
          if (id === projectId) {
            setProject(prev => {
              if (!prev) return null;
              return { ...prev, isScrolling: false };
            });
            showSnackbar('اسکرول متن متوقف شد', 'info');
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
          
          let errorMessage = 'خطایی رخ داد';
          
          // بررسی نوع خطای دریافتی و استخراج پیام مناسب
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData && typeof errorData === 'object') {
            if (errorData.message) {
              errorMessage = errorData.message;
            } else {
              // سعی در تبدیل آبجکت به رشته
              try {
                errorMessage = JSON.stringify(errorData);
              } catch (e) {
                errorMessage = 'خطای نامشخص از سرور';
              }
            }
            
            // لاگ کردن جزئیات بیشتر برای اشکال‌زدایی
            console.log('جزئیات خطا:', {
              type: errorData.type,
              code: errorData.code,
              details: errorData.details,
              stack: errorData.stack
            });
          }
          
          showSnackbar(errorMessage, 'error');
        });
        
        return socketInstance;
      } catch (error) {
        console.error('خطا در ایجاد اتصال به سرور:', error);
        setConnectionError('خطا در ایجاد اتصال به سرور');
        setIsOnline(false);
        setOpenSnackbar(true);
        showSnackbar('خطا در ایجاد اتصال به سرور', 'error');
        return null;
      }
    };
    
    // ایجاد اتصال به سرور
    const socketInstance = setupSocketConnection();
    
    // پاکسازی
    return () => {
      if (socketInstance) {
        // ترک پروژه قبل از قطع اتصال
        socketInstance.emit('leave-project', {
          projectId: projectId,
          role: 'controller'
        });
        socketInstance.disconnect();
      }
    };
  }, [projectId, navigate]);
  
  // پیشگیری از خطای ResizeObserver
  useEffect(() => {
    // رفع خطای ResizeObserver با اضافه کردن یک event handler به window
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('ResizeObserver') || event.error?.message?.includes('ResizeObserver')) {
        // جلوگیری از نمایش خطا در کنسول
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
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
      socket.emit('start-countdown', {
        projectId: projectId,
        seconds: project.startDelay
      });
    } else {
      // شروع بدون تاخیر
      socket.emit('start-scrolling', projectId);
    }
  };
  
  // توقف اسکرول
  const handleStopScrolling = () => {
    if (!socket || !isOnline || !project) return;
    
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
  
  // تغییر موقعیت اسکرول
  const handleScrollPositionChange = (newPosition: number) => {
    if (!socket || !isOnline || !project) return;
    
    socket.emit('set-scroll-position', {
      projectId: projectId,
      position: newPosition
    });
  };
  
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
          در حال بارگذاری کنترل‌کننده...
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
            خطا در بارگذاری کنترل‌کننده
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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h6" component="div">
          کنترل از راه دور: {project.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            bgcolor: isOnline ? 'success.main' : 'error.main',
            color: 'white',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            fontSize: '0.75rem'
          }}>
            {isOnline ? `${connectedViewers} بیننده متصل` : 'قطع ارتباط'}
          </Box>
          <Button
            component={RouterLink}
            to="/"
            size="small"
            startIcon={<HomeIcon />}
          >
            خروج
          </Button>
        </Box>
      </Box>

      {/* نوار کنترل اسکرول */}
      <Paper sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        p: 2,
        m: 1,
        mb: 0
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 2,
          mb: 2
        }}>
          {!project.isScrolling ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartScrolling}
              disabled={!isOnline}
              fullWidth
              sx={{ py: 1 }}
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
              fullWidth
              sx={{ py: 1 }}
            >
              توقف اسکرول
            </Button>
          )}
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Typography gutterBottom>
            موقعیت اسکرول:
          </Typography>
          <Slider
            value={project.startPosition}
            min={0}
            max={100}
            onChange={(_, newValue) => handleScrollPositionChange(newValue as number)}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Typography gutterBottom display="flex" alignItems="center">
            <SpeedIcon fontSize="small" sx={{ mr: 0.5 }} />
            سرعت اسکرول:
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Slider
                value={project.scrollSpeed}
                min={0}
                max={5}
                step={0.1}
                onChange={(_, newValue) => handleSettingChange('scrollSpeed', newValue as number)}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: 'بدون حرکت' },
                  { value: 1, label: 'بسیار آهسته' },
                  { value: 3, label: 'متوسط' },
                  { value: 5, label: 'سریع' }
                ]}
              />
            </Grid>
            <Grid item>
              <Typography>{project.scrollSpeed}</Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* تب‌های تنظیمات */}
      <Paper sx={{ m: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" aria-label="تنظیمات">
          <Tab label="تنظیمات متن" icon={<TextFormatIcon />} iconPosition="start" />
          <Tab label="تنظیمات ظاهری" icon={<ColorLensIcon />} iconPosition="start" />
          <Tab label="تنظیمات پیشرفته" icon={<DesktopWindowsIcon />} iconPosition="start" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="font-family-label">فونت</InputLabel>
                <Select
                  labelId="font-family-label"
                  value={project.fontFamily}
                  onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                  label="فونت"
                >
                  <MenuItem value='"Vazirmatn", sans-serif' style={{ fontFamily: '"Vazirmatn", sans-serif' }}>وزیر متن</MenuItem>
                  <MenuItem value='"BTitr", sans-serif' style={{ fontFamily: '"BTitr", sans-serif' }}>تیتر</MenuItem>
                  <MenuItem value='"IRANSans", sans-serif' style={{ fontFamily: '"IRANSans", sans-serif' }}>ایران سنس</MenuItem>
                  <MenuItem value='"Yekan", sans-serif' style={{ fontFamily: '"Yekan", sans-serif' }}>یکان</MenuItem>
                  <MenuItem value='"Sahel", sans-serif' style={{ fontFamily: '"Sahel", sans-serif' }}>ساحل</MenuItem>
                  <MenuItem value='"Samim", sans-serif' style={{ fontFamily: '"Samim", sans-serif' }}>صمیم</MenuItem>
                  <MenuItem value='"Tanha", sans-serif' style={{ fontFamily: '"Tanha", sans-serif' }}>تنها</MenuItem>
                  <MenuItem value='"Arial", sans-serif' style={{ fontFamily: '"Arial", sans-serif' }}>Arial</MenuItem>
                  <MenuItem value='"Times New Roman", serif' style={{ fontFamily: '"Times New Roman", serif' }}>Times New Roman</MenuItem>
                  <MenuItem value='"Courier New", monospace' style={{ fontFamily: '"Courier New", monospace' }}>Courier New</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom display="flex" alignItems="center">
                <FormatSizeIcon fontSize="small" sx={{ mr: 0.5 }} />
                اندازه فونت:
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <IconButton onClick={() => handleSettingChange('fontSize', Math.max(16, project.fontSize - 2))}>
                    <TextDecreaseIcon />
                  </IconButton>
                </Grid>
                <Grid item xs>
                  <Slider
                    value={project.fontSize}
                    min={16}
                    max={72}
                    onChange={(_, newValue) => handleSettingChange('fontSize', newValue as number)}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item>
                  <IconButton onClick={() => handleSettingChange('fontSize', Math.min(72, project.fontSize + 2))}>
                    <TextIncreaseIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom display="flex" alignItems="center">
                <FormatLineSpacingIcon fontSize="small" sx={{ mr: 0.5 }} />
                فاصله بین خطوط:
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={project.lineHeight}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(_, newValue) => handleSettingChange('lineHeight', newValue as number)}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 1, label: 'کم' },
                      { value: 1.5, label: 'متوسط' },
                      { value: 2, label: 'زیاد' },
                      { value: 3, label: 'خیلی زیاد' }
                    ]}
                  />
                </Grid>
                <Grid item>
                  <Typography>{project.lineHeight}</Typography>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>چینش متن:</Typography>
              <ToggleButtonGroup
                value={project.textAlign}
                exclusive
                onChange={(_, newAlignment) => {
                  if (newAlignment) handleSettingChange('textAlign', newAlignment);
                }}
                aria-label="چینش متن"
                fullWidth
              >
                <ToggleButton value="right" aria-label="راست‌چین">
                  <FormatAlignRightIcon />
                </ToggleButton>
                <ToggleButton value="center" aria-label="وسط‌چین">
                  <FormatAlignCenterIcon />
                </ToggleButton>
                <ToggleButton value="left" aria-label="چپ‌چین">
                  <FormatAlignLeftIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="متن تله‌پرامپتر"
                multiline
                rows={8}
                fullWidth
                value={project.text}
                onChange={(e) => handleTextChange(e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="رنگ متن"
                fullWidth
                value={project.textColor}
                onChange={(e) => handleSettingChange('textColor', e.target.value)}
                type="color"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="رنگ پس‌زمینه"
                fullWidth
                value={project.backgroundColor}
                onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                type="color"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={project.isMirrored}
                    onChange={(e) => handleSettingChange('isMirrored', e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FlipIcon fontSize="small" sx={{ mr: 0.5 }} />
                    نمایش آینه‌ای
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="عرض پرامپتر (%)"
                type="number"
                fullWidth
                value={project.prompterWidth}
                onChange={(e) => handleSettingChange('prompterWidth', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 10, max: 100 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="ارتفاع پرامپتر (%)"
                type="number"
                fullWidth
                value={project.prompterHeight}
                onChange={(e) => handleSettingChange('prompterHeight', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 10, max: 100 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={project.useStartDelay}
                    onChange={(e) => handleSettingChange('useStartDelay', e.target.checked)}
                  />
                }
                label="استفاده از تاخیر شروع"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="تاخیر شروع (ثانیه)"
                type="number"
                fullWidth
                disabled={!project.useStartDelay}
                value={project.startDelay}
                onChange={(e) => handleSettingChange('startDelay', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1, max: 10 } }}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
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

export default RemoteControlPage; 