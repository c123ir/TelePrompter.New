import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  IconButton,
  Paper,
  Chip
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import PeopleIcon from '@mui/icons-material/People';
import ComputerIcon from '@mui/icons-material/Computer';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';

interface ServerStatusProps {
  isConnected: boolean;
  activeConnections: number;
  serverUrl: string;
  reconnect: () => void;
  connectionError?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastPingTime?: number;
  connectionTime?: Date;
}

const ServerStatus: React.FC<ServerStatusProps> = ({
  isConnected,
  activeConnections,
  serverUrl,
  reconnect,
  connectionError = '',
  reconnectAttempts,
  maxReconnectAttempts,
  lastPingTime,
  connectionTime
}) => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'نامشخص';
    return date.toLocaleTimeString('fa-IR');
  };

  const getConnectionDuration = () => {
    if (!connectionTime || !isConnected) return 'اتصال برقرار نیست';
    
    const diffMs = new Date().getTime() - connectionTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins} دقیقه و ${diffSecs} ثانیه`;
  };

  return (
    <>
      <Box 
        onClick={handleClickOpen}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          '&:hover': { opacity: 0.8 }
        }}
      >
        <Chip
          icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
          label={`${isConnected ? 'متصل' : 'قطع'} (${activeConnections})`}
          color={isConnected ? 'success' : 'error'}
          variant="outlined"
          clickable
        />
      </Box>
      
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1 }} />
            وضعیت اتصال به سرور
          </Typography>
          <IconButton
            aria-label="بستن"
            onClick={handleClose}
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {isConnected ? 
                <WifiIcon color="success" sx={{ mr: 1 }} /> : 
                <WifiOffIcon color="error" sx={{ mr: 1 }} />
              }
              <Typography variant="subtitle1" fontWeight="bold">
                {isConnected ? 'اتصال برقرار است' : 'اتصال قطع است'}
              </Typography>
            </Box>
            
            {!isConnected && connectionError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                خطا: {connectionError}
              </Typography>
            )}
            
            {!isConnected && reconnectAttempts > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                تلاش مجدد: {reconnectAttempts} از {maxReconnectAttempts}
              </Typography>
            )}
          </Paper>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <ComputerIcon />
              </ListItemIcon>
              <ListItemText
                primary="آدرس سرور"
                secondary={serverUrl}
              />
            </ListItem>
            
            <Divider variant="inset" component="li" />
            
            <ListItem>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText
                primary="کاربران متصل"
                secondary={`${activeConnections} کاربر آنلاین`}
              />
            </ListItem>
            
            <Divider variant="inset" component="li" />
            
            <ListItem>
              <ListItemIcon>
                <AccessTimeIcon />
              </ListItemIcon>
              <ListItemText
                primary="مدت زمان اتصال"
                secondary={getConnectionDuration()}
              />
            </ListItem>
            
            {lastPingTime && (
              <>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="آخرین پینگ"
                    secondary={`${lastPingTime} میلی‌ثانیه`}
                  />
                </ListItem>
              </>
            )}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={reconnect} 
            disabled={isConnected}
            color="primary"
          >
            تلاش مجدد
          </Button>
          <Button onClick={handleClose} color="inherit">
            بستن
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ServerStatus; 