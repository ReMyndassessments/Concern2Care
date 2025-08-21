import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

const notificationDB = new SQLDatabase("notifications", {
  migrations: "./migrations",
});

export interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  actionUrl?: string;
}

export interface ListNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Creates a new notification for a user.
export const createNotification = api<CreateNotificationRequest, Notification>(
  { expose: false, method: "POST", path: "/notifications" },
  async (req) => {
    const notification = await notificationDB.queryRow<any>`
      INSERT INTO notifications (
        user_id, title, message, type, action_url, created_at
      ) VALUES (
        ${req.userId}, ${req.title}, ${req.message}, ${req.type}, 
        ${req.actionUrl || null}, NOW()
      )
      RETURNING *
    `;

    return {
      id: notification.id,
      userId: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.is_read,
      actionUrl: notification.action_url,
      createdAt: notification.created_at
    };
  }
);

// Lists notifications for the authenticated user.
export const listNotifications = api<void, ListNotificationsResponse>(
  { expose: true, method: "GET", path: "/notifications", auth: true },
  async () => {
    const auth = getAuthData()!;

    const notifications = await notificationDB.queryAll<any>`
      SELECT * FROM notifications 
      WHERE user_id = ${auth.email}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const unreadCount = await notificationDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${auth.email} AND is_read = false
    `;

    return {
      notifications: notifications.map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.is_read,
        actionUrl: notification.action_url,
        createdAt: notification.created_at
      })),
      unreadCount: unreadCount?.count || 0
    };
  }
);

// Marks a notification as read.
export const markAsRead = api<{ id: number }, { success: boolean }>(
  { expose: true, method: "PUT", path: "/notifications/:id/read", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    await notificationDB.exec`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = ${req.id} AND user_id = ${auth.email}
    `;

    return { success: true };
  }
);

// Marks all notifications as read for the user.
export const markAllAsRead = api<void, { success: boolean }>(
  { expose: true, method: "PUT", path: "/notifications/read-all", auth: true },
  async () => {
    const auth = getAuthData()!;

    await notificationDB.exec`
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = ${auth.email} AND is_read = false
    `;

    return { success: true };
  }
);
