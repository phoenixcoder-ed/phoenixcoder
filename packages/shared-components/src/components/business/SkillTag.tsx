import React from 'react';
import { X, Star, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { SkillCategory } from '@phoenixcoder/shared-types';

// 技能等级枚举
export type SkillLevel = 1 | 2 | 3 | 4 | 5;

// 技能类别枚举 - 使用 shared-types 中的定义
// export type SkillCategory = 
//   | 'programming' 
//   | 'framework' 
//   | 'database' 
//   | 'tool' 
//   | 'language' 
//   | 'soft_skill' 
//   | 'certification'
//   | 'other';

// 技能状态枚举
export type SkillStatus = 'learning' | 'proficient' | 'expert' | 'certified';

// 技能数据接口
export interface Skill {
  /** 技能ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能等级 (1-5) */
  level?: SkillLevel;
  /** 技能类别 */
  category?: SkillCategory;
  /** 技能状态 */
  status?: SkillStatus;
  /** 技能描述 */
  description?: string;
  /** 是否必需 */
  required?: boolean;
  /** 是否认证 */
  certified?: boolean;
  /** 经验年数 */
  experience?: number;
  /** 最后使用时间 */
  lastUsed?: string;
  /** 技能图标 */
  icon?: string;
  /** 技能颜色 */
  color?: string;
  /** 相关项目数量 */
  projectCount?: number;
  /** 技能热度 */
  popularity?: number;
  /** 市场需求度 */
  demand?: 'low' | 'medium' | 'high' | 'very_high';
}

// SkillTag 组件属性接口
export interface SkillTagProps {
  /** 技能数据 */
  skill: Skill;
  /** 标签变体 */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'level' | 'status' | 'compact';
  /** 标签尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 是否显示等级 */
  showLevel?: boolean;
  /** 是否显示状态 */
  showStatus?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否显示删除按钮 */
  showRemove?: boolean;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否选中 */
  selected?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否动画效果 */
  animated?: boolean;
  /** 点击回调 */
  onClick?: (skill: Skill) => void;
  /** 删除回调 */
  onRemove?: (skill: Skill) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 技能类别配置
const skillCategoryConfig = {
  programming: {
    label: '编程语言',
    icon: '💻',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  framework: {
    label: '框架',
    icon: '🏗️',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  database: {
    label: '数据库',
    icon: '🗄️',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  tool: {
    label: '工具',
    icon: '🔧',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  language: {
    label: '语言',
    icon: '🌐',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  soft_skill: {
    label: '软技能',
    icon: '🤝',
    color: 'bg-pink-100 text-pink-800 border-pink-200'
  },
  certification: {
    label: '认证',
    icon: '🏆',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  other: {
    label: '其他',
    icon: '📋',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

// 技能状态配置
const skillStatusConfig = {
  learning: {
    label: '学习中',
    icon: '📚',
    color: 'bg-blue-100 text-blue-700'
  },
  proficient: {
    label: '熟练',
    icon: '✅',
    color: 'bg-green-100 text-green-700'
  },
  expert: {
    label: '专家',
    icon: '🌟',
    color: 'bg-purple-100 text-purple-700'
  },
  certified: {
    label: '认证',
    icon: '🏆',
    color: 'bg-yellow-100 text-yellow-700'
  }
};

// 技能等级配置
const skillLevelConfig = {
  1: {
    label: '入门',
    stars: 1,
    color: 'text-gray-400'
  },
  2: {
    label: '初级',
    stars: 2,
    color: 'text-blue-400'
  },
  3: {
    label: '中级',
    stars: 3,
    color: 'text-green-400'
  },
  4: {
    label: '高级',
    stars: 4,
    color: 'text-orange-400'
  },
  5: {
    label: '专家',
    stars: 5,
    color: 'text-red-400'
  }
};

// 需求度配置
const demandConfig = {
  low: {
    label: '低需求',
    color: 'text-gray-500',
    icon: '📉'
  },
  medium: {
    label: '中等需求',
    color: 'text-blue-500',
    icon: '📊'
  },
  high: {
    label: '高需求',
    color: 'text-orange-500',
    icon: '📈'
  },
  very_high: {
    label: '极高需求',
    color: 'text-red-500',
    icon: '🔥'
  }
};

// 渲染技能等级星星
const renderStars = (level: SkillLevel, className?: string) => {
  const config = skillLevelConfig[level];
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i < config.stars
              ? cn('fill-current', config.color)
              : 'text-gray-200'
          )}
        />
      ))}
    </div>
  );
};

// 格式化经验年数
const formatExperience = (years: number): string => {
  if (years < 1) {
    return '< 1年';
  } else if (years === 1) {
    return '1年';
  } else {
    return `${years}年`;
  }
};

// 格式化最后使用时间
const formatLastUsed = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) {
    return `${diffYears}年前`;
  } else if (diffMonths > 0) {
    return `${diffMonths}个月前`;
  } else if (diffDays > 0) {
    return `${diffDays}天前`;
  } else {
    return '最近使用';
  }
};

/**
 * SkillTag 技能标签组件
 */
export const SkillTag: React.FC<SkillTagProps> = ({
  skill,
  variant = 'default',
  size = 'default',
  showLevel = false,
  showStatus = false,
  showIcon = true,
  showRemove = false,
  showTooltip = true,
  clickable = false,
  selected = false,
  disabled = false,
  animated = true,
  onClick,
  onRemove,
  className
}) => {
  const categoryConfig = skill.category ? skillCategoryConfig[skill.category as keyof typeof skillCategoryConfig] || skillCategoryConfig.other : skillCategoryConfig.other;
  const statusConfig = skill.status ? skillStatusConfig[skill.status] : null;
  const levelConfig = skill.level ? skillLevelConfig[skill.level] : null;
  const demandInfo = skill.demand ? demandConfig[skill.demand] : null;

  const handleClick = () => {
    if (clickable && !disabled && onClick) {
      onClick(skill);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(skill);
    }
  };

  // 构建工具提示内容
  const tooltipContent = showTooltip ? (
    <div className="space-y-2 text-sm">
      <div className="font-medium">{skill.name}</div>
      
      {skill.description && (
        <div className="text-muted-foreground">{skill.description}</div>
      )}
      
      <div className="space-y-1">
        {skill.category && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">类别:</span>
            <span>{categoryConfig.icon} {categoryConfig.label}</span>
          </div>
        )}
        
        {skill.level && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">等级:</span>
            <div className="flex items-center gap-1">
              {renderStars(skill.level)}
              <span className="ml-1">{levelConfig?.label}</span>
            </div>
          </div>
        )}
        
        {skill.status && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">状态:</span>
            <span>{statusConfig?.icon} {statusConfig?.label}</span>
          </div>
        )}
        
        {skill.experience && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">经验:</span>
            <span>{formatExperience(skill.experience)}</span>
          </div>
        )}
        
        {skill.projectCount && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">项目:</span>
            <span>{skill.projectCount}个</span>
          </div>
        )}
        
        {skill.lastUsed && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">最后使用:</span>
            <span>{formatLastUsed(skill.lastUsed)}</span>
          </div>
        )}
        
        {skill.demand && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">市场需求:</span>
            <span className={demandInfo?.color}>
              {demandInfo?.icon} {demandInfo?.label}
            </span>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // 紧凑模式
  if (variant === 'compact') {
    const tag = (
      <Badge
        className={cn(
          'inline-flex items-center gap-1 transition-all duration-200',
          clickable && 'cursor-pointer hover:shadow-sm',
          selected && 'ring-2 ring-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          animated && 'hover:scale-105',
          skill.required && 'border-orange-300 bg-orange-50 text-orange-700',
          skill.certified && 'border-green-300 bg-green-50 text-green-700',
          className
        )}
        variant={skill.required ? 'default' : 'secondary'}
        size={size}
        onClick={handleClick}
      >
        {showIcon && skill.icon && (
          <span className="text-xs">{skill.icon}</span>
        )}
        {showIcon && !skill.icon && skill.category && (
          <span className="text-xs">{categoryConfig.icon}</span>
        )}
        
        <span className="truncate max-w-[100px]">{skill.name}</span>
        
        {showLevel && skill.level && (
          <span className="text-xs opacity-70">L{skill.level}</span>
        )}
        
        {skill.certified && (
          <CheckCircle className="w-3 h-3" />
        )}
        
        {showRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </Badge>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {tag}
      </Tooltip>
    ) : tag;
  }

  // 等级模式
  if (variant === 'level' && skill.level) {
    const tag = (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
          'bg-white hover:shadow-md',
          clickable && 'cursor-pointer hover:shadow-lg',
          selected && 'ring-2 ring-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          animated && 'hover:scale-105',
          className
        )}
        onClick={handleClick}
      >
        {showIcon && (
          <span className="text-sm">
            {skill.icon || categoryConfig.icon}
          </span>
        )}
        
        <span className="font-medium text-sm">{skill.name}</span>
        
        {renderStars(skill.level, 'ml-1')}
        
        <span className={cn('text-xs font-medium', levelConfig?.color)}>
          {levelConfig?.label}
        </span>
        
        {skill.certified && (
          <Award className="w-4 h-4 text-yellow-500" />
        )}
        
        {showRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-5 w-5 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {tag}
      </Tooltip>
    ) : tag;
  }

  // 状态模式
  if (variant === 'status' && skill.status) {
    const tag = (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
          statusConfig?.color,
          clickable && 'cursor-pointer hover:shadow-md',
          selected && 'ring-2 ring-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          animated && 'hover:scale-105',
          className
        )}
        onClick={handleClick}
      >
        {showIcon && (
          <span className="text-sm">
            {skill.icon || statusConfig?.icon}
          </span>
        )}
        
        <span className="font-medium text-sm">{skill.name}</span>
        
        <Badge variant="outline" className="text-xs px-1 py-0">
          {statusConfig?.label}
        </Badge>
        
        {skill.experience && (
          <span className="text-xs opacity-70">
            {formatExperience(skill.experience)}
          </span>
        )}
        
        {showRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-5 w-5 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );

    return showTooltip && tooltipContent ? (
      <Tooltip content={tooltipContent}>
        {tag}
      </Tooltip>
    ) : tag;
  }

  // 默认模式
  const tag = (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 transition-all duration-200',
        clickable && 'cursor-pointer hover:shadow-sm',
        selected && 'ring-2 ring-primary',
        disabled && 'opacity-50 cursor-not-allowed',
        animated && 'hover:scale-105',
        skill.required && 'border-orange-300 bg-orange-50 text-orange-700',
        skill.certified && 'border-green-300 bg-green-50 text-green-700',
        skill.color && `bg-${skill.color}-100 text-${skill.color}-800 border-${skill.color}-200`,
        className
      )}
      variant={variant === 'default' ? (skill.required ? 'default' : 'secondary') : (variant === 'status' || variant === 'level' || variant === 'ghost') ? 'secondary' : variant}
      size={size}
      onClick={handleClick}
    >
      {showIcon && (
        <span className="text-sm">
          {skill.icon || categoryConfig.icon}
        </span>
      )}
      
      <span className="font-medium">{skill.name}</span>
      
      {showLevel && skill.level && (
        <div className="flex items-center gap-1">
          {renderStars(skill.level)}
        </div>
      )}
      
      {showStatus && skill.status && (
        <span className="text-xs opacity-70">
          {statusConfig?.label}
        </span>
      )}
      
      {skill.certified && (
        <CheckCircle className="w-3 h-3" />
      )}
      
      {skill.demand === 'very_high' && (
        <TrendingUp className="w-3 h-3 text-red-500" />
      )}
      
      {showRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </Badge>
  );

  return showTooltip && tooltipContent ? (
    <Tooltip content={tooltipContent}>
      {tag}
    </Tooltip>
  ) : tag;
};

// 技能标签组
export interface SkillTagGroupProps {
  /** 技能列表 */
  skills: Skill[];
  /** 最大显示数量 */
  maxDisplay?: number;
  /** 标签属性 */
  tagProps?: Omit<SkillTagProps, 'skill'>;
  /** 是否显示更多按钮 */
  showMore?: boolean;
  /** 更多按钮文本 */
  moreText?: string;
  /** 点击更多回调 */
  onMoreClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * SkillTagGroup 技能标签组组件
 */
export const SkillTagGroup: React.FC<SkillTagGroupProps> = ({
  skills,
  maxDisplay = 6,
  tagProps,
  showMore = true,
  moreText = '更多',
  onMoreClick,
  className
}) => {
  const displaySkills = skills.slice(0, maxDisplay);
  const remainingCount = skills.length - maxDisplay;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displaySkills.map((skill) => (
        <SkillTag
          key={skill.id}
          skill={skill}
          {...tagProps}
        />
      ))}
      
      {remainingCount > 0 && showMore && (
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-muted"
          onClick={onMoreClick}
        >
          +{remainingCount} {moreText}
        </Badge>
      )}
    </div>
  );
};

// 导出类型和组件
export type {
  SkillCategory
};

export default SkillTag;