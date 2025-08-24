// 通知相关类型
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_CANCELLED = 'task_cancelled',
  TASK_DEADLINE_REMINDER = 'task_deadline_reminder',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  SKILL_LEVEL_UP = 'skill_level_up',
  NEW_MESSAGE = 'new_message',
  PAYMENT_RECEIVED = 'payment_received',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SECURITY_ALERT = 'security_alert',
  FEATURE_UPDATE = 'feature_update'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook'
}

// 通知设置
export interface NotificationSettings {
  userId: string;
  preferences: NotificationPreference[];
  globalEnabled: boolean;
  quietHours?: QuietHours;
  updatedAt: Date;
}

export interface NotificationPreference {
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
  frequency?: NotificationFrequency;
}

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never'
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
  days: number[]; // 0-6, Sunday to Saturday
}

// 推送通知相关
export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// 邮件通知相关
export interface EmailNotification {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  template: string;
  templateData: Record<string, unknown>;
  priority: NotificationPriority;
  scheduledAt?: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: string;
  isActive: boolean;
}

// 批量通知
export interface BulkNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetUsers: string[];
  channels: NotificationChannel[];
  scheduledAt?: Date;
  status: BulkNotificationStatus;
  createdBy: string;
  createdAt: Date;
  sentAt?: Date;
  stats?: BulkNotificationStats;
}

export enum BulkNotificationStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface BulkNotificationStats {
  totalTargets: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
}

// 通知历史和统计
export interface NotificationHistory {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  errorMessage?: string;
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked'
}

export interface NotificationStats {
  userId: string;
  period: string; // YYYY-MM-DD or YYYY-MM
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
}