/**
 * @file FloatingAssistant.tsx
 * @description کامپوننت دستیار شناور برای دسترسی سریع به قابلیت‌های دستیار هوشمند
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskType, TaskPriority, TaskStatus, Screenshot } from './types';
import { LocalStorageTaskOrchestrator } from './taskOrchestratorCore';

// استایل‌های درون‌خطی برای دستیار
const styles = {
  // آیکون شناور
  floatingIcon: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#4a6cf7',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    transition: 'transform 0.3s ease',
    fontSize: '24px',
  },
  
  // آیکون شناور در حالت هاور
  floatingIconHover: {
    transform: 'scale(1.1)',
  },
  
  // پنل دستیار
  assistantPanel: {
    position: 'fixed' as const,
    bottom: '80px',
    right: '20px',
    width: '350px',
    maxHeight: '500px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
    zIndex: 999,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  
  // هدر پنل
  panelHeader: {
    backgroundColor: '#4a6cf7',
    color: 'white',
    padding: '15px',
    fontWeight: 'bold' as const,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // دکمه بستن
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
  },
  
  // محتوای پنل
  panelContent: {
    padding: '15px',
    overflowY: 'auto' as const,
    flexGrow: 1,
  },
  
  // فرم ثبت تسک
  taskForm: {
    marginBottom: '20px',
  },
  
  // فیلد فرم
  formField: {
    marginBottom: '10px',
  },
  
  // برچسب فیلد
  fieldLabel: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold' as const,
  },
  
  // ورودی متنی
  textInput: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  
  // انتخاب‌گر
  selectInput: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  
  // دکمه ثبت
  submitButton: {
    backgroundColor: '#4a6cf7',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  
  // لیست تسک‌ها
  taskList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  
  // آیتم تسک
  taskItem: {
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    borderLeft: '4px solid #4a6cf7',
    backgroundColor: '#f8f9fa',
  },
  
  // عنوان تسک
  taskTitle: {
    fontWeight: 'bold' as const,
    marginBottom: '5px',
  },
  
  // برچسب نوع تسک
  taskType: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    marginRight: '5px',
    backgroundColor: '#e0e0e0',
  },
  
  // برچسب اولویت تسک
  taskPriority: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    color: 'white',
  },
  
  // اولویت بحرانی
  criticalPriority: {
    backgroundColor: '#dc3545',
  },
  
  // اولویت بالا
  highPriority: {
    backgroundColor: '#fd7e14',
  },
  
  // اولویت متوسط
  mediumPriority: {
    backgroundColor: '#ffc107',
    color: '#212529',
  },
  
  // اولویت پایین
  lowPriority: {
    backgroundColor: '#6c757d',
  },
  
  // فوتر پنل
  panelFooter: {
    borderTop: '1px solid #eee',
    padding: '10px 15px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  
  // دکمه فوتر
  footerButton: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  
  // دکمه‌های فوتر با فاصله
  footerButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  
  // گروه دکمه‌ها
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  
  // نوار منو
  menuTabs: {
    display: 'flex',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
  },
  
  // گزینه منو
  menuTab: {
    padding: '10px 15px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
  },
  
  // گزینه منوی فعال
  activeMenuTab: {
    borderBottom: '2px solid #4a6cf7',
    fontWeight: 'bold' as const,
  },
  
  // گالری اسکرین‌شات‌ها
  screenshotGallery: {
    marginTop: '15px',
  },
  
  // کارت اسکرین‌شات
  screenshotCard: {
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px',
  },
  
  // تصویر اسکرین‌شات
  screenshotImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  
  // تاریخ اسکرین‌شات
  screenshotDate: {
    fontSize: '12px',
    color: '#666',
  },
};

// نوع نمای فعال
type ActiveView = 'tasks' | 'screenshots';

/**
 * کامپوننت دستیار هوشمند شناور
 */
const FloatingAssistant: React.FC = () => {
  // ایجاد یک نمونه از ارکستراتور با useMemo برای جلوگیری از ساخت مجدد در هر رندر
  const orchestrator = useMemo(() => new LocalStorageTaskOrchestrator(), []);
  
  // متغیرهای حالت
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tasks, setTasks] = useState<Array<any>>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: TaskType.BUG,
    priority: TaskPriority.MEDIUM,
    relatedComponent: '',
  });
  
  // نوع نمای فعال
  const [activeView, setActiveView] = useState<ActiveView>('tasks');
  
  // ذخیره‌سازی اسکرین‌شات‌ها
  const [savedScreenshots, setSavedScreenshots] = useState<Screenshot[]>([]);
  
  // بارگیری تسک‌ها
  const loadTasks = useCallback(async () => {
    try {
      const allTasks = await orchestrator.taskManager.getTasksByPriority();
      setTasks(allTasks);
    } catch (error) {
      console.error('خطا در بارگیری تسک‌ها:', error);
    }
  }, [orchestrator.taskManager]);
  
  // بارگیری اولیه تسک‌ها
  useEffect(() => {
    loadTasks();
  }, [isOpen, loadTasks]);
  
  // مدیریت تغییر ورودی‌ها
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // مدیریت ثبت فرم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // ثبت تسک
      await orchestrator.taskManager.registerTask({
        title: formData.title,
        description: formData.description,
        type: formData.type as TaskType,
        priority: formData.priority as TaskPriority,
        relatedComponent: formData.relatedComponent,
      });
      
      // پاک کردن فرم
      setFormData({
        title: '',
        description: '',
        type: TaskType.BUG,
        priority: TaskPriority.MEDIUM,
        relatedComponent: '',
      });
      
      // بارگیری مجدد تسک‌ها
      loadTasks();
    } catch (error) {
      console.error('خطا در ثبت تسک:', error);
    }
  };
  
  // گرفتن اسکرین‌شات
  const handleCaptureScreenshot = useCallback(async () => {
    try {
      // شبیه‌سازی فرآیند گرفتن اسکرین‌شات - این خط فقط برای نمایش است
      // const mockScreenshotData = 'data:image/png;base64,...';
      
      const screenshot = await orchestrator.screenshotManager.captureScreenshot();
      await orchestrator.screenshotManager.saveScreenshot(screenshot);
      alert('اسکرین‌شات با موفقیت ذخیره شد!');
    } catch (error) {
      console.error('خطا در گرفتن اسکرین‌شات:', error);
      alert('خطا در گرفتن اسکرین‌شات');
    }
  }, [orchestrator.screenshotManager]);
  
  // دانلود کردن همه داده‌ها
  const downloadData = async () => {
    try {
      const allData = await orchestrator.exportAllData();
      
      // تبدیل داده‌ها به JSON
      const jsonData = JSON.stringify(allData, null, 2);
      
      // ایجاد فایل قابل دانلود
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // ایجاد لینک دانلود و کلیک خودکار روی آن
      const link = document.createElement('a');
      link.href = url;
      link.download = `smart-assistant-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      
      // پاکسازی
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      alert('داده‌ها با موفقیت صادر شدند.');
    } catch (error) {
      console.error('خطا در صادرات داده‌ها:', error);
      alert('خطا در صادرات داده‌ها. لطفاً کنسول را بررسی کنید.');
    }
  };
  
  // بارگیری اسکرین‌شات‌ها
  const loadScreenshots = useCallback(async () => {
    try {
      const data = await orchestrator.exportAllData();
      setSavedScreenshots(data.screenshots);
    } catch (error) {
      console.error('خطا در بارگیری اسکرین‌شات‌ها:', error);
    }
  }, [orchestrator]);
  
  // بارگیری داده‌ها بر اساس نما
  useEffect(() => {
    if (isOpen) {
      if (activeView === 'tasks') {
        loadTasks();
      } else if (activeView === 'screenshots') {
        loadScreenshots();
      }
    }
  }, [isOpen, activeView, loadTasks, loadScreenshots]);
  
  // کلیدهای میانبر
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // کلید Shift+Alt+A برای نمایش دستیار
      if (e.shiftKey && e.altKey && e.key === 'a') {
        setIsOpen(!isOpen);
      }
      
      // کلید Shift+Alt+S برای گرفتن اسکرین‌شات
      if (e.shiftKey && e.altKey && e.key === 's') {
        await handleCaptureScreenshot();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleCaptureScreenshot]);
  
  // رنگ اولویت تسک
  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return styles.criticalPriority;
      case TaskPriority.HIGH:
        return styles.highPriority;
      case TaskPriority.MEDIUM:
        return styles.mediumPriority;
      case TaskPriority.LOW:
        return styles.lowPriority;
      default:
        return {};
    }
  };
  
  // نمایش محتوا بر اساس نمای فعال
  const renderContent = () => {
    switch (activeView) {
      case 'tasks':
        return (
          <>
            {/* فرم ثبت تسک */}
            <form style={styles.taskForm} onSubmit={handleSubmit}>
              <div style={styles.formField}>
                <label style={styles.fieldLabel}>عنوان</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={styles.textInput}
                  required
                />
              </div>
              
              <div style={styles.formField}>
                <label style={styles.fieldLabel}>توضیحات</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={styles.textInput}
                  rows={3}
                />
              </div>
              
              <div style={styles.formField}>
                <label style={styles.fieldLabel}>نوع</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  style={styles.selectInput}
                >
                  <option value={TaskType.BUG}>باگ</option>
                  <option value={TaskType.FEATURE}>قابلیت جدید</option>
                  <option value={TaskType.REFACTOR}>بازنویسی</option>
                  <option value={TaskType.OPTIMIZATION}>بهینه‌سازی</option>
                  <option value={TaskType.DOCUMENTATION}>مستندسازی</option>
                  <option value={TaskType.IDEA}>ایده</option>
                </select>
              </div>
              
              <div style={styles.formField}>
                <label style={styles.fieldLabel}>اولویت</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  style={styles.selectInput}
                >
                  <option value={TaskPriority.LOW}>کم</option>
                  <option value={TaskPriority.MEDIUM}>متوسط</option>
                  <option value={TaskPriority.HIGH}>بالا</option>
                  <option value={TaskPriority.CRITICAL}>بحرانی</option>
                </select>
              </div>
              
              <div style={styles.formField}>
                <label style={styles.fieldLabel}>کامپوننت مرتبط</label>
                <input
                  type="text"
                  name="relatedComponent"
                  value={formData.relatedComponent}
                  onChange={handleInputChange}
                  style={styles.textInput}
                />
              </div>
              
              <button type="submit" style={styles.submitButton}>
                ثبت تسک
              </button>
            </form>
            
            {/* لیست تسک‌ها */}
            <h3>تسک‌های فعال</h3>
            <ul style={styles.taskList}>
              {tasks.filter(task => task.status !== TaskStatus.COMPLETED).map(task => (
                <li key={task.id} style={styles.taskItem}>
                  <div style={styles.taskTitle}>{task.title}</div>
                  <div>
                    <span style={styles.taskType}>{task.type}</span>
                    <span style={{...styles.taskPriority, ...getPriorityStyle(task.priority)}}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && <p>{task.description}</p>}
                </li>
              ))}
              {tasks.filter(task => task.status !== TaskStatus.COMPLETED).length === 0 && (
                <p>هیچ تسک فعالی وجود ندارد.</p>
              )}
            </ul>
          </>
        );
        
      case 'screenshots':
        return (
          <div style={styles.screenshotGallery}>
            <h3>اسکرین‌شات‌های ذخیره شده</h3>
            {savedScreenshots.length > 0 ? (
              savedScreenshots.map((screenshot, index) => (
                <div key={screenshot.id || index} style={styles.screenshotCard}>
                  <img 
                    src={screenshot.dataUrl} 
                    alt={`اسکرین‌شات ${index + 1}`} 
                    style={styles.screenshotImage} 
                  />
                  <div style={styles.screenshotDate}>
                    تاریخ: {new Date(screenshot.createdAt).toLocaleString('fa-IR')}
                  </div>
                  {screenshot.annotation && (
                    <p>{screenshot.annotation}</p>
                  )}
                </div>
              ))
            ) : (
              <p>هیچ اسکرین‌شاتی ذخیره نشده است.</p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* آیکون شناور */}
      <div
        style={{
          ...styles.floatingIcon,
          ...(isHovered ? styles.floatingIconHover : {}),
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        💡
      </div>
      
      {/* پنل دستیار */}
      {isOpen && (
        <div style={styles.assistantPanel}>
          {/* هدر */}
          <div style={styles.panelHeader}>
            <span>دستیار هوشمند</span>
            <button style={styles.closeButton} onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>
          
          {/* منوی نوع نما */}
          <div style={styles.menuTabs}>
            <div 
              style={{
                ...styles.menuTab,
                ...(activeView === 'tasks' ? styles.activeMenuTab : {})
              }}
              onClick={() => setActiveView('tasks')}
            >
              تسک‌ها
            </div>
            <div 
              style={{
                ...styles.menuTab,
                ...(activeView === 'screenshots' ? styles.activeMenuTab : {})
              }}
              onClick={() => setActiveView('screenshots')}
            >
              اسکرین‌شات‌ها
            </div>
          </div>
          
          {/* محتوا */}
          <div style={styles.panelContent}>
            {renderContent()}
          </div>
          
          {/* فوتر */}
          <div style={styles.panelFooter}>
            <div style={styles.footerButtons}>
              <div style={styles.buttonGroup}>
                <button 
                  style={styles.footerButton} 
                  onClick={handleCaptureScreenshot}
                >
                  اسکرین‌شات
                </button>
                <button 
                  style={styles.footerButton} 
                  onClick={activeView === 'tasks' ? loadTasks : loadScreenshots}
                >
                  بارگیری مجدد
                </button>
              </div>
              
              <div>
                <button 
                  style={styles.footerButton} 
                  onClick={downloadData}
                >
                  صادرات داده‌ها
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAssistant; 