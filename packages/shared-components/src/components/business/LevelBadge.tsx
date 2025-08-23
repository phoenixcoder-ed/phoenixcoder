import React from 'react';
import { Star, Crown, Award, Shield, Zap, Trophy, Target, Flame } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';

// 等级类型枚举
export type LevelType = 
  | 'user' 
  | 'skill' 
  | 'task' 
  | 'achievement' 
  | 'reputation' 
  | 'experience'
  | 'rank'
  | 'tier';

// 等级样式变体
export type LevelVariant = 
  | 'default' 
  | 'outline' 
  | 'filled' 
  | 'gradient' 
  | 'minimal' 
  | 'detailed' 
  | 'compact'
  | 'premium';

// 等级数据接口
export interface Level {
  /** 等级ID */
  id: string;
  /** 当前等级 */
  current: number;
  /** 最大等级 */
  max?: number;
  /** 等级名称 */
  name?: string;
  /** 等级标题 */
  title?: string;
  /** 等级描述 */
  description?: string;
  /** 当前经验值 */
  currentExp?: number;
  /** 下一级所需经验值 */
  nextLevelExp?: number;
  /** 总经验值 */
  totalExp?: number;
  /** 等级类型 */
  type?: LevelType;
  /** 等级图标 */
  icon?: string;
  /** 等级颜色 */
  color?: string;
  /** 是否为特殊等级 */
  special?: boolean;
  /** 是否为最高等级 */
  maxLevel?: boolean;
  /** 等级权益 */
  benefits?: string[];
  /** 解锁时间 */
  unlockedAt?: string;
  /** 等级进度百分比 */
  progress?: number;
}

// LevelBadge 组件属性接口
export interface LevelBadgeProps {
  /** 等级数据 */
  level: Level;
  /** 徽章变体 */
  variant?: LevelVariant;
  /** 徽章尺寸 */
  size?: 'sm' | 'default' | 'lg' | 'xl';
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 是否显示经验值 */
  showExp?: boolean;
  /** 是否显示等级名称 */
  showName?: boolean;
  /** 是否显示等级标题 */
  showTitle?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否动画效果 */
  animated?: boolean;
  /** 是否发光效果 */
  glowing?: boolean;
  /** 点击回调 */
  onClick?: (level: Level) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 等级类型配置
const levelTypeConfig = {
  user: {
    label: '用户等级',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  skill: {
    label: '技能等级',
    icon: Star,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  task: {
    label: '任务等级',
    icon: Target,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-100 text-green-800 border-green-200'
  },
  achievement: {
    label: '成就等级',
    icon: Award,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  reputation: {
    label: '声誉等级',
    icon: Shield,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  experience: {
    label: '经验等级',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  rank: {
    label: '排名等级',
    icon: Trophy,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-100 text-red-800 border-red-200'
  },
  tier: {
    label: '层级等级',
    icon: Flame,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-100 text-pink-800 border-pink-200'
  }
};

// 等级名称配置
const levelNameConfig: Record<number, { name: string; title: string; color: string }> = {
  1: { name: '新手', title: '初出茅庐', color: 'text-gray-600' },
  2: { name: '学徒', title: '勤学苦练', color: 'text-blue-600' },
  3: { name: '熟练', title: '小有所成', color: 'text-green-600' },
  4: { name: '专家', title: '技艺精湛', color: 'text-purple-600' },
  5: { name: '大师', title: '炉火纯青', color: 'text-orange-600' },
  6: { name: '宗师', title: '登峰造极', color: 'text-red-600' },
  7: { name: '传奇', title: '名震江湖', color: 'text-pink-600' },
  8: { name: '神话', title: '神乎其技', color: 'text-indigo-600' },
  9: { name: '至尊', title: '无人能及', color: 'text-yellow-600' },
  10: { name: '超凡', title: '超凡入圣', color: 'text-gradient' }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    badge: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    progress: 'h-1',
    container: 'gap-1'
  },
  default: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    progress: 'h-1.5',
    container: 'gap-1.5'
  },
  lg: {
    badge: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    progress: 'h-2',
    container: 'gap-2'
  },
  xl: {
    badge: 'px-6 py-3 text-lg',
    icon: 'w-6 h-6',
    progress: 'h-2.5',
    container: 'gap-3'
  }
};

// 格式化经验值
const formatExp = (exp: number): string => {
  if (exp >= 1000000) {
    return `${(exp / 1000000).toFixed(1)}M`;
  } else if (exp >= 1000) {
    return `${(exp / 1000).toFixed(1)}K`;
  } else {
    return exp.toString();
  }
};

// 计算进度百分比
const calculateProgress = (current: number, next: number): number => {
  if (next <= 0) return 100;
  return Math.min(100, (current / next) * 100);
};

// 格式化解锁时间
const formatUnlockedTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) {
    return `${diffYears}年前解锁`;
  } else if (diffMonths > 0) {
    return `${diffMonths}个月前解锁`;
  } else if (diffDays > 0) {
    return `${diffDays}天前解锁`;
  } else {
    return '今日解锁';
  }
};

/**
 * LevelBadge 等级徽章组件
 */
export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  variant = 'default',
  size = 'default',
  showProgress = false,
  showExp = false,
  showName = true,
  showTitle = false,
  showIcon = true,
  showTooltip = true,
  clickable = false,
  animated = true,
  glowing = false,
  onClick,
  className
}) => {
  const typeConfig = level.type ? levelTypeConfig[level.type] : levelTypeConfig.user;
  const nameConfig = levelNameConfig[level.current] || {
    name: `等级 ${level.current}`,
    title: '未知等级',
    color: 'text-gray-600'
  };
  const sizeStyles = sizeConfig[size];
  const IconComponent = typeConfig.icon;

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(level);
    }
  };

  // 计算进度
  const progress = level.progress || 
    (level.currentExp && level.nextLevelExp 
      ? calculateProgress(level.currentExp, level.nextLevelExp)
      : 0);

  // 构建工具提示内容
  const tooltipContent = showTooltip ? (
    <div className="space-y-3 text-sm max-w-xs">
      <div className="space-y-1">
        <div className="font-medium text-base">
          {level.name || nameConfig.name} - {level.title || nameConfig.title}
        </div>
        <div className="text-muted-foreground">
          {level.description || `当前等级: ${level.current}${level.max ? ` / ${level.max}` : ''}`}
        </div>
      </div>
      
      {(level.currentExp || level.nextLevelExp) && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>经验值</span>
            <span>
              {level.currentExp ? formatExp(level.currentExp) : 0}
              {level.nextLevelExp && ` / ${formatExp(level.nextLevelExp)}`}
            </span>
          </div>
          {showProgress && (
            <Progress value={progress} className="h-1.5" />
          )}
        </div>
      )}
      
      {level.benefits && level.benefits.length > 0 && (
        <div className="space-y-1">
          <div className="font-medium text-xs text-muted-foreground">等级权益</div>
          <ul className="space-y-0.5 text-xs">
            {level.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {level.unlockedAt && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          {formatUnlockedTime(level.unlockedAt)}
        </div>
      )}
    </div>
  ) : null;

  // 紧凑模式
  if (variant === 'compact') {
    const badge = (
      <Badge
        className={cn(
          'inline-flex items-center transition-all duration-200',
          sizeStyles.badge,
          sizeStyles.container,
          clickable && 'cursor-pointer hover:shadow-sm',
          animated && 'hover:scale-105',
          glowing && level.special && 'animate-pulse',
          level.special && 'bg-gradient-to-r text-white border-0',
          level.special && typeConfig.color,
          !level.special && typeConfig.bgColor,
          className
        )}
        onClick={handleClick}
      >
        {showIcon && (
          <IconComponent className={cn(sizeStyles.icon, level.special && 'text-white')} />
        )}
        <span className="font-medium">{level.current}</span>
      </Badge>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {badge}
      </Tooltip>
    ) : badge;
  }

  // 最小模式
  if (variant === 'minimal') {
    const badge = (
      <div
        className={cn(
          'inline-flex items-center transition-all duration-200',
          sizeStyles.container,
          clickable && 'cursor-pointer',
          animated && 'hover:scale-105',
          className
        )}
        onClick={handleClick}
      >
        {showIcon && (
          <IconComponent className={cn(sizeStyles.icon, nameConfig.color)} />
        )}
        <span className={cn('font-medium', nameConfig.color)}>
          {level.current}
        </span>
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {badge}
      </Tooltip>
    ) : badge;
  }

  // 渐变模式
  if (variant === 'gradient') {
    const badge = (
      <div
        className={cn(
          'inline-flex items-center rounded-lg border-0 bg-gradient-to-r text-white transition-all duration-200',
          sizeStyles.badge,
          sizeStyles.container,
          typeConfig.color,
          clickable && 'cursor-pointer hover:shadow-lg',
          animated && 'hover:scale-105',
          glowing && 'animate-pulse shadow-lg',
          className
        )}
        onClick={handleClick}
      >
        {showIcon && (
          <IconComponent className={cn(sizeStyles.icon, 'text-white')} />
        )}
        
        <div className="flex flex-col items-start">
          <span className="font-bold text-white">
            {showName ? (level.name || nameConfig.name) : `Lv.${level.current}`}
          </span>
          {showTitle && (level.title || nameConfig.title) && (
            <span className="text-xs text-white/80">
              {level.title || nameConfig.title}
            </span>
          )}
        </div>
        
        {level.maxLevel && (
          <Crown className={cn(sizeStyles.icon, 'text-yellow-300 ml-1')} />
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {badge}
      </Tooltip>
    ) : badge;
  }

  // 详细模式
  if (variant === 'detailed') {
    const badge = (
      <div
        className={cn(
          'inline-flex flex-col p-3 rounded-lg border bg-white shadow-sm transition-all duration-200',
          clickable && 'cursor-pointer hover:shadow-md',
          animated && 'hover:scale-105',
          glowing && level.special && 'ring-2 ring-offset-2',
          level.special && `ring-${typeConfig.color.split('-')[1]}-400`,
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 mb-2">
          {showIcon && (
            <div className={cn(
              'p-1.5 rounded-full',
              level.special ? `bg-gradient-to-r ${typeConfig.color}` : typeConfig.bgColor.split(' ')[0]
            )}>
              <IconComponent className={cn(
                sizeStyles.icon,
                level.special ? 'text-white' : typeConfig.bgColor.split(' ')[1]
              )} />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('font-bold', nameConfig.color)}>
                {showName ? (level.name || nameConfig.name) : `等级 ${level.current}`}
              </span>
              {level.maxLevel && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            {showTitle && (level.title || nameConfig.title) && (
              <div className="text-xs text-muted-foreground">
                {level.title || nameConfig.title}
              </div>
            )}
          </div>
          
          <Badge variant="outline" className="text-xs">
            Lv.{level.current}
          </Badge>
        </div>
        
        {showProgress && (level.currentExp || level.nextLevelExp) && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>经验值</span>
              <span>
                {level.currentExp ? formatExp(level.currentExp) : 0}
                {level.nextLevelExp && ` / ${formatExp(level.nextLevelExp)}`}
              </span>
            </div>
            <Progress value={progress} className={sizeStyles.progress} />
          </div>
        )}
        
        {showExp && level.totalExp && (
          <div className="text-xs text-muted-foreground mt-1">
            总经验: {formatExp(level.totalExp)}
          </div>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {badge}
      </Tooltip>
    ) : badge;
  }

  // 高级模式
  if (variant === 'premium') {
    const badge = (
      <div
        className={cn(
          'relative inline-flex items-center rounded-lg border-2 bg-gradient-to-br from-white to-gray-50 transition-all duration-300',
          sizeStyles.badge,
          sizeStyles.container,
          'border-gradient-to-r',
          typeConfig.color,
          clickable && 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5',
          animated && 'transform transition-transform',
          glowing && 'animate-pulse shadow-2xl',
          level.special && 'shadow-lg',
          className
        )}
        onClick={handleClick}
      >
        {/* 背景光效 */}
        {level.special && (
          <div className={cn(
            'absolute inset-0 rounded-lg bg-gradient-to-r opacity-10',
            typeConfig.color
          )} />
        )}
        
        {showIcon && (
          <div className={cn(
            'relative p-1 rounded-full',
            level.special ? `bg-gradient-to-r ${typeConfig.color}` : typeConfig.bgColor.split(' ')[0]
          )}>
            <IconComponent className={cn(
              sizeStyles.icon,
              level.special ? 'text-white' : typeConfig.bgColor.split(' ')[1]
            )} />
          </div>
        )}
        
        <div className="relative flex flex-col">
          <span className={cn('font-bold', nameConfig.color)}>
            {showName ? (level.name || nameConfig.name) : `Lv.${level.current}`}
          </span>
          {showTitle && (level.title || nameConfig.title) && (
            <span className="text-xs text-muted-foreground">
              {level.title || nameConfig.title}
            </span>
          )}
        </div>
        
        {level.maxLevel && (
          <Crown className={cn(sizeStyles.icon, 'text-yellow-500 ml-1')} />
        )}
        
        {level.special && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping" />
            <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
          </div>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {badge}
      </Tooltip>
    ) : badge;
  }

  // 默认模式
  const badge = (
    <Badge
      className={cn(
        'inline-flex items-center transition-all duration-200',
        sizeStyles.badge,
        sizeStyles.container,
        clickable && 'cursor-pointer hover:shadow-sm',
        animated && 'hover:scale-105',
        glowing && level.special && 'animate-pulse',
        level.special && 'bg-gradient-to-r text-white border-0',
        level.special && typeConfig.color,
        !level.special && typeConfig.bgColor,
        className
      )}
      variant={variant === 'filled' ? 'default' : (variant === 'default' ? 'default' : variant)}
      onClick={handleClick}
    >
      {showIcon && (
        <IconComponent className={cn(
          sizeStyles.icon,
          level.special ? 'text-white' : typeConfig.bgColor.split(' ')[1]
        )} />
      )}
      
      <span className="font-medium">
        {showName ? (level.name || nameConfig.name) : `Lv.${level.current}`}
      </span>
      
      {showTitle && (level.title || nameConfig.title) && (
        <span className="text-xs opacity-80">
          - {level.title || nameConfig.title}
        </span>
      )}
      
      {level.maxLevel && (
        <Crown className={cn(
          sizeStyles.icon,
          level.special ? 'text-yellow-300' : 'text-yellow-500',
          'ml-1'
        )} />
      )}
    </Badge>
  );

  return showTooltip && tooltipContent ? (
    <Tooltip content={tooltipContent}>
      {badge}
    </Tooltip>
  ) : badge;
};

// 等级进度组件
export interface LevelProgressProps {
  /** 等级数据 */
  level: Level;
  /** 是否显示详细信息 */
  detailed?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * LevelProgress 等级进度组件
 */
export const LevelProgress: React.FC<LevelProgressProps> = ({
  level,
  detailed = false,
  className
}) => {
  const progress = level.progress || 
    (level.currentExp && level.nextLevelExp 
      ? calculateProgress(level.currentExp, level.nextLevelExp)
      : 0);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <LevelBadge
          level={level}
          variant="compact"
          showTooltip={false}
        />
        
        {detailed && (level.currentExp || level.nextLevelExp) && (
          <div className="text-sm text-muted-foreground">
            {level.currentExp ? formatExp(level.currentExp) : 0}
            {level.nextLevelExp && ` / ${formatExp(level.nextLevelExp)}`}
          </div>
        )}
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {detailed && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>当前等级</span>
          <span>
            {level.maxLevel ? '已达最高等级' : `距离下一级还需 ${level.nextLevelExp && level.currentExp ? formatExp(level.nextLevelExp - level.currentExp) : '未知'} 经验`}
          </span>
        </div>
      )}
    </div>
  );
};

// 类型已在文件开头导出

export default LevelBadge;