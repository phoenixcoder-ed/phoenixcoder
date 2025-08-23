import React from 'react';
import { cn } from '../../utils/cn';
import { UserLevel } from '@phoenixcoder/shared-types';
import { Badge } from './Badge';
import { Progress } from './Progress';
import { Star, Trophy, Crown, Zap } from 'lucide-react';

export interface LevelBadgeProps {
  level: UserLevel;
  type?: 'user' | 'skill';
  size?: 'sm' | 'default' | 'lg';
  showProgress?: boolean;
  experience?: number;
  maxExperience?: number;
  className?: string;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  type = 'user',
  size = 'default',
  showProgress = false,
  experience = 0,
  maxExperience = 1000,
  className
}) => {
  const levelConfig = {
    [UserLevel.BEGINNER]: {
      label: '新手',
      icon: Star,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      progressColor: 'bg-gray-500'
    },
    [UserLevel.INTERMEDIATE]: {
      label: '进阶',
      icon: Trophy,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      progressColor: 'bg-blue-500'
    },
    [UserLevel.ADVANCED]: {
      label: '高级',
      icon: Crown,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      progressColor: 'bg-purple-500'
    },
    [UserLevel.EXPERT]: {
      label: '专家',
      icon: Zap,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      progressColor: 'bg-yellow-500'
    }
  };

  const sizeStyles = {
    sm: {
      badge: 'text-xs px-2 py-1',
      icon: 'w-3 h-3',
      progress: 'h-1'
    },
    default: {
      badge: 'text-sm px-3 py-1',
      icon: 'w-4 h-4',
      progress: 'h-2'
    },
    lg: {
      badge: 'text-base px-4 py-2',
      icon: 'w-5 h-5',
      progress: 'h-3'
    }
  };

  const config = levelConfig[level];
  const Icon = config.icon;
  const progressPercentage = Math.min((experience / maxExperience) * 100, 100);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Badge
        variant="outline"
        className={cn(
          'inline-flex items-center gap-1 font-medium border',
          config.color,
          sizeStyles[size].badge
        )}
      >
        <Icon className={sizeStyles[size].icon} />
        {config.label}
        {type === 'user' && (
          <span className="ml-1 opacity-75">
            Lv.{Object.values(UserLevel).indexOf(level) + 1}
          </span>
        )}
      </Badge>
      
      {showProgress && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Progress
            value={progressPercentage}
            className={cn('flex-1', sizeStyles[size].progress)}
          />
          <span className="whitespace-nowrap">
            {experience}/{maxExperience} XP
          </span>
        </div>
      )}
    </div>
  );
};

export { LevelBadge };