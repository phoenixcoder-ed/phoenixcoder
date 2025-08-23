import React from 'react';
import { Coins, DollarSign, Gift, Star, Trophy, Zap, TrendingUp, Award, Crown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';
import { Button } from '../ui/Button';

// 奖励类型枚举
export type RewardType = 
  | 'money' 
  | 'points' 
  | 'experience' 
  | 'badge' 
  | 'achievement' 
  | 'level' 
  | 'skill' 
  | 'item'
  | 'bonus'
  | 'premium';

// 奖励状态枚举
export type RewardStatus = 
  | 'available' 
  | 'earned' 
  | 'claimed' 
  | 'expired' 
  | 'locked' 
  | 'pending';

// 奖励样式变体
export type RewardVariant = 
  | 'default' 
  | 'outline' 
  | 'filled' 
  | 'gradient' 
  | 'minimal' 
  | 'detailed' 
  | 'compact'
  | 'card'
  | 'list'
  | 'banner';

// 奖励数据接口
export interface Reward {
  /** 奖励ID */
  id?: string;
  /** 奖励名称 */
  name: string;
  /** 奖励描述 */
  description?: string;
  /** 奖励类型 */
  type: RewardType;
  /** 奖励状态 */
  status?: RewardStatus;
  /** 奖励数值 */
  amount: number;
  /** 奖励单位 */
  unit?: string;
  /** 奖励图标 */
  icon?: string;
  /** 奖励图片 */
  image?: string;
  /** 奖励颜色 */
  color?: string;
  /** 奖励等级 */
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  /** 获得时间 */
  earnedAt?: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** 领取时间 */
  claimedAt?: Date;
  /** 是否可堆叠 */
  stackable?: boolean;
  /** 堆叠数量 */
  stackCount?: number;
  /** 最大堆叠数量 */
  maxStack?: number;
  /** 奖励条件 */
  requirements?: string[];
  /** 奖励来源 */
  source?: string;
  /** 奖励分类 */
  category?: string;
  /** 是否为特殊奖励 */
  special?: boolean;
  /** 是否为限时奖励 */
  limited?: boolean;
  /** 奖励价值评分 */
  valueScore?: number;
  /** 获得概率 */
  probability?: number;
}

// RewardDisplay 组件属性接口
export interface RewardDisplayProps {
  /** 奖励数据 */
  reward: Reward;
  /** 显示变体 */
  variant?: RewardVariant;
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否显示描述 */
  showDescription?: boolean;
  /** 是否显示状态 */
  showStatus?: boolean;
  /** 是否显示数量 */
  showAmount?: boolean;
  /** 是否显示稀有度 */
  showRarity?: boolean;
  /** 是否显示时间信息 */
  showTime?: boolean;
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
  onClick?: (reward: Reward) => void;
  /** 领取回调 */
  onClaim?: (reward: Reward) => void;
  /** 查看详情回调 */
  onViewDetails?: (reward: Reward) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 奖励类型配置
const rewardTypeConfig = {
  money: {
    label: '金钱',
    icon: DollarSign,
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-100 text-green-800 border-green-200',
    textColor: 'text-green-600',
    unit: '元',
    emoji: '💰'
  },
  points: {
    label: '积分',
    icon: Star,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-100 text-blue-800 border-blue-200',
    textColor: 'text-blue-600',
    unit: '分',
    emoji: '⭐'
  },
  experience: {
    label: '经验',
    icon: TrendingUp,
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-100 text-purple-800 border-purple-200',
    textColor: 'text-purple-600',
    unit: 'EXP',
    emoji: '📈'
  },
  badge: {
    label: '徽章',
    icon: Award,
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    textColor: 'text-yellow-600',
    unit: '个',
    emoji: '🏆'
  },
  achievement: {
    label: '成就',
    icon: Trophy,
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-100 text-orange-800 border-orange-200',
    textColor: 'text-orange-600',
    unit: '项',
    emoji: '🏅'
  },
  level: {
    label: '等级',
    icon: Crown,
    color: 'from-indigo-400 to-indigo-600',
    bgColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    textColor: 'text-indigo-600',
    unit: '级',
    emoji: '👑'
  },
  skill: {
    label: '技能',
    icon: Zap,
    color: 'from-cyan-400 to-cyan-600',
    bgColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    textColor: 'text-cyan-600',
    unit: '点',
    emoji: '⚡'
  },
  item: {
    label: '道具',
    icon: Gift,
    color: 'from-pink-400 to-pink-600',
    bgColor: 'bg-pink-100 text-pink-800 border-pink-200',
    textColor: 'text-pink-600',
    unit: '个',
    emoji: '🎁'
  },
  bonus: {
    label: '奖金',
    icon: Coins,
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-100 text-amber-800 border-amber-200',
    textColor: 'text-amber-600',
    unit: '元',
    emoji: '🪙'
  },
  premium: {
    label: '高级',
    icon: Crown,
    color: 'from-violet-400 to-violet-600',
    bgColor: 'bg-violet-100 text-violet-800 border-violet-200',
    textColor: 'text-violet-600',
    unit: '天',
    emoji: '💎'
  }
};

// 奖励状态配置
const rewardStatusConfig = {
  available: {
    label: '可获得',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 text-blue-800',
    emoji: '🎯'
  },
  earned: {
    label: '已获得',
    color: 'text-green-600',
    bgColor: 'bg-green-100 text-green-800',
    emoji: '✅'
  },
  claimed: {
    label: '已领取',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 text-gray-800',
    emoji: '📦'
  },
  expired: {
    label: '已过期',
    color: 'text-red-600',
    bgColor: 'bg-red-100 text-red-800',
    emoji: '⏰'
  },
  locked: {
    label: '未解锁',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 text-gray-600',
    emoji: '🔒'
  },
  pending: {
    label: '待审核',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 text-yellow-800',
    emoji: '⏳'
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

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'p-2 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-xs',
    title: 'text-sm font-medium',
    amount: 'text-lg font-bold',
    badge: 'px-1.5 py-0.5 text-xs'
  },
  default: {
    container: 'p-3 gap-2',
    icon: 'w-5 h-5',
    text: 'text-sm',
    title: 'text-base font-medium',
    amount: 'text-xl font-bold',
    badge: 'px-2 py-1 text-xs'
  },
  lg: {
    container: 'p-4 gap-3',
    icon: 'w-6 h-6',
    text: 'text-base',
    title: 'text-lg font-medium',
    amount: 'text-2xl font-bold',
    badge: 'px-3 py-1.5 text-sm'
  }
};

// 格式化数量
const formatAmount = (amount: number, unit?: string): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M${unit ? ` ${unit}` : ''}`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K${unit ? ` ${unit}` : ''}`;
  } else {
    return `${amount}${unit ? ` ${unit}` : ''}`;
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

// 格式化剩余时间
const formatTimeRemaining = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) {
    return '已过期';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) {
    return `${days}天后过期`;
  } else if (hours > 0) {
    return `${hours}小时后过期`;
  } else if (minutes > 0) {
    return `${minutes}分钟后过期`;
  } else {
    return '即将过期';
  }
};

/**
 * RewardDisplay 奖励展示组件
 */
export const RewardDisplay: React.FC<RewardDisplayProps> = ({
  reward,
  variant = 'default',
  size = 'default',
  showIcon = true,
  showDescription = true,
  showStatus = true,
  showAmount = true,
  showRarity = true,
  showTime = false,
  showActions = false,
  showTooltip = true,
  clickable = false,
  animated = true,
  glowing = false,
  onClick,
  onClaim,
  onViewDetails,
  className
}) => {
  const typeConfig = rewardTypeConfig[reward.type];
  const statusConfig = reward.status ? rewardStatusConfig[reward.status] : rewardStatusConfig.available;
  const rarityConfig_ = reward.rarity ? rarityConfig[reward.rarity] : rarityConfig.common;
  const sizeStyles = sizeConfig[size];
  const IconComponent = typeConfig.icon;

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(reward);
    }
  };

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClaim) {
      onClaim(reward);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(reward);
    }
  };

  // 构建工具提示内容
  const tooltipContent = showTooltip ? (
    <div className="space-y-3 text-sm max-w-xs">
      <div className="space-y-1">
        <div className="font-medium flex items-center gap-2">
          <span>{reward.name}</span>
          {reward.rarity && (
            <Badge className={cn('text-xs', rarityConfig_.bgColor)}>
              {rarityConfig_.emoji} {rarityConfig_.label}
            </Badge>
          )}
        </div>
        {reward.description && (
          <div className="text-muted-foreground">
            {reward.description}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">类型:</span>
          <span>{typeConfig.emoji} {typeConfig.label}</span>
        </div>
        
        {reward.status && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">状态:</span>
            <span className={statusConfig.color}>
              {statusConfig.emoji} {statusConfig.label}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">数量:</span>
          <span className="font-medium">
            {formatAmount(reward.amount, reward.unit || typeConfig.unit)}
          </span>
        </div>
        
        {reward.stackable && reward.stackCount && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">堆叠:</span>
            <span>{reward.stackCount}{reward.maxStack ? `/${reward.maxStack}` : ''}</span>
          </div>
        )}
        
        {reward.source && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">来源:</span>
            <span>{reward.source}</span>
          </div>
        )}
        
        {reward.category && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">分类:</span>
            <span>{reward.category}</span>
          </div>
        )}
        
        {reward.valueScore && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">价值评分:</span>
            <span>{reward.valueScore}/100</span>
          </div>
        )}
        
        {reward.probability && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">获得概率:</span>
            <span>{(reward.probability * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      {(reward.earnedAt || reward.claimedAt || reward.expiresAt) && (
        <div className="space-y-1 border-t pt-2">
          {reward.earnedAt && (
            <div className="text-xs text-muted-foreground">
              获得时间: {formatTime(reward.earnedAt)}
            </div>
          )}
          {reward.claimedAt && (
            <div className="text-xs text-muted-foreground">
              领取时间: {formatTime(reward.claimedAt)}
            </div>
          )}
          {reward.expiresAt && (
            <div className="text-xs text-muted-foreground">
              {formatTimeRemaining(reward.expiresAt)}
            </div>
          )}
        </div>
      )}
      
      {reward.requirements && reward.requirements.length > 0 && (
        <div className="space-y-1">
          <div className="font-medium text-xs text-muted-foreground">获得条件</div>
          <ul className="space-y-0.5 text-xs">
            {reward.requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {(reward.special || reward.limited) && (
        <div className="flex gap-1 pt-2 border-t">
          {reward.special && (
            <Badge variant="outline" className="text-xs">
              ⭐ 特殊奖励
            </Badge>
          )}
          {reward.limited && (
            <Badge variant="outline" className="text-xs">
              ⏰ 限时奖励
            </Badge>
          )}
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
          glowing && reward.rarity && `shadow-lg ${rarityConfig_.glow}`,
          typeConfig.bgColor,
          className
        )}
        onClick={handleClick}
      >
        {showIcon && (
          <IconComponent className={cn(sizeStyles.icon, typeConfig.textColor)} />
        )}
        
        {showAmount && (
          <span className={cn('font-bold', sizeStyles.text)}>
            {formatAmount(reward.amount, reward.unit || typeConfig.unit)}
          </span>
        )}
        
        {reward.stackable && reward.stackCount && reward.stackCount > 1 && (
          <Badge variant="outline" className="text-xs ml-1">
            x{reward.stackCount}
          </Badge>
        )}
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
          'inline-flex items-center gap-1 transition-all duration-200',
          clickable && 'cursor-pointer',
          animated && 'hover:scale-105',
          className
        )}
        onClick={handleClick}
      >
        {showIcon && (
          <IconComponent className={cn(sizeStyles.icon, typeConfig.textColor)} />
        )}
        
        {showAmount && (
          <span className={cn('font-medium', sizeStyles.text, typeConfig.textColor)}>
            {formatAmount(reward.amount, reward.unit || typeConfig.unit)}
          </span>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {display}
      </Tooltip>
    ) : display;
  }

  // 列表模式
  if (variant === 'list') {
    const display = (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border bg-white transition-all duration-200',
          clickable && 'cursor-pointer hover:shadow-sm',
          animated && 'hover:scale-[1.02]',
          glowing && reward.rarity && `shadow-lg ${rarityConfig_.glow}`,
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className={cn('p-2 rounded-full', typeConfig.bgColor.split(' ')[0])}>
              <IconComponent className={cn(sizeStyles.icon, typeConfig.bgColor.split(' ')[1])} />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', sizeStyles.title)}>
                {reward.name}
              </span>
              
              {showRarity && reward.rarity && (
                <Badge className={cn('text-xs', rarityConfig_.bgColor)}>
          {rarityConfig_.emoji}
        </Badge>
              )}
              
              {showStatus && reward.status && (
                <Badge variant="outline" className={cn('text-xs', statusConfig.bgColor)}>
                  {statusConfig.emoji}
                </Badge>
              )}
            </div>
            
            {showDescription && reward.description && (
              <div className={cn('text-muted-foreground mt-1', sizeStyles.text)}>
                {reward.description}
              </div>
            )}
            
            {showTime && (reward.earnedAt || reward.expiresAt) && (
              <div className={cn('text-muted-foreground mt-1', sizeStyles.text)}>
                {reward.earnedAt && `获得于 ${formatTime(reward.earnedAt)}`}
                {reward.expiresAt && ` • ${formatTimeRemaining(reward.expiresAt)}`}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {showAmount && (
            <div className="text-right">
              <div className={cn('font-bold', sizeStyles.amount, typeConfig.textColor)}>
                {formatAmount(reward.amount, reward.unit || typeConfig.unit)}
              </div>
              {reward.stackable && reward.stackCount && reward.stackCount > 1 && (
                <div className={cn('text-muted-foreground', sizeStyles.text)}>
                  x{reward.stackCount}
                </div>
              )}
            </div>
          )}
          
          {showActions && (
            <div className="flex gap-2">
              {reward.status === 'earned' && onClaim && (
                <Button
                  size="sm"
                  onClick={handleClaim}
                  className="bg-green-600 hover:bg-green-700"
                >
                  领取
                </Button>
              )}
              
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewDetails}
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
  }

  // 卡片模式
  if (variant === 'card') {
    const display = (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200',
          sizeStyles.container,
          clickable && 'cursor-pointer hover:shadow-md',
          animated && 'hover:scale-105',
          glowing && reward.rarity && `shadow-lg ${rarityConfig_.glow}`,
          className
        )}
        onClick={handleClick}
      >
        {/* 背景渐变 */}
        {reward.rarity && (
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-5',
            rarityConfig_.color
          )} />
        )}
        
        {/* 稀有度边框 */}
        {reward.rarity && reward.rarity !== 'common' && (
          <div className={cn(
            'absolute inset-0 border-2 rounded-lg',
            `border-${reward.rarity === 'legendary' ? 'yellow' : reward.rarity === 'epic' ? 'purple' : reward.rarity === 'rare' ? 'blue' : 'green'}-200`
          )} />
        )}
        
        <div className="relative">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {showIcon && (
                <div className={cn('p-2 rounded-full', typeConfig.bgColor.split(' ')[0])}>
                  <IconComponent className={cn(sizeStyles.icon, typeConfig.bgColor.split(' ')[1])} />
                </div>
              )}
              
              <div>
                <div className={cn('font-medium', sizeStyles.title)}>
                  {reward.name}
                </div>
                <div className={cn('text-muted-foreground', sizeStyles.text)}>
                  {typeConfig.label}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              {showRarity && reward.rarity && (
                <Badge className={cn('text-xs', rarityConfig_.bgColor)}>
              {rarityConfig_.emoji} {rarityConfig_.label}
            </Badge>
              )}
              
              {showStatus && reward.status && (
                <Badge variant="outline" className={cn('text-xs', statusConfig.bgColor)}>
                  {statusConfig.emoji} {statusConfig.label}
                </Badge>
              )}
            </div>
          </div>
          
          {/* 数量显示 */}
          {showAmount && (
            <div className="text-center mb-3">
              <div className={cn('font-bold', sizeStyles.amount, typeConfig.textColor)}>
                {formatAmount(reward.amount, reward.unit || typeConfig.unit)}
              </div>
              {reward.stackable && reward.stackCount && reward.stackCount > 1 && (
                <div className={cn('text-muted-foreground', sizeStyles.text)}>
                  堆叠数量: {reward.stackCount}{reward.maxStack ? `/${reward.maxStack}` : ''}
                </div>
              )}
            </div>
          )}
          
          {/* 描述 */}
          {showDescription && reward.description && (
            <div className={cn('text-muted-foreground mb-3', sizeStyles.text)}>
              {reward.description}
            </div>
          )}
          
          {/* 时间信息 */}
          {showTime && (reward.earnedAt || reward.expiresAt) && (
            <div className={cn('text-muted-foreground mb-3 space-y-1', sizeStyles.text)}>
              {reward.earnedAt && (
                <div>获得时间: {formatTime(reward.earnedAt)}</div>
              )}
              {reward.expiresAt && (
                <div className={reward.expiresAt.getTime() < Date.now() ? 'text-red-600' : ''}>
                  {formatTimeRemaining(reward.expiresAt)}
                </div>
              )}
            </div>
          )}
          
          {/* 特殊标记 */}
          {(reward.special || reward.limited) && (
            <div className="flex gap-1 mb-3">
              {reward.special && (
                <Badge variant="outline" className="text-xs">
                  ⭐ 特殊
                </Badge>
              )}
              {reward.limited && (
                <Badge variant="outline" className="text-xs">
                  ⏰ 限时
                </Badge>
              )}
            </div>
          )}
          
          {/* 操作按钮 */}
          {showActions && (
            <div className="flex gap-2">
              {reward.status === 'earned' && onClaim && (
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
                  className={reward.status === 'earned' && onClaim ? '' : 'flex-1'}
                >
                  查看详情
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
          'relative overflow-hidden rounded-lg bg-gradient-to-r text-white p-4 transition-all duration-200',
          typeConfig.color,
          clickable && 'cursor-pointer hover:shadow-lg',
          animated && 'hover:scale-[1.02]',
          className
        )}
        onClick={handleClick}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showIcon && (
                <div className="p-3 bg-white/20 rounded-full">
                  <IconComponent className={cn(sizeStyles.icon, 'text-white')} />
                </div>
              )}
              
              <div>
                <div className={cn('font-bold text-white', sizeStyles.title)}>
                  {reward.name}
                </div>
                {showDescription && reward.description && (
                  <div className={cn('text-white/80', sizeStyles.text)}>
                    {reward.description}
                  </div>
                )}
              </div>
            </div>
            
            {showAmount && (
              <div className="text-right">
                <div className={cn('font-bold text-white', sizeStyles.amount)}>
                  {formatAmount(reward.amount, reward.unit || typeConfig.unit)}
                </div>
                <div className={cn('text-white/80', sizeStyles.text)}>
                  {typeConfig.label}
                </div>
              </div>
            )}
          </div>
          
          {showActions && (
            <div className="flex gap-2 mt-3">
              {reward.status === 'earned' && onClaim && (
                <Button
                  size="sm"
                  onClick={handleClaim}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  立即领取
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

  // 默认模式
  const display = (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border transition-all duration-200',
        sizeStyles.container,
        clickable && 'cursor-pointer hover:shadow-sm',
        animated && 'hover:scale-105',
        glowing && reward.rarity && `shadow-lg ${rarityConfig_.glow}`,
        typeConfig.bgColor,
        className
      )}
      onClick={handleClick}
    >
      {showIcon && (
        <IconComponent className={cn(sizeStyles.icon, typeConfig.textColor)} />
      )}
      
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', sizeStyles.title)}>
            {reward.name}
          </span>
          
          {showRarity && reward.rarity && (
            <Badge className={cn('text-xs', rarityConfig_.bgColor)}>
          {rarityConfig_.emoji}
        </Badge>
          )}
        </div>
        
        {showAmount && (
          <div className={cn('font-bold', sizeStyles.text, typeConfig.textColor)}>
            {formatAmount(reward.amount, reward.unit || typeConfig.unit)}
          </div>
        )}
        
        {showDescription && reward.description && (
          <div className={cn('text-muted-foreground', sizeStyles.text)}>
            {reward.description}
          </div>
        )}
      </div>
      
      {showStatus && reward.status && (
        <Badge variant="outline" className={cn('text-xs ml-2', statusConfig.bgColor)}>
          {statusConfig.emoji}
        </Badge>
      )}
    </div>
  );

  return showTooltip && tooltipContent ? (
    <Tooltip content={tooltipContent}>
      {display}
    </Tooltip>
  ) : display;
};

// 奖励列表组件
export interface RewardListProps {
  /** 奖励列表 */
  rewards: Reward[];
  /** 标题 */
  title?: string;
  /** 显示变体 */
  variant?: RewardVariant;
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 最大显示数量 */
  maxItems?: number;
  /** 是否显示更多按钮 */
  showMore?: boolean;
  /** 点击更多回调 */
  onShowMore?: () => void;
  /** 奖励点击回调 */
  onRewardClick?: (reward: Reward) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * RewardList 奖励列表组件
 */
export const RewardList: React.FC<RewardListProps> = ({
  rewards,
  title,
  variant = 'list',
  size = 'default',
  maxItems,
  showMore = false,
  onShowMore,
  onRewardClick,
  className
}) => {
  const displayRewards = maxItems ? rewards.slice(0, maxItems) : rewards;
  const hasMore = maxItems && rewards.length > maxItems;

  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <div className="font-medium text-lg">{title}</div>
      )}
      
      <div className={cn(
        'space-y-2',
        variant === 'card' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        variant === 'compact' && 'flex flex-wrap gap-2'
      )}>
        {displayRewards.map((reward, index) => (
          <RewardDisplay
            key={reward.id || index}
            reward={reward}
            variant={variant}
            size={size}
            clickable={!!onRewardClick}
            onClick={onRewardClick}
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
            查看更多 ({rewards.length - maxItems!} 项)
          </Button>
        </div>
      )}
      
      {rewards.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <div>暂无奖励</div>
        </div>
      )}
    </div>
  );
};

// 类型已在文件开头导出

export default RewardDisplay;