import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  TextField, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  Alert, 
  CircularProgress, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { createSocketConnection, type Socket } from '../utils/socketUtil';
import { getServerUrl } from '../config/serverConfig';
import { socketConfig } from '../config/socketConfig';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import InfoIcon from '@mui/icons-material/Info';
import HomeIcon from '@mui/icons-material/Home';
import BugReportIcon from '@mui/icons-material/BugReport';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Link as RouterLink } from 'react-router-dom';

/**
 * صفحه تست اتصال سوکت برای عیب‌یابی و بررسی اتصال
 */

// انواع پیام‌های لاگ
type LogType = 'sent' | 'received' | 'error' | 'info' | 'system' | 'success';

// ساختار یک پیام لاگ
interface LogMessage {
  id: number;
  timestamp: string;
  type: LogType;
  event?: string;
  message: string;
  details?: any;
}

// رویدادهای پیش‌فرض
const DEFAULT_EVENTS = [
  'get-projects',
  'join-project',
  'get-project',
  'ping',
  'custom-event'
];

const SocketTestPage: React.FC = () => {
  // وضعیت اتصال
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('قطع');
  const [serverUrl, setServerUrl] = useState<string>(getServerUrl());
  const [socketId, setSocketId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // پیام سفارشی
  const [customMessage, setCustomMessage] = useState<string>('');
  const [customEvent, setCustomEvent] = useState<string>('custom-event');
  const [selectedEvent, setSelectedEvent] = useState<string>('get-projects');
  const [projectId, setProjectId] = useState<string>('');
  
  // لاگ‌ها
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [nextLogId, setNextLogId] = useState<number>(1);
  
  // رفرنس سوکت
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // اضافه کردن یک پیام به لاگ
  const addLog = (message: string, type: LogType = 'info', event?: string, details?: any) => {
    const newLog: LogMessage = {
      id: nextLogId,
      timestamp: new Date().toLocaleTimeString(),
      type,
      event,
      message,
      details
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // حداکثر 100 پیام نگه می‌داریم
    setNextLogId(prev => prev + 1);
  };
  
  // اتصال به سرور
  const connectToServer = (url: string = serverUrl) => {
    try {
      // قطع اتصال قبلی اگر وجود دارد
      if (socketRef.current) {
        addLog('قطع اتصال قبلی...', 'info');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      setIsLoading(true);
      addLog(`تلاش برای اتصال به ${url}...`, 'info');
      setConnectionStatus('در حال اتصال...');
      
      // تنظیمات سوکت
      const socketOpts = {
        ...socketConfig,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        transports: ['websocket', 'polling'] as string[],
        upgrade: true,
        forceNew: true,
        multiplex: false,
        query: {
          role: 'tester',
          clientInfo: JSON.stringify({
            userAgent: navigator.userAgent,
            resolution: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString()
          })
        }
      };
      
      addLog('تنظیمات سوکت:', 'info', undefined, socketOpts);
      
      // ایجاد اتصال جدید
      const socket = createSocketConnection(url || 'http://localhost:4444', socketOpts);
      socketRef.current = socket;
      
      // رویدادهای سوکت
      socket.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus('متصل');
        if (socket.id) {
          setSocketId(socket.id);
        }
        setIsLoading(false);
        addLog(`اتصال برقرار شد. شناسه سوکت: ${socket.id || 'نامشخص'}`, 'info');
      });
      
      socket.on('connect_error', (error) => {
        setIsConnected(false);
        setConnectionStatus(`خطای اتصال: ${error.message}`);
        setIsLoading(false);
        addLog(`خطای اتصال: ${error.message}`, 'error', undefined, error);
      });
      
      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        setConnectionStatus(`قطع شده: ${reason}`);
        setIsLoading(false);
        addLog(`اتصال قطع شد. دلیل: ${reason}`, 'info');
      });
      
      socket.on('error', (error) => {
        addLog(`خطای سوکت: ${typeof error === 'string' ? error : JSON.stringify(error)}`, 'error', 'error', error);
      });
      
      socket.on('pong', (latency: number) => {
        const currentPing = Date.now() - latency;
        addLog(`پاسخ پینگ دریافت شد: ${currentPing}ms`, 'received', 'pong', { latency: currentPing });
      });
      
      // گوش دادن به همه رویدادها برای اشکال‌زدایی
      socket.onAny((event, ...args) => {
        if (!['connect', 'disconnect', 'connect_error'].includes(event)) {
          addLog(`رویداد دریافت شد: ${event}`, 'received', event, args);
        }
      });
      
    } catch (error) {
      addLog(`خطا در ایجاد اتصال: ${(error as Error).message}`, 'error', undefined, error);
      setConnectionStatus(`خطا: ${(error as Error).message}`);
      setIsLoading(false);
    }
  };
  
  // قطع اتصال از سرور
  const disconnectFromServer = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionStatus('قطع شده توسط کاربر');
      addLog('اتصال به سرور قطع شد', 'info');
    }
  };
  
  // ارسال پینگ به سرور
  const sendPing = () => {
    if (socketRef.current && isConnected) {
      const timestamp = Date.now();
      socketRef.current.emit('ping', timestamp);
      addLog('پینگ ارسال شد', 'sent', 'ping', { timestamp });
    } else {
      addLog('امکان ارسال پینگ نیست - اتصال برقرار نیست', 'error');
    }
  };
  
  // دریافت لیست پروژه‌ها
  const getProjects = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-projects');
      addLog('درخواست لیست پروژه‌ها ارسال شد', 'sent', 'get-projects');
    } else {
      addLog('امکان دریافت لیست پروژه‌ها نیست - اتصال برقرار نیست', 'error');
    }
  };
  
  // پیوستن به پروژه
  const joinProject = () => {
    if (socketRef.current && isConnected && projectId) {
      const data = {
        projectId,
        role: 'tester'
      };
      socketRef.current.emit('join-project', data);
      addLog(`درخواست پیوستن به پروژه ${projectId} ارسال شد`, 'sent', 'join-project', data);
    } else {
      addLog('امکان پیوستن به پروژه نیست - اتصال برقرار نیست یا شناسه پروژه وارد نشده است', 'error');
    }
  };
  
  // دریافت اطلاعات پروژه
  const getProject = () => {
    if (socketRef.current && isConnected && projectId) {
      socketRef.current.emit('get-project', { projectId });
      addLog(`درخواست اطلاعات پروژه ${projectId} ارسال شد`, 'sent', 'get-project', { projectId });
    } else {
      addLog('امکان دریافت اطلاعات پروژه نیست - اتصال برقرار نیست یا شناسه پروژه وارد نشده است', 'error');
    }
  };
  
  // ارسال پیام سفارشی
  const sendCustomMessage = () => {
    if (socketRef.current && isConnected && customMessage) {
      try {
        // تلاش برای تبدیل پیام به JSON اگر ممکن باشد
        let messageData;
        try {
          messageData = JSON.parse(customMessage);
        } catch {
          messageData = customMessage;
        }
        
        socketRef.current.emit(customEvent, messageData);
        addLog(`پیام سفارشی ارسال شد به رویداد "${customEvent}"`, 'sent', customEvent, messageData);
        setCustomMessage('');
      } catch (error) {
        addLog(`خطا در ارسال پیام سفارشی: ${(error as Error).message}`, 'error', undefined, error);
      }
    } else {
      addLog('امکان ارسال پیام سفارشی نیست - اتصال برقرار نیست یا پیام خالی است', 'error');
    }
  };
  
  // ارسال رویداد انتخاب شده
  const sendSelectedEvent = () => {
    if (socketRef.current && isConnected) {
      switch (selectedEvent) {
        case 'get-projects':
          getProjects();
          break;
        case 'join-project':
          joinProject();
          break;
        case 'get-project':
          getProject();
          break;
        case 'ping':
          sendPing();
          break;
        case 'custom-event':
          if (customMessage) {
            sendCustomMessage();
          } else {
            addLog('لطفاً پیام سفارشی را وارد کنید', 'error');
          }
          break;
        default:
          socketRef.current.emit(selectedEvent);
          addLog(`رویداد ${selectedEvent} ارسال شد`, 'sent', selectedEvent);
      }
    } else {
      addLog('امکان ارسال رویداد نیست - اتصال برقرار نیست', 'error');
    }
  };
  
  // پاک کردن لاگ‌ها
  const clearLogs = () => {
    setLogs([]);
    addLog('لاگ‌ها پاک شدند', 'system');
  };
  
  // تابع خطایابی کامل
  const runDebugTest = async () => {
    addLog('شروع فرآیند خطایابی...', 'system');
    
    // تنظیمات سوکت برای نمایش در گزارش
    const debugSocketOpts = {
      ...socketConfig,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: ['websocket', 'polling'] as string[],
      upgrade: true,
      forceNew: true,
      multiplex: false,
      query: {
        role: 'tester',
        clientInfo: JSON.stringify({
          userAgent: navigator.userAgent,
          resolution: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString()
        })
      }
    };
    
    // اگر اتصال برقرار نیست، تلاش برای اتصال مجدد
    if (!isConnected) {
      addLog('تلاش برای اتصال به سرور...', 'system');
      connectToServer();
      
      // منتظر می‌مانیم تا اتصال برقرار شود
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (!isConnected) {
        addLog('خطا در اتصال به سرور! ادامه تست با محدودیت...', 'error');
      }
    }
    
    // آرایه برای ذخیره همه نتایج تست
    const testResults = [`=== گزارش خطایابی (${new Date().toLocaleString()}) ===\n`];
    testResults.push(`آدرس سرور: ${serverUrl}`);
    testResults.push(`وضعیت اتصال: ${connectionStatus}`);
    testResults.push(`شناسه سوکت: ${socketId || 'نامشخص'}`);
    testResults.push(`تنظیمات اتصال: ${JSON.stringify(debugSocketOpts, null, 2)}`);
    testResults.push('\n=== نتایج تست‌ها ===');
    
    // تست پینگ
    try {
      addLog('تست پینگ...', 'system');
      const pingStart = Date.now();
      sendPing();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pingResult = `پینگ: ${isConnected ? 'موفق' : 'ناموفق'} (${Date.now() - pingStart}ms)`;
      testResults.push(pingResult);
    } catch (error: any) {
      const errorMessage = error?.message || 'خطای نامشخص';
      testResults.push(`خطا در تست پینگ: ${errorMessage}`);
      addLog(`خطا در تست پینگ: ${errorMessage}`, 'error');
    }
    
    // تست دریافت پروژه‌ها
    try {
      addLog('تست دریافت پروژه‌ها...', 'system');
      getProjects();
      await new Promise(resolve => setTimeout(resolve, 1000));
      testResults.push(`دریافت پروژه‌ها: ${isConnected ? 'درخواست ارسال شد' : 'ناموفق'}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'خطای نامشخص';
      testResults.push(`خطا در دریافت پروژه‌ها: ${errorMessage}`);
      addLog(`خطا در دریافت پروژه‌ها: ${errorMessage}`, 'error');
    }
    
    // تست پیوستن به پروژه اگر شناسه پروژه وارد شده باشد
    if (projectId) {
      try {
        addLog('تست پیوستن به پروژه...', 'system');
        joinProject();
        await new Promise(resolve => setTimeout(resolve, 1000));
        testResults.push(`پیوستن به پروژه: درخواست برای پروژه ${projectId} ارسال شد`);
      } catch (error: any) {
        const errorMessage = error?.message || 'خطای نامشخص';
        testResults.push(`خطا در پیوستن به پروژه: ${errorMessage}`);
        addLog(`خطا در پیوستن به پروژه: ${errorMessage}`, 'error');
      }
    } else {
      testResults.push('پیوستن به پروژه: انجام نشد (شناسه پروژه وارد نشده است)');
    }
    
    // تست دریافت اطلاعات پروژه اگر شناسه پروژه وارد شده باشد
    if (projectId) {
      try {
        addLog('تست دریافت اطلاعات پروژه...', 'system');
        getProject();
        await new Promise(resolve => setTimeout(resolve, 1000));
        testResults.push(`دریافت اطلاعات پروژه: درخواست برای پروژه ${projectId} ارسال شد`);
      } catch (error: any) {
        const errorMessage = error?.message || 'خطای نامشخص';
        testResults.push(`خطا در دریافت اطلاعات پروژه: ${errorMessage}`);
        addLog(`خطا در دریافت اطلاعات پروژه: ${errorMessage}`, 'error');
      }
    } else {
      testResults.push('دریافت اطلاعات پروژه: انجام نشد (شناسه پروژه وارد نشده است)');
    }
    
    // ذخیره نتایج در کلیپ بورد
    const testResultsText = testResults.join('\n');
    try {
      await navigator.clipboard.writeText(testResultsText);
      addLog('نتایج خطایابی در کلیپ بورد ذخیره شد', 'success');
    } catch (error: any) {
      const errorMessage = error?.message || 'خطای نامشخص';
      addLog(`خطا در ذخیره نتایج در کلیپ بورد: ${errorMessage}`, 'error');
      // نمایش نتایج در لاگ در صورت خطا در ذخیره در کلیپ بورد
      addLog('نتایج خطایابی:', 'info');
      addLog(testResultsText, 'info');
    }
    
    addLog('فرآیند خطایابی به پایان رسید', 'system');
  };
  
  // اتصال خودکار در هنگام بارگذاری صفحه
  useEffect(() => {
    connectToServer();
    
    // پاکسازی در هنگام خروج از صفحه
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  // رنگ متناسب با نوع لاگ
  const getLogColor = (type: LogType): string => {
    switch (type) {
      case 'sent': return '#2196f3';
      case 'received': return '#4caf50';
      case 'error': return '#f44336';
      case 'system': return '#9c27b0';
      case 'success': return '#4caf50';
      default: return '#757575';
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          تست اتصال سوکت
        </Typography>
        
        <Button
          component={RouterLink}
          to="/"
          variant="outlined"
          startIcon={<HomeIcon />}
        >
          بازگشت به صفحه اصلی
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* بخش اتصال */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="مدیریت اتصال" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="آدرس سرور"
                  variant="outlined"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => connectToServer(serverUrl)}
                    disabled={isConnected || isLoading}
                    fullWidth
                    startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
                  >
                    {isLoading ? 'در حال اتصال...' : 'اتصال'}
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={disconnectFromServer}
                    disabled={!isConnected}
                    fullWidth
                  >
                    قطع اتصال
                  </Button>
                </Box>
                
                <Alert 
                  severity={isConnected ? "success" : "error"}
                  sx={{ mb: 2 }}
                >
                  وضعیت: {connectionStatus}
                  {isConnected && socketId && <Box component="span" sx={{ mr: 1 }}>| شناسه: {socketId}</Box>}
                </Alert>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                ارسال رویداد
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>رویداد</InputLabel>
                  <Select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    label="رویداد"
                  >
                    {DEFAULT_EVENTS.map((event) => (
                      <MenuItem key={event} value={event}>{event}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {(selectedEvent === 'join-project' || selectedEvent === 'get-project') && (
                  <TextField
                    label="شناسه پروژه"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                )}
                
                {selectedEvent === 'custom-event' && (
                  <>
                    <TextField
                      label="نام رویداد سفارشی"
                      value={customEvent}
                      onChange={(e) => setCustomEvent(e.target.value)}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      label="پیام (متن یا JSON)"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  </>
                )}
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={sendSelectedEvent}
                  disabled={!isConnected}
                  startIcon={<SendIcon />}
                  fullWidth
                >
                  ارسال رویداد
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={sendPing}
                  disabled={!isConnected}
                  startIcon={<PlayArrowIcon />}
                  fullWidth
                >
                  ارسال پینگ
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={getProjects}
                  disabled={!isConnected}
                  startIcon={<RefreshIcon />}
                  fullWidth
                >
                  دریافت پروژه‌ها
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Button 
                variant="contained" 
                color="warning" 
                onClick={runDebugTest}
                startIcon={<BugReportIcon />}
                fullWidth
              >
                خطایابی اتوماتیک (ذخیره در کلیپ بورد)
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* بخش لاگ‌ها */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="لاگ‌های ارتباطی" 
              action={
                <Box sx={{ display: 'flex' }}>
                  <Tooltip title="کپی لاگ‌ها">
                    <IconButton 
                      color="primary" 
                      onClick={() => {
                        const logsText = logs.map(log => 
                          `[${log.timestamp}][${log.type}]${log.event ? ` [${log.event}]` : ''}: ${log.message}`
                        ).join('\n');
                        navigator.clipboard.writeText(logsText);
                        addLog('لاگ‌ها در کلیپ بورد ذخیره شدند', 'success');
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="پاک کردن لاگ‌ها">
                    <IconButton 
                      color="error" 
                      onClick={clearLogs}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <CardContent sx={{ height: 'calc(100% - 80px)' }}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  height: '100%', 
                  overflow: 'auto', 
                  p: 1,
                  bgcolor: '#f5f5f5'
                }}
              >
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <Box 
                      key={log.id} 
                      sx={{ 
                        mb: 0.5, 
                        p: 1, 
                        borderRadius: 1,
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: getLogColor(log.type),
                            fontWeight: 'bold',
                            mr: 1
                          }}
                        >
                          [{log.type.toUpperCase()}]
                        </Typography>
                        {log.event && (
                          <Chip 
                            label={log.event} 
                            size="small" 
                            sx={{ mr: 1, fontSize: '0.7rem' }} 
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {log.timestamp}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {log.message}
                      </Typography>
                      {log.details && (
                        <Box 
                          component="pre" 
                          sx={{ 
                            mt: 1, 
                            p: 1, 
                            bgcolor: '#f0f0f0', 
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: 100
                          }}
                        >
                          {typeof log.details === 'string' 
                            ? log.details 
                            : JSON.stringify(log.details, null, 2)
                          }
                        </Box>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography align="center" color="text.secondary" sx={{ p: 2 }}>
                    هیچ لاگی وجود ندارد
                  </Typography>
                )}
                <div ref={logsEndRef} />
              </Paper>
            </CardContent>
          </Card>
        </Grid>
        
        {/* راهنما */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="راهنمای استفاده" />
            <CardContent>
              <Typography variant="body1" paragraph>
                این صفحه برای تست اتصال سوکت و اشکال‌زدایی طراحی شده است. با استفاده از این صفحه می‌توانید:
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="اتصال به سرور" 
                    secondary="آدرس سرور را وارد کرده و دکمه اتصال را بزنید. وضعیت اتصال در بالای صفحه نمایش داده می‌شود." 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="ارسال رویدادها" 
                    secondary="رویداد مورد نظر را انتخاب کرده و دکمه ارسال را بزنید. پاسخ‌های دریافتی در بخش لاگ‌ها نمایش داده می‌شوند." 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="ارسال پیام سفارشی" 
                    secondary="می‌توانید نام رویداد و پیام سفارشی خود را وارد کرده و ارسال کنید. پیام می‌تواند متن ساده یا JSON باشد." 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="مشاهده لاگ‌ها" 
                    secondary="تمام پیام‌های ارسالی و دریافتی در بخش لاگ‌ها نمایش داده می‌شوند. می‌توانید با کلیک روی آیکون سطل زباله، لاگ‌ها را پاک کنید." 
                  />
                </ListItem>
              </List>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  برای اشکال‌زدایی بهتر، کنسول مرورگر را نیز باز نگه دارید تا خطاهای احتمالی را مشاهده کنید.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SocketTestPage; 