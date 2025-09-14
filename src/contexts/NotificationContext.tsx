import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationManager, NotificationProps } from '@/components/ui/notification';

interface NotificationContextType {
  notifications: NotificationProps[];
  addNotification: (notification: Omit<NotificationProps, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: NotificationProps = {
      ...notification,
      id,
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
      }}
    >
      {children}
      <NotificationManager
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Convenience functions for different notification types
export function useNotificationHelpers() {
  const { addNotification } = useNotification();

  const showSuccess = useCallback((title: string, description?: string, action?: ReactNode) => {
    addNotification({
      title,
      description,
      type: 'success',
      duration: 4000,
      action
    });
  }, [addNotification]);

  const showError = useCallback((title: string, description?: string, action?: ReactNode) => {
    addNotification({
      title,
      description,
      type: 'error',
      duration: 6000, // Longer duration for errors
      action
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, description?: string, action?: ReactNode) => {
    addNotification({
      title,
      description,
      type: 'warning',
      duration: 5000,
      action
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, description?: string, action?: ReactNode) => {
    addNotification({
      title,
      description,
      type: 'info',
      duration: 4000,
      action
    });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

