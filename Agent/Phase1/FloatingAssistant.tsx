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
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 9999,
    fontSize: '24px',
    transition: 'all 0.3s ease',
  },
  
  // آیکون شناور هنگام هاور
  floatingIconHover: {
    transform: 'scale(1.1)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
  },
  
  // پنل دستیار
  assistantPanel: {
    position: 'fixed' as const,
    bottom: '80px',
    right: '20px',
    width: '300px',
    maxHeight: '500px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 9998,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  
  // هدر پنل
  panelHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #eaeaea',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4a6cf7',
    color: 'white',
  },
  
  // دکمه بستن
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
  },
  
  // بدنه پنل با اسکرول
  panelBody: {
    padding: '16px',
    overflowY: 'auto' as const,
    maxHeight: '350px',
    flexGrow: 1,
  },
  
  // فرم افزودن تسک
  taskForm: {
    marginBottom: '16px',
  },
  
  // فیلدهای فرم
  formField: {
    marginBottom: '12px',
  },
  
  // برچسب فیلد
  formLabel: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  
  // ورودی متنی
  textInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  
  // منوی کشویی
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  
  // دکمه ثبت
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#4a6cf7',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
  },
  
  // لیست تسک‌ها
  taskList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  
  // آیتم تسک
  taskItem: {
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '8px',
    backgroundColor: '#f5f5f5',
    borderLeft: '4px solid #4a6cf7',
  },
  
  // عنوان تسک
  taskTitle: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 'bold' as const,
  },
  
  // اطلاعات اضافی تسک
  taskMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
  },
  
  // برچسب اولویت
  priorityBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    color: 'white',
  },
  
  // رنگ‌های اولویت
  priority: {
    [TaskPriority.LOW]: { backgroundColor: '#8bc34a' },
    [TaskPriority.MEDIUM]: { backgroundColor: '#ffc107' },
    [TaskPriority.HIGH]: { backgroundColor: '#ff9800' },
    [TaskPriority.CRITICAL]: { backgroundColor: '#f44336' },
  },
  
  // پا صفحه پنل
  panelFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #eaeaea',
    display: 'flex',
    justifyContent: 'space-between',
  },
  
  // دکمه‌های اکشن
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};

/**
 * کامپوننت دستیار شناور
 */
const FloatingAssistant: React.FC = () => {
  // نمونه‌سازی از دستیار هوشمند
  const taskOrchestrator = new LocalStorageTaskOrchestrator();
  
  // استیت‌های کامپوننت
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: TaskType.BUG,
    priority: TaskPriority.MEDIUM,
    relatedComponent: '',
  });
  
  // بارگیری تسک‌ها
  useEffect(() => {
    const loadTasks = async () => {
      if (isOpen) {
        const loadedTasks = await taskOrchestrator.taskManager.getTasksByPriority();
        setTasks(loadedTasks);
      }
    };
    
    loadTasks();
  }, [isOpen]);
  
  // تغییر فیلدهای فرم
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };
  
  // ثبت تسک جدید
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await taskOrchestrator.taskManager.registerTask(newTask);
      
      // پاک کردن فرم
      setNewTask({
        title: '',
        description: '',
        type: TaskType.BUG,
        priority: TaskPriority.MEDIUM,
        relatedComponent: '',
      });
      
      // بارگیری مجدد تسک‌ها
      const updatedTasks = await taskOrchestrator.taskManager.getTasksByPriority();
      setTasks(updatedTasks);
      
    } catch (error) {
      console.error('Error registering task:', error);
    }
  };
  
  // گرفتن اسکرین‌شات
  const handleCaptureScreenshot = async () => {
    try {
      const screenshot = await taskOrchestrator.screenshotManager.captureScreenshot();
      await taskOrchestrator.screenshotManager.saveScreenshot(screenshot);
      alert('اسکرین‌شات با موفقیت ذخیره شد.');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  };
  
  // قرار دادن کلیدهای میانبر
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // کلید میانبر برای نمایش/مخفی کردن دستیار (Alt+A)
      if (e.altKey && e.key === 'a') {
        setIsOpen(prev => !prev);
      }
      
      // کلید میانبر برای گرفتن اسکرین‌شات (Alt+S)
      if (e.altKey && e.key === 's') {
        await handleCaptureScreenshot();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // رندر کامپوننت
  return (
    <>
      {/* آیکون شناور */}
      <div
        style={{
          ...styles.floatingIcon,
          ...(isHovered ? styles.floatingIconHover : {}),
        }}
        onClick={() => setIsOpen(prev => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        🧠
      </div>
      
      {/* پنل دستیار */}
      {isOpen && (
        <div style={styles.assistantPanel}>
          {/* هدر پنل */}
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>دستیار هوشمند</h3>
            <button
              style={styles.closeButton}
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          {/* بدنه پنل */}
          <div style={styles.panelBody}>
            {/* فرم افزودن تسک جدید */}
            <form style={styles.taskForm} onSubmit={handleSubmit}>
              <div style={styles.formField}>
                <label style={styles.formLabel} htmlFor="title">
                  عنوان
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  style={styles.textInput}
                  required
                />
              </div>
              
              <div style={styles.formField}>
                <label style={styles.formLabel} htmlFor="description">
                  توضیحات
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  style={{ ...styles.textInput, minHeight: '60px' }}
                />
              </div>
              
              <div style={styles.formField}>
                <label style={styles.formLabel} htmlFor="type">
                  نوع
                </label>
                <select
                  id="type"
                  name="type"
                  value={newTask.type}
                  onChange={handleInputChange}
                  style={styles.select}
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
                <label style={styles.formLabel} htmlFor="priority">
                  اولویت
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value={TaskPriority.LOW}>کم</option>
                  <option value={TaskPriority.MEDIUM}>متوسط</option>
                  <option value={TaskPriority.HIGH}>زیاد</option>
                  <option value={TaskPriority.CRITICAL}>بحرانی</option>
                </select>
              </div>
              
              <div style={styles.formField}>
                <label style={styles.formLabel} htmlFor="relatedComponent">
                  کامپوننت مرتبط
                </label>
                <input
                  type="text"
                  id="relatedComponent"
                  name="relatedComponent"
                  value={newTask.relatedComponent}
                  onChange={handleInputChange}
                  style={styles.textInput}
                />
              </div>
              
              <button type="submit" style={styles.submitButton}>
                ثبت تسک
              </button>
            </form>
            
            {/* لیست تسک‌ها */}
            <h4>تسک‌های فعال</h4>
            <ul style={styles.taskList}>
              {tasks
                .filter(task => task.status !== TaskStatus.COMPLETED)
                .map(task => (
                  <li key={task.id} style={styles.taskItem}>
                    <h4 style={styles.taskTitle}>{task.title}</h4>
                    <p>{task.description}</p>
                    <div style={styles.taskMeta}>
                      <span>{task.type}</span>
                      <span
                        style={{
                          ...styles.priorityBadge,
                          ...styles.priority[task.priority as TaskPriority],
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
          
          {/* پا صفحه پنل */}
          <div style={styles.panelFooter}>
            <button
              style={styles.actionButton}
              onClick={handleCaptureScreenshot}
            >
              📷 اسکرین‌شات
            </button>
            
            <button
              style={styles.actionButton}
              onClick={async () => {
                const tasks = await taskOrchestrator.taskManager.getTasksByPriority();
                setTasks(tasks);
              }}
            >
              🔄 بارگذاری مجدد
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAssistant; 