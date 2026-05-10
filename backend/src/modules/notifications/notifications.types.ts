export type NotificationType =
  | 'adoption_request_approved'
  | 'adoption_request_rejected'
  | 'adoption_request_sent'
  | 'chat_message'
  | 'donation_received'
  | 'donation_goal_reached'
  | 'volunteer_registration';

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timeLabel: string; // UI-friendly ("14:32", "Өчигдөр", "04.12")
  createdAt: string;
  isRead: boolean;
  actionLabel: string | null;
  actionUrl: string | null;
};

