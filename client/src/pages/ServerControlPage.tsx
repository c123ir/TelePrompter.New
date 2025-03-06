import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Alert, 
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Slider
} from '@mui/material';
import { createSocketConnection, type Socket } from '../utils/socketUtil';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';

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
  lastUpdated?: Date;
}

// رابط کاربر متصل
interface ConnectedClient {
  id: string;
  ip: string;
  connectedAt: Date;
  projectId?: string;
}

// نوع تب فعال
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// پنل تب
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ServerControlPage: React.FC = () => {
  const navigate = useNavigate();
  
  // وضعیت تب‌ها
  const [tabValue, setTabValue] = useState<number>(0);
  
  // وضعیت پروژه‌ها
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // وضعیت اتصال
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>('');
  const [activeClients, setActiveClients] = useState<ConnectedClient[]>([]);
  
  // وضعیت دیالوگ
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  
  // وضعیت پیام‌ها
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
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
  
  // اتصال به سرور
  useEffect(() => {
    const connectToServer = () => {
      try {
        const socketInstance = createSocketConnection(SOCKET_SERVER);
        
        socketInstance.on('connect', () => {
          setIsOnline(true);
          setConnectionError('');
          console.log('به سرور متصل شدیم');
          
          // درخواست لیست پروژه‌ها و کاربران
          socketInstance.emit('request-projects');
          socketInstance.emit('request-clients');
        });
        
        socketInstance.on('connect_error', (error) => {
          console.error('خطا در اتصال به سرور:', error);
          setConnectionError(`خطا در اتصال به سرور: ${error.message}`);
          setIsOnline(false);
        });
        
        socketInstance.on('disconnect', (reason) => {
          setIsOnline(false);
          console.log('ارتباط با سرور قطع شد:', reason);
        });
        
        // دریافت لیست پروژه‌ها
        socketInstance.on('project-list', (data: Project[]) => {
          setProjects(data);
          setLoading(false);
        });
        
        // دریافت اطلاعات پروژه به‌روز شده
        socketInstance.on('project-updated', (data: Project) => {
          setProjects(prev => 
            prev.map(project => project.id === data.id ? data : project)
          );
          showSnackbar(`پروژه "${data.name}" با موفقیت به‌روز شد`, 'success');
        });
        
        // پروژه جدید
        socketInstance.on('project-created', (data: Project) => {
          setProjects(prev => [...prev, data]);
          showSnackbar(`پروژه "${data.name}" با موفقیت ایجاد شد`, 'success');
        });
        
        // حذف پروژه
        socketInstance.on('project-deleted', (id: string) => {
          setProjects(prev => prev.filter(project => project.id !== id));
          showSnackbar('پروژه با موفقیت حذف شد', 'success');
        });
        
        // دریافت لیست کاربران
        socketInstance.on('client-list', (clients: ConnectedClient[]) => {
          setActiveClients(clients);
        });
        
        // دریافت به‌روزرسانی وضعیت کاربران
        socketInstance.on('client-status-update', (clients: ConnectedClient[]) => {
          setActiveClients(clients);
        });
        
        // دریافت خطا
        socketInstance.on('error', (error: any) => {
          console.error('خطای دریافتی از سرور:', error);
          showSnackbar(error.message || 'خطایی رخ داد', 'error');
        });
        
        setSocket(socketInstance);
        return socketInstance;
      } catch (error) {
        console.error('خطا در ایجاد اتصال به سرور:', error);
        setConnectionError('خطا در ایجاد اتصال به سرور');
        setIsOnline(false);
        return null;
      }
    };
    
    const socketInstance = connectToServer();
    
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);
  
  // درخواست به‌روزرسانی لیست پروژه‌ها
  const refreshProjects = () => {
    if (!socket || !isOnline) return;
    
    setLoading(true);
    socket.emit('request-projects');
  };
  
  // درخواست به‌روزرسانی لیست کاربران
  const refreshClients = () => {
    if (!socket || !isOnline) return;
    
    socket.emit('request-clients');
  };
  
  // ایجاد پروژه جدید
  const createNewProject = () => {
    if (!socket || !isOnline) return;
    
    const newProject = {
      name: 'پروژه جدید',
      text: 'متن نمونه برای پروژه جدید...',
      fontSize: 32,
      fontFamily: 'IRANSans',
      textColor: '#ffffff',
      backgroundColor: '#000000',
      textAlign: 'right' as const,
      isMirrored: false,
      scrollSpeed: 3,
      isScrolling: false,
      startPosition: 50,
      prompterWidth: 80,
      prompterHeight: 70,
      startDelay: 3,
      useStartDelay: true,
      isActive: true,
    };
    
    socket.emit('create-project', newProject);
  };
  
  // باز کردن دیالوگ ویرایش
  const openEdit = (project: Project) => {
    setSelectedProject({...project});
    setOpenEditDialog(true);
  };
  
  // باز کردن دیالوگ حذف
  const openDelete = (project: Project) => {
    setSelectedProject(project);
    setOpenDeleteDialog(true);
  };
  
  // ذخیره تغییرات پروژه
  const saveProjectChanges = () => {
    if (!socket || !isOnline || !selectedProject) return;
    
    socket.emit('update-project', selectedProject);
    setOpenEditDialog(false);
  };
  
  // حذف پروژه
  const deleteProject = () => {
    if (!socket || !isOnline || !selectedProject) return;
    
    socket.emit('delete-project', selectedProject.id);
    setOpenDeleteDialog(false);
  };
  
  // قطع اتصال کاربر
  const disconnectClient = (clientId: string) => {
    if (!socket || !isOnline) return;
    
    socket.emit('force-disconnect-client', clientId);
  };
  
  // تغییر وضعیت اسکرول پروژه
  const toggleScrolling = (project: Project) => {
    if (!socket || !isOnline) return;
    
    if (project.isScrolling) {
      socket.emit('stop-scrolling', project.id);
    } else {
      socket.emit('start-scrolling', project.id);
    }
  };
  
  // تغییر در فیلدهای پروژه
  const handleProjectChange = <K extends keyof Project>(key: K, value: Project[K]) => {
    if (!selectedProject) return;
    
    setSelectedProject(prev => {
      if (!prev) return null;
      return { ...prev, [key]: value };
    });
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          پنل مدیریت سرور تله‌پرامپتر
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={RouterLink}
            to="/"
            variant="outlined"
            startIcon={<HomeIcon />}
          >
            صفحه اصلی
          </Button>
          <Button
            component={RouterLink}
            to="/server-status"
            variant="outlined"
            startIcon={<BarChartIcon />}
          >
            وضعیت سرور
          </Button>
        </Box>
      </Box>
      
      <Alert 
        severity={isOnline ? "success" : "error"} 
        sx={{ mb: 3 }}
      >
        {isOnline 
          ? `اتصال به سرور برقرار است. آدرس سرور: ${SOCKET_SERVER}`
          : `اتصال به سرور برقرار نیست: ${connectionError || 'خطای اتصال'}`
        }
      </Alert>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs">
          <Tab label="مدیریت پروژه‌ها" id="tab-0" />
          <Tab label="کاربران متصل" id="tab-1" />
        </Tabs>
        
        {/* پنل مدیریت پروژه‌ها */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              لیست پروژه‌ها
            </Typography>
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={createNewProject}
                disabled={!isOnline}
                sx={{ mr: 1 }}
              >
                پروژه جدید
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshProjects}
                disabled={!isOnline}
              >
                به‌روزرسانی
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : projects.length === 0 ? (
            <Alert severity="info">
              هیچ پروژه‌ای یافت نشد. با دکمه "پروژه جدید" یک پروژه ایجاد کنید.
            </Alert>
          ) : (
            <List>
              {projects.map((project) => (
                <Paper key={project.id} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6">{project.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        شناسه: {project.id}
                      </Typography>
                      <Typography variant="body2">
                        کاربران متصل: {project.clientCount || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        وضعیت: {project.isScrolling ? 'در حال اسکرول' : 'متوقف'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color={project.isScrolling ? 'error' : 'success'}
                          startIcon={project.isScrolling ? <StopIcon /> : <PlayArrowIcon />}
                          onClick={() => toggleScrolling(project)}
                          disabled={!isOnline}
                        >
                          {project.isScrolling ? 'توقف اسکرول' : 'شروع اسکرول'}
                        </Button>
                        <Button
                          component={RouterLink}
                          to={`/project/${project.id}`}
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                        >
                          مشاهده
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => openEdit(project)}
                        >
                          ویرایش
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => openDelete(project)}
                        >
                          حذف
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </List>
          )}
        </TabPanel>
        
        {/* پنل کاربران متصل */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              کاربران متصل ({activeClients.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshClients}
              disabled={!isOnline}
            >
              به‌روزرسانی
            </Button>
          </Box>
          
          {activeClients.length === 0 ? (
            <Alert severity="info">
              هیچ کاربری به سرور متصل نیست.
            </Alert>
          ) : (
            <List>
              {activeClients.map((client) => (
                <Paper key={client.id} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle1">
                        <PeopleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        {client.ip || 'کاربر ناشناس'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        شناسه: {client.id}
                      </Typography>
                      <Typography variant="body2">
                        اتصال از: {new Date(client.connectedAt).toLocaleString('fa-IR')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        پروژه: {client.projectId 
                          ? projects.find(p => p.id === client.projectId)?.name || client.projectId 
                          : 'بدون پروژه'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => disconnectClient(client.id)}
                          disabled={!isOnline}
                        >
                          قطع اتصال
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>
      
      {/* دیالوگ ویرایش پروژه */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ویرایش پروژه
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="نام پروژه"
                  fullWidth
                  value={selectedProject.name}
                  onChange={(e) => handleProjectChange('name', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="font-family-label">فونت</InputLabel>
                  <Select
                    labelId="font-family-label"
                    value={selectedProject.fontFamily}
                    onChange={(e) => handleProjectChange('fontFamily', e.target.value)}
                    label="فونت"
                  >
                    <MenuItem value="IRANSans">ایران سنس</MenuItem>
                    <MenuItem value="Vazirmatn">وزیر متن</MenuItem>
                    <MenuItem value="Tahoma">تاهوما</MenuItem>
                    <MenuItem value="Arial">Arial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="اندازه فونت"
                  type="number"
                  fullWidth
                  value={selectedProject.fontSize}
                  onChange={(e) => handleProjectChange('fontSize', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 16, max: 100 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Slider
                  value={selectedProject.scrollSpeed}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={(_, newValue) => handleProjectChange('scrollSpeed', newValue as number)}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: 'بدون حرکت' },
                    { value: 1, label: 'بسیار آهسته' },
                    { value: 3, label: 'متوسط' },
                    { value: 5, label: 'سریع' }
                  ]}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="alignment-label">چینش متن</InputLabel>
                  <Select
                    labelId="alignment-label"
                    value={selectedProject.textAlign}
                    onChange={(e) => handleProjectChange('textAlign', e.target.value as 'right' | 'center' | 'left')}
                    label="چینش متن"
                  >
                    <MenuItem value="right">راست‌چین</MenuItem>
                    <MenuItem value="center">وسط‌چین</MenuItem>
                    <MenuItem value="left">چپ‌چین</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="رنگ متن"
                  fullWidth
                  value={selectedProject.textColor}
                  onChange={(e) => handleProjectChange('textColor', e.target.value)}
                  type="color"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="رنگ پس‌زمینه"
                  fullWidth
                  value={selectedProject.backgroundColor}
                  onChange={(e) => handleProjectChange('backgroundColor', e.target.value)}
                  type="color"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="عرض پرامپتر (%)"
                  type="number"
                  fullWidth
                  value={selectedProject.prompterWidth}
                  onChange={(e) => handleProjectChange('prompterWidth', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 10, max: 100 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="ارتفاع پرامپتر (%)"
                  type="number"
                  fullWidth
                  value={selectedProject.prompterHeight}
                  onChange={(e) => handleProjectChange('prompterHeight', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 10, max: 100 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="موقعیت شروع (%)"
                  type="number"
                  fullWidth
                  value={selectedProject.startPosition}
                  onChange={(e) => handleProjectChange('startPosition', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedProject.useStartDelay}
                      onChange={(e) => handleProjectChange('useStartDelay', e.target.checked)}
                    />
                  }
                  label="استفاده از تاخیر شروع"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="تاخیر شروع (ثانیه)"
                  type="number"
                  fullWidth
                  disabled={!selectedProject.useStartDelay}
                  value={selectedProject.startDelay}
                  onChange={(e) => handleProjectChange('startDelay', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedProject.isMirrored}
                      onChange={(e) => handleProjectChange('isMirrored', e.target.checked)}
                    />
                  }
                  label="نمایش آینه‌ای"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="متن"
                  multiline
                  rows={10}
                  fullWidth
                  value={selectedProject.text}
                  onChange={(e) => handleProjectChange('text', e.target.value)}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>
            انصراف
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveProjectChanges}
            disabled={!isOnline}
          >
            ذخیره تغییرات
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* دیالوگ حذف پروژه */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>
          حذف پروژه
        </DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف پروژه "{selectedProject?.name}" اطمینان دارید؟
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            این عملیات غیرقابل بازگشت است و تمام تنظیمات و متن پروژه حذف خواهد شد.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            انصراف
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={deleteProject}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* نمایش پیام */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
    </Container>
  );
};

export default ServerControlPage; 