import React from 'react';
import { Clock, DollarSign, User, MapPin, Star, Eye, Heart, MessageCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';

// 任务状态枚举
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

// 任务优先级枚举
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// 任务类型枚举
export type TaskType = 'development' | 'design' | 'testing' | 'documentation' | 'consultation' | 'other';

// 技能标签接口
export interface SkillTag {
  /** 技能ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能等级 */
  level?: number;
  /** 是否必需 */
  required?: boolean;
}

// 发布者信息接口
export interface Publisher {
  /** 用户ID */
  id: string;
  /** 用户名 */
  name: string;
  /** 头像URL */
  avatar?: string;
  /** 评分 */
  rating?: number;
  /** 认证状态 */
  verified?: boolean;
  /** 位置 */
  location?: string;
}

// 任务数据接口
export interface Task {
  /** 任务ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description: string;
  /** 任务类型 */
  type: TaskType;
  /** 任务状态 */
  status: TaskStatus;
  /** 优先级 */
  priority: TaskPriority;
  /** 报酬 */
  reward: number;
  /** 货币单位 */
  currency?: string;
  /** 预计工时 */
  estimatedHours?: number;
  /** 截止时间 */
  deadline?: string;
  /** 发布时间 */
  publishedAt: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 技能要求 */
  skills: SkillTag[];
  /** 发布者信息 */
  publisher: Publisher;
  /** 浏览次数 */
  views?: number;
  /** 收藏次数 */
  favorites?: number;
  /** 申请人数 */
  applicants?: number;
  /** 是否紧急 */
  urgent?: boolean;
  /** 是否远程 */
  remote?: boolean;
  /** 位置 */
  location?: string;
  /** 标签 */
  tags?: string[];
}

// TaskCard 组件属性接口
export interface TaskCardProps {
  /** 任务数据 */
  task: Task;
  /** 卡片变体 */
  variant?: 'default' | 'compact' | 'detailed' | 'featured';
  /** 卡片尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 是否显示发布者信息 */
  showPublisher?: boolean;
  /** 是否显示技能标签 */
  showSkills?: boolean;
  /** 是否显示统计信息 */
  showStats?: boolean;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否显示收藏按钮 */
  showFavorite?: boolean;
  /** 是否已收藏 */
  isFavorited?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否选中 */
  selected?: boolean;
  /** 点击回调 */
  onClick?: (task: Task) => void;
  /** 申请任务回调 */
  onApply?: (task: Task) => void;
  /** 收藏回调 */
  onFavorite?: (task: Task, favorited: boolean) => void;
  /** 查看详情回调 */
  onViewDetails?: (task: Task) => void;
  /** 联系发布者回调 */
  onContact?: (task: Task) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 任务状态配置
const taskStatusConfig = {
  open: {
    label: '招募中',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🟢'
  },
  in_progress: {
    label: '进行中',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🔵'
  },
  completed: {
    label: '已完成',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '✅'
  },
  cancelled: {
    label: '已取消',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌'
  },
  expired: {
    label: '已过期',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '⏰'
  }
};

// 任务优先级配置
const taskPriorityConfig = {
  low: {
    label: '低',
    color: 'bg-gray-100 text-gray-600',
    icon: '⬇️'
  },
  medium: {
    label: '中',
    color: 'bg-yellow-100 text-yellow-700',
    icon: '➡️'
  },
  high: {
    label: '高',
    color: 'bg-orange-100 text-orange-700',
    icon: '⬆️'
  },
  urgent: {
    label: '紧急',
    color: 'bg-red-100 text-red-700',
    icon: '🔥'
  }
};

// 任务类型配置
const taskTypeConfig = {
  development: {
    label: '开发',
    color: 'bg-blue-100 text-blue-700',
    icon: '💻'
  },
  design: {
    label: '设计',
    color: 'bg-purple-100 text-purple-700',
    icon: '🎨'
  },
  testing: {
    label: '测试',
    color: 'bg-green-100 text-green-700',
    icon: '🧪'
  },
  documentation: {
    label: '文档',
    color: 'bg-indigo-100 text-indigo-700',
    icon: '📝'
  },
  consultation: {
    label: '咨询',
    color: 'bg-teal-100 text-teal-700',
    icon: '💡'
  },
  other: {
    label: '其他',
    color: 'bg-gray-100 text-gray-700',
    icon: '📋'
  }
};

// 格式化时间
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}天前`;
  } else if (diffHours > 0) {
    return `${diffHours}小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`;
  } else {
    return '刚刚';
  }
};

// 格式化截止时间
const formatDeadline = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return '已过期';
  } else if (diffDays === 0) {
    return '今天截止';
  } else if (diffDays === 1) {
    return '明天截止';
  } else {
    return `${diffDays}天后截止`;
  }
};

// 格式化报酬
const formatReward = (amount: number, currency: string = '¥'): string => {
  if (amount >= 10000) {
    return `${currency}${(amount / 10000).toFixed(1)}万`;
  } else if (amount >= 1000) {
    return `${currency}${(amount / 1000).toFixed(1)}k`;
  } else {
    return `${currency}${amount}`;
  }
};

/**
 * TaskCard 任务卡片组件
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  variant = 'default',
  size = 'default',
  showPublisher = true,
  showSkills = true,
  showStats = true,
  showActions = true,
  showFavorite = true,
  isFavorited = false,
  clickable = true,
  selected = false,
  onClick,
  onApply,
  onFavorite,
  onViewDetails,
  onContact,
  className
}) => {
  const statusConfig = taskStatusConfig[task.status];
  const priorityConfig = taskPriorityConfig[task.priority];
  const typeConfig = taskTypeConfig[task.type];

  const handleCardClick = () => {
    if (clickable && onClick) {
      onClick(task);
    }
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApply) {
      onApply(task);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(task, !isFavorited);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(task);
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContact) {
      onContact(task);
    }
  };

  // 卡片尺寸样式
  const sizeStyles = {
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6'
  };

  // 紧凑模式
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          clickable && 'cursor-pointer hover:shadow-lg',
          selected && 'ring-2 ring-primary',
          sizeStyles[size],
          className
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{typeConfig.icon}</span>
              <h3 className="font-medium text-sm truncate">{task.title}</h3>
              {task.urgent && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  紧急
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {formatReward(task.reward, task.currency)}
              </span>
              {task.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDeadline(task.deadline)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {showFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                className="h-8 w-8 p-0"
              >
                <Heart
                  className={cn(
                    'w-4 h-4',
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  )}
                />
              </Button>
            )}
            
            {showActions && task.status === 'open' && (
              <Button size="sm" onClick={handleApply}>
                申请
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // 详细模式
  if (variant === 'detailed') {
    return (
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          clickable && 'cursor-pointer hover:shadow-lg',
          selected && 'ring-2 ring-primary',
          className
        )}
        onClick={handleCardClick}
      >
        <CardHeader className={sizeStyles[size]}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={typeConfig.color}>
                  {typeConfig.icon} {typeConfig.label}
                </Badge>
                <Badge className={statusConfig.color}>
                  {statusConfig.icon} {statusConfig.label}
                </Badge>
                {task.priority !== 'low' && (
                  <Badge className={priorityConfig.color}>
                    {priorityConfig.icon} {priorityConfig.label}
                  </Badge>
                )}
                {task.urgent && (
                  <Badge variant="destructive">
                    🔥 紧急
                  </Badge>
                )}
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-3">
                {task.description}
              </p>
            </div>
            
            {showFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                className="ml-4"
              >
                <Heart
                  className={cn(
                    'w-5 h-5',
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  )}
                />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn('pt-0', sizeStyles[size])}>
          {/* 技能标签 */}
          {showSkills && task.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {task.skills.slice(0, 6).map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={skill.required ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {skill.name}
                    {skill.level && (
                      <span className="ml-1 opacity-70">L{skill.level}</span>
                    )}
                  </Badge>
                ))}
                {task.skills.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{task.skills.length - 6}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 任务信息 */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-green-600">
                {formatReward(task.reward, task.currency)}
              </span>
            </div>
            
            {task.estimatedHours && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{task.estimatedHours}小时</span>
              </div>
            )}
            
            {task.deadline && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className={cn(
                  new Date(task.deadline) < new Date() ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {formatDeadline(task.deadline)}
                </span>
              </div>
            )}
            
            {(task.location || task.remote) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{task.remote ? '远程' : task.location}</span>
              </div>
            )}
          </div>

          {/* 发布者信息 */}
          {showPublisher && (
            <div className="flex items-center gap-3 mb-4">
              <Avatar
                src={task.publisher.avatar}
                alt={task.publisher.name}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{task.publisher.name}</span>
                  {task.publisher.verified && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {task.publisher.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{task.publisher.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {task.publisher.location && (
                    <span>{task.publisher.location}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 统计信息 */}
          {showStats && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              {task.views && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{task.views}</span>
                </div>
              )}
              {task.favorites && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{task.favorites}</span>
                </div>
              )}
              {task.applicants && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{task.applicants}人申请</span>
                </div>
              )}
              <span>发布于 {formatTime(task.publishedAt)}</span>
            </div>
          )}
        </CardContent>

        {/* 操作按钮 */}
        {showActions && (
          <CardFooter className={cn('pt-0', sizeStyles[size])}>
            <div className="flex gap-2 w-full">
              {task.status === 'open' && (
                <Button onClick={handleApply} className="flex-1">
                  申请任务
                </Button>
              )}
              
              <Button variant="outline" onClick={handleViewDetails}>
                查看详情
              </Button>
              
              {showPublisher && (
                <Button variant="outline" onClick={handleContact}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  联系
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    );
  }

  // 特色模式
  if (variant === 'featured') {
    return (
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
          clickable && 'cursor-pointer hover:shadow-xl hover:border-primary/30',
          selected && 'ring-2 ring-primary',
          className
        )}
        onClick={handleCardClick}
      >
        <CardHeader className={sizeStyles[size]}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={cn(typeConfig.color, 'font-medium')}>
                  {typeConfig.icon} {typeConfig.label}
                </Badge>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  🌟 推荐
                </Badge>
                {task.urgent && (
                  <Badge variant="destructive">
                    🔥 紧急
                  </Badge>
                )}
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-primary">{task.title}</h3>
              <p className="text-muted-foreground line-clamp-2 mb-4">
                {task.description}
              </p>
              
              <div className="flex items-center gap-6 text-lg font-semibold">
                <div className="flex items-center gap-2 text-green-600">
                  <DollarSign className="w-5 h-5" />
                  <span>{formatReward(task.reward, task.currency)}</span>
                </div>
                
                {task.deadline && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-5 h-5" />
                    <span>{formatDeadline(task.deadline)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {showFavorite && (
              <Button
                variant="ghost"
                size="lg"
                onClick={handleFavorite}
                className="ml-4"
              >
                <Heart
                  className={cn(
                    'w-6 h-6',
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  )}
                />
              </Button>
            )}
          </div>
        </CardHeader>

        {showActions && (
          <CardFooter className={sizeStyles[size]}>
            <div className="flex gap-3 w-full">
              {task.status === 'open' && (
                <Button size="lg" onClick={handleApply} className="flex-1">
                  立即申请
                </Button>
              )}
              
              <Button variant="outline" size="lg" onClick={handleViewDetails}>
                查看详情
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    );
  }

  // 默认模式
  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        clickable && 'cursor-pointer hover:shadow-lg',
        selected && 'ring-2 ring-primary',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className={sizeStyles[size]}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={typeConfig.color}>
                {typeConfig.icon} {typeConfig.label}
              </Badge>
              <Badge className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              {task.urgent && (
                <Badge variant="destructive">
                  紧急
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {task.description}
            </p>
          </div>
          
          {showFavorite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className="ml-4"
            >
              <Heart
                  className={cn(
                    'w-5 h-5',
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  )}
                />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', sizeStyles[size])}>
        {/* 技能标签 */}
        {showSkills && task.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {task.skills.slice(0, 4).map((skill) => (
                <Badge
                  key={skill.id}
                  variant={skill.required ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {skill.name}
                </Badge>
              ))}
              {task.skills.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{task.skills.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 任务信息 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <DollarSign className="w-4 h-4" />
              <span>{formatReward(task.reward, task.currency)}</span>
            </div>
            
            {task.deadline && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDeadline(task.deadline)}</span>
              </div>
            )}
          </div>
          
          {showStats && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task.applicants && (
                <span>{task.applicants}人申请</span>
              )}
              <span>{formatTime(task.publishedAt)}</span>
            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className={cn('pt-0', sizeStyles[size])}>
          <div className="flex gap-2 w-full">
            {task.status === 'open' && (
              <Button onClick={handleApply} className="flex-1">
                申请
              </Button>
            )}
            
            <Button variant="outline" onClick={handleViewDetails}>
              详情
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

// 类型已在 @phoenixcoder/shared-types 中定义，无需重复导出

export default TaskCard;