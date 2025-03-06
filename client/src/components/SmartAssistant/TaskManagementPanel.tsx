import React from 'react';
import { Task, TaskStatus, TaskType, TaskPriority } from './types';

interface TaskManagementPanelProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
}

export const TaskManagementPanel: React.FC<TaskManagementPanelProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    onTaskUpdate(taskId, { status: newStatus });
  };

  const handlePriorityChange = (taskId: string, newPriority: TaskPriority) => {
    onTaskUpdate(taskId, { priority: newPriority });
  };

  return (
    <div className="task-management-panel">
      <h2>مدیریت تسک‌ها</h2>
      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-item">
            <div className="task-header">
              <h3>{task.title}</h3>
              <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                {task.priority}
              </span>
            </div>
            <p>{task.description}</p>
            <div className="task-meta">
              <span className="task-type">{task.type}</span>
              <span className="task-status">{task.status}</span>
              <span className="task-date">
                {new Date(task.createdAt).toLocaleDateString('fa-IR')}
              </span>
            </div>
            <div className="task-actions">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id || '', e.target.value as TaskStatus)}
              >
                <option value={TaskStatus.TODO}>انجام نشده</option>
                <option value={TaskStatus.IN_PROGRESS}>در حال انجام</option>
                <option value={TaskStatus.COMPLETED}>انجام شده</option>
                <option value={TaskStatus.DEFERRED}>به تعویق افتاده</option>
              </select>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(task.id || '', e.target.value as TaskPriority)}
              >
                <option value={TaskPriority.LOW}>کم</option>
                <option value={TaskPriority.MEDIUM}>متوسط</option>
                <option value={TaskPriority.HIGH}>زیاد</option>
                <option value={TaskPriority.CRITICAL}>بحرانی</option>
              </select>
              <button
                className="delete-button"
                onClick={() => onTaskDelete(task.id || '')}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManagementPanel;
