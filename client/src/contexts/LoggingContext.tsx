import React, { createContext, useState, useContext, ReactNode } from 'react';
import { logger } from '../utils/logger';
import LogViewer from '../components/LogViewer';

interface LoggingContextProps {
  showLogViewer: () => void;
  hideLogViewer: () => void;
  isLogViewerOpen: boolean;
  logError: (message: string, source: string, details?: any) => void;
  logWarning: (message: string, source: string, details?: any) => void;
  logInfo: (message: string, source: string, details?: any) => void;
  logDebug: (message: string, source: string, details?: any) => void;
  copyLogsToClipboard: () => void;
  clearLogs: () => void;
}

const LoggingContext = createContext<LoggingContextProps | undefined>(undefined);

interface LoggingProviderProps {
  children: ReactNode;
}

export const LoggingProvider: React.FC<LoggingProviderProps> = ({ children }) => {
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);

  const showLogViewer = () => {
    setIsLogViewerOpen(true);
  };

  const hideLogViewer = () => {
    setIsLogViewerOpen(false);
  };

  const logError = (message: string, source: string, details?: any) => {
    logger.error(message, source, details);
  };

  const logWarning = (message: string, source: string, details?: any) => {
    logger.warn(message, source, details);
  };

  const logInfo = (message: string, source: string, details?: any) => {
    logger.info(message, source, details);
  };

  const logDebug = (message: string, source: string, details?: any) => {
    logger.debug(message, source, details);
  };

  const copyLogsToClipboard = () => {
    logger.copyLogsToClipboard();
  };

  const clearLogs = () => {
    logger.clearLogs();
  };

  return (
    <LoggingContext.Provider
      value={{
        showLogViewer,
        hideLogViewer,
        isLogViewerOpen,
        logError,
        logWarning,
        logInfo,
        logDebug,
        copyLogsToClipboard,
        clearLogs
      }}
    >
      {children}
      <LogViewer isOpen={isLogViewerOpen} onClose={hideLogViewer} />
    </LoggingContext.Provider>
  );
};

export const useLogging = (): LoggingContextProps => {
  const context = useContext(LoggingContext);
  if (context === undefined) {
    throw new Error('useLogging must be used within a LoggingProvider');
  }
  return context;
};

export default LoggingContext; 