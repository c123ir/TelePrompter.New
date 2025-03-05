import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Alert,
  AlertTitle,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Chip,
  CardHeader,
  IconButton,
  Tooltip
} from '@mui/material';
import { io, Socket } from 'socket.io-client';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ComputerIcon from '@mui/icons-material/Computer';
import PeopleIcon from '@mui/icons-material/People';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import PingIcon from '@mui/icons-material/NetworkCheck';
import { Link as RouterLink } from 'react-router-dom';
import { getServerUrl } from '../config/serverConfig';
import { socketConfig } from '../config/socketConfig';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import InfoIcon from '@mui/icons-material/Info';
import HomeIcon from '@mui/icons-material/Home';

interface ServerInfo {
  version: string;
  uptime: number;
  connections: number;
  memory: number;
  os: string;
  startTime: string;
  nodeVersion: string;
}

// انواع پیام‌های لاگ
type LogType = 'info' | 'error' | 'success' | 'warning' | 'system';

// ساختار یک پیام لاگ
interface LogMessage {
  id: number;
  timestamp: string;
  type: LogType;
  message: string;
  details?: any;
}

// ساختار پروژه
interface Project {
  id: string;
  name: string;
  createdAt: string;
  connectedUsers: number;
}

// ساختار کاربر متصل
interface ConnectedUser {
  socketId: string;
  role: string;
  projectId?: string;
  connectionTime: string;
  clientInfo?: string;
}

const ServerStatusPage: React.FC = () => {
  // وضعیت اتصال
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('قطع');
  const [serverUrl, setServerUrl] = useState<string>(getServerUrl());
  const [customServerUrl, setCustomServerUrl] = useState<string>(getServerUrl());
  const [socketId, setSocketId] = useState<string>('');
  const [pingTime, setPingTime] = useState<number | null>(null);
  const [pingInterval, setPingInterval] = useState<number>(5000);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  
  // لاگ‌ها
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [nextLogId, setNextLogId] = useState<number>(1);
  
  // اطلاعات سرور
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // پیام سفارشی
  const [customMessage, setCustomMessage] = useState<string>('');
  const [customEvent, setCustomEvent] = useState<string>('custom-event');
  
  // رفرنس سوکت
  const socketRef = useRef<Socket | null>(null);
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // اضافه کردن یک پیام به لاگ
  const addLog = (message: string, type: LogType = 'info', details?: any) => {
    const newLog: LogMessage = {
      id: nextLogId,
      timestamp: new Date().toLocaleTimeString(),
      type,
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
          role: 'admin',
          clientInfo: JSON.stringify({
            userAgent: navigator.userAgent,
            resolution: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString()
          })
        }
      };
      
      addLog('تنظیمات سوکت:', 'info', socketOpts);
      
      // ایجاد اتصال جدید
      const socket = io(url, socketOpts);
      socketRef.current = socket;
      
      // رویدادهای سوکت
      socket.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus('متصل');
        if (socket.id) {
          setSocketId(socket.id);
        }
        setIsLoading(false);
        addLog(`اتصال برقرار شد. شناسه سوکت: ${socket.id || 'نامشخص'}`, 'success');
        
        // درخواست اطلاعات سرور
        getServerInfo();
        getProjects();
        getUsers();
        
        // شروع پینگ خودکار
        if (isPinging) {
          startPinging();
        }
      });
      
      socket.on('connect_error', (error) => {
        setIsConnected(false);
        setConnectionStatus(`خطای اتصال: ${error.message}`);
        setIsLoading(false);
        addLog(`خطای اتصال: ${error.message}`, 'error', error);
      });
      
      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        setConnectionStatus(`قطع شده: ${reason}`);
        setIsLoading(false);
        addLog(`اتصال قطع شد. دلیل: ${reason}`, 'warning');
        
        // توقف پینگ
        if (pingTimerRef.current) {
          clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
      });
      
      socket.on('error', (error) => {
        addLog(`خطای سوکت: ${typeof error === 'string' ? error : JSON.stringify(error)}`, 'error', error);
      });
      
      socket.on('pong', (latency: number) => {
        const currentPing = Date.now() - latency;
        setPingTime(currentPing);
        addLog(`پاسخ پینگ دریافت شد: ${currentPing}ms`, 'info');
      });
      
      socket.on('server-info', (info) => {
        setServerInfo(info);
        addLog('اطلاعات سرور دریافت شد', 'info', info);
      });
      
      socket.on('projects-list', (projectsList) => {
        setProjects(projectsList);
        addLog(`${projectsList.length} پروژه دریافت شد`, 'info', projectsList);
      });
      
      socket.on('users-list', (usersList) => {
        setUsers(usersList);
        addLog(`${usersList.length} کاربر متصل دریافت شد`, 'info', usersList);
      });
      
      // گوش دادن به همه رویدادها برای اشکال‌زدایی
      socket.onAny((event, ...args) => {
        if (!['pong', 'connect', 'disconnect'].includes(event)) {
          addLog(`رویداد دریافت شد: ${event}`, 'info', args);
        }
      });
      
    } catch (error) {
      addLog(`خطا در ایجاد اتصال: ${(error as Error).message}`, 'error', error);
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
      
      // توقف پینگ
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    }
  };
  
  // ارسال پینگ به سرور
  const sendPing = () => {
    if (socketRef.current && isConnected) {
      const timestamp = Date.now();
      socketRef.current.emit('ping', timestamp);
      addLog('پینگ ارسال شد', 'info');
    } else {
      addLog('امکان ارسال پینگ نیست - اتصال برقرار نیست', 'warning');
    }
  };
  
  // شروع پینگ خودکار
  const startPinging = () => {
    // توقف پینگ قبلی اگر وجود دارد
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
    }
    
    setIsPinging(true);
    addLog(`شروع پینگ خودکار هر ${pingInterval}ms`, 'info');
    
    // تنظیم تایمر جدید
    pingTimerRef.current = setInterval(() => {
      sendPing();
    }, pingInterval);
  };
  
  // توقف پینگ خودکار
  const stopPinging = () => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
      setIsPinging(false);
      addLog('پینگ خودکار متوقف شد', 'info');
    }
  };
  
  // دریافت اطلاعات سرور
  const getServerInfo = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-server-info');
      addLog('درخواست اطلاعات سرور ارسال شد', 'info');
    } else {
      addLog('امکان دریافت اطلاعات سرور نیست - اتصال برقرار نیست', 'warning');
    }
  };
  
  // دریافت لیست پروژه‌ها
  const getProjects = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-projects');
      addLog('درخواست لیست پروژه‌ها ارسال شد', 'info');
    } else {
      addLog('امکان دریافت لیست پروژه‌ها نیست - اتصال برقرار نیست', 'warning');
    }
  };
  
  // دریافت لیست کاربران متصل
  const getUsers = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-connected-users');
      addLog('درخواست لیست کاربران متصل ارسال شد', 'info');
    } else {
      addLog('امکان دریافت لیست کاربران نیست - اتصال برقرار نیست', 'warning');
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
        addLog(`پیام سفارشی ارسال شد به رویداد "${customEvent}"`, 'info', messageData);
        setCustomMessage('');
      } catch (error) {
        addLog(`خطا در ارسال پیام سفارشی: ${(error as Error).message}`, 'error');
      }
    } else {
      addLog('امکان ارسال پیام سفارشی نیست - اتصال برقرار نیست یا پیام خالی است', 'warning');
    }
  };
  
  // پاک کردن لاگ‌ها
  const clearLogs = () => {
    setLogs([]);
    addLog('لاگ‌ها پاک شدند', 'system');
  };
  
  // اتصال خودکار در هنگام بارگذاری صفحه
  useEffect(() => {
    connectToServer();
    
    // پاکسازی در هنگام خروج از صفحه
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
      }
    };
  }, []);
  
  // رنگ متناسب با نوع لاگ
  const getLogColor = (type: LogType): string => {
    switch (type) {
      case 'error': return '#f44336';
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'system': return '#9c27b0';
      default: return '#2196f3';
    }
  };
  
  // تبدیل میلی‌ثانیه به فرمت خوانا
  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} روز و ${hours % 24} ساعت`;
    } else if (hours > 0) {
      return `${hours} ساعت و ${minutes % 60} دقیقه`;
    } else if (minutes > 0) {
      return `${minutes} دقیقه و ${seconds % 60} ثانیه`;
    } else {
      return `${seconds} ثانیه`;
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          وضعیت سرور و مدیریت اتصال
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
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => connectToServer(customServerUrl)}
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
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  پینگ سرور
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={sendPing}
                    disabled={!isConnected}
                    sx={{ mr: 2 }}
                    startIcon={<PingIcon />}
                  >
                    ارسال پینگ
                  </Button>
                  
                  {pingTime !== null && (
                    <Chip 
                      label={`${pingTime} میلی‌ثانیه`} 
                      color={pingTime < 100 ? "success" : pingTime < 300 ? "warning" : "error"} 
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="فاصله پینگ (ms)"
                    type="number"
                    value={pingInterval}
                    onChange={(e) => setPingInterval(parseInt(e.target.value))}
                    size="small"
                  />
                  
                  {isPinging ? (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={stopPinging}
                      disabled={!isConnected}
                      startIcon={<StopIcon />}
                    >
                      توقف پینگ خودکار
                    </Button>
                  ) : (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={startPinging}
                      disabled={!isConnected}
                      startIcon={<PlayArrowIcon />}
                    >
                      شروع پینگ خودکار
                    </Button>
                  )}
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                ارسال پیام سفارشی
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="نام رویداد"
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  size="small"
                  sx={{ mb: 1, width: '100%' }}
                />
                
                <TextField
                  label="پیام (متن یا JSON)"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  sx={{ mb: 1 }}
                />
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={sendCustomMessage}
                  disabled={!isConnected || !customMessage}
                  startIcon={<SendIcon />}
                  fullWidth
                >
                  ارسال پیام
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* بخش اطلاعات سرور */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="اطلاعات سرور" 
              action={
                <Tooltip title="به‌روزرسانی اطلاعات">
                  <IconButton 
                    onClick={getServerInfo}
                    disabled={!isConnected}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              {serverInfo ? (
                <Box>
                  <Typography variant="body1">
                    <strong>نسخه:</strong> {serverInfo.version}
                  </Typography>
                  <Typography variant="body1">
                    <strong>زمان اجرا:</strong> {formatUptime(serverInfo.uptime * 1000)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>تعداد اتصال‌ها:</strong> {serverInfo.connections}
                  </Typography>
                  <Typography variant="body1">
                    <strong>مصرف حافظه:</strong> {Math.round(serverInfo.memory / 1024 / 1024)} مگابایت
                  </Typography>
                  <Typography variant="body1">
                    <strong>سیستم عامل:</strong> {serverInfo.os}
                  </Typography>
                  <Typography variant="body1">
                    <strong>نسخه Node.js:</strong> {serverInfo.nodeVersion}
                  </Typography>
                  <Typography variant="body1">
                    <strong>زمان شروع:</strong> {new Date(serverInfo.startTime).toLocaleString()}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  {isConnected ? (
                    <CircularProgress size={30} />
                  ) : (
                    <Typography color="text.secondary">
                      برای دریافت اطلاعات سرور، ابتدا متصل شوید
                    </Typography>
                  )}
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">
                  پروژه‌ها ({projects.length})
                </Typography>
                <Tooltip title="به‌روزرسانی لیست پروژه‌ها">
                  <IconButton 
                    size="small" 
                    onClick={getProjects}
                    disabled={!isConnected}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {projects.length > 0 ? (
                <List dense sx={{ maxHeight: 150, overflow: 'auto', bgcolor: 'background.paper' }}>
                  {projects.map((project) => (
                    <ListItem key={project.id}>
                      <ListItemText 
                        primary={project.name} 
                        secondary={`شناسه: ${project.id} | کاربران: ${project.connectedUsers}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" align="center">
                  هیچ پروژه‌ای یافت نشد
                </Typography>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">
                  کاربران متصل ({users.length})
                </Typography>
                <Tooltip title="به‌روزرسانی لیست کاربران">
                  <IconButton 
                    size="small" 
                    onClick={getUsers}
                    disabled={!isConnected}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {users.length > 0 ? (
                <List dense sx={{ maxHeight: 150, overflow: 'auto', bgcolor: 'background.paper' }}>
                  {users.map((user) => (
                    <ListItem key={user.socketId}>
                      <ListItemText 
                        primary={`${user.role}${user.projectId ? ` (پروژه: ${user.projectId.substring(0, 6)}...)` : ''}`} 
                        secondary={`شناسه: ${user.socketId.substring(0, 8)}... | زمان اتصال: ${new Date(user.connectionTime).toLocaleTimeString()}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" align="center">
                  هیچ کاربری متصل نیست
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* بخش لاگ‌ها */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="لاگ‌های اتصال" 
              action={
                <Tooltip title="پاک کردن لاگ‌ها">
                  <IconButton 
                    color="error" 
                    onClick={clearLogs}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Paper 
                variant="outlined" 
                sx={{ 
                  height: 300, 
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
      </Grid>
    </Container>
  );
};

export default ServerStatusPage; 