import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: "warning" | "error" | "info" | "success";
  time: string;
  isNew: boolean;
  category: "docs" | "mail" | "system";
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Document Pending",
    description: "Atlas Logistics has 3 customs forms awaiting uploaded signature.",
    type: "warning",
    time: "2m ago",
    isNew: true,
    category: "docs"
  },
  {
    id: "2",
    title: "Email Delivery Failed",
    description: "Shipping manifest for PacLog (INV-882) could not be delivered to remote SMTP.",
    type: "error",
    time: "15m ago",
    isNew: true,
    category: "mail"
  },
  {
    id: "3",
    title: "System Update",
    description: "Cloud node SYD-12 successfully synced with Global Registry.",
    type: "success",
    time: "1h ago",
    isNew: false,
    category: "system"
  },
  {
    id: "4",
    title: "Missing KYC Data",
    description: "EuroL (ID: EU-44) kyc verification is pending for over 48 hours.",
    type: "error",
    time: "4h ago",
    isNew: false,
    category: "docs"
  }
];

let globalNotifications = [...INITIAL_NOTIFICATIONS];
let listeners: Function[] = [];

export function useNotifications() {
  const [notifications, setNotifs] = useState(globalNotifications);
  
  useEffect(() => {
    listeners.push(setNotifs);
    return () => {
      listeners = listeners.filter(l => l !== setNotifs);
    };
  }, []);
  
  const addNotification = (notif: Notification) => {
    globalNotifications = [notif, ...globalNotifications];
    listeners.forEach(l => l(globalNotifications));
  };

  const markAllRead = () => {
    globalNotifications = globalNotifications.map(n => ({ ...n, isNew: false }));
    listeners.forEach(l => l(globalNotifications));
  };

  const removeNotification = (id: string) => {
    globalNotifications = globalNotifications.filter(n => n.id !== id);
    listeners.forEach(l => l(globalNotifications));
  };
  
  return { notifications, addNotification, markAllRead, removeNotification };
}
