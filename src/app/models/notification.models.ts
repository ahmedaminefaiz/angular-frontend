export type NotificationType =
  | 'ALERT_RECEIVED'
  | 'ALERT_STATUS_CHANGE'
  | 'PROBLEM_ASSIGNED'
  | 'PROBLEM_STATUS_CHANGE';

export interface NotificationResponse {
  id: number;
  message: string;
  type: NotificationType;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}