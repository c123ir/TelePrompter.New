// این صفحه حذف و در آینده برنامه‌ریزی مجدد خواهد شد
// فعلا برای رفع خطاها و برگرداندن برنامه به حالت پایدار قبلی، این صفحه موقتا حذف می‌شود

import React from 'react';
import { 
  Container,
  Typography, 
  Button,
  Box
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

const ServerStatusPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          صفحه وضعیت سرور
        </Typography>
        <Typography variant="body1" paragraph>
          این بخش موقتا غیرفعال شده است و در نسخه‌های آینده بازگشت خواهد کرد.
        </Typography>
        <Button 
          component={RouterLink} 
          to="/" 
          variant="contained" 
          color="primary"
          startIcon={<HomeIcon />}
        >
          بازگشت به صفحه اصلی
        </Button>
      </Box>
    </Container>
  );
};

export default ServerStatusPage; 