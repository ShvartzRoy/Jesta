import React, { createContext, useContext, useState } from 'react';

interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  read?: boolean;
}

interface NotificationContextType {
  liveNotifications: Notification[];
  setNewNotification: (n: Notification) => void;
  removeLiveNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  liveNotifications: [],
  setNewNotification: () => {},
  removeLiveNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([]);

  const setNewNotification = (newNotification: Notification) => {
    setLiveNotifications((prev) => [newNotification, ...prev]);
  };

  const removeLiveNotification = (id: number) => {
    setLiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        liveNotifications,
        setNewNotification,
        removeLiveNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;

