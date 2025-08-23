import React from 'react';
import { cn } from '../../utils/cn';
import { Skill, SkillCategory, SkillLevel } from '@phoenixcoder/shared-types';
import { Badge } from './Badge';
import { 
  Code, 
  Smartphone, 
  Server, 
  Database, 
  Cloud, 
  Brain, 
  Palette, 
  Settings 
} from 'lucide-react';

export interface SkillTagProps {
  skill?: Skill;
  name?: string;
  category?: SkillCategory;
  level?: SkillLevel;
  verified?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  showLevel?: boolean;
  showIcon?: boolean;
  onClick?: (skill: Skill | { name: string; category?: SkillCategory; level?: SkillLevel }) => void;
  className?: string;
}

const SkillTag: React.FC<SkillTagProps> = ({
  skill,
  name,
  category,
  level,
  verified = false,
  size = 'default',
  variant = 'default',
  showLevel = true,
  showIcon = true,
  onClick,
  className
}) => {
  // 使用 skill 对象或单独的属性
  const skillName = skill?.name || name || '';
  const skillCategory = skill?.category || category;
  const skillLevel = skill?.level || level;
  const isVerified = skill?.verified || verified;

  const categoryConfig = {
    [SkillCategory.FRONTEND]: {
      label: '前端',
      icon: Code,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    [SkillCategory.BACKEND]: {
      label: '后端',
      icon: Server,
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    [SkillCategory.MOBILE]: {
      label: '移动端',
      icon: Smartphone,
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    [SkillCategory.DATABASE]: {
      label: '数据库',
      icon: Database,
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    [SkillCategory.DEVOPS]: {
      label: 'DevOps',
      icon: Cloud,
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    },
    [SkillCategory.AI_ML]: {
      label: 'AI/ML',
      icon: Brain,
      color: 'bg-pink-100 text-pink-800 border-pink-200'
    },
    [SkillCategory.DESIGN]: {
      label: '设计',
      icon: Palette,
      color: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    [SkillCategory.OTHER]: {
      label: '其他',
      icon: Settings,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const levelLabels = {
    [SkillLevel.NOVICE]: '新手',
    [SkillLevel.BEGINNER]: '初级',
    [SkillLevel.INTERMEDIATE]: '中级',
    [SkillLevel.ADVANCED]: '高级',
    [SkillLevel.EXPERT]: '专家'
  };

  const sizeStyles = {
    sm: {
      badge: 'text-xs px-2 py-1',
      icon: 'w-3 h-3'
    },
    default: {
      badge: 'text-sm px-3 py-1',
      icon: 'w-4 h-4'
    },
    lg: {
      badge: 'text-base px-4 py-2',
      icon: 'w-5 h-5'
    }
  };

  const config = skillCategory ? categoryConfig[skillCategory] : null;
  const Icon = config?.icon || Settings;
  const levelLabel = skillLevel ? levelLabels[skillLevel] : null;

  const handleClick = () => {
    if (onClick) {
      if (skill) {
        onClick(skill);
      } else {
        onClick({ name: skillName, category: skillCategory, level: skillLevel });
      }
    }
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center gap-1 font-medium cursor-pointer transition-colors',
        config?.color || 'bg-gray-100 text-gray-800 border-gray-200',
        sizeStyles[size].badge,
        onClick && 'hover:opacity-80',
        isVerified && 'ring-2 ring-green-400 ring-opacity-50',
        className
      )}
      onClick={handleClick}
    >
      {showIcon && <Icon className={sizeStyles[size].icon} />}
      <span className="truncate">{skillName}</span>
      {showLevel && levelLabel && (
        <span className="opacity-75 text-xs">
          {levelLabel}
        </span>
      )}
      {isVerified && (
        <span className="text-green-600 text-xs">✓</span>
      )}
    </Badge>
  );
};

export { SkillTag };