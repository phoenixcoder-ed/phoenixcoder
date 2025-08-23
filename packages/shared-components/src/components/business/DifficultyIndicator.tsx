import React from 'react';
import { AlertTriangle, Zap, Flame, Star, Target, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';

// 难度等级枚举
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// 难度类型枚举
export type DifficultyType = 
  | 'task' 
  | 'skill' 
  | 'project' 
  | 'challenge' 
  | 'learning' 
  | 'technical'
  | 'complexity'
  | 'effort';

// 难度样式变体
export type DifficultyVariant = 
  | 'default' 
  | 'outline' 
  | 'filled' 
  | 'gradient' 
  | 'minimal' 
  | 'detailed' 
  | 'compact'
  | 'bars'
  | 'stars'
  | 'dots';

// 难度数据接口
export interface Difficulty {
  /** 难度ID */
  id?: string;
  /** 难度等级 (1-5) */
  level: DifficultyLevel;
  /** 难度名称 */
  name?: string;
  /** 难度描述 */
  description?: string;
  /** 难度类型 */
  type?: DifficultyType;
  /** 预估时间（小时） */
  estimatedHours?: number;
  /** 所需技能等级 */
  requiredSkillLevel?: number;
  /** 复杂度评分 (0-100) */
  complexityScore?: number;
  /** 学习曲线陡峭程度 */
  learningCurve?: 'gentle' | 'moderate' | 'steep' | 'extreme';
  /** 技术要求 */
  technicalRequirements?: string[];
  /** 风险等级 */
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  /** 是否推荐新手 */
  beginnerFriendly?: boolean;
  /** 完成率统计 */
  completionRate?: number;
  /** 平均完成时间 */
  averageCompletionTime?: number;
}

// DifficultyIndicator 组件属性接口
export interface DifficultyIndicatorProps {
  /** 难度数据 */
  difficulty: Difficulty;
  /** 指示器变体 */
  variant?: DifficultyVariant;
  /** 指示器尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 是否显示描述 */
  showDescription?: boolean;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否动画效果 */
  animated?: boolean;
  /** 点击回调 */
  onClick?: (difficulty: Difficulty) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 难度等级配置
const difficultyLevelConfig = {
  1: {
    name: '简单',
    description: '适合新手，基础技能即可完成',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-100 text-green-800 border-green-200',
    textColor: 'text-green-600',
    icon: Target,
    bars: 1,
    percentage: 20
  },
  2: {
    name: '容易',
    description: '需要一定基础，但难度不大',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-100 text-blue-800 border-blue-200',
    textColor: 'text-blue-600',
    icon: Activity,
    bars: 2,
    percentage: 40
  },
  3: {
    name: '中等',
    description: '需要扎实的基础知识和技能',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    textColor: 'text-yellow-600',
    icon: BarChart3,
    bars: 3,
    percentage: 60
  },
  4: {
    name: '困难',
    description: '需要丰富经验和高级技能',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-100 text-orange-800 border-orange-200',
    textColor: 'text-orange-600',
    icon: AlertTriangle,
    bars: 4,
    percentage: 80
  },
  5: {
    name: '极难',
    description: '需要专家级技能和丰富经验',
    color: 'from-red-500 to-red-700',
    bgColor: 'bg-red-100 text-red-800 border-red-200',
    textColor: 'text-red-600',
    icon: Flame,
    bars: 5,
    percentage: 100
  }
};

// 难度类型配置
const difficultyTypeConfig = {
  task: {
    label: '任务难度',
    icon: Target,
    description: '完成此任务的难度等级'
  },
  skill: {
    label: '技能难度',
    icon: Star,
    description: '掌握此技能的难度等级'
  },
  project: {
    label: '项目难度',
    icon: BarChart3,
    description: '项目整体复杂度和难度'
  },
  challenge: {
    label: '挑战难度',
    icon: Zap,
    description: '挑战的困难程度'
  },
  learning: {
    label: '学习难度',
    icon: TrendingUp,
    description: '学习曲线的陡峭程度'
  },
  technical: {
    label: '技术难度',
    icon: Activity,
    description: '技术实现的复杂度'
  },
  complexity: {
    label: '复杂度',
    icon: BarChart3,
    description: '整体复杂程度评估'
  },
  effort: {
    label: '工作量',
    icon: AlertTriangle,
    description: '所需投入的精力和时间'
  }
};

// 学习曲线配置
const learningCurveConfig = {
  gentle: {
    label: '平缓',
    description: '学习曲线平缓，容易上手',
    color: 'text-green-600',
    icon: '📈'
  },
  moderate: {
    label: '适中',
    description: '学习曲线适中，需要一定时间',
    color: 'text-blue-600',
    icon: '📊'
  },
  steep: {
    label: '陡峭',
    description: '学习曲线陡峭，需要大量练习',
    color: 'text-orange-600',
    icon: '📉'
  },
  extreme: {
    label: '极陡',
    description: '学习曲线极陡，需要专业指导',
    color: 'text-red-600',
    icon: '⚡'
  }
};

// 风险等级配置
const riskLevelConfig = {
  low: {
    label: '低风险',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '🟢'
  },
  medium: {
    label: '中等风险',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '🟡'
  },
  high: {
    label: '高风险',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '🟠'
  },
  critical: {
    label: '极高风险',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '🔴'
  }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    badge: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    bar: 'w-1 h-3',
    dot: 'w-1.5 h-1.5',
    star: 'w-3 h-3',
    container: 'gap-1'
  },
  default: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    bar: 'w-1.5 h-4',
    dot: 'w-2 h-2',
    star: 'w-4 h-4',
    container: 'gap-1.5'
  },
  lg: {
    badge: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    bar: 'w-2 h-5',
    dot: 'w-2.5 h-2.5',
    star: 'w-5 h-5',
    container: 'gap-2'
  }
};

// 格式化时间
const formatHours = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}分钟`;
  } else if (hours < 24) {
    return `${hours}小时`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
  }
};

// 格式化完成率
const formatCompletionRate = (rate: number): string => {
  return `${Math.round(rate)}%`;
};

/**
 * DifficultyIndicator 难度指示器组件
 */
export const DifficultyIndicator: React.FC<DifficultyIndicatorProps> = ({
  difficulty,
  variant = 'default',
  size = 'default',
  showLabel = true,
  showDescription = false,
  showDetails = false,
  showTooltip = true,
  clickable = false,
  animated = true,
  onClick,
  className
}) => {
  const levelConfig = difficultyLevelConfig[difficulty.level];
  const typeConfig = difficulty.type ? difficultyTypeConfig[difficulty.type] : difficultyTypeConfig.task;
  const sizeStyles = sizeConfig[size];
  const IconComponent = levelConfig.icon;

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(difficulty);
    }
  };

  // 构建工具提示内容
  const tooltipContent = showTooltip ? (
    <div className="space-y-3 text-sm max-w-xs">
      <div className="space-y-1">
        <div className="font-medium">
          {difficulty.name || levelConfig.name} - {typeConfig.label}
        </div>
        <div className="text-muted-foreground">
          {difficulty.description || levelConfig.description}
        </div>
      </div>
      
      <div className="space-y-2">
        {difficulty.estimatedHours && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">预估时间:</span>
            <span>{formatHours(difficulty.estimatedHours)}</span>
          </div>
        )}
        
        {difficulty.requiredSkillLevel && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">所需技能等级:</span>
            <span>Lv.{difficulty.requiredSkillLevel}</span>
          </div>
        )}
        
        {difficulty.complexityScore && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">复杂度评分:</span>
            <span>{difficulty.complexityScore}/100</span>
          </div>
        )}
        
        {difficulty.learningCurve && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">学习曲线:</span>
            <span className={learningCurveConfig[difficulty.learningCurve].color}>
              {learningCurveConfig[difficulty.learningCurve].icon} {learningCurveConfig[difficulty.learningCurve].label}
            </span>
          </div>
        )}
        
        {difficulty.riskLevel && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">风险等级:</span>
            <span className={riskLevelConfig[difficulty.riskLevel].color}>
              {riskLevelConfig[difficulty.riskLevel].icon} {riskLevelConfig[difficulty.riskLevel].label}
            </span>
          </div>
        )}
        
        {difficulty.completionRate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">完成率:</span>
            <span>{formatCompletionRate(difficulty.completionRate)}</span>
          </div>
        )}
        
        {difficulty.averageCompletionTime && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">平均完成时间:</span>
            <span>{formatHours(difficulty.averageCompletionTime)}</span>
          </div>
        )}
      </div>
      
      {difficulty.technicalRequirements && difficulty.technicalRequirements.length > 0 && (
        <div className="space-y-1">
          <div className="font-medium text-xs text-muted-foreground">技术要求</div>
          <ul className="space-y-0.5 text-xs">
            {difficulty.technicalRequirements.map((req, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {difficulty.beginnerFriendly !== undefined && (
        <div className={cn(
          'text-xs px-2 py-1 rounded border-t pt-2',
          difficulty.beginnerFriendly 
            ? 'text-green-700 bg-green-50' 
            : 'text-orange-700 bg-orange-50'
        )}>
          {difficulty.beginnerFriendly ? '✅ 适合新手' : '⚠️ 不建议新手'}
        </div>
      )}
    </div>
  ) : null;

  // 条形图模式
  if (variant === 'bars') {
    const indicator = (
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
        <div className={cn('flex items-end', sizeStyles.container)}>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-sm transition-all duration-200',
                sizeStyles.bar,
                i < levelConfig.bars
                  ? cn('bg-gradient-to-t', levelConfig.color)
                  : 'bg-gray-200'
              )}
            />
          ))}
        </div>
        
        {showLabel && (
          <span className={cn('font-medium ml-2', levelConfig.textColor)}>
            {difficulty.name || levelConfig.name}
          </span>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {indicator}
      </Tooltip>
    ) : indicator;
  }

  // 星星模式
  if (variant === 'stars') {
    const indicator = (
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
        <div className={cn('flex items-center', sizeStyles.container)}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                sizeStyles.star,
                'transition-all duration-200',
                i < difficulty.level
                  ? cn('fill-current', levelConfig.textColor)
                  : 'text-gray-200'
              )}
            />
          ))}
        </div>
        
        {showLabel && (
          <span className={cn('font-medium ml-2', levelConfig.textColor)}>
            {difficulty.name || levelConfig.name}
          </span>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {indicator}
      </Tooltip>
    ) : indicator;
  }

  // 点状模式
  if (variant === 'dots') {
    const indicator = (
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
        <div className={cn('flex items-center', sizeStyles.container)}>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-200',
                sizeStyles.dot,
                i < difficulty.level
                  ? cn('bg-gradient-to-r', levelConfig.color)
                  : 'bg-gray-200'
              )}
            />
          ))}
        </div>
        
        {showLabel && (
          <span className={cn('font-medium ml-2', levelConfig.textColor)}>
            {difficulty.name || levelConfig.name}
          </span>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {indicator}
      </Tooltip>
    ) : indicator;
  }

  // 紧凑模式
  if (variant === 'compact') {
    const indicator = (
      <Badge
        className={cn(
          'inline-flex items-center transition-all duration-200',
          sizeStyles.badge,
          sizeStyles.container,
          clickable && 'cursor-pointer hover:shadow-sm',
          animated && 'hover:scale-105',
          levelConfig.bgColor,
          className
        )}
        onClick={handleClick}
      >
        <IconComponent className={sizeStyles.icon} />
        <span className="font-medium">{difficulty.level}</span>
      </Badge>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {indicator}
      </Tooltip>
    ) : indicator;
  }

  // 最小模式
  if (variant === 'minimal') {
    const indicator = (
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
        <IconComponent className={cn(sizeStyles.icon, levelConfig.textColor)} />
        {showLabel && (
          <span className={cn('font-medium', levelConfig.textColor)}>
            {difficulty.name || levelConfig.name}
          </span>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {indicator}
      </Tooltip>
    ) : indicator;
  }

  // 渐变模式
  if (variant === 'gradient') {
    const indicator = (
      <div
        className={cn(
          'inline-flex items-center rounded-lg border-0 bg-gradient-to-r text-white transition-all duration-200',
          sizeStyles.badge,
          sizeStyles.container,
          levelConfig.color,
          clickable && 'cursor-pointer hover:shadow-lg',
          animated && 'hover:scale-105',
          className
        )}
        onClick={handleClick}
      >
        <IconComponent className={cn(sizeStyles.icon, 'text-white')} />
        
        {showLabel && (
          <span className="font-bold text-white">
            {difficulty.name || levelConfig.name}
          </span>
        )}
        
        {showDescription && (difficulty.description || levelConfig.description) && (
          <span className="text-xs text-white/80 ml-1">
            {difficulty.description || levelConfig.description}
          </span>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {indicator}
      </Tooltip>
    ) : indicator;
  }

  // 详细模式
  if (variant === 'detailed') {
    const indicator = (
      <div
        className={cn(
          'inline-flex flex-col p-3 rounded-lg border bg-white shadow-sm transition-all duration-200',
          clickable && 'cursor-pointer hover:shadow-md',
          animated && 'hover:scale-105',
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('p-1.5 rounded-full', levelConfig.bgColor.split(' ')[0])}>
            <IconComponent className={cn(sizeStyles.icon, levelConfig.bgColor.split(' ')[1])} />
          </div>
          
          <div className="flex-1">
            <div className="font-bold text-sm">
              {difficulty.name || levelConfig.name}
            </div>
            {showDescription && (difficulty.description || levelConfig.description) && (
              <div className="text-xs text-muted-foreground">
                {difficulty.description || levelConfig.description}
              </div>
            )}
          </div>
          
          <Badge variant="outline" className="text-xs">
            Lv.{difficulty.level}
          </Badge>
        </div>
        
        {showDetails && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {difficulty.estimatedHours && (
              <div>预估时间: {formatHours(difficulty.estimatedHours)}</div>
            )}
            {difficulty.completionRate && (
              <div>完成率: {formatCompletionRate(difficulty.completionRate)}</div>
            )}
          </div>
        )}
        
        {difficulty.complexityScore && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>复杂度</span>
              <span>{difficulty.complexityScore}/100</span>
            </div>
            <Progress value={difficulty.complexityScore} className="h-1" />
          </div>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {indicator}
      </Tooltip>
    ) : indicator;
  }

  // 默认模式
  const indicator = (
    <Badge
      className={cn(
        'inline-flex items-center transition-all duration-200',
        sizeStyles.badge,
        sizeStyles.container,
        clickable && 'cursor-pointer hover:shadow-sm',
        animated && 'hover:scale-105',
        levelConfig.bgColor,
        className
      )}
      variant={variant === 'default' ? 'default' : variant === 'filled' ? 'default' : variant as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'}
      onClick={handleClick}
    >
      <IconComponent className={sizeStyles.icon} />
      
      {showLabel && (
        <span className="font-medium">
          {difficulty.name || levelConfig.name}
        </span>
      )}
      
      {showDescription && (difficulty.description || levelConfig.description) && (
        <span className="text-xs opacity-80 ml-1">
          {difficulty.description || levelConfig.description}
        </span>
      )}
    </Badge>
  );

  return showTooltip && tooltipContent ? (
    <Tooltip content={tooltipContent}>
      {indicator}
    </Tooltip>
  ) : indicator;
};

// 难度比较组件
export interface DifficultyComparisonProps {
  /** 难度列表 */
  difficulties: Difficulty[];
  /** 标题 */
  title?: string;
  /** 是否显示平均值 */
  showAverage?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * DifficultyComparison 难度比较组件
 */
export const DifficultyComparison: React.FC<DifficultyComparisonProps> = ({
  difficulties,
  title = '难度对比',
  showAverage = true,
  className
}) => {
  const averageLevel = difficulties.length > 0 
    ? Math.round(difficulties.reduce((sum, d) => sum + d.level, 0) / difficulties.length)
    : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <div className="font-medium text-sm text-muted-foreground">{title}</div>
      )}
      
      <div className="space-y-2">
        {difficulties.map((difficulty, index) => (
          <div key={difficulty.id || index} className="flex items-center justify-between">
            <span className="text-sm">
              {difficulty.name || difficulty.type || `项目 ${index + 1}`}
            </span>
            <DifficultyIndicator
              difficulty={difficulty}
              variant="bars"
              size="sm"
              showLabel={false}
              showTooltip={true}
            />
          </div>
        ))}
        
        {showAverage && difficulties.length > 1 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium">平均难度</span>
            <DifficultyIndicator
              difficulty={{ level: averageLevel as DifficultyLevel }}
              variant="bars"
              size="sm"
              showLabel={false}
              showTooltip={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};



export default DifficultyIndicator;