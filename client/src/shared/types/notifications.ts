export interface Notification {
  id: number;
  notification_type: string;
  content: string;
  link: string | null;
  priority: "normal" | "high" | "urgent";
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender_name: string;
  sender_role: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  total_count: number;
}

export interface CreateNotificationRequest {
  user_id: number;
  notification_type?: string;
  content: string;
  link?: string;
  priority?: "normal" | "high" | "urgent";
}

export interface NotificationIconProps {
  className?: string;
  maxNotifications?: number; // défaut: 50
  pollInterval?: number; // défaut: 30000ms (30s)
  onNavigate?: (link: string) => void;
}
