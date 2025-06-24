import { useState, useEffect, useCallback } from "react";
import { NotificationService, APIError } from "../lib/notification-api";
import type {
  Notification,
  NotificationsResponse,
} from "../types/notifications";

interface UseNotificationsOptions {
  pollInterval?: number;
  maxNotifications?: number;
  autoStart?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearError: () => void;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    pollInterval = 30000, // 30 secondes
    maxNotifications = 50,
    autoStart = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data: NotificationsResponse =
        await NotificationService.getNotifications();

      setNotifications(data.notifications.slice(0, maxNotifications));
      setUnreadCount(data.unread_count);
      setTotalCount(data.total_count);
    } catch (err) {
      const errorMessage =
        err instanceof APIError
          ? err.message
          : "Erreur lors du chargement des notifications";
      setError(errorMessage);
      console.error("Erreur notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [maxNotifications]);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await NotificationService.markAsRead(id);

        // Mise à jour optimiste de l'état local
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Rafraîchissement pour synchroniser avec le serveur
        setTimeout(refreshNotifications, 100);
      } catch (err) {
        const errorMessage =
          err instanceof APIError
            ? err.message
            : "Erreur lors du marquage comme lu";
        setError(errorMessage);
        console.error("Erreur marquage lu:", err);
      }
    },
    [refreshNotifications]
  );

  const deleteNotification = useCallback(
    async (id: number) => {
      try {
        await NotificationService.deleteNotification(id);

        // Mise à jour optimiste de l'état local
        const notificationToDelete = notifications.find((n) => n.id === id);

        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        setTotalCount((prev) => Math.max(0, prev - 1));

        if (notificationToDelete && !notificationToDelete.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Rafraîchissement pour synchroniser avec le serveur
        setTimeout(refreshNotifications, 100);
      } catch (err) {
        const errorMessage =
          err instanceof APIError
            ? err.message
            : "Erreur lors de la suppression";
        setError(errorMessage);
        console.error("Erreur suppression:", err);
      }
    },
    [notifications, refreshNotifications]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Chargement initial
  useEffect(() => {
    if (autoStart) {
      refreshNotifications();
    }
  }, [autoStart, refreshNotifications]);

  // Polling automatique
  useEffect(() => {
    if (!autoStart || pollInterval <= 0) return;

    const interval = setInterval(refreshNotifications, pollInterval);

    return () => clearInterval(interval);
  }, [autoStart, pollInterval, refreshNotifications]);

  // Rafraîchissement lors du focus de la fenêtre
  useEffect(() => {
    const handleFocus = () => {
      if (autoStart && !isLoading) {
        refreshNotifications();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [autoStart, isLoading, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    deleteNotification,
    clearError,
  };
}
