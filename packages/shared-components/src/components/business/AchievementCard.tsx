import React from 'react';
import { Star, Crown, Target, Zap, Shield, Lock, Calendar, Users, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';
import { Button } from '../ui/Button';

// 成就类型枚举
export type AchievementType = 
  | 'milestone' 
  | 'skill' 
  | 'social' 
  | 'challenge' 
  | 'streak' 
  | 'special' 
  | 'seasonal' 
  | 'rare'
  | 'legendary'
  | 'hidden';

// 成就状态枚举
export type AchievementStatus = 
  | 'locked' 
  | 'available' 
  | 'in_progress' 
  | 'completed' 
  | 'claimed';

// 成就稀有度枚举
export type AchievementRarity = 
  | 'common' 
  | 'uncommon' 
  | 'rare' 
  | 'epic' 
  | 'legendary';

// 成就样式变体
export type AchievementVariant = 
  | 'default' 
  | 'compact' 
  | 'detailed' 
  | 'card' 
  | 'banner' 
  | 'minimal'
  | 'showcase';

// 成就进度接口
export interface AchievementProgress {
  /** 当前进度 */
  current: number;
  /** 目标进度 */
  target: number;
  /** 进度单位 */
  unit?: string;
  /** 进度描述 */
  description?: string;
}

// 成就奖励接口
export interface AchievementReward {
  /** 奖励类型 */
  type: 'points' | 'badge' | 'title' | 'item' | 'experience' | 'currency';
  /** 奖励数量 */
  amount: number;
  /** 奖励名称 */
  name: string;
  /** 奖励描述 */
  description?: string;
  /** 奖励图标 */
  icon?: string;
}

// 成就数据接口
export interface Achievement {
  /** 成就ID */
  id: string;
  /** 成就名称 */
  title: string;
  /** 成就描述 */
  description: string;
  /** 成就类型 */
  type: AchievementType;
  /** 成就状态 */
  status: AchievementStatus;
  /** 成就稀有度 */
  rarity: AchievementRarity;
  /** 成就图标 */
  icon?: string;
  /** 成就图片 */
  image?: string;
  /** 成就进度 */
  progress?: AchievementProgress;
  /** 成就奖励 */
  rewards?: AchievementReward[];
  /** 解锁条件 */
  requirements?: string[];
  /** 解锁时间 */
  unlockedAt?: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 领取时间 */
  claimedAt?: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** 成就分数 */
  points?: number;
  /** 完成人数 */
  completedCount?: number;
  /** 总人数 */
  totalUsers?: number;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否为秘密成就 */
  secret?: boolean;
  /** 成就系列 */
  series?: string;
  /** 成就等级 */
  level?: number;
  /** 最大等级 */
  maxLevel?: number;
  /** 前置成就 */
  prerequisites?: string[];
  /** 后续成就 */
  nextAchievements?: string[];
  /** 成就标签 */
  tags?: string[];
  /** 成就难度 */
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
}

// AchievementCard 组件属性接口
export interface AchievementCardProps {
  /** 成就数据 */
  achievement: Achievement;
  /** 显示变体 */
  variant?: AchievementVariant;
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 是否显示进度 */
  showProgress?: boolean;
  /** 是否显示奖励 */
  showRewards?: boolean;
  /** 是否显示统计 */
  showStats?: boolean;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否动画效果 */
  animated?: boolean;
  /** 是否发光效果 */
  glowing?: boolean;
  /** 点击回调 */
  onClick?: (achievement: Achievement) => void;
  /** 领取回调 */
  onClaim?: (achievement: Achievement) => void;
  /** 查看详情回调 */
  onViewDetails?: (achievement: Achievement) => void;
  /** 分享回调 */
  onShare?: (achievement: Achievement) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 成就类型配置
const achievementTypeConfig = {
  milestone: {
    label: '里程碑',
    icon: Target,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-100 text-blue-800 border-blue-200',
    textColor: 'text-blue-600',
    emoji: '🎯'
  },
  skill: {
    label: '技能',
    icon: Zap,
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    textColor: 'text-yellow-600',
    emoji: '⚡'
  },
  social: {
    label: '社交',
    icon: Users,
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-100 text-green-800 border-green-200',
    textColor: 'text-green-600',
    emoji: '👥'
  },
  challenge: {
    label: '挑战',
    icon: Shield,
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-100 text-red-800 border-red-200',
    textColor: 'text-red-600',
    emoji: '🛡️'
  },
  streak: {
    label: '连击',
    icon: TrendingUp,
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-100 text-purple-800 border-purple-200',
    textColor: 'text-purple-600',
    emoji: '📈'
  },
  special: {
    label: '特殊',
    icon: Star,
    color: 'from-pink-400 to-pink-600',
    bgColor: 'bg-pink-100 text-pink-800 border-pink-200',
    textColor: 'text-pink-600',
    emoji: '⭐'
  },
  seasonal: {
    label: '季节',
    icon: Calendar,
    color: 'from-cyan-400 to-cyan-600',
    bgColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    textColor: 'text-cyan-600',
    emoji: '📅'
  },
  rare: {
    label: '稀有',
    icon: Star,
    color: 'from-indigo-400 to-indigo-600',
    bgColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    textColor: 'text-indigo-600',
    emoji: '💎'
  },
  legendary: {
    label: '传说',
    icon: Crown,
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-100 text-amber-800 border-amber-200',
    textColor: 'text-amber-600',
    emoji: '👑'
  },
  hidden: {
    label: '隐藏',
    icon: Lock,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100 text-gray-800 border-gray-200',
    textColor: 'text-gray-600',
    emoji: '🔒'
  }
};

// 成就状态配置
const achievementStatusConfig = {
  locked: {
    label: '未解锁',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 text-gray-600',
    emoji: '🔒'
  },
  available: {
    label: '可获得',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 text-blue-800',
    emoji: '🎯'
  },
  in_progress: {
    label: '进行中',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 text-yellow-800',
    emoji: '⏳'
  },
  completed: {
    label: '已完成',
    color: 'text-green-600',
    bgColor: 'bg-green-100 text-green-800',
    emoji: '✅'
  },
  claimed: {
    label: '已领取',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 text-gray-800',
    emoji: '📦'
  }
};

// 稀有度配置
const rarityConfig = {
  common: {
    label: '普通',
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100 text-gray-800 border-gray-200',
    textColor: 'text-gray-600',
    glow: 'shadow-gray-200',
    emoji: '⚪'
  },
  uncommon: {
    label: '稀有',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-100 text-green-800 border-green-200',
    textColor: 'text-green-600',
    glow: 'shadow-green-200',
    emoji: '🟢'
  },
  rare: {
    label: '珍贵',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-100 text-blue-800 border-blue-200',
    textColor: 'text-blue-600',
    glow: 'shadow-blue-200',
    emoji: '🔵'
  },
  epic: {
    label: '史诗',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-100 text-purple-800 border-purple-200',
    textColor: 'text-purple-600',
    glow: 'shadow-purple-200',
    emoji: '🟣'
  },
  legendary: {
    label: '传说',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    textColor: 'text-yellow-600',
    glow: 'shadow-yellow-200',
    emoji: '🟡'
  }
};

// 难度配置
const difficultyConfig = {
  easy: {
    label: '简单',
    color: 'text-green-600',
    bgColor: 'bg-green-100 text-green-800',
    emoji: '🟢'
  },
  medium: {
    label: '中等',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 text-yellow-800',
    emoji: '🟡'
  },
  hard: {
    label: '困难',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 text-orange-800',
    emoji: '🟠'
  },
  extreme: {
    label: '极限',
    color: 'text-red-600',
    bgColor: 'bg-red-100 text-red-800',
    emoji: '🔴'
  }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'p-3 gap-2',
    icon: 'w-6 h-6',
    text: 'text-xs',
    title: 'text-sm font-medium',
    description: 'text-xs',
    badge: 'px-1.5 py-0.5 text-xs'
  },
  default: {
    container: 'p-4 gap-3',
    icon: 'w-8 h-8',
    text: 'text-sm',
    title: 'text-base font-medium',
    description: 'text-sm',
    badge: 'px-2 py-1 text-xs'
  },
  lg: {
    container: 'p-6 gap-4',
    icon: 'w-10 h-10',
    text: 'text-base',
    title: 'text-lg font-medium',
    description: 'text-base',
    badge: 'px-3 py-1.5 text-sm'
  }
};

// 格式化时间
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
};

// 格式化完成率
const formatCompletionRate = (completed: number, total: number): string => {
  if (total === 0) return '0%';
  const rate = (completed / total) * 100;
  return `${rate.toFixed(1)}%`;
};

// 计算进度百分比
const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

/**
 * AchievementCard 成就卡片组件
 */
export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  variant = 'default',
  size = 'default',
  showProgress = true,
  showRewards = true,
  showStats = false,
  showActions = true,
  showTooltip = true,
  clickable = false,
  animated = true,
  glowing = false,
  onClick,
  onClaim,
  onViewDetails,
  onShare,
  className
}) => {
  const typeConfig = achievementTypeConfig[achievement.type];
  const statusConfig = achievementStatusConfig[achievement.status];
  const rarityConfig_ = rarityConfig[achievement.rarity];
  const difficultyConfig_ = achievement.difficulty ? difficultyConfig[achievement.difficulty] : null;
  const sizeStyles = sizeConfig[size];
  const IconComponent = typeConfig.icon;

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(achievement);
    }
  };

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClaim) {
      onClaim(achievement);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(achievement);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(achievement);
    }
  };

  // 构建工具提示内容
  const tooltipContent = showTooltip ? (
    <div className="space-y-3 text-sm max-w-sm">
      <div className="space-y-1">
        <div className="font-medium flex items-center gap-2">
          <span>{achievement.title}</span>
          <Badge className={cn('text-xs', rarityConfig_.bgColor)}>
            {rarityConfig_.emoji} {rarityConfig_.label}
          </Badge>
        </div>
        <div className="text-muted-foreground">
          {achievement.description}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">类型:</span>
          <span>{typeConfig.emoji} {typeConfig.label}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">状态:</span>
          <span className={statusConfig.color}>
            {statusConfig.emoji} {statusConfig.label}
          </span>
        </div>
        
        {achievement.difficulty && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">难度:</span>
            <span className={difficultyConfig_!.color}>
              {difficultyConfig_!.emoji} {difficultyConfig_!.label}
            </span>
          </div>
        )}
        
        {achievement.points && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">积分:</span>
            <span className="font-medium">{achievement.points} 分</span>
          </div>
        )}
        
        {achievement.series && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">系列:</span>
            <span>{achievement.series}</span>
          </div>
        )}
        
        {achievement.level && achievement.maxLevel && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">等级:</span>
            <span>{achievement.level}/{achievement.maxLevel}</span>
          </div>
        )}
      </div>
      
      {achievement.progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">进度</span>
            <span>{achievement.progress.current}/{achievement.progress.target} {achievement.progress.unit}</span>
          </div>
          <Progress 
            value={calculateProgress(achievement.progress.current, achievement.progress.target)} 
            className="h-2"
          />
        </div>
      )}
      
      {achievement.rewards && achievement.rewards.length > 0 && (
        <div className="space-y-1">
          <div className="font-medium text-xs text-muted-foreground">奖励</div>
          <div className="space-y-1">
            {achievement.rewards.map((reward, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{reward.name}</span>
                <span className="font-medium">{reward.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {achievement.requirements && achievement.requirements.length > 0 && (
        <div className="space-y-1">
          <div className="font-medium text-xs text-muted-foreground">解锁条件</div>
          <ul className="space-y-0.5 text-xs">
            {achievement.requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {(achievement.completedAt || achievement.unlockedAt || achievement.claimedAt) && (
        <div className="space-y-1 border-t pt-2">
          {achievement.unlockedAt && (
            <div className="text-xs text-muted-foreground">
              解锁时间: {formatTime(achievement.unlockedAt)}
            </div>
          )}
          {achievement.completedAt && (
            <div className="text-xs text-muted-foreground">
              完成时间: {formatTime(achievement.completedAt)}
            </div>
          )}
          {achievement.claimedAt && (
            <div className="text-xs text-muted-foreground">
              领取时间: {formatTime(achievement.claimedAt)}
            </div>
          )}
        </div>
      )}
      
      {showStats && achievement.completedCount && achievement.totalUsers && (
        <div className="border-t pt-2">
          <div className="text-xs text-muted-foreground">
            完成率: {formatCompletionRate(achievement.completedCount, achievement.totalUsers)}
          </div>
          <div className="text-xs text-muted-foreground">
            {achievement.completedCount} / {achievement.totalUsers} 人完成
          </div>
        </div>
      )}
      
      {achievement.tags && achievement.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          {achievement.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  ) : null;

  // 紧凑模式
  if (variant === 'compact') {
    const display = (
      <div
        className={cn(
          'inline-flex items-center rounded-lg border transition-all duration-200',
          sizeStyles.container,
          clickable && 'cursor-pointer hover:shadow-sm',
          animated && 'hover:scale-105',
          glowing && `shadow-lg ${rarityConfig_.glow}`,
          achievement.status === 'locked' ? 'opacity-50 grayscale' : '',
          rarityConfig_.bgColor,
          className
        )}
        onClick={handleClick}
      >
        <div className={cn('p-2 rounded-full', typeConfig.bgColor.split(' ')[0])}>
          <IconComponent className={cn(sizeStyles.icon, typeConfig.bgColor.split(' ')[1])} />
        </div>
        
        <div className="flex flex-col">
          <span className={cn('font-medium', sizeStyles.title)}>
            {achievement.title}
          </span>
          
          <div className="flex items-center gap-1">
            <Badge className={cn('text-xs', statusConfig.bgColor)}>
              {statusConfig.emoji}
            </Badge>
            
            <Badge className={cn('text-xs', rarityConfig_.bgColor)}>
          {rarityConfig_.emoji}
        </Badge>
          </div>
        </div>
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {display}
      </Tooltip>
    ) : display;
  }

  // 最小模式
  if (variant === 'minimal') {
    const display = (
      <div
        className={cn(
          'inline-flex items-center gap-2 transition-all duration-200',
          clickable && 'cursor-pointer',
          animated && 'hover:scale-105',
          achievement.status === 'locked' ? 'opacity-50 grayscale' : '',
          className
        )}
        onClick={handleClick}
      >
        <div className={cn('p-1 rounded-full', typeConfig.bgColor.split(' ')[0])}>
          <IconComponent className={cn(sizeStyles.icon, typeConfig.bgColor.split(' ')[1])} />
        </div>
        
        <span className={cn('font-medium', sizeStyles.text)}>
          {achievement.title}
        </span>
        
        <Badge className={cn('text-xs', statusConfig.bgColor)}>
          {statusConfig.emoji}
        </Badge>
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {display}
      </Tooltip>
    ) : display;
  }

  // 展示模式
  if (variant === 'showcase') {
    const display = (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white transition-all duration-300',
          rarityConfig_.color,
          clickable && 'cursor-pointer hover:shadow-xl',
          animated && 'hover:scale-105',
          achievement.status === 'locked' ? 'opacity-50 grayscale' : '',
          className
        )}
        onClick={handleClick}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
        
        <div className="relative z-10">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <div className="font-bold text-lg text-white">
                  {achievement.title}
                </div>
                <div className="text-white/80 text-sm">
                  {typeConfig.label} • {rarityConfig_.label}
                </div>
              </div>
            </div>
            
            <Badge className="bg-white/20 text-white border-white/30">
              {statusConfig.emoji} {statusConfig.label}
            </Badge>
          </div>
          
          {/* 描述 */}
          <div className="text-white/90 mb-4">
            {achievement.description}
          </div>
          
          {/* 进度 */}
          {showProgress && achievement.progress && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>进度</span>
                <span>{achievement.progress.current}/{achievement.progress.target} {achievement.progress.unit}</span>
              </div>
              <Progress 
                value={calculateProgress(achievement.progress.current, achievement.progress.target)} 
                className="h-2 bg-white/20"
              />
            </div>
          )}
          
          {/* 奖励 */}
          {showRewards && achievement.rewards && achievement.rewards.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-white/80 mb-2">奖励</div>
              <div className="flex flex-wrap gap-2">
                {achievement.rewards.map((reward, index) => (
                  <Badge key={index} className="bg-white/20 text-white border-white/30">
                    {reward.name} +{reward.amount}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* 操作按钮 */}
          {showActions && (
            <div className="flex gap-2">
              {achievement.status === 'completed' && onClaim && (
                <Button
                  size="sm"
                  onClick={handleClaim}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  领取奖励
                </Button>
              )}
              
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewDetails}
                  className="border-white text-white hover:bg-white/10"
                >
                  查看详情
                </Button>
              )}
              
              {achievement.status === 'completed' && onShare && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                  className="border-white text-white hover:bg-white/10"
                >
                  分享
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {display}
      </Tooltip>
    ) : display;
  }

  // 横幅模式
  if (variant === 'banner') {
    const display = (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-gradient-to-r p-4 text-white transition-all duration-200',
          typeConfig.color,
          clickable && 'cursor-pointer hover:shadow-lg',
          animated && 'hover:scale-[1.02]',
          achievement.status === 'locked' ? 'opacity-50 grayscale' : '',
          className
        )}
        onClick={handleClick}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <IconComponent className={cn(sizeStyles.icon, 'text-white')} />
              </div>
              
              <div>
                <div className={cn('font-bold text-white', sizeStyles.title)}>
                  {achievement.title}
                </div>
                <div className={cn('text-white/80', sizeStyles.text)}>
                  {achievement.description}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                {statusConfig.emoji} {statusConfig.label}
              </Badge>
              
              <Badge className="bg-white/20 text-white border-white/30">
                {rarityConfig_.emoji}
              </Badge>
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2 mt-3">
              {achievement.status === 'completed' && onClaim && (
                <Button
                  size="sm"
                  onClick={handleClaim}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  领取
                </Button>
              )}
              
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewDetails}
                  className="border-white text-white hover:bg-white/10"
                >
                  详情
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* 装饰性背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10" />
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {display}
      </Tooltip>
    ) : display;
  }

  // 详细模式
  if (variant === 'detailed') {
    const display = (
      <div
        className={cn(
          'rounded-lg border bg-white shadow-sm transition-all duration-200',
          sizeStyles.container,
          clickable && 'cursor-pointer hover:shadow-md',
          animated && 'hover:scale-[1.02]',
          glowing && `shadow-lg ${rarityConfig_.glow}`,
          achievement.status === 'locked' ? 'opacity-50 grayscale' : '',
          className
        )}
        onClick={handleClick}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-full', typeConfig.bgColor.split(' ')[0])}>
              <IconComponent className={cn(sizeStyles.icon, typeConfig.bgColor.split(' ')[1])} />
            </div>
            
            <div>
              <div className={cn('font-medium', sizeStyles.title)}>
                {achievement.title}
              </div>
              <div className={cn('text-muted-foreground', sizeStyles.text)}>
                {typeConfig.label}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn('text-xs', rarityConfig_.bgColor)}>
              {rarityConfig_.emoji} {rarityConfig_.label}
            </Badge>
            
            <Badge variant="outline" className={cn('text-xs', statusConfig.bgColor)}>
              {statusConfig.emoji} {statusConfig.label}
            </Badge>
            
            {achievement.difficulty && (
              <Badge variant="outline" className={cn('text-xs', difficultyConfig_!.bgColor)}>
                {difficultyConfig_!.emoji} {difficultyConfig_!.label}
              </Badge>
            )}
          </div>
        </div>
        
        {/* 描述 */}
        <div className={cn('text-muted-foreground mb-3', sizeStyles.description)}>
          {achievement.description}
        </div>
        
        {/* 进度 */}
        {showProgress && achievement.progress && (
          <div className="mb-3">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>进度</span>
              <span>{achievement.progress.current}/{achievement.progress.target} {achievement.progress.unit}</span>
            </div>
            <Progress 
              value={calculateProgress(achievement.progress.current, achievement.progress.target)} 
              className="h-2"
            />
            {achievement.progress.description && (
              <div className="text-xs text-muted-foreground mt-1">
                {achievement.progress.description}
              </div>
            )}
          </div>
        )}
        
        {/* 奖励 */}
        {showRewards && achievement.rewards && achievement.rewards.length > 0 && (
          <div className="mb-3">
            <div className="text-sm font-medium text-muted-foreground mb-2">奖励</div>
            <div className="flex flex-wrap gap-2">
              {achievement.rewards.map((reward, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {reward.name} +{reward.amount}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* 统计信息 */}
        {showStats && (achievement.completedCount || achievement.points) && (
          <div className="mb-3 space-y-1">
            {achievement.points && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">积分奖励:</span>
                <span className="font-medium">{achievement.points} 分</span>
              </div>
            )}
            
            {achievement.completedCount && achievement.totalUsers && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">完成率:</span>
                <span>{formatCompletionRate(achievement.completedCount, achievement.totalUsers)}</span>
              </div>
            )}
            
            {achievement.series && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">系列:</span>
                <span>{achievement.series}</span>
              </div>
            )}
            
            {achievement.level && achievement.maxLevel && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">等级:</span>
                <span>{achievement.level}/{achievement.maxLevel}</span>
              </div>
            )}
          </div>
        )}
        
        {/* 时间信息 */}
        {(achievement.completedAt || achievement.unlockedAt) && (
          <div className="mb-3 space-y-1">
            {achievement.unlockedAt && (
              <div className="text-xs text-muted-foreground">
                解锁时间: {formatTime(achievement.unlockedAt)}
              </div>
            )}
            {achievement.completedAt && (
              <div className="text-xs text-muted-foreground">
                完成时间: {formatTime(achievement.completedAt)}
              </div>
            )}
          </div>
        )}
        
        {/* 标签 */}
        {achievement.tags && achievement.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {achievement.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* 操作按钮 */}
        {showActions && (
          <div className="flex gap-2">
            {achievement.status === 'completed' && onClaim && (
              <Button
                size="sm"
                onClick={handleClaim}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                领取奖励
              </Button>
            )}
            
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewDetails}
                className={achievement.status === 'completed' && onClaim ? '' : 'flex-1'}
              >
                查看详情
              </Button>
            )}
            
            {achievement.status === 'completed' && onShare && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
              >
                分享
              </Button>
            )}
          </div>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {display}
      </Tooltip>
    ) : display;
  }

  // 卡片模式（默认）
  const display = (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200',
        sizeStyles.container,
        clickable && 'cursor-pointer hover:shadow-md',
        animated && 'hover:scale-105',
        glowing && `shadow-lg ${rarityConfig_.glow}`,
        achievement.status === 'locked' ? 'opacity-50 grayscale' : '',
        className
      )}
      onClick={handleClick}
    >
      {/* 稀有度边框 */}
      {achievement.rarity !== 'common' && (
        <div className={cn(
          'absolute inset-0 border-2 rounded-lg',
          `border-${achievement.rarity === 'legendary' ? 'yellow' : achievement.rarity === 'epic' ? 'purple' : achievement.rarity === 'rare' ? 'blue' : 'green'}-200`
        )} />
      )}
      
      <div className="relative">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', typeConfig.bgColor.split(' ')[0])}>
              <IconComponent className={cn(sizeStyles.icon, typeConfig.bgColor.split(' ')[1])} />
            </div>
            
            <div>
              <div className={cn('font-medium', sizeStyles.title)}>
                {achievement.title}
              </div>
              <div className={cn('text-muted-foreground', sizeStyles.text)}>
                {typeConfig.label}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn('text-xs', rarityConfig_.bgColor)}>
          {rarityConfig_.emoji}
        </Badge>
            
            <Badge variant="outline" className={cn('text-xs', statusConfig.bgColor)}>
              {statusConfig.emoji}
            </Badge>
          </div>
        </div>
        
        {/* 描述 */}
        <div className={cn('text-muted-foreground mb-3', sizeStyles.description)}>
          {achievement.description}
        </div>
        
        {/* 进度 */}
        {showProgress && achievement.progress && (
          <div className="mb-3">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>进度</span>
              <span>{achievement.progress.current}/{achievement.progress.target}</span>
            </div>
            <Progress 
              value={calculateProgress(achievement.progress.current, achievement.progress.target)} 
              className="h-2"
            />
          </div>
        )}
        
        {/* 奖励 */}
        {showRewards && achievement.rewards && achievement.rewards.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {achievement.rewards.slice(0, 3).map((reward, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {reward.name} +{reward.amount}
                </Badge>
              ))}
              {achievement.rewards.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{achievement.rewards.length - 3} 更多
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* 操作按钮 */}
        {showActions && (
          <div className="flex gap-2">
            {achievement.status === 'completed' && onClaim && (
              <Button
                size="sm"
                onClick={handleClaim}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                领取
              </Button>
            )}
            
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewDetails}
                className={achievement.status === 'completed' && onClaim ? '' : 'flex-1'}
              >
                详情
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return showTooltip && tooltipContent ? (
    <Tooltip content={tooltipContent}>
      {display}
    </Tooltip>
  ) : display;
};

// 成就列表组件
export interface AchievementListProps {
  /** 成就列表 */
  achievements: Achievement[];
  /** 标题 */
  title?: string;
  /** 显示变体 */
  variant?: AchievementVariant;
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 过滤状态 */
  filterStatus?: AchievementStatus[];
  /** 过滤类型 */
  filterType?: AchievementType[];
  /** 过滤稀有度 */
  filterRarity?: AchievementRarity[];
  /** 排序方式 */
  sortBy?: 'name' | 'status' | 'rarity' | 'completedAt' | 'points';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 最大显示数量 */
  maxItems?: number;
  /** 是否显示更多按钮 */
  showMore?: boolean;
  /** 点击更多回调 */
  onShowMore?: () => void;
  /** 成就点击回调 */
  onAchievementClick?: (achievement: Achievement) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * AchievementList 成就列表组件
 */
export const AchievementList: React.FC<AchievementListProps> = ({
  achievements,
  title,
  variant = 'card',
  size = 'default',
  filterStatus,
  filterType,
  filterRarity,
  sortBy = 'status',
  sortOrder = 'desc',
  maxItems,
  showMore = false,
  onShowMore,
  onAchievementClick,
  className
}) => {
  // 过滤成就
  let filteredAchievements = achievements;
  
  if (filterStatus && filterStatus.length > 0) {
    filteredAchievements = filteredAchievements.filter(a => filterStatus.includes(a.status));
  }
  
  if (filterType && filterType.length > 0) {
    filteredAchievements = filteredAchievements.filter(a => filterType.includes(a.type));
  }
  
  if (filterRarity && filterRarity.length > 0) {
    filteredAchievements = filteredAchievements.filter(a => filterRarity.includes(a.rarity));
  }
  
  // 排序成就
  filteredAchievements.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'status': {
        const statusOrder = { completed: 4, claimed: 3, in_progress: 2, available: 1, locked: 0 };
        aValue = statusOrder[a.status];
        bValue = statusOrder[b.status];
        break;
      }
      case 'rarity': {
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, uncommon: 1, common: 0 };
        aValue = rarityOrder[a.rarity];
        bValue = rarityOrder[b.rarity];
        break;
      }
      case 'completedAt':
        aValue = a.completedAt?.getTime() || 0;
        bValue = b.completedAt?.getTime() || 0;
        break;
      case 'points':
        aValue = a.points || 0;
        bValue = b.points || 0;
        break;
      default:
        aValue = a.title;
        bValue = b.title;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  const displayAchievements = maxItems ? filteredAchievements.slice(0, maxItems) : filteredAchievements;
  const hasMore = maxItems && filteredAchievements.length > maxItems;

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="font-medium text-lg">{title}</div>
      )}
      
      <div className={cn(
        'space-y-3',
        variant === 'card' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        variant === 'compact' && 'flex flex-wrap gap-2',
        variant === 'minimal' && 'flex flex-wrap gap-2'
      )}>
        {displayAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            variant={variant}
            size={size}
            clickable={!!onAchievementClick}
            onClick={onAchievementClick}
          />
        ))}
      </div>
      
      {hasMore && showMore && onShowMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onShowMore}
            className="text-sm"
          >
            查看更多 ({filteredAchievements.length - maxItems!} 项)
          </Button>
        </div>
      )}
      
      {filteredAchievements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <div>暂无成就</div>
        </div>
      )}
    </div>
  );
};



export default AchievementCard;