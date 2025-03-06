import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { serverLogger } from '../utils/serverLogger';
import '../styles/LogViewer.css';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
  details?: any;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to logger updates
    const unsubscribe = logger.subscribe((updatedLogs: LogEntry[]) => {
      setLogs(updatedLogs);
    });

    // Initialize with current logs
    setLogs(logger.getAllLogs());

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyToClipboard = () => {
    logger.copyLogsToClipboard();
  };

  const handleClearLogs = () => {
    logger.clearLogs();
  };

  const handleFetchServerLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await serverLogger.fetchServerLogs();
      setError(null);
    } catch (err) {
      setError('خطا در دریافت لاگ‌های سرور');
      console.error('Error fetching server logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const diagnosticResult = await serverLogger.runServerDiagnostics();
      logger.info('نتایج تشخیصی سرور دریافت شد', 'LogViewer', diagnosticResult);
    } catch (err) {
      setError('خطا در اجرای عملیات تشخیصی');
      console.error('Error running diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesText = filter === '' || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.source.toLowerCase().includes(filter.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    
    const matchesSource = sourceFilter === 'all' || 
      (sourceFilter === 'client' && !log.source.includes('[سرور]')) ||
      (sourceFilter === 'server' && log.source.includes('[سرور]'));
    
    return matchesText && matchesLevel && matchesSource;
  });

  return (
    <div className="log-viewer-overlay">
      <div className="log-viewer-container">
        <div className="log-viewer-header">
          <h2>سیستم خطایابی</h2>
          <div className="log-viewer-toolbar">
            <div className="log-filter-controls">
              <input
                type="text"
                placeholder="جستجو در لاگ‌ها..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="log-search-input"
              />
              <select 
                value={levelFilter} 
                onChange={(e) => setLevelFilter(e.target.value)}
                className="log-level-filter"
              >
                <option value="all">همه سطوح</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="log-source-filter"
              >
                <option value="all">همه منابع</option>
                <option value="client">فقط کلاینت</option>
                <option value="server">فقط سرور</option>
              </select>
            </div>
            <div className="log-actions">
              <button 
                onClick={handleFetchServerLogs} 
                className="log-action-button log-server-button"
                disabled={isLoading}
              >
                {isLoading ? 'در حال بارگذاری...' : 'دریافت لاگ‌های سرور'}
              </button>
              <button 
                onClick={handleRunDiagnostics} 
                className="log-action-button log-diagnostic-button"
                disabled={isLoading}
              >
                تشخیص خطا
              </button>
              <button onClick={handleCopyToClipboard} className="log-action-button">
                کپی تمام لاگ‌ها
              </button>
              <button onClick={handleClearLogs} className="log-action-button log-clear-button">
                پاک کردن لاگ‌ها
              </button>
              <button onClick={onClose} className="log-action-button log-close-button">
                بستن
              </button>
            </div>
          </div>
          {error && <div className="log-error-message">{error}</div>}
        </div>
        
        <div className="log-viewer-content">
          {filteredLogs.length === 0 ? (
            <div className="log-empty-message">هیچ لاگی برای نمایش وجود ندارد.</div>
          ) : (
            <table className="log-table">
              <thead>
                <tr>
                  <th>زمان</th>
                  <th>سطح</th>
                  <th>منبع</th>
                  <th>پیام</th>
                  <th>جزئیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index} className={`log-level-${log.level}`}>
                    <td>{log.timestamp}</td>
                    <td>{log.level.toUpperCase()}</td>
                    <td>{log.source}</td>
                    <td>{log.message}</td>
                    <td>
                      {log.details ? (
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="log-viewer-footer">
          <div className="log-stats">
            تعداد لاگ‌ها: {filteredLogs.length} (از مجموع {logs.length})
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
