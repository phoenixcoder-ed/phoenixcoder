import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';
import { Separator } from '../ui/Separator';
import { SkillTag } from './SkillTag';
import { LevelBadge } from './LevelBadge';
import { DifficultyIndicator } from './DifficultyIndicator';
import { RewardDisplay } from './RewardDisplay';
import { SkillCategory } from '@phoenixcoder/shared-types';
import {
  Star,
  Lock,
  Unlock,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowDown,
  Target,
  Trophy,
  Zap,
  BookOpen,
  Code,
  Palette,
  Database,
  Server,
  Globe,
  Smartphone,
  Shield,
  BarChart,
  Users,
  Settings,
  Plus,
  Minus,
  RotateCcw,
  Filter,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';

// 技能状态枚举
export enum SkillStatus {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MASTERED = 'mastered'
}

// 技能类型枚举
export enum SkillType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  MOBILE = 'mobile',
  DATABASE = 'database',
  DEVOPS = 'devops',
  DESIGN = 'design',
  TESTING = 'testing',
  SECURITY = 'security',
  ANALYTICS = 'analytics',
  MANAGEMENT = 'management',
  SOFT_SKILLS = 'soft_skills',
  TOOLS = 'tools'
}

// 技能难度枚举
export enum SkillDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

// 技能分支类型
export enum SkillBranch {
  MAIN = 'main',
  OPTIONAL = 'optional',
  ADVANCED = 'advanced',
  SPECIALIZATION = 'specialization'
}

// 技能节点位置
export interface SkillPosition {
  x: number;
  y: number;
  layer: number;
  branch: SkillBranch;
}

// 技能连接
export interface SkillConnection {
  from: string;
  to: string;
  type: 'prerequisite' | 'recommended' | 'related';
  weight: number;
}

// 技能奖励
export interface SkillReward {
  type: 'points' | 'badge' | 'achievement' | 'unlock';
  value: number | string;
  description: string;
}

// 技能要求
export interface SkillRequirement {
  skillId: string;
  level: number;
  optional?: boolean;
}

// 技能数据接口
export interface SkillData {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  difficulty: SkillDifficulty;
  status: SkillStatus;
  level: number;
  maxLevel: number;
  experience: number;
  maxExperience: number;
  position: SkillPosition;
  icon?: string;
  color?: string;
  tags: string[];
  requirements: SkillRequirement[];
  rewards: SkillReward[];
  estimatedTime: number; // 预计学习时间（小时）
  resources: string[]; // 学习资源链接
  projects: string[]; // 相关项目
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// 技能树布局模式
export type SkillTreeLayout = 'tree' | 'grid' | 'flow' | 'radial' | 'timeline';

// 技能树视图模式
export type SkillTreeView = 'overview' | 'detailed' | 'compact' | 'focus';

// 技能树过滤器
export interface SkillTreeFilters {
  types: SkillType[];
  difficulties: SkillDifficulty[];
  statuses: SkillStatus[];
  branches: SkillBranch[];
  search: string;
  showCompleted: boolean;
  showLocked: boolean;
}

// 技能树统计
export interface SkillTreeStats {
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  availableSkills: number;
  lockedSkills: number;
  totalExperience: number;
  completionRate: number;
  averageLevel: number;
  skillsByType: Record<SkillType, number>;
  skillsByDifficulty: Record<SkillDifficulty, number>;
}

// 技能树属性接口
export interface SkillTreeProps {
  skills: SkillData[];
  connections: SkillConnection[];
  layout?: SkillTreeLayout;
  view?: SkillTreeView;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'compact' | 'detailed' | 'interactive';
  className?: string;
  
  // 显示选项
  showFilters?: boolean;
  showStats?: boolean;
  showMinimap?: boolean;
  showProgress?: boolean;
  showConnections?: boolean;
  showTooltips?: boolean;
  showLegend?: boolean;
  
  // 交互选项
  interactive?: boolean;
  zoomable?: boolean;
  pannable?: boolean;
  selectable?: boolean;
  
  // 过滤和搜索
  filters?: SkillTreeFilters;
  onFiltersChange?: (filters: SkillTreeFilters) => void;
  
  // 事件回调
  onSkillClick?: (skill: SkillData) => void;
  onSkillSelect?: (skillId: string, selected: boolean) => void;
  onSkillStart?: (skillId: string) => void;
  onSkillComplete?: (skillId: string) => void;
  onSkillReset?: (skillId: string) => void;
  onLayoutChange?: (layout: SkillTreeLayout) => void;
  onViewChange?: (view: SkillTreeView) => void;
  
  // 自定义渲染
  renderSkillNode?: (skill: SkillData) => React.ReactNode;
  renderConnection?: (connection: SkillConnection) => React.ReactNode;
}

// 技能类型配置
const skillTypeConfig = {
  [SkillType.FRONTEND]: {
    icon: Globe,
    color: 'blue',
    label: '前端开发'
  },
  [SkillType.BACKEND]: {
    icon: Server,
    color: 'green',
    label: '后端开发'
  },
  [SkillType.MOBILE]: {
    icon: Smartphone,
    color: 'purple',
    label: '移动开发'
  },
  [SkillType.DATABASE]: {
    icon: Database,
    color: 'orange',
    label: '数据库'
  },
  [SkillType.DEVOPS]: {
    icon: Settings,
    color: 'red',
    label: 'DevOps'
  },
  [SkillType.DESIGN]: {
    icon: Palette,
    color: 'pink',
    label: '设计'
  },
  [SkillType.TESTING]: {
    icon: CheckCircle,
    color: 'cyan',
    label: '测试'
  },
  [SkillType.SECURITY]: {
    icon: Shield,
    color: 'yellow',
    label: '安全'
  },
  [SkillType.ANALYTICS]: {
    icon: BarChart,
    color: 'indigo',
    label: '数据分析'
  },
  [SkillType.MANAGEMENT]: {
    icon: Users,
    color: 'gray',
    label: '项目管理'
  },
  [SkillType.SOFT_SKILLS]: {
    icon: Target,
    color: 'emerald',
    label: '软技能'
  },
  [SkillType.TOOLS]: {
    icon: Code,
    color: 'violet',
    label: '工具'
  }
};

// 技能状态配置
const skillStatusConfig = {
  [SkillStatus.LOCKED]: {
    icon: Lock,
    color: 'gray',
    label: '未解锁'
  },
  [SkillStatus.AVAILABLE]: {
    icon: Circle,
    color: 'blue',
    label: '可学习'
  },
  [SkillStatus.IN_PROGRESS]: {
    icon: Zap,
    color: 'yellow',
    label: '学习中'
  },
  [SkillStatus.COMPLETED]: {
    icon: CheckCircle,
    color: 'green',
    label: '已完成'
  },
  [SkillStatus.MASTERED]: {
    icon: Trophy,
    color: 'gold',
    label: '已精通'
  }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    node: 'w-16 h-16',
    text: 'text-xs',
    icon: 'w-4 h-4'
  },
  default: {
    node: 'w-20 h-20',
    text: 'text-sm',
    icon: 'w-5 h-5'
  },
  lg: {
    node: 'w-24 h-24',
    text: 'text-base',
    icon: 'w-6 h-6'
  }
};

// 辅助函数
const formatTime = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)}分钟`;
  if (hours < 24) return `${hours}小时`;
  return `${Math.round(hours / 24)}天`;
};

const formatProgress = (current: number, max: number): string => {
  const percentage = Math.round((current / max) * 100);
  return `${percentage}%`;
};

const getSkillProgress = (skill: SkillData): number => {
  return (skill.experience / skill.maxExperience) * 100;
};

const isSkillUnlocked = (skill: SkillData, allSkills: SkillData[]): boolean => {
  if (skill.requirements.length === 0) return true;
  
  return skill.requirements.every(req => {
    const requiredSkill = allSkills.find(s => s.id === req.skillId);
    if (!requiredSkill) return false;
    
    if (req.optional) return true;
    return requiredSkill.level >= req.level;
  });
};

const calculateStats = (skills: SkillData[]): SkillTreeStats => {
  const stats: SkillTreeStats = {
    totalSkills: skills.length,
    completedSkills: 0,
    inProgressSkills: 0,
    availableSkills: 0,
    lockedSkills: 0,
    totalExperience: 0,
    completionRate: 0,
    averageLevel: 0,
    skillsByType: {} as Record<SkillType, number>,
    skillsByDifficulty: {} as Record<SkillDifficulty, number>
  };
  
  skills.forEach(skill => {
    // 状态统计
    switch (skill.status) {
      case SkillStatus.COMPLETED:
      case SkillStatus.MASTERED:
        stats.completedSkills++;
        break;
      case SkillStatus.IN_PROGRESS:
        stats.inProgressSkills++;
        break;
      case SkillStatus.AVAILABLE:
        stats.availableSkills++;
        break;
      case SkillStatus.LOCKED:
        stats.lockedSkills++;
        break;
    }
    
    // 经验统计
    stats.totalExperience += skill.experience;
    
    // 类型统计
    stats.skillsByType[skill.type] = (stats.skillsByType[skill.type] || 0) + 1;
    
    // 难度统计
    stats.skillsByDifficulty[skill.difficulty] = (stats.skillsByDifficulty[skill.difficulty] || 0) + 1;
  });
  
  // 计算完成率
  stats.completionRate = stats.totalSkills > 0 ? (stats.completedSkills / stats.totalSkills) * 100 : 0;
  
  // 计算平均等级
  const totalLevels = skills.reduce((sum, skill) => sum + skill.level, 0);
  stats.averageLevel = stats.totalSkills > 0 ? totalLevels / stats.totalSkills : 0;
  
  return stats;
};

// 技能节点组件
interface SkillNodeProps {
  skill: SkillData;
  size: 'sm' | 'default' | 'lg';
  view: SkillTreeView;
  interactive: boolean;
  showTooltips: boolean;
  onClick?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onReset?: () => void;
}

const SkillNode: React.FC<SkillNodeProps> = ({
  skill,
  size,
  view,
  interactive,
  showTooltips,
  onClick,
  onStart,
  onComplete,
  onReset
}) => {
  const typeConfig = skillTypeConfig[skill.type];
  const statusConfig = skillStatusConfig[skill.status];
  const sizeConf = sizeConfig[size];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;
  
  const progress = getSkillProgress(skill);
  const isLocked = skill.status === SkillStatus.LOCKED;
  const isCompleted = skill.status === SkillStatus.COMPLETED || skill.status === SkillStatus.MASTERED;
  
  const nodeContent = (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200',
        sizeConf.node,
        isLocked && 'opacity-50 cursor-not-allowed',
        !isLocked && interactive && 'cursor-pointer hover:scale-105 hover:shadow-lg',
        statusConfig.color === 'gray' && 'border-gray-300 bg-gray-50',
        statusConfig.color === 'blue' && 'border-blue-300 bg-blue-50',
        statusConfig.color === 'yellow' && 'border-yellow-300 bg-yellow-50',
        statusConfig.color === 'green' && 'border-green-300 bg-green-50',
        statusConfig.color === 'gold' && 'border-yellow-400 bg-yellow-100'
      )}
      onClick={!isLocked ? onClick : undefined}
    >
      {/* 状态图标 */}
      <div className="absolute -top-2 -right-2">
        <div className={cn(
          'flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white',
          statusConfig.color === 'gray' && 'border-gray-400 text-gray-600',
          statusConfig.color === 'blue' && 'border-blue-400 text-blue-600',
          statusConfig.color === 'yellow' && 'border-yellow-400 text-yellow-600',
          statusConfig.color === 'green' && 'border-green-400 text-green-600',
          statusConfig.color === 'gold' && 'border-yellow-500 text-yellow-700'
        )}>
          <StatusIcon className="w-3 h-3" />
        </div>
      </div>
      
      {/* 主图标 */}
      <TypeIcon className={cn(
        sizeConf.icon,
        typeConfig.color === 'blue' && 'text-blue-600',
        typeConfig.color === 'green' && 'text-green-600',
        typeConfig.color === 'purple' && 'text-purple-600',
        typeConfig.color === 'orange' && 'text-orange-600',
        typeConfig.color === 'red' && 'text-red-600',
        typeConfig.color === 'pink' && 'text-pink-600',
        typeConfig.color === 'cyan' && 'text-cyan-600',
        typeConfig.color === 'yellow' && 'text-yellow-600',
        typeConfig.color === 'indigo' && 'text-indigo-600',
        typeConfig.color === 'gray' && 'text-gray-600',
        typeConfig.color === 'emerald' && 'text-emerald-600',
        typeConfig.color === 'violet' && 'text-violet-600'
      )} />
      
      {/* 等级徽章 */}
      {skill.level > 0 && (
        <div className="absolute -bottom-2 -left-2">
          <LevelBadge level={{
            id: skill.id,
            current: skill.level,
            max: skill.maxLevel,
            type: 'skill'
          }} size="sm" />
        </div>
      )}
      
      {/* 进度条 */}
      {skill.status === SkillStatus.IN_PROGRESS && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
  
  if (showTooltips) {
    return (
      <Tooltip
        content={
          <div className="space-y-2">
            <div className="font-medium">{skill.name}</div>
            <div className="text-sm text-muted-foreground">{skill.description}</div>
            
            <div className="flex items-center gap-2">
              <SkillTag skill={{
                id: skill.id,
                name: skill.name,
                category: SkillCategory.OTHER
              }} size="sm" />
              <DifficultyIndicator difficulty={{
                level: skill.difficulty === SkillDifficulty.BEGINNER ? 1 :
                       skill.difficulty === SkillDifficulty.INTERMEDIATE ? 2 :
                       skill.difficulty === SkillDifficulty.ADVANCED ? 3 : 4,
                type: 'skill'
              }} size="sm" />
            </div>
            
            {skill.status === SkillStatus.IN_PROGRESS && (
              <div className="space-y-1">
                <div className="text-sm">进度: {formatProgress(skill.experience, skill.maxExperience)}</div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {skill.estimatedTime > 0 && (
              <div className="text-sm text-muted-foreground">
                预计时间: {formatTime(skill.estimatedTime)}
              </div>
            )}
            
            {skill.requirements.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">前置要求:</div>
                {skill.requirements.map((req, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • 需要技能等级 {req.level}{req.optional && ' (可选)'}
                  </div>
                ))}
              </div>
            )}
            
            {interactive && !isLocked && (
              <div className="flex gap-2 pt-2">
                {skill.status === SkillStatus.AVAILABLE && (
                  <Button size="sm" onClick={onStart}>
                    开始学习
                  </Button>
                )}
                
                {skill.status === SkillStatus.IN_PROGRESS && (
                  <Button size="sm" onClick={onComplete}>
                    标记完成
                  </Button>
                )}
                
                {isCompleted && (
                  <Button size="sm" variant="outline" onClick={onReset}>
                    重新学习
                  </Button>
                )}
              </div>
            )}
          </div>
        }
      >
        {nodeContent}
      </Tooltip>
    );
  }
  
  return nodeContent;
};

// 技能连接线组件
interface SkillConnectionProps {
  connection: SkillConnection;
  fromSkill: SkillData;
  toSkill: SkillData;
}

const SkillConnectionLine: React.FC<SkillConnectionProps> = ({
  connection,
  fromSkill,
  toSkill
}) => {
  const isActive = fromSkill.status !== SkillStatus.LOCKED && toSkill.status !== SkillStatus.LOCKED;
  
  return (
    <div className={cn(
      'absolute border-t-2 transition-all duration-200',
      connection.type === 'prerequisite' && 'border-blue-400',
      connection.type === 'recommended' && 'border-yellow-400',
      connection.type === 'related' && 'border-gray-400',
      !isActive && 'opacity-30'
    )} />
  );
};

// 技能树统计组件
interface SkillTreeStatsProps {
  stats: SkillTreeStats;
  size: 'sm' | 'default' | 'lg';
}

const SkillTreeStatsPanel: React.FC<SkillTreeStatsProps> = ({ stats, size }) => {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">技能统计</h3>
          <Badge variant="outline">
            {stats.completedSkills}/{stats.totalSkills}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>完成率</span>
            <span>{Math.round(stats.completionRate)}%</span>
          </div>
          
          <Progress value={stats.completionRate} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">已完成</div>
            <div className="font-medium text-green-600">{stats.completedSkills}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground">学习中</div>
            <div className="font-medium text-yellow-600">{stats.inProgressSkills}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground">可学习</div>
            <div className="font-medium text-blue-600">{stats.availableSkills}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground">未解锁</div>
            <div className="font-medium text-gray-600">{stats.lockedSkills}</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">技能类型分布</div>
          
          <div className="space-y-1">
            {Object.entries(stats.skillsByType).map(([type, count]) => {
              const typeConfig = skillTypeConfig[type as SkillType];
              const TypeIcon = typeConfig.icon;
              
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4" />
                    <span>{typeConfig.label}</span>
                  </div>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

// 主组件
export const SkillTree: React.FC<SkillTreeProps> = ({
  skills,
  connections,
  layout = 'tree',
  view = 'overview',
  size = 'default',
  variant = 'default',
  className,
  showFilters = true,
  showStats = true,
  showMinimap = false,
  showProgress = true,
  showConnections = true,
  showTooltips = true,
  showLegend = true,
  interactive = true,
  zoomable = false,
  pannable = false,
  selectable = false,
  filters,
  onFiltersChange,
  onSkillClick,
  onSkillSelect,
  onSkillStart,
  onSkillComplete,
  onSkillReset,
  onLayoutChange,
  onViewChange,
  renderSkillNode,
  renderConnection
}) => {
  // 状态管理
  const [localFilters, setLocalFilters] = useState<SkillTreeFilters>(filters || {
    types: [],
    difficulties: [],
    statuses: [],
    branches: [],
    search: '',
    showCompleted: true,
    showLocked: true
  });
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // 计算统计信息
  const stats = useMemo(() => calculateStats(skills), [skills]);
  
  // 过滤技能
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      // 搜索过滤
      if (localFilters.search && !skill.name.toLowerCase().includes(localFilters.search.toLowerCase())) {
        return false;
      }
      
      // 类型过滤
      if (localFilters.types.length > 0 && !localFilters.types.includes(skill.type)) {
        return false;
      }
      
      // 难度过滤
      if (localFilters.difficulties.length > 0 && !localFilters.difficulties.includes(skill.difficulty)) {
        return false;
      }
      
      // 状态过滤
      if (localFilters.statuses.length > 0 && !localFilters.statuses.includes(skill.status)) {
        return false;
      }
      
      // 分支过滤
      if (localFilters.branches.length > 0 && !localFilters.branches.includes(skill.position.branch)) {
        return false;
      }
      
      // 显示选项过滤
      if (!localFilters.showCompleted && (skill.status === SkillStatus.COMPLETED || skill.status === SkillStatus.MASTERED)) {
        return false;
      }
      
      if (!localFilters.showLocked && skill.status === SkillStatus.LOCKED) {
        return false;
      }
      
      return true;
    });
  }, [skills, localFilters]);
  
  // 事件处理
  const handleFiltersChange = useCallback((newFilters: SkillTreeFilters) => {
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [onFiltersChange]);
  
  const handleSkillClick = useCallback((skill: SkillData) => {
    if (selectable) {
      const isSelected = selectedSkills.includes(skill.id);
      const newSelected = isSelected 
        ? selectedSkills.filter(id => id !== skill.id)
        : [...selectedSkills, skill.id];
      
      setSelectedSkills(newSelected);
      onSkillSelect?.(skill.id, !isSelected);
    }
    
    onSkillClick?.(skill);
  }, [selectedSkills, selectable, onSkillClick, onSkillSelect]);
  
  const handleSkillStart = useCallback((skillId: string) => {
    onSkillStart?.(skillId);
  }, [onSkillStart]);
  
  const handleSkillComplete = useCallback((skillId: string) => {
    onSkillComplete?.(skillId);
  }, [onSkillComplete]);
  
  const handleSkillReset = useCallback((skillId: string) => {
    onSkillReset?.(skillId);
  }, [onSkillReset]);
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* 工具栏 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 过滤器 */}
        {showFilters && (
          <div className="flex-1">
            {/* 这里可以添加过滤器组件 */}
          </div>
        )}
        
        {/* 布局和视图控制 */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={layout === 'tree' ? 'default' : 'outline'}
            onClick={() => onLayoutChange?.('tree')}
          >
            树形
          </Button>
          
          <Button
            size="sm"
            variant={layout === 'grid' ? 'default' : 'outline'}
            onClick={() => onLayoutChange?.('grid')}
          >
            网格
          </Button>
          
          <Button
            size="sm"
            variant={layout === 'flow' ? 'default' : 'outline'}
            onClick={() => onLayoutChange?.('flow')}
          >
            流程
          </Button>
          
          {zoomable && (
            <div className="flex items-center gap-1 border rounded-lg">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <span className="px-2 text-sm">{Math.round(zoom * 100)}%</span>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-6">
        {/* 主要内容区域 */}
        <div className="flex-1">
          {/* 技能树容器 */}
          <div 
            className={cn(
              'relative overflow-auto border rounded-lg bg-gray-50 p-8',
              layout === 'grid' && 'grid grid-cols-6 gap-4',
              layout === 'tree' && 'flex flex-col items-center',
              layout === 'flow' && 'flex flex-wrap gap-4'
            )}
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              minHeight: '600px'
            }}
          >
            {/* 技能节点 */}
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className={cn(
                  'relative',
                  layout === 'grid' && 'flex justify-center',
                  selectable && selectedSkills.includes(skill.id) && 'ring-2 ring-blue-500 rounded-lg'
                )}
                style={{
                  gridColumn: layout === 'grid' ? skill.position.x : undefined,
                  gridRow: layout === 'grid' ? skill.position.y : undefined
                }}
              >
                {renderSkillNode ? renderSkillNode(skill) : (
                  <SkillNode
                    skill={skill}
                    size={size}
                    view={view}
                    interactive={interactive}
                    showTooltips={showTooltips}
                    onClick={() => handleSkillClick(skill)}
                    onStart={() => handleSkillStart(skill.id)}
                    onComplete={() => handleSkillComplete(skill.id)}
                    onReset={() => handleSkillReset(skill.id)}
                  />
                )}
              </div>
            ))}
            
            {/* 连接线 */}
            {showConnections && connections.map((connection, index) => {
              const fromSkill = skills.find(s => s.id === connection.from);
              const toSkill = skills.find(s => s.id === connection.to);
              
              if (!fromSkill || !toSkill) return null;
              
              return renderConnection ? renderConnection(connection) : (
                <SkillConnectionLine
                  key={index}
                  connection={connection}
                  fromSkill={fromSkill}
                  toSkill={toSkill}
                />
              );
            })}
          </div>
          
          {/* 图例 */}
          {showLegend && (
            <Card className="mt-4 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">图例</h4>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 状态图例 */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">状态</div>
                    {Object.entries(skillStatusConfig).map(([status, config]) => {
                      const StatusIcon = config.icon;
                      return (
                        <div key={status} className="flex items-center gap-2 text-sm">
                          <StatusIcon className="w-4 h-4" />
                          <span>{config.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 类型图例 */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">类型</div>
                    {Object.entries(skillTypeConfig).slice(0, 4).map(([type, config]) => {
                      const TypeIcon = config.icon;
                      return (
                        <div key={type} className="flex items-center gap-2 text-sm">
                          <TypeIcon className="w-4 h-4" />
                          <span>{config.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 连接类型图例 */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">连接</div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-0.5 bg-blue-400" />
                      <span>前置要求</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-0.5 bg-yellow-400" />
                      <span>推荐学习</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-0.5 bg-gray-400" />
                      <span>相关技能</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
        
        {/* 侧边栏 */}
        {showStats && (
          <div className="w-80 space-y-4">
            <SkillTreeStatsPanel stats={stats} size={size} />
            
            {/* 进度面板 */}
            {showProgress && (
              <Card className="p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">学习进度</h4>
                  
                  {skills
                    .filter(skill => skill.status === SkillStatus.IN_PROGRESS)
                    .slice(0, 5)
                    .map(skill => {
                      const progress = getSkillProgress(skill);
                      return (
                        <div key={skill.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{skill.name}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })
                  }
                  
                  {skills.filter(skill => skill.status === SkillStatus.IN_PROGRESS).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      暂无正在学习的技能
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 类型已在 @phoenixcoder/shared-types 中定义，无需重复导出