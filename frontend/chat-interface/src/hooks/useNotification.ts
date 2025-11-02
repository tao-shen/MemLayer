import { create } from 'zustand';
import type { ToastType } from '@/components/Toast';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ toasts: [] });
  },
}));

export const useNotification = () => {
  const { addToast, removeToast, clearAll, toasts } = useNotificationStore();

  const notify = {
    success: (message: string, description?: string, action?: Toast['action']) => {
      addToast({ type: 'success', message, description, action });
    },
    error: (message: string, description?: string, action?: Toast['action']) => {
      addToast({ type: 'error', message, description, action, duration: 0 }); // Don't auto-dismiss errors
    },
    warning: (message: string, description?: string, action?: Toast['action']) => {
      addToast({ type: 'warning', message, description, action });
    },
    info: (message: string, description?: string, action?: Toast['action']) => {
      addToast({ type: 'info', message, description, action });
    },
  };

  return {
    notify,
    toasts,
    removeToast,
    clearAll,
  };
};
