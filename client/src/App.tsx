import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, responsiveFontSizes, CssBaseline, Box } from '@mui/material';
import { faIR } from '@mui/material/locale';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import ProjectSelectionPage from './pages/ProjectSelectionPage';
import HomePage from './pages/HomePage';
import ServerStatusPage from './pages/ServerStatusPage';
import ServerControlPage from './pages/ServerControlPage';
import RemoteControlPage from './pages/RemoteControlPage';
import DisplayPage from './pages/DisplayPage';
import SocketTestPage from './pages/SocketTestPage';
import { LoggingProvider } from './contexts/LoggingContext';
import { Fab, Tooltip } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useLogging } from './contexts/LoggingContext';
import FloatingAssistant from './components/SmartAssistant/FloatingAssistant';

// ایجاد کش با پشتیبانی راست به چپ
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

// ایجاد تم اختصاصی
let theme = createTheme(
  {
    direction: 'rtl',
    palette: {
      mode: 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
    },
    typography: {
      fontFamily: 'IRANSans, Vazirmatn, Tahoma, Arial',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @font-face {
            font-family: 'IRANSans';
            font-style: normal;
            font-display: swap;
          }
        `,
      },
    },
  },
  faIR // افزودن ترجمه‌های فارسی
);

// فعال کردن فونت‌های پاسخگو
theme = responsiveFontSizes(theme);

// کامپوننت دکمه خطایابی
const DebugButton: React.FC = () => {
  const { showLogViewer } = useLogging();
  
  return (
    <Tooltip title="نمایش سیستم خطایابی" arrow placement="left">
      <Fab 
        color="secondary" 
        size="medium" 
        onClick={showLogViewer}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 900
        }}
      >
        <BugReportIcon />
      </Fab>
    </Tooltip>
  );
};

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoggingProvider>
          <Box dir="rtl" sx={{ minHeight: '100vh' }}>
            <Router>
              <Routes>
                {/* صفحه اصلی - انتخاب پروژه */}
                <Route path="/" element={<ProjectSelectionPage />} />
                
                {/* صفحه نمایش پروژه با شناسه پروژه */}
                <Route path="/project/:projectId" element={<HomePage />} />
                
                {/* صفحه کنترل از راه دور */}
                <Route path="/remote/:projectId" element={<RemoteControlPage />} />
                
                {/* صفحه نمایش‌دهنده */}
                <Route path="/display/:projectId" element={<DisplayPage />} />
                
                {/* صفحه وضعیت سرور */}
                <Route path="/server-status" element={<ServerStatusPage />} />
                
                {/* صفحه کنترل سرور برای مدیران */}
                <Route path="/admin" element={<ServerControlPage />} />
                
                {/* صفحه تست سوکت برای عیب‌یابی */}
                <Route path="/socket-test" element={<SocketTestPage />} />
                
                {/* مسیر پیش‌فرض */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <AppDebugButton />
              <FloatingAssistant />
            </Router>
          </Box>
        </LoggingProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

// کامپوننت دکمه خطایابی در سطح برنامه
const AppDebugButton: React.FC = () => {
  // فقط در محیط توسعه نمایش داده شود
  if (process.env.NODE_ENV !== 'development' && !process.env.REACT_APP_SHOW_DEBUG) {
    return null;
  }
  
  return <DebugButton />;
};

export default App;
