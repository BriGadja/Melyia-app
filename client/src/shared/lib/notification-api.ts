import type {
  Notification,
  NotificationsResponse,
  CreateNotificationRequest,
} from "../types/notifications";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

class APIError extends Error {
  constructor(message: string, public status?: number, public data?: unknown) {
    super(message);
    this.name = "APIError";
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("auth_token");

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new APIError(
        errorData?.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new APIError(data.message || "API request failed", undefined, data);
    }

    return data.data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error or request failed");
  }
}

export class NotificationService {
  static async getNotifications(): Promise<NotificationsResponse> {
    return apiRequest<NotificationsResponse>("/notifications");
  }

  static async createNotification(
    data: CreateNotificationRequest
  ): Promise<Notification> {
    return apiRequest<Notification>("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async markAsRead(id: number): Promise<void> {
    await apiRequest<void>(`/notifications/${id}/read`, {
      method: "PUT",
      body: JSON.stringify({}),
    });
  }

  static async deleteNotification(id: number): Promise<void> {
    await apiRequest<void>(`/notifications/${id}`, {
      method: "DELETE",
    });
  }
}

export { APIError };
