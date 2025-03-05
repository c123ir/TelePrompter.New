import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  CircularProgress,
  Divider,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TimerIcon from '@mui/icons-material/Timer';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import io, { Socket } from 'socket.io-client';
import { getTextStats } from '../utils/textUtils';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';

// آدرس سرور Socket.io
const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || 'http://localhost:4444';

// تعریف نوع داده پروژه
interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  text: string;
  clientCount: number;
}

// صفحه انتخاب پروژه
const ProjectSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  
  // وضعیت‌های کامپوننت
  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // وضعیت‌های ایجاد پروژه جدید
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectText, setNewProjectText] = useState<string>('');
  const [creatingProject, setCreatingProject] = useState<boolean>(false);
  
  // وضعیت‌های ویرایش پروژه
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<boolean>(false);
  const [currentEditProject, setCurrentEditProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState<string>('');
  const [editProjectText, setEditProjectText] = useState<string>('');
  
  // وضعیت‌های حذف پروژه
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [deletingProject, setDeletingProject] = useState<boolean>(false);
  const [currentDeleteProject, setCurrentDeleteProject] = useState<Project | null>(null);
  
  // وضعیت‌های اسنک‌بار
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // اتصال به سرور و دریافت لیست پروژه‌ها
  useEffect(() => {
    // اتصال به سرور Socket.io
    const newSocket = io(SOCKET_SERVER, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('به سرور متصل شدیم');
      
      // درخواست لیست پروژه‌ها
      newSocket.emit('get-projects');
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('خطای اتصال به سرور:', err);
      setConnected(false);
      setError('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.');
      setLoading(false);
    });
    
    // دریافت لیست پروژه‌ها
    newSocket.on('projects-list', (projectsList: Project[]) => {
      setProjects(projectsList);
      setLoading(false);
    });
    
    // دریافت تایید ایجاد پروژه جدید
    newSocket.on('project-created', (project: Project) => {
      setProjects(prev => [...prev, project]);
      setCreatingProject(false);
      setOpenCreateDialog(false);
      showSnackbar(`پروژه "${project.name}" با موفقیت ایجاد شد`, 'success');
    });
    
    // دریافت خطا
    newSocket.on('error', (errorData: any) => {
      console.error('خطای دریافتی از سرور:', errorData);
      showSnackbar(errorData.message || 'خطایی رخ داد', 'error');
      setCreatingProject(false);
      setEditingProject(false);
      setDeletingProject(false);
    });
    
    // دریافت تأیید ویرایش پروژه
    newSocket.on('project-updated', (project: Project) => {
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      setEditingProject(false);
      setOpenEditDialog(false);
      showSnackbar(`پروژه "${project.name}" با موفقیت ویرایش شد`, 'success');
    });
    
    // دریافت تأیید حذف پروژه
    newSocket.on('project-delete-confirmed', (projectId: string) => {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setDeletingProject(false);
      setOpenDeleteDialog(false);
      showSnackbar(`پروژه با موفقیت حذف شد`, 'success');
    });
    
    // دریافت اطلاع حذف پروژه توسط کاربر دیگر
    newSocket.on('project-deleted', (projectId: string) => {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      showSnackbar(`پروژه توسط کاربر دیگری حذف شد`, 'info');
    });
    
    setSocket(newSocket);
    
    // پاکسازی هنگام خروج
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // انتخاب پروژه و هدایت به صفحه پروژه
  const handleSelectProject = (projectId: string) => {
    if (!socket || !connected) {
      showSnackbar('اتصال به سرور برقرار نیست', 'error');
      return;
    }
    
    // ذخیره شناسه پروژه در localStorage
    localStorage.setItem('selectedProjectId', projectId);
    
    // هدایت به صفحه تله‌پرامپتر
    navigate(`/project/${projectId}`);
  };
  
  // انتخاب پروژه به عنوان کنترل‌کننده
  const handleSelectAsController = (projectId: string) => {
    if (!socket || !connected) {
      showSnackbar('اتصال به سرور برقرار نیست', 'error');
      return;
    }
    
    // ذخیره شناسه پروژه و نقش در localStorage
    localStorage.setItem('selectedProjectId', projectId);
    localStorage.setItem('userRole', 'controller');
    
    // هدایت به صفحه کنترل از راه دور
    navigate(`/control/${projectId}`);
  };
  
  // انتخاب پروژه به عنوان نمایش‌دهنده
  const handleSelectAsViewer = (projectId: string) => {
    if (!socket || !connected) {
      showSnackbar('اتصال به سرور برقرار نیست', 'error');
      return;
    }
    
    // ذخیره شناسه پروژه و نقش در localStorage
    localStorage.setItem('selectedProjectId', projectId);
    localStorage.setItem('userRole', 'viewer');
    
    // هدایت به صفحه نمایش‌دهنده
    navigate(`/display/${projectId}`);
  };
  
  // باز کردن دیالوگ ایجاد پروژه جدید
  const handleOpenCreateDialog = () => {
    setNewProjectName('');
    setNewProjectText('');
    setOpenCreateDialog(true);
  };
  
  // بستن دیالوگ ایجاد پروژه
  const handleCloseCreateDialog = () => {
    if (creatingProject) return; // اگر در حال ایجاد پروژه هستیم، اجازه بستن ندهید
    
    setOpenCreateDialog(false);
  };
  
  // ایجاد پروژه جدید
  const handleCreateProject = () => {
    if (!socket || !connected) {
      showSnackbar('اتصال به سرور برقرار نیست', 'error');
      return;
    }
    
    if (!newProjectName.trim()) {
      showSnackbar('لطفاً نام پروژه را وارد کنید', 'warning');
      return;
    }
    
    setCreatingProject(true);
    
    // ارسال درخواست ایجاد پروژه به سرور
    socket.emit('create-project', {
      name: newProjectName.trim(),
      text: newProjectText.trim() || 'متن پیش‌فرض تله‌پرامپتر...'
    });
  };
  
  // نمایش پیام اسنک‌بار
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // فرمت کردن تاریخ
  const formatDate = (dateStr: string | Date) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'تاریخ نامعتبر';
    }
  };
  
  // درخواست مجدد لیست پروژه‌ها
  const handleRefresh = () => {
    if (!socket || !connected) {
      showSnackbar('اتصال به سرور برقرار نیست', 'error');
      return;
    }
    
    setLoading(true);
    socket.emit('get-projects');
  };
  
  // باز کردن دیالوگ ویرایش پروژه
  const handleOpenEditDialog = (project: Project) => {
    setCurrentEditProject(project);
    setEditProjectName(project.name);
    setEditProjectText(project.text);
    setOpenEditDialog(true);
  };
  
  // بستن دیالوگ ویرایش پروژه
  const handleCloseEditDialog = () => {
    if (editingProject) return; // اگر در حال ویرایش پروژه هستیم، اجازه بستن ندهید
    
    setOpenEditDialog(false);
    setCurrentEditProject(null);
    setEditProjectName('');
    setEditProjectText('');
  };
  
  // ویرایش پروژه
  const handleEditProject = () => {
    if (!socket || !connected) {
      showSnackbar('اتصال به سرور برقرار نیست', 'error');
      return;
    }
    
    if (!currentEditProject) {
      showSnackbar('پروژه‌ای برای ویرایش انتخاب نشده است', 'error');
      return;
    }
    
    if (!editProjectName.trim()) {
      showSnackbar('لطفاً نام پروژه را وارد کنید', 'warning');
      return;
    }
    
    setEditingProject(true);
    
    // ارسال درخواست ویرایش پروژه به سرور
    socket.emit('edit-project', {
      projectId: currentEditProject.id,
      name: editProjectName.trim(),
      text: editProjectText.trim() || 'متن پیش‌فرض تله‌پرامپتر...'
    });
  };
  
  // باز کردن دیالوگ حذف پروژه
  const handleOpenDeleteDialog = (project: Project) => {
    setCurrentDeleteProject(project);
    setOpenDeleteDialog(true);
  };
  
  // بستن دیالوگ حذف پروژه
  const handleCloseDeleteDialog = () => {
    if (deletingProject) return; // اگر در حال حذف پروژه هستیم، اجازه بستن ندهید
    
    setOpenDeleteDialog(false);
    setCurrentDeleteProject(null);
  };
  
  // حذف پروژه
  const handleDeleteProject = () => {
    if (!socket || !connected) {
      showSnackbar('اتصال به سرور برقرار نیست', 'error');
      return;
    }
    
    if (!currentDeleteProject) {
      showSnackbar('پروژه‌ای برای حذف انتخاب نشده است', 'error');
      return;
    }
    
    setDeletingProject(true);
    
    // ارسال درخواست حذف پروژه به سرور
    socket.emit('delete-project', currentDeleteProject.id);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          پروژه‌های تله‌پرامپتر
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
            disabled={!connected || loading}
          >
            بروزرسانی
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            disabled={!connected}
          >
            پروژه جدید
          </Button>
        </Box>
      </Box>
      
      {!connected && (
        <Alert severity="error" sx={{ mb: 3 }}>
          اتصال به سرور برقرار نیست. لطفاً صفحه را مجدداً بارگذاری کنید یا از در دسترس بودن سرور اطمینان حاصل کنید.
          {error && <Typography variant="body2" sx={{ mt: 1 }}>{error}</Typography>}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            در حال بارگذاری پروژه‌ها...
          </Typography>
        </Box>
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            هیچ پروژه‌ای یافت نشد
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            برای شروع، یک پروژه جدید ایجاد کنید.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreateDialog}
            disabled={!connected}
          >
            ایجاد پروژه جدید
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {project.name}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Tooltip title="آخرین به‌روزرسانی">
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(project.updatedAt)}
                      </Typography>
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Chip 
                      label={`${project.clientCount} کاربر متصل`} 
                      size="small" 
                      color={project.clientCount > 0 ? "primary" : "default"}
                      variant={project.clientCount > 0 ? "filled" : "outlined"}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'start', mb: 1 }}>
                    <TextSnippetIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        maxHeight: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {project.text || 'بدون متن'}
                    </Typography>
                  </Box>
                  
                  {/* نمایش آمار متن */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                    <Tooltip title="تعداد کاراکترها">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormatSizeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {getTextStats(project.text).charCount} کاراکتر
                        </Typography>
                      </Box>
                    </Tooltip>
                    
                    <Tooltip title="تعداد کلمات">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AutoStoriesIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {getTextStats(project.text).wordCount} کلمه
                        </Typography>
                      </Box>
                    </Tooltip>
                    
                    <Tooltip title="زمان تقریبی خواندن">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {getTextStats(project.text).readingTime} دقیقه
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ display: 'flex', flexDirection: 'column', p: 2, gap: 1 }}>
                  <Button 
                    size="large" 
                    fullWidth 
                    variant="contained" 
                    onClick={() => handleSelectProject(project.id)}
                  >
                    مشاهده پروژه
                  </Button>
                  
                  <Box sx={{ display: 'flex', width: '100%', gap: 1, mt: 1 }}>
                    <Button 
                      size="medium"
                      fullWidth 
                      variant="outlined" 
                      color="primary"
                      onClick={() => handleSelectAsController(project.id)}
                    >
                      کنترل از راه دور
                    </Button>
                    
                    <Button 
                      size="medium"
                      fullWidth 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => handleSelectAsViewer(project.id)}
                    >
                      نمایش‌دهنده
                    </Button>
                  </Box>
                  
                  {/* دکمه‌های ویرایش و حذف */}
                  <Box sx={{ display: 'flex', width: '100%', gap: 1, mt: 1 }}>
                    <Button 
                      size="small"
                      fullWidth 
                      variant="outlined" 
                      color="info"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEditDialog(project)}
                    >
                      ویرایش
                    </Button>
                    
                    <Button 
                      size="small"
                      fullWidth 
                      variant="outlined" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleOpenDeleteDialog(project)}
                    >
                      حذف
                    </Button>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* دیالوگ ایجاد پروژه جدید */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ایجاد پروژه جدید</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            لطفاً اطلاعات پروژه جدید را وارد کنید.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="نام پروژه"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
            disabled={creatingProject}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="متن اولیه (اختیاری)"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newProjectText}
            onChange={(e) => setNewProjectText(e.target.value)}
            disabled={creatingProject}
            placeholder="متن پیش‌فرض تله‌پرامپتر..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={creatingProject}>
            انصراف
          </Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            disabled={!newProjectName.trim() || creatingProject}
          >
            {creatingProject ? <CircularProgress size={24} /> : 'ایجاد'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* اسنک‌بار برای نمایش پیام‌ها */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Button
        component={RouterLink}
        to="/server-status"
        variant="outlined"
        color="primary"
        startIcon={<SettingsIcon />}
        sx={{ mt: 2, mb: 1 }}
        fullWidth
      >
        وضعیت سرور و اشکال‌زدایی
      </Button>
      
      <Button
        component={RouterLink}
        to="/socket-test"
        variant="outlined"
        color="secondary"
        startIcon={<BugReportIcon />}
        sx={{ mb: 2 }}
        fullWidth
      >
        تست اتصال سوکت
      </Button>
    </Container>
  );
};

export default ProjectSelectionPage;