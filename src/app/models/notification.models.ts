export type NotificationType = 'ALERT_STATUS_CHANGE';

export interface NotificationResponse {
  id: number;
  message: string;
  type: NotificationType;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}