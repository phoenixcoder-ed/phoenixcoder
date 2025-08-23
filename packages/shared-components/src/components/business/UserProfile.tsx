import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Star, 
  Award, 
  Target, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageSquare, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Facebook, 
  Youtube, 
  Twitch, 
  // Discord, 
  Slack, 
  Settings, 
  Edit, 
  Share, 
  Flag, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Plus, 
  Minus, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Copy, 
  Download, 
  Upload, 
  Camera, 
  Image, 
  FileText, 
  Link, 
  Tag, 
  Bookmark, 
  Zap, 
  Activity, 
  BarChart, 
  PieChart, 
  TrendingDown, 
  Hash,
  AtSign, 
  Building, 
  School, 
  Home, 
  Briefcase as Work, 
  Coffee, 
  Gamepad2 as GameController2, 
  Music, 
  Book, 
  Palette, 
  Camera as CameraIcon, 
  Plane, 
  Car, 
  Bike, 
  Mountain, 
  Waves, 
  Sun, 
  Moon, 
  CloudRain, 
  Snowflake, 
  Flower, 
  TreePine, 
  Leaf, 
  Bug, 
  Fish, 
  Bird, 
  Cat, 
  Dog, 
  Rabbit, 
  Turtle, 
  Heart as Butterfly, 
  Sparkles, 
  Crown, 
  Flame as Fire, 
  Lightbulb, 
  Rocket, 
  Gamepad2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { Separator } from '../ui/Separator';
import { Progress } from '../ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { SkillTag } from './SkillTag';
import { LevelBadge } from './LevelBadge';
import { AchievementCard } from './AchievementCard';
import { ProgressChart } from './ProgressChart';
import { SkillCategory } from '@phoenixcoder/shared-types';

// 用户状态枚举
export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'invisible';

// 用户类型枚举
export type UserType = 'individual' | 'company' | 'organization' | 'bot' | 'admin' | 'moderator';

// 用户等级类型
export type UserLevelType = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

// 认证状态
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

// 社交媒体平台
export type SocialPlatform = 
  | 'github' 
  | 'linkedin' 
  | 'twitter' 
  | 'instagram' 
  | 'facebook' 
  | 'youtube' 
  | 'twitch' 
  | 'discord' 
  | 'slack' 
  | 'website' 
  | 'blog' 
  | 'portfolio';

// 联系方式接口
export interface ContactInfo {
  /** 邮箱 */
  email?: string;
  /** 电话 */
  phone?: string;
  /** 地址 */
  address?: string;
  /** 城市 */
  city?: string;
  /** 国家 */
  country?: string;
  /** 邮编 */
  zipCode?: string;
  /** 时区 */
  timezone?: string;
  /** 语言 */
  languages?: string[];
}

// 社交媒体链接接口
export interface SocialLink {
  /** 平台 */
  platform: SocialPlatform;
  /** 链接 */
  url: string;
  /** 用户名 */
  username?: string;
  /** 是否公开 */
  public?: boolean;
  /** 是否验证 */
  verified?: boolean;
}

// 工作经历接口
export interface WorkExperience {
  /** ID */
  id: string;
  /** 公司名称 */
  company: string;
  /** 职位 */
  position: string;
  /** 描述 */
  description?: string;
  /** 开始时间 */
  startDate: Date;
  /** 结束时间 */
  endDate?: Date;
  /** 是否当前工作 */
  current?: boolean;
  /** 地点 */
  location?: string;
  /** 技能 */
  skills?: string[];
  /** 成就 */
  achievements?: string[];
}

// 教育经历接口
export interface Education {
  /** ID */
  id: string;
  /** 学校名称 */
  school: string;
  /** 学位 */
  degree: string;
  /** 专业 */
  major?: string;
  /** 描述 */
  description?: string;
  /** 开始时间 */
  startDate: Date;
  /** 结束时间 */
  endDate?: Date;
  /** 是否当前在读 */
  current?: boolean;
  /** 地点 */
  location?: string;
  /** GPA */
  gpa?: number;
  /** 荣誉 */
  honors?: string[];
}

// 项目经历接口
export interface ProjectExperience {
  /** ID */
  id: string;
  /** 项目名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 角色 */
  role?: string;
  /** 开始时间 */
  startDate: Date;
  /** 结束时间 */
  endDate?: Date;
  /** 是否进行中 */
  ongoing?: boolean;
  /** 项目链接 */
  url?: string;
  /** 代码链接 */
  codeUrl?: string;
  /** 技能 */
  skills?: string[];
  /** 成果 */
  achievements?: string[];
  /** 团队规模 */
  teamSize?: number;
}

// 用户统计接口
export interface UserStats {
  /** 任务完成数 */
  tasksCompleted?: number;
  /** 任务发布数 */
  tasksPublished?: number;
  /** 获得评分 */
  rating?: number;
  /** 评价数量 */
  reviewCount?: number;
  /** 收入总额 */
  totalEarnings?: number;
  /** 支出总额 */
  totalSpending?: number;
  /** 关注者数 */
  followers?: number;
  /** 关注数 */
  following?: number;
  /** 浏览量 */
  views?: number;
  /** 点赞数 */
  likes?: number;
  /** 收藏数 */
  bookmarks?: number;
  /** 分享数 */
  shares?: number;
  /** 注册时间 */
  joinDate?: Date;
  /** 最后活跃时间 */
  lastActive?: Date;
  /** 在线时长 */
  onlineHours?: number;
}

// 用户偏好接口
export interface UserPreferences {
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto';
  /** 语言 */
  language?: string;
  /** 时区 */
  timezone?: string;
  /** 通知设置 */
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  /** 隐私设置 */
  privacy?: {
    profilePublic?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
    showLocation?: boolean;
    showStats?: boolean;
  };
}

// 用户接口
export interface UserData {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName?: string;
  /** 邮箱 */
  email: string;
  /** 头像 */
  avatar?: string;
  /** 封面图 */
  coverImage?: string;
  /** 个人简介 */
  bio?: string;
  /** 个人描述 */
  description?: string;
  /** 用户类型 */
  type: UserType;
  /** 用户状态 */
  status: UserStatus;
  /** 用户等级 */
  level?: number;
  /** 用户等级类型 */
  levelType?: UserLevelType;
  /** 经验值 */
  experience?: number;
  /** 认证状态 */
  verified: VerificationStatus;
  /** 联系方式 */
  contact?: ContactInfo;
  /** 社交媒体 */
  socialLinks?: SocialLink[];
  /** 技能 */
  skills?: string[];
  /** 兴趣爱好 */
  interests?: string[];
  /** 工作经历 */
  workExperience?: WorkExperience[];
  /** 教育经历 */
  education?: Education[];
  /** 项目经历 */
  projects?: ProjectExperience[];
  /** 统计数据 */
  stats?: UserStats;
  /** 用户偏好 */
  preferences?: UserPreferences;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

// UserProfile 组件属性接口
export interface UserProfileProps {
  /** 用户数据 */
  user: UserData;
  /** 显示模式 */
  mode?: 'card' | 'page' | 'modal' | 'sidebar' | 'compact' | 'minimal';
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 显示变体 */
  variant?: 'default' | 'outline' | 'filled' | 'gradient';
  /** 布局方向 */
  layout?: 'horizontal' | 'vertical';
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 是否显示封面 */
  showCover?: boolean;
  /** 是否显示状态 */
  showStatus?: boolean;
  /** 是否显示等级 */
  showLevel?: boolean;
  /** 是否显示认证 */
  showVerification?: boolean;
  /** 是否显示联系方式 */
  showContact?: boolean;
  /** 是否显示社交媒体 */
  showSocial?: boolean;
  /** 是否显示技能 */
  showSkills?: boolean;
  /** 是否显示统计 */
  showStats?: boolean;
  /** 是否显示经历 */
  showExperience?: boolean;
  /** 是否显示项目 */
  showProjects?: boolean;
  /** 是否显示成就 */
  showAchievements?: boolean;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否可编辑 */
  editable?: boolean;
  /** 是否当前用户 */
  isCurrentUser?: boolean;
  /** 是否关注 */
  isFollowing?: boolean;
  /** 是否屏蔽 */
  isBlocked?: boolean;
  /** 最大技能显示数 */
  maxSkills?: number;
  /** 最大项目显示数 */
  maxProjects?: number;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 点击回调 */
  onClick?: (user: UserData) => void;
  /** 编辑回调 */
  onEdit?: (user: UserData) => void;
  /** 关注回调 */
  onFollow?: (userId: string) => void;
  /** 取消关注回调 */
  onUnfollow?: (userId: string) => void;
  /** 屏蔽回调 */
  onBlock?: (userId: string) => void;
  /** 举报回调 */
  onReport?: (userId: string) => void;
  /** 分享回调 */
  onShare?: (user: UserData) => void;
  /** 消息回调 */
  onMessage?: (userId: string) => void;
  /** 联系回调 */
  onContact?: (contactInfo: ContactInfo) => void;
  /** 社交链接点击回调 */
  onSocialClick?: (link: SocialLink) => void;
  /** 技能点击回调 */
  onSkillClick?: (skill: string) => void;
  /** 项目点击回调 */
  onProjectClick?: (project: ProjectExperience) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 用户状态配置
const userStatusConfig = {
  online: { color: 'bg-green-500', label: '在线' },
  offline: { color: 'bg-gray-400', label: '离线' },
  away: { color: 'bg-yellow-500', label: '离开' },
  busy: { color: 'bg-red-500', label: '忙碌' },
  invisible: { color: 'bg-gray-400', label: '隐身' }
};

// 用户类型配置
const userTypeConfig = {
  individual: { icon: User, label: '个人用户', color: 'text-blue-600' },
  company: { icon: Building, label: '企业用户', color: 'text-purple-600' },
  organization: { icon: Users, label: '组织用户', color: 'text-green-600' },
  bot: { icon: Zap, label: '机器人', color: 'text-orange-600' },
  admin: { icon: Shield, label: '管理员', color: 'text-red-600' },
  moderator: { icon: Award, label: '版主', color: 'text-indigo-600' }
};

// 认证状态配置
const verificationConfig = {
  unverified: { icon: XCircle, label: '未认证', color: 'text-gray-500' },
  pending: { icon: Clock, label: '待认证', color: 'text-yellow-500' },
  verified: { icon: CheckCircle, label: '已认证', color: 'text-green-500' },
  rejected: { icon: XCircle, label: '认证失败', color: 'text-red-500' }
};

// 社交平台图标配置
const socialPlatformIcons = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitch: Twitch,
  discord: Globe, // 使用 Globe 作为 discord 的替代图标
  slack: Slack,
  website: Globe,
  blog: FileText,
  portfolio: Briefcase
};

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'text-sm',
    avatar: 'w-12 h-12',
    coverHeight: 'h-24',
    spacing: 'space-y-2 space-x-2',
    padding: 'p-3',
    icon: 'w-3 h-3',
    badge: 'text-xs px-1.5 py-0.5',
    button: 'h-8 px-3 text-sm'
  },
  default: {
    container: 'text-sm',
    avatar: 'w-16 h-16',
    coverHeight: 'h-32',
    spacing: 'space-y-3 space-x-3',
    padding: 'p-4',
    icon: 'w-4 h-4',
    badge: 'text-xs px-2 py-1',
    button: 'h-10 px-4 text-sm'
  },
  lg: {
    container: 'text-base',
    avatar: 'w-20 h-20',
    coverHeight: 'h-40',
    spacing: 'space-y-4 space-x-4',
    padding: 'p-6',
    icon: 'w-5 h-5',
    badge: 'text-sm px-2.5 py-1',
    button: 'h-12 px-6 text-base'
  }
};

// 格式化时间
const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days} 天前`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} 周前`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} 个月前`;
  } else {
    const years = Math.floor(days / 365);
    return `${years} 年前`;
  }
};

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// 格式化评分
const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

// 用户状态指示器组件
const UserStatusIndicator: React.FC<{
  status: UserStatus;
  size: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}> = ({ status, size, showLabel = false }) => {
  const config = userStatusConfig[status];
  const sizeStyles = sizeConfig[size];
  
  return (
    <div className="flex items-center gap-1">
      <div className={cn(
        'rounded-full',
        config.color,
        size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
      )} />
      
      {showLabel && (
        <span className={cn('text-muted-foreground', sizeStyles.container)}>
          {config.label}
        </span>
      )}
    </div>
  );
};

// 社交链接组件
const SocialLinks: React.FC<{
  links: SocialLink[];
  size: 'sm' | 'default' | 'lg';
  maxDisplay?: number;
  onClick?: (link: SocialLink) => void;
}> = ({ links, size, maxDisplay = 5, onClick }) => {
  const sizeStyles = sizeConfig[size];
  const displayLinks = links.slice(0, maxDisplay);
  const remainingCount = links.length - maxDisplay;
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {displayLinks.map((link, index) => {
        const IconComponent = socialPlatformIcons[link.platform] || Globe;
        
        return (
          <Tooltip
            key={index}
            content={link.username || link.url}
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-auto w-auto p-1"
              onClick={() => onClick?.(link)}
            >
              <IconComponent className={cn('text-gray-600', sizeStyles.icon)} />
              
              {link.verified && (
                <CheckCircle className={cn('text-green-500 ml-1', 
                  size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
                )} />
              )}
            </Button>
          </Tooltip>
        );
      })}
      
      {remainingCount > 0 && (
        <Badge variant="outline" className={sizeStyles.badge}>
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

// 统计项组件
const StatItem: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  size: 'sm' | 'default' | 'lg';
  onClick?: () => void;
}> = ({ icon: IconComponent, label, value, size, onClick }) => {
  const sizeStyles = sizeConfig[size];
  
  return (
    <div 
      className={cn(
        'flex flex-col items-center text-center',
        onClick && 'cursor-pointer hover:bg-gray-50 rounded-md p-2 transition-colors'
      )}
      onClick={onClick}
    >
      <IconComponent className={cn('text-gray-500 mb-1', sizeStyles.icon)} />
      
      <div className={cn('font-semibold', sizeStyles.container)}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      
      <div className={cn('text-muted-foreground', 
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>
        {label}
      </div>
    </div>
  );
};

/**
 * UserProfile 用户资料组件
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  mode = 'card',
  size = 'default',
  variant = 'default',
  layout = 'vertical',
  showAvatar = true,
  showCover = true,
  showStatus = true,
  showLevel = true,
  showVerification = true,
  showContact = true,
  showSocial = true,
  showSkills = true,
  showStats = true,
  showExperience = false,
  showProjects = false,
  showAchievements = false,
  showActions = true,
  editable = false,
  isCurrentUser = false,
  isFollowing = false,
  isBlocked = false,
  maxSkills = 5,
  maxProjects = 3,
  loading = false,
  error,
  onClick,
  onEdit,
  onFollow,
  onUnfollow,
  onBlock,
  onReport,
  onShare,
  onMessage,
  onContact,
  onSocialClick,
  onSkillClick,
  onProjectClick,
  className
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const sizeStyles = sizeConfig[size];
  const typeConfig = userTypeConfig[user.type];
  const verifyConfig = verificationConfig[user.verified];
  
  // 错误状态
  if (error) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <div className="text-lg font-semibold mb-2">加载失败</div>
        <div className="text-muted-foreground">{error}</div>
      </Card>
    );
  }
  
  // 加载状态
  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className={cn('rounded-full bg-gray-300', sizeStyles.avatar)} />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/4" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded" />
            <div className="h-3 bg-gray-300 rounded w-5/6" />
          </div>
        </div>
      </Card>
    );
  }
  
  // 渲染头部
  const renderHeader = () => (
    <div className="relative">
      {/* 封面图 */}
      {showCover && user.coverImage && (
        <div className={cn('relative overflow-hidden rounded-t-lg', sizeStyles.coverHeight)}>
          <img 
            src={user.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          
          {editable && (
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm"
            >
              <Camera className={sizeStyles.icon} />
            </Button>
          )}
        </div>
      )}
      
      {/* 用户信息 */}
      <div className={cn('flex items-start gap-4', sizeStyles.padding, 
        layout === 'horizontal' && 'flex-row',
        layout === 'vertical' && 'flex-col'
      )}>
        {/* 头像 */}
        {showAvatar && (
          <div className="relative flex-shrink-0">
            <Avatar className={cn(sizeStyles.avatar, 'border-4 border-white shadow-lg')}>
              <AvatarImage
                src={user.avatar}
                alt={user.displayName || user.username}
              />
              <AvatarFallback>
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* 状态指示器 */}
            {showStatus && (
              <div className="absolute -bottom-1 -right-1">
                <UserStatusIndicator status={user.status} size={size} />
              </div>
            )}
            
            {editable && (
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white shadow-md"
              >
                <Camera className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
        
        {/* 基本信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* 名称和认证 */}
              <div className="flex items-center gap-2 mb-1">
                <h2 className={cn('font-bold truncate', 
                  size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
                )}>
                  {user.displayName || user.username}
                </h2>
                
                {showVerification && user.verified === 'verified' && (
                  <Tooltip content="已认证用户">
                    <verifyConfig.icon className={cn('text-green-500', sizeStyles.icon)} />
                  </Tooltip>
                )}
                
                <Badge 
                  variant="outline" 
                  className={cn(typeConfig.color, sizeStyles.badge)}
                >
                  <typeConfig.icon className={cn('mr-1', sizeStyles.icon)} />
                  {typeConfig.label}
                </Badge>
              </div>
              
              {/* 用户名 */}
              {user.displayName && (
                <div className={cn('text-muted-foreground mb-2', sizeStyles.container)}>
                  @{user.username}
                </div>
              )}
              
              {/* 等级 */}
              {showLevel && user.level !== undefined && (
                <div className="mb-2">
                  <LevelBadge
                    level={{
                      id: `user-${user.id}`,
                      current: user.level,
                      type: 'user',
                      currentExp: user.experience,
                      nextLevelExp: (user.level + 1) * 1000
                    }}
                    size={size}
                    showProgress
                  />
                </div>
              )}
              
              {/* 简介 */}
              {user.bio && (
                <p className={cn('text-muted-foreground mb-3', sizeStyles.container)}>
                  {user.bio}
                </p>
              )}
              
              {/* 联系方式 */}
              {showContact && user.contact && (
                <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                  {user.contact.email && (
                    <div className="flex items-center gap-1">
                      <Mail className={sizeStyles.icon} />
                      <span className="truncate">{user.contact.email}</span>
                    </div>
                  )}
                  
                  {user.contact.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className={sizeStyles.icon} />
                      <span>{user.contact.city}</span>
                    </div>
                  )}
                  
                  {user.stats?.joinDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className={sizeStyles.icon} />
                      <span>加入于 {formatDate(user.stats.joinDate)}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* 社交媒体 */}
              {showSocial && user.socialLinks && user.socialLinks.length > 0 && (
                <div className="mb-3">
                  <SocialLinks
                    links={user.socialLinks}
                    size={size}
                    onClick={onSocialClick}
                  />
                </div>
              )}
            </div>
            
            {/* 操作按钮 */}
            {showActions && (
              <div className="flex items-center gap-2">
                {isCurrentUser ? (
                  editable && (
                    <Button
                      size={size}
                      variant="outline"
                      onClick={() => onEdit?.(user)}
                    >
                      <Edit className={sizeStyles.icon} />
                      编辑
                    </Button>
                  )
                ) : (
                  <>
                    <Button
                      size={size}
                      variant={isFollowing ? 'outline' : 'default'}
                      onClick={() => isFollowing ? onUnfollow?.(user.id) : onFollow?.(user.id)}
                    >
                      <Users className={sizeStyles.icon} />
                      {isFollowing ? '取消关注' : '关注'}
                    </Button>
                    
                    <Button
                      size={size}
                      variant="outline"
                      onClick={() => onMessage?.(user.id)}
                    >
                      <MessageSquare className={sizeStyles.icon} />
                      消息
                    </Button>
                    
                    <Button
                      size={size}
                      variant="ghost"
                      onClick={() => onShare?.(user)}
                    >
                      <Share className={sizeStyles.icon} />
                    </Button>
                    
                    <Button
                      size={size}
                      variant="ghost"
                      onClick={() => onReport?.(user.id)}
                    >
                      <MoreHorizontal className={sizeStyles.icon} />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // 渲染统计
  const renderStats = () => {
    if (!showStats || !user.stats) return null;
    
    const stats = [
      { icon: Target, label: '完成任务', value: user.stats.tasksCompleted || 0 },
      { icon: Star, label: '评分', value: user.stats.rating ? formatRating(user.stats.rating) : '-' },
      { icon: Users, label: '关注者', value: user.stats.followers || 0 },
      { icon: Eye, label: '浏览量', value: user.stats.views || 0 }
    ];
    
    return (
      <div className={cn('grid grid-cols-4 gap-4 py-4 border-t', sizeStyles.padding)}>
        {stats.map((stat, index) => (
          <StatItem
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            size={size}
          />
        ))}
      </div>
    );
  };
  
  // 渲染技能
  const renderSkills = () => {
    if (!showSkills || !user.skills || user.skills.length === 0) return null;
    
    const displaySkills = user.skills.slice(0, maxSkills);
    const remainingCount = user.skills.length - maxSkills;
    
    return (
      <div className={cn('py-4 border-t', sizeStyles.padding)}>
        <h3 className={cn('font-semibold mb-3', sizeStyles.container)}>技能</h3>
        
        <div className="flex flex-wrap gap-2">
          {displaySkills.map((skill, index) => (
            <SkillTag
              key={index}
              skill={typeof skill === 'string' ? {
                   id: `skill-${index}`,
                   name: skill,
                   category: SkillCategory.FRONTEND,
                   level: 3,
                   experience: 0,
                   certified: false
                 } : skill}
              size={size}
              onClick={() => onSkillClick?.(skill)}
            />
          ))}
          
          {remainingCount > 0 && (
            <Badge variant="outline" className={sizeStyles.badge}>
              +{remainingCount} 更多
            </Badge>
          )}
        </div>
      </div>
    );
  };
  
  // 渲染内容
  const renderContent = () => {
    if (mode === 'compact' || mode === 'minimal') {
      return (
        <div>
          {renderHeader()}
          {mode === 'compact' && renderStats()}
        </div>
      );
    }
    
    if (mode === 'page') {
      return (
        <div className="space-y-6">
          {renderHeader()}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="experience">经历</TabsTrigger>
              <TabsTrigger value="projects">项目</TabsTrigger>
              <TabsTrigger value="achievements">成就</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="space-y-6">
                {renderStats()}
                {renderSkills()}
                
                {user.description && (
                  <div className={sizeStyles.padding}>
                    <h3 className={cn('font-semibold mb-3', sizeStyles.container)}>个人描述</h3>
                    <p className={cn('text-muted-foreground', sizeStyles.container)}>
                      {user.description}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {showExperience && (
              <TabsContent value="experience">
                <div className={sizeStyles.padding}>
                  <h3 className={cn('font-semibold mb-4', sizeStyles.container)}>工作经历</h3>
                  {/* 工作经历内容 */}
                </div>
              </TabsContent>
            )}
            
            {showProjects && (
              <TabsContent value="projects">
                <div className={sizeStyles.padding}>
                  <h3 className={cn('font-semibold mb-4', sizeStyles.container)}>项目经历</h3>
                  {/* 项目经历内容 */}
                </div>
              </TabsContent>
            )}
            
            {showAchievements && (
              <TabsContent value="achievements">
                <div className={sizeStyles.padding}>
                  <h3 className={cn('font-semibold mb-4', sizeStyles.container)}>成就</h3>
                  {/* 成就内容 */}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      );
    }
    
    return (
      <div>
        {renderHeader()}
        {renderStats()}
        {renderSkills()}
      </div>
    );
  };
  
  // 根据模式渲染
  const containerClass = cn(
    'bg-white',
    variant === 'outline' && 'border',
    variant === 'filled' && 'bg-gray-50',
    variant === 'gradient' && 'bg-gradient-to-br from-blue-50 to-purple-50',
    mode === 'card' && 'rounded-lg shadow-sm',
    mode === 'modal' && 'rounded-lg shadow-lg',
    mode === 'sidebar' && 'border-r',
    mode === 'page' && 'max-w-4xl mx-auto',
    onClick && 'cursor-pointer hover:shadow-md transition-shadow',
    className
  );
  
  return (
    <div className={containerClass} onClick={() => onClick?.(user)}>
      {renderContent()}
    </div>
  );
};



export default UserProfile;