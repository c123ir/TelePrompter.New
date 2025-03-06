/**
 * @file FloatingAssistant.tsx
 * @description کامپوننت دستیار شناور برای دسترسی سریع به قابلیت‌های دستیار هوشمند
 */

import React, { useState, useEffect } from 'react';
import { TaskType, TaskPriority, TaskStatus } from './types';
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
};

/**
 * کامپوننت دستیار هوشمند شناور
 */
const FloatingAssistant: React.FC = () => {
  // هسته دستیار
  const orchestrator = new LocalStorageTaskOrchestrator();
  
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
  
  // بارگیری تسک‌ها
  const loadTasks = async () => {
    if (isOpen) {
      const tasksData = await orchestrator.taskManager.getTasksByPriority();
      setTasks(tasksData);
    }
  };
  
  // بارگیری اولیه تسک‌ها
  useEffect(() => {
    loadTasks();
  }, [isOpen]);
  
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
  const handleCaptureScreenshot = async () => {
    try {
      const screenshot = await orchestrator.screenshotManager.captureScreenshot();
      await orchestrator.screenshotManager.saveScreenshot(screenshot);
      alert('اسکرین‌شات با موفقیت ذخیره شد.');
    } catch (error) {
      console.error('خطا در گرفتن اسکرین‌شات:', error);
    }
  };
  
  // کلیدهای میانبر
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // نمایش/مخفی کردن دستیار با Alt+A
      if (e.altKey && e.code === 'KeyA') {
        setIsOpen(prev => !prev);
      }
      
      // گرفتن اسکرین‌شات با Alt+S
      if (e.altKey && e.code === 'KeyS') {
        await handleCaptureScreenshot();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
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
          
          {/* محتوا */}
          <div style={styles.panelContent}>
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
          </div>
          
          {/* فوتر */}
          <div style={styles.panelFooter}>
            <button 
              style={styles.footerButton} 
              onClick={handleCaptureScreenshot}
            >
              اسکرین‌شات
            </button>
            <button 
              style={styles.footerButton} 
              onClick={loadTasks}
            >
              بارگیری مجدد
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAssistant; 