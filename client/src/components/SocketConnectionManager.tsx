import React, { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { createSocketConnection, type Socket } from '../utils/socketUtil';

interface SocketConnectionManagerProps {
  serverUrl: string;
  onConnect?: (socket: Socket) => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

// تعریف نوع داده برای خطای سوکت
interface SocketError extends Error {
  type?: string;
  description?: string;
  data?: any;
}

/**
 * کامپوننت مدیریت اتصال سوکت برای تشخیص و رفع خطای اتصال
 */
const SocketConnectionManager: React.FC<SocketConnectionManagerProps> = ({
  serverUrl,
  onConnect,
  onDisconnect,
  onError
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  useEffect(() => {
    console.log('تلاش برای اتصال به سرور:', serverUrl);
    
    // انجام اتصال به سرور با استفاده از ابزار سوکت
    const socket = createSocketConnection(serverUrl);
    
    // رویدادهای اتصال
    socket.on('connect', () => {
      console.log('اتصال به سرور برقرار شد. Socket ID:', socket.id);
      setIsConnected(true);
      setError(null);
      if (onConnect) onConnect(socket);
    });
    
    socket.on('connect_error', (err: SocketError) => {
      console.error('خطا در اتصال به سرور:', err);
      console.error('جزئیات خطا:', {
        message: err.message,
        ...(err.type && { type: err.type }),
        ...(err.description && { description: err.description }),
        stack: err.stack,
        ...(err.data && { data: err.data })
      });
      
      setError(`خطا در اتصال به سرور: ${err.message}`);
      setOpenSnackbar(true);
      if (onError) onError(err);
    });
    
    socket.on('disconnect', (reason: string) => {
      console.log('اتصال به سرور قطع شد. دلیل:', reason);
      setIsConnected(false);
      if (onDisconnect) onDisconnect();
      
      if (reason === 'io server disconnect') {
        // قطع ارتباط از سمت سرور، نیاز به اتصال مجدد دستی
        console.log('تلاش برای اتصال مجدد...');
        socket.connect();
      }
    });
    
    socket.on('error', (err: any) => {
      console.error('خطای سوکت دریافت شد:', err);
      
      let errorMessage = 'خطای نامشخص';
      let errorDetails = {};
      
      // بررسی نوع خطای دریافتی و استخراج پیام مناسب
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        }
        
        // جمع‌آوری جزئیات خطا برای لاگ
        errorDetails = {
          ...(err.type && { type: err.type }),
          ...(err.code && { code: err.code }),
          ...(err.description && { description: err.description }),
          ...(err.stack && { stack: err.stack }),
          ...(err.data && { data: err.data })
        };
        
        // سعی در تبدیل خطا به JSON برای نمایش جزئیات بیشتر
        try {
          console.error('جزئیات خطا:', errorDetails);
          console.error('خطا به صورت JSON:', JSON.stringify(err, null, 2));
        } catch (e) {
          console.error('خطای سوکت قابل تبدیل به JSON نیست');
        }
      }
      
      setError(`خطا در ارتباط با سرور: ${errorMessage}`);
      setOpenSnackbar(true);
      if (onError) onError(err);
    });
    
    // تمیزکاری در زمان unmount
    return () => {
      console.log('قطع اتصال از سرور...');
      socket.disconnect();
    };
  }, [serverUrl, onConnect, onDisconnect, onError]);
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  return (
    <Snackbar
      open={openSnackbar && error !== null}
      autoHideDuration={6000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleCloseSnackbar} severity="error" variant="filled">
        {error}
      </Alert>
    </Snackbar>
  );
};

export default SocketConnectionManager; 