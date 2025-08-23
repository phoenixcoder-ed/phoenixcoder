import React from 'react';
import {
  Bell,
  Check,
  X,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageCircle,
  AtSign,
  Heart,
  UserPlus,
  Share,
  Bookmark,
  Award,
  Gift,
  Target,
  Clock,
  Settings,
  Shield,
  CreditCard,
  RefreshCw,
  Image,
  Video,
  Volume2,
  FileText,
  Link,
  File,
  Download,
  MoreHorizontal,
  Archive,
  Trash2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';

// 通知类型枚举
export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'message' 
  | 'mention' 
  | 'like' 
  | 'follow' 
  | 'comment' 
  | 'share' 
  | 'bookmark' 
  | 'achievement' 
  | 'reward' 
  | 'task' 
  | 'reminder' 
  | 'system' 
  | 'security' 
  | 'payment' 
  | 'update' 
  | 'announcement';

// 通知优先级枚举
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// 通知状态枚举
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'deleted';

// 通知分类枚举
export type NotificationCategory = 
  | 'social' 
  | 'system' 
  | 'task' 
  | 'security' 
  | 'payment' 
  | 'marketing' 
  | 'update' 
  | 'reminder';

// 通知动作接口
export interface NotificationAction {
  /** 动作ID */
  id: string;
  /** 动作标签 */
  label: string;
  /** 动作类型 */
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** 动作图标 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 点击回调 */
  onClick?: () => void;
}

// 通知发送者接口
export interface NotificationSender {
  /** 发送者ID */
  id: string;
  /** 发送者名称 */
  name: string;
  /** 发送者头像 */
  avatar?: string;
  /** 发送者类型 */
  type?: 'user' | 'system' | 'bot' | 'service';
  /** 发送者角色 */
  role?: string;
  /** 是否在线 */
  online?: boolean;
  /** 是否已验证 */
  verified?: boolean;
}

// 通知附件接口
export interface NotificationAttachment {
  /** 附件ID */
  id: string;
  /** 附件名称 */
  name: string;
  /** 附件类型 */
  type: 'image' | 'video' | 'audio' | 'document' | 'link' | 'file';
  /** 附件URL */
  url: string;
  /** 附件大小 */
  size?: number;
  /** 附件缩略图 */
  thumbnail?: string;
  /** 附件描述 */
  description?: string;
}

// NotificationItem 组件属性接口
export interface NotificationItemProps {
  /** 通知ID */
  id: string;
  /** 通知类型 */
  type?: NotificationType;
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  content?: string;
  /** 通知状态 */
  status?: NotificationStatus;
  /** 通知优先级 */
  priority?: NotificationPriority;
  /** 通知分类 */
  category?: NotificationCategory;
  /** 发送者信息 */
  sender?: NotificationSender;
  /** 通知时间 */
  timestamp: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** 通知图标 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 通知图片 */
  image?: string;
  /** 通知附件 */
  attachments?: NotificationAttachment[];
  /** 通知动作 */
  actions?: NotificationAction[];
  /** 通知链接 */
  link?: string;
  /** 通知数据 */
  data?: Record<string, any>;
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 显示变体 */
  variant?: 'default' | 'compact' | 'detailed' | 'card' | 'minimal' | 'inline';
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 是否显示时间 */
  showTime?: boolean;
  /** 是否显示状态 */
  showStatus?: boolean;
  /** 是否显示优先级 */
  showPriority?: boolean;
  /** 是否显示动作 */
  showActions?: boolean;
  /** 是否显示菜单 */
  showMenu?: boolean;
  /** 是否可选择 */
  selectable?: boolean;
  /** 是否已选择 */
  selected?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否悬浮效果 */
  hoverable?: boolean;
  /** 是否点击效果 */
  clickable?: boolean;
  /** 点击通知回调 */
  onClick?: (notification: NotificationItemProps) => void;
  /** 标记为已读回调 */
  onMarkAsRead?: (id: string) => void;
  /** 标记为未读回调 */
  onMarkAsUnread?: (id: string) => void;
  /** 归档回调 */
  onArchive?: (id: string) => void;
  /** 删除回调 */
  onDelete?: (id: string) => void;
  /** 选择回调 */
  onSelect?: (id: string, selected: boolean) => void;
  /** 拖拽开始回调 */
  onDragStart?: (id: string) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (id: string) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 通知类型配置
const notificationTypeConfig = {
  info: {
    label: '信息',
    icon: Info,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  success: {
    label: '成功',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  warning: {
    label: '警告',
    icon: AlertTriangle,
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-200'
  },
  error: {
    label: '错误',
    icon: XCircle,
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  message: {
    label: '消息',
    icon: MessageCircle,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  mention: {
    label: '提及',
    icon: AtSign,
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200'
  },
  like: {
    label: '点赞',
    icon: Heart,
    color: 'pink',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200'
  },
  follow: {
    label: '关注',
    icon: UserPlus,
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200'
  },
  comment: {
    label: '评论',
    icon: MessageCircle,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  share: {
    label: '分享',
    icon: Share,
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  bookmark: {
    label: '收藏',
    icon: Bookmark,
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200'
  },
  achievement: {
    label: '成就',
    icon: Award,
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-200'
  },
  reward: {
    label: '奖励',
    icon: Gift,
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200'
  },
  task: {
    label: '任务',
    icon: Target,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  reminder: {
    label: '提醒',
    icon: Clock,
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200'
  },
  system: {
    label: '系统',
    icon: Settings,
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200'
  },
  security: {
    label: '安全',
    icon: Shield,
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  payment: {
    label: '支付',
    icon: CreditCard,
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  update: {
    label: '更新',
    icon: RefreshCw,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  announcement: {
    label: '公告',
    icon: Bell,
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200'
  }
};

// 优先级配置
const priorityConfig = {
  low: {
    label: '低',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300'
  },
  normal: {
    label: '普通',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-300'
  },
  high: {
    label: '高',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-300'
  },
  urgent: {
    label: '紧急',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    borderColor: 'border-red-300'
  }
};

// 状态配置
const statusConfig = {
  unread: {
    label: '未读',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  read: {
    label: '已读',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600'
  },
  archived: {
    label: '已归档',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600'
  },
  deleted: {
    label: '已删除',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600'
  }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'p-2 gap-2',
    avatar: 'w-6 h-6',
    icon: 'w-4 h-4',
    title: 'text-sm font-medium',
    content: 'text-xs',
    time: 'text-xs',
    badge: 'text-xs px-1.5 py-0.5',
    button: 'h-6 px-2 text-xs'
  },
  default: {
    container: 'p-3 gap-3',
    avatar: 'w-8 h-8',
    icon: 'w-5 h-5',
    title: 'text-sm font-medium',
    content: 'text-sm',
    time: 'text-xs',
    badge: 'text-xs px-2 py-1',
    button: 'h-8 px-3 text-sm'
  },
  lg: {
    container: 'p-4 gap-4',
    avatar: 'w-10 h-10',
    icon: 'w-6 h-6',
    title: 'text-base font-medium',
    content: 'text-sm',
    time: 'text-sm',
    badge: 'text-sm px-2.5 py-1',
    button: 'h-9 px-4 text-sm'
  }
};

// 格式化时间
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years}年前`;
  } else if (months > 0) {
    return `${months}个月前`;
  } else if (weeks > 0) {
    return `${weeks}周前`;
  } else if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取附件图标
const getAttachmentIcon = (type: NotificationAttachment['type']) => {
  switch (type) {
    case 'image':
      return Image;
    case 'video':
      return Video;
    case 'audio':
      return Volume2;
    case 'document':
      return FileText;
    case 'link':
      return Link;
    case 'file':
    default:
      return File;
  }
};

// 附件组件
const AttachmentItem: React.FC<{
  attachment: NotificationAttachment;
  size: 'sm' | 'default' | 'lg';
}> = ({ attachment, size }) => {
  const sizeStyles = sizeConfig[size];
  const IconComponent = getAttachmentIcon(attachment.type);

  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer',
      size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2'
    )}>
      {attachment.thumbnail ? (
        <img 
          src={attachment.thumbnail} 
          alt={attachment.name}
          className={cn('rounded object-cover', sizeStyles.avatar)}
        />
      ) : (
        <div className={cn('flex items-center justify-center rounded bg-gray-200', sizeStyles.avatar)}>
          <IconComponent className={cn('text-gray-500', sizeStyles.icon)} />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className={cn('font-medium truncate', sizeStyles.content)}>
          {attachment.name}
        </div>
        {attachment.size && (
          <div className={cn('text-muted-foreground', sizeStyles.time)}>
            {formatFileSize(attachment.size)}
          </div>
        )}
      </div>
      
      <Button
        size={size === 'sm' ? 'sm' : 'sm'}
        variant="ghost"
        className="shrink-0"
      >
        <Download className={sizeStyles.icon} />
      </Button>
    </div>
  );
};

/**
 * NotificationItem 通知项组件
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type = 'info',
  title,
  content,
  status = 'unread',
  priority = 'normal',
  category = 'system',
  sender,
  timestamp,
  expiresAt,
  icon,
  image,
  attachments = [],
  actions = [],
  link,
  data,
  size = 'default',
  variant = 'default',
  showAvatar = true,
  showTime = true,
  showStatus = true,
  showPriority = false,
  showActions = true,
  showMenu = true,
  selectable = false,
  selected = false,
  draggable = false,
  hoverable = true,
  clickable = true,
  onClick,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onDelete,
  onSelect,
  onDragStart,
  onDragEnd,
  className
}) => {
  const typeConfig = notificationTypeConfig[type];
  const priorityStyles = priorityConfig[priority];
  const statusStyles = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const IconComponent = icon || typeConfig.icon;
  const isUnread = status === 'unread';
  const isExpired = expiresAt && new Date() > expiresAt;

  // 处理点击事件
  const handleClick = () => {
    if (clickable && onClick) {
      onClick({
        id,
        type,
        title,
        content,
        status,
        priority,
        category,
        sender,
        timestamp,
        expiresAt,
        icon,
        image,
        attachments,
        actions,
        link,
        data,
        size,
        variant,
        showAvatar,
        showTime,
        showStatus,
        showPriority,
        showActions,
        showMenu,
        selectable,
        selected,
        draggable,
        hoverable,
        clickable,
        onClick,
        onMarkAsRead,
        onMarkAsUnread,
        onArchive,
        onDelete,
        onSelect,
        onDragStart,
        onDragEnd,
        className
      });
    }
    
    // 自动标记为已读
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  // 处理选择事件
  const handleSelect = (checked: boolean) => {
    if (onSelect) {
      onSelect(id, checked);
    }
  };

  // 紧凑模式
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 rounded-lg border transition-colors',
        isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200',
        hoverable && 'hover:bg-gray-50',
        clickable && 'cursor-pointer',
        selected && 'ring-2 ring-blue-500',
        className
      )}>
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => handleSelect(e.target.checked)}
            className="rounded border-gray-300"
          />
        )}
        
        <div className={cn('p-1.5 rounded-full', typeConfig.bgColor)}>
          <IconComponent className={cn('w-3 h-3', typeConfig.textColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          {content && (
            <div className="text-xs text-muted-foreground truncate">{content}</div>
          )}
        </div>
        
        {showTime && (
          <div className="text-xs text-muted-foreground shrink-0">
            {formatTime(timestamp)}
          </div>
        )}
        
        {isUnread && (
          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
        )}
      </div>
    );
  }

  // 内联模式
  if (variant === 'inline') {
    return (
      <div className={cn(
        'flex items-start gap-3 py-2',
        hoverable && 'hover:bg-gray-50',
        clickable && 'cursor-pointer',
        className
      )}>
        {showAvatar && sender && (
          <Avatar
            src={sender.avatar}
            alt={sender.name}
            className={sizeStyles.avatar}
            fallback={sender.name.charAt(0).toUpperCase()}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-medium', sizeStyles.title)}>
              {sender?.name || '系统'}
            </span>
            
            {showTime && (
              <span className={cn('text-muted-foreground', sizeStyles.time)}>
                {formatTime(timestamp)}
              </span>
            )}
            
            {isUnread && (
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </div>
          
          <div className={cn('text-muted-foreground', sizeStyles.content)}>
            {content || title}
          </div>
        </div>
      </div>
    );
  }

  // 最小模式
  if (variant === 'minimal') {
    return (
      <div className={cn(
        'flex items-center justify-between p-2 rounded-lg border transition-colors',
        isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200',
        hoverable && 'hover:bg-gray-50',
        clickable && 'cursor-pointer',
        className
      )}>
        <div className="flex items-center gap-2">
          <IconComponent className={cn(sizeStyles.icon, typeConfig.textColor)} />
          <span className={cn('font-medium', sizeStyles.title)}>{title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {showTime && (
            <span className={cn('text-muted-foreground', sizeStyles.time)}>
              {formatTime(timestamp)}
            </span>
          )}
          
          {isUnread && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
      </div>
    );
  }

  // 卡片模式
  const isCard = variant === 'card';
  
  return (
    <div 
      className={cn(
        'relative transition-all duration-200',
        isCard ? 'rounded-lg border bg-white shadow-sm' : 'border-b border-gray-200 last:border-b-0',
        sizeStyles.container,
        isUnread && !isCard && 'bg-blue-50/50',
        isUnread && isCard && 'ring-1 ring-blue-200',
        hoverable && 'hover:bg-gray-50',
        clickable && 'cursor-pointer',
        selected && 'ring-2 ring-blue-500',
        isExpired && 'opacity-60',
        className
      )}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={() => onDragStart?.(id)}
      onDragEnd={() => onDragEnd?.(id)}
    >
      {/* 未读指示器 */}
      {isUnread && !isCard && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
      )}
      
      <div className="flex items-start gap-3">
        {/* 选择框 */}
        {selectable && (
          <div className="pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                handleSelect(e.target.checked);
              }}
              className="rounded border-gray-300"
            />
          </div>
        )}
        
        {/* 头像或图标 */}
        <div className="shrink-0">
          {showAvatar && sender ? (
            <div className="relative">
              <Avatar
                src={sender.avatar}
                alt={sender.name}
                className={sizeStyles.avatar}
                fallback={sender.name.charAt(0).toUpperCase()}
              />
              
              {/* 在线状态 */}
              {sender.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
              
              {/* 验证标识 */}
              {sender.verified && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                  <Check className="w-1.5 h-1.5 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className={cn('p-2 rounded-full', typeConfig.bgColor)}>
              <IconComponent className={cn(sizeStyles.icon, typeConfig.textColor)} />
            </div>
          )}
        </div>
        
        {/* 主要内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部信息 */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', sizeStyles.title)}>
                {sender?.name || title}
              </span>
              
              {sender?.role && (
                <Badge variant="outline" className={sizeStyles.badge}>
                  {sender.role}
                </Badge>
              )}
              
              {showPriority && priority !== 'normal' && (
                <Badge 
                  variant="outline" 
                  className={cn(sizeStyles.badge, priorityStyles.textColor)}
                >
                  {priorityStyles.label}
                </Badge>
              )}
              
              {showStatus && status !== 'read' && (
                <Badge 
                  variant="outline" 
                  className={cn(sizeStyles.badge, statusStyles.textColor)}
                >
                  {statusStyles.label}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {showTime && (
                <Tooltip content={timestamp.toLocaleString()}>
                  <span className={cn('text-muted-foreground', sizeStyles.time)}>
                    {formatTime(timestamp)}
                  </span>
                </Tooltip>
              )}
              
              {isUnread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              
              {/* 菜单 */}
              {showMenu && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        if (isUnread && onMarkAsRead) {
                          onMarkAsRead(id);
                        } else if (!isUnread && onMarkAsUnread) {
                          onMarkAsUnread(id);
                        }
                      }}
                    >
                      {isUnread ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                      {isUnread ? '标记为已读' : '标记为未读'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive?.(id)}>
                      <Archive className="w-4 h-4 mr-2" />
                      归档
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* 标题（如果有发送者） */}
          {sender && title && (
            <div className={cn('font-medium mb-1', sizeStyles.title)}>
              {title}
            </div>
          )}
          
          {/* 内容 */}
          {content && (
            <div className={cn('text-muted-foreground mb-2', sizeStyles.content)}>
              {content}
            </div>
          )}
          
          {/* 图片 */}
          {image && (
            <div className="mb-3">
              <img 
                src={image} 
                alt="通知图片"
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: size === 'sm' ? '120px' : size === 'lg' ? '200px' : '160px' }}
              />
            </div>
          )}
          
          {/* 附件 */}
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((attachment) => (
                <AttachmentItem
                  key={attachment.id}
                  attachment={attachment}
                  size={size}
                />
              ))}
            </div>
          )}
          
          {/* 过期提示 */}
          {isExpired && (
            <div className="mb-2">
              <Badge variant="outline" className="text-red-600 border-red-200">
                <Clock className="w-3 h-3 mr-1" />
                已过期
              </Badge>
            </div>
          )}
          
          {/* 动作按钮 */}
          {showActions && actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {actions.map((action) => {
                const ActionIcon = action.icon;
                
                return (
                  <Button
                    key={action.id}
                    size={size === 'sm' ? 'sm' : 'sm'}
                    variant={action.type === 'primary' ? 'default' : 'outline'}
                    disabled={action.disabled}
                    loading={action.loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick?.();
                    }}
                    className={cn(
                      action.type === 'success' && 'bg-green-600 hover:bg-green-700 text-white',
                      action.type === 'warning' && 'bg-yellow-600 hover:bg-yellow-700 text-white',
                      action.type === 'danger' && 'bg-red-600 hover:bg-red-700 text-white'
                    )}
                  >
                    {ActionIcon && <ActionIcon className="w-4 h-4 mr-1" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;