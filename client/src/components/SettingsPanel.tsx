import React from 'react';
import {
  Box,
  Slider,
  Typography,
  Switch,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Button,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import SettingsIcon from '@mui/icons-material/Settings';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import TimerIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

interface SettingsPanelProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  mirror: boolean;
  setMirror: (mirror: boolean) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  alignment: 'left' | 'center' | 'right';
  setAlignment: (alignment: 'left' | 'center' | 'right') => void;
  isScrolling: boolean;
  setIsScrolling: (isScrolling: boolean) => void;
  text: string;
  setText: (text: string) => void;
  fontFamily: string;
  setFontFamily: (fontFamily: string) => void;
  width: number;
  setWidth: (width: number) => void;
  height: number;
  setHeight: (height: number) => void;
  position: { x: number, y: number };
  setPosition: (position: { x: number, y: number }) => void;
  startDelay: number;
  setStartDelay: (delay: number) => void;
  useStartDelay: boolean;
  setUseStartDelay: (use: boolean) => void;
  lineHeight: number;
  setLineHeight: (lineHeight: number) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  fontSize,
  setFontSize,
  speed,
  setSpeed,
  mirror,
  setMirror,
  backgroundColor,
  setBackgroundColor,
  textColor,
  setTextColor,
  alignment,
  setAlignment,
  isScrolling,
  setIsScrolling,
  text,
  setText,
  fontFamily,
  setFontFamily,
  width,
  setWidth,
  height,
  setHeight,
  position,
  setPosition,
  startDelay,
  setStartDelay,
  useStartDelay,
  setUseStartDelay,
  lineHeight,
  setLineHeight,
}) => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAlignmentChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: 'left' | 'center' | 'right' | null,
  ) => {
    if (newAlignment !== null) {
      setAlignment(newAlignment);
    }
  };

  const fonts = [
    { value: '"Vazirmatn", sans-serif', label: 'وزیر متن' },
    { value: '"BTitr", sans-serif', label: 'تیتر' },
    { value: '"IRANSans", sans-serif', label: 'ایران سنس' },
    { value: '"Yekan", sans-serif', label: 'یکان' },
    { value: '"Sahel", sans-serif', label: 'ساحل' },
    { value: '"Samim", sans-serif', label: 'صمیم' },
    { value: '"Tanha", sans-serif', label: 'تنها' },
    { value: '"Arial", sans-serif', label: 'Arial' },
    { value: '"Times New Roman", serif', label: 'Times New Roman' },
    { value: '"Courier New", monospace', label: 'Courier New' },
  ];

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    setPosition({
      ...position,
      [axis]: value,
    });
  };

  const toggleScrolling = () => {
    setIsScrolling(!isScrolling);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, my: 2, maxHeight: '80vh', overflowY: 'auto' }}>
      <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab icon={<TextFieldsIcon />} label="متن" />
        <Tab icon={<SettingsIcon />} label="تنظیمات" />
        <Tab icon={<AspectRatioIcon />} label="ابعاد" />
      </Tabs>

      {/* بخش متن */}
      {tabValue === 0 && (
        <Box sx={{ width: '100%', mb: 4 }}>
          <TextField
            label="متن تله‌پرامپتر"
            multiline
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            variant="outlined"
            dir="rtl"
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            color={isScrolling ? 'error' : 'primary'}
            onClick={toggleScrolling}
            fullWidth
            size="large"
          >
            {isScrolling ? 'توقف' : 'شروع حرکت'}
          </Button>
        </Box>
      )}

      {/* بخش تنظیمات */}
      {tabValue === 1 && (
        <>
          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>اندازه فونت: {fontSize}px</Typography>
            <Slider
              value={fontSize}
              onChange={(_, newValue) => setFontSize(newValue as number)}
              min={12}
              max={72}
              step={1}
              marks
            />
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>
              فاصله بین خطوط: {lineHeight}
            </Typography>
            <Box sx={{ width: '100%' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={lineHeight}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(_, newValue) => setLineHeight(newValue as number)}
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
                  <Typography>{lineHeight}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>
              سرعت اسکرول:
            </Typography>
            <Box sx={{ width: '100%' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={speed}
                    min={0}
                    max={5}
                    step={0.1}
                    onChange={(_, newValue) => setSpeed(newValue as number)}
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
                  <Typography>{speed}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>تراز متن</Typography>
            <ToggleButtonGroup
              value={alignment}
              exclusive
              onChange={handleAlignmentChange}
              aria-label="text alignment"
              fullWidth
            >
              <ToggleButton value="right" aria-label="right aligned">
                <FormatAlignRightIcon />
              </ToggleButton>
              <ToggleButton value="center" aria-label="centered">
                <FormatAlignCenterIcon />
              </ToggleButton>
              <ToggleButton value="left" aria-label="left aligned">
                <FormatAlignLeftIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="font-family-label">فونت</InputLabel>
              <Select
                labelId="font-family-label"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                label="فونت"
              >
                {fonts.map((font) => (
                  <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <FormControlLabel
              control={<Switch checked={mirror} onChange={(e) => setMirror(e.target.checked)} />}
              label="نمایش آینه‌ای"
            />
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <FormControlLabel
              control={<Switch checked={useStartDelay} onChange={(e) => setUseStartDelay(e.target.checked)} />}
              label="استفاده از تایمر شمارش معکوس"
            />
          </Box>

          {useStartDelay && (
            <Box sx={{ width: '100%', mb: 2, opacity: useStartDelay ? 1 : 0.5 }}>
              <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TimerIcon sx={{ mr: 1 }} /> تاخیر شروع (ثانیه): {startDelay}
              </Typography>
              <Slider
                value={startDelay}
                onChange={(_, value) => setStartDelay(value as number)}
                min={1}
                max={30}
                step={1}
                disabled={!useStartDelay}
                marks={[
                  { value: 1, label: '۱' },
                  { value: 10, label: '۱۰' },
                  { value: 20, label: '۲۰' },
                  { value: 30, label: '۳۰' },
                ]}
              />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>رنگ پس‌زمینه</Typography>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{ width: '100%', height: '40px' }}
            />
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>رنگ متن</Typography>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{ width: '100%', height: '40px' }}
            />
          </Box>
        </>
      )}

      {/* بخش ابعاد و موقعیت */}
      {tabValue === 2 && (
        <>
          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>عرض کادر: {width}%</Typography>
            <Slider
              value={width}
              onChange={(_, newValue) => setWidth(newValue as number)}
              min={20}
              max={100}
              step={5}
              marks
            />
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>ارتفاع کادر: {height}%</Typography>
            <Slider
              value={height}
              onChange={(_, newValue) => setHeight(newValue as number)}
              min={20}
              max={100}
              step={5}
              marks
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            موقعیت کادر
          </Typography>

          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>موقعیت افقی: {position.x}%</Typography>
            <Slider
              value={position.x}
              onChange={(_, newValue) => handlePositionChange('x', newValue as number)}
              min={0}
              max={100}
              step={5}
              marks
            />
          </Box>

          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography gutterBottom>موقعیت عمودی: {position.y}%</Typography>
            <Slider
              value={position.y}
              onChange={(_, newValue) => handlePositionChange('y', newValue as number)}
              min={0}
              max={100}
              step={5}
              marks
            />
          </Box>

          <Button
            variant="outlined"
            startIcon={<ZoomOutMapIcon />}
            onClick={() => {
              setPosition({ x: 50, y: 50 });
              setWidth(80);
              setHeight(80);
            }}
            fullWidth
            sx={{ mt: 2 }}
          >
            تنظیم مجدد
          </Button>
        </>
      )}
    </Paper>
  );
};

export default SettingsPanel; 