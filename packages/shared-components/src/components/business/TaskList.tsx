import React, { useState, useEffect, useMemo } from 'react';
import { SkillCategory } from '@phoenixcoder/shared-types';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List, 
  Calendar, 
  Clock, 
  DollarSign, 
  Star, 
  User, 
  Users, 
  MapPin, 
  Tag, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share, 
  Bookmark, 
  Flag, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  Zap, 
  Target, 
  Award, 
  TrendingUp, 
  Activity, 
  FileText, 
  Code, 
  Palette, 
  Camera, 
  Music, 
  Video, 
  Gamepad2, 
  Briefcase, 
  GraduationCap, 
  Building, 
  Home, 
  Car, 
  Plane, 
  Coffee, 
  ShoppingCart, 
  Smartphone, 
  Laptop, 
  Monitor, 
  Headphones, 
  Keyboard, 
  Mouse, 
  Printer, 
  Wifi, 
  Database, 
  Server, 
  Cloud, 
  Shield, 
  Lock, 
  Key, 
  Settings, 
  // Tool, 
  Wrench, 
  Hammer, 
  // Screwdriver, 
  Paintbrush, 
  Scissors, 
  Ruler, 
  Calculator, 
  Book, 
  Pen, 
  Pencil, 
  Eraser, 
  Paperclip, 
  Folder, 
  Archive, 
  Trash, 
  Download, 
  Upload, 
  Link, 
  ExternalLink, 
  Copy, 
  Edit, 
  Save, 
  // Print, 
  Mail, 
  Phone, 
  Globe, 
  Navigation, 
  Compass, 
  Map, 
  Route, 
  Truck, 
  Bus, 
  Train, 
  Ship, 
  Rocket, 
  Satellite, 
  Sun, 
  Moon, 
  Star as StarIcon, 
  Cloud as CloudIcon, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Thermometer, 
  Droplets, 
  Flame, 
  Snowflake, 
  Umbrella, 
  TreePine, 
  Flower, 
  Leaf, 
  Bug, 
  Fish, 
  Bird, 
  Cat, 
  Dog, 
  Rabbit, 
  Turtle, 
  // Butterfly, 
  Sparkles, 
  Crown, 
  Diamond, 
  Gift, 
  Cake, 
  Pizza, 
  IceCream, 
  Candy, 
  Apple, 
  Banana, 
  Cherry, 
  Grape, 
  // Orange,
  // Strawberry,
  // Watermelon, 
  Carrot, 
  // Corn,
  // Tomato,
  // Pepper,
  // Mushroom,
  // Bread,
  // Cheese,
  // Meat, 
  Fish as FishIcon, 
  Egg, 
  Milk, 
  Wine, 
  Beer, 
  CupSoda, 
  Coffee as CoffeeIcon, 
  // Tea, 
  Soup, 
  Salad, 
  Sandwich, 
  // Burger, 
  // Fries,
  // Donut,
  // Cookie,
  // Chocolate,
  // Candy as CandyIcon,
  // Lollipop,
  // Popcorn,
  // Pretzel,
  // Croissant,
  // Bagel,
  // Waffle,
  // Pancakes,
  // Muffin,
  // Cupcake,
  // Pie,
  // Tart,
  // Pudding,
  // Jelly,
  // Honey, 
  // Syrup,
  // Jam,
  // Butter,
  // Salt,
  // Pepper as PepperIcon,
  // Spice,
  // Herb,
  // Garlic,
  // Onion,
  // Ginger,
  // Chili,
  // Lime,
  // Lemon, 
  // Coconut,
  // Pineapple,
  // Mango,
  // Peach,
  // Plum,
  // Kiwi,
  // Avocado,
  // Broccoli,
  // Cabbage,
  // Lettuce,
  // Spinach,
  // Celery,
  // Cucumber, 
  // Radish,
  // Turnip,
  // Beet,
  // Potato,
  // SweetPotato,
  // Pumpkin,
  // Squash,
  // Eggplant,
  // Zucchini,
  // Artichoke,
  // Asparagus,
  // BrusselsSprouts,
  // Cauliflower, 
  // Kale,
  // Chard,
  // Arugula,
  // Watercress,
  // Parsley,
  // Cilantro,
  // Basil,
  // Mint,
  // Rosemary,
  // Thyme,
  // Oregano,
  // Sage,
  // Dill, 
  // Chives,
  // Tarragon,
  // Bay,
  // Cardamom,
  // Cinnamon,
  // Clove,
  // Nutmeg,
  // Vanilla,
  // Saffron,
  // Turmeric,
  // Paprika,
  // Cumin,
  // Coriander, 
  // Fennel,
  // Anise,
  // Mustard,
  // Horseradish,
  // Wasabi,
  // Sriracha,
  // Tabasco,
  // Ketchup,
  // Mustard as MustardIcon,
  // Mayo,
  // Ranch,
  // Caesar,
  // Vinaigrette, 
  // Pesto,
  // Hummus,
  // Guacamole,
  // Salsa,
  // Queso,
  // Tzatziki,
  // Aioli,
  // Chimichurri,
  // Harissa,
  // Tahini,
  // Miso,
  // Soy,
  // Teriyaki, 
  // Hoisin,
  // Oyster,
  // Fish as FishSauce,
  // Worcestershire,
  // Balsamic,
  // Rice,
  // Vinegar,
  // Olive,
  // Coconut as CoconutOil,
  // Sesame,
  // Sunflower,
  // Canola,
  // Vegetable,
  // Peanut, 
  // Almond,
  // Walnut,
  // Pecan,
  // Cashew,
  // Pistachio,
  // Hazelnut,
  // Macadamia,
  // Brazil,
  // Pine,
  // Chestnut,
  // Acorn,
  // Hickory,
  // Beech, 
  // Oak,
  // Maple,
  // Birch,
  // Ash,
  // Elm,
  // Poplar,
  // Willow,
  // Cedar,
  // Fir,
  // Spruce,
  // Pine as PineTree,
  // Redwood,
  // Sequoia, 
  // Cypress,
  // Juniper,
  // Yew,
  // Holly,
  // Ivy,
  // Fern,
  // Moss,
  // Lichen,
  // Algae,
  // Seaweed,
  // Coral,
  // Sponge,
  // Jellyfish, 
  // Starfish,
  // Seahorse,
  // Octopus,
  // Squid,
  // Crab,
  // Lobster,
  // Shrimp,
  // Clam,
  // Oyster,
  // Mussel,
  // Scallop,
  // Snail,
  // Slug, 
  Worm, 
  // Spider,
  // Ant,
  // Bee,
  // Wasp,
  // Fly,
  // Mosquito,
  // Moth,
  // Beetle,
  // Ladybug,
  // Dragonfly,
  // Grasshopper,
  // Cricket,
  // Cicada, 
  // Mantis,
  // Stick,
  // Caterpillar,
  // Cocoon,
  // Chrysalis,
  // Metamorphosis,
  // Evolution,
  // Adaptation,
  // Selection,
  // Mutation,
  // Gene,
  // DNA,
  // RNA, 
  // Protein,
  // Enzyme,
  // Hormone,
  // Vitamin,
  // Mineral,
  // Nutrient,
  // Calorie,
  // Carb,
  // Fat,
  // Fiber,
  // Sugar, 
  // Sodium,
  // Potassium,
  // Calcium,
  // Iron,
  // Zinc,
  // Magnesium,
  // Phosphorus,
  // Selenium,
  // Iodine,
  // Fluoride, 
  // Chloride,
  // Sulfur,
  // Chromium,
  // Manganese,
  // Molybdenum,
  // Copper,
  // Cobalt,
  // Nickel,
  // Vanadium,
  // Boron,
  // Silicon, 
  // Tin,
  // Aluminum,
  // Lead,
  // Mercury,
  // Cadmium,
  // Arsenic,
  // Antimony,
  // Bismuth,
  // Thallium,
  // Polonium,
  // Radon, 
  // Radium,
  // Uranium,
  // Plutonium,
  // Thorium,
  // Actinium,
  // Protactinium,
  // Neptunium,
  // Americium,
  // Curium, 
  // Berkelium,
  // Californium,
  // Einsteinium,
  // Fermium,
  // Mendelevium,
  // Nobelium,
  // Lawrencium,
  // Rutherfordium,
  // Dubnium,
  // Seaborgium, 
  // Bohrium,
  // Hassium,
  // Meitnerium,
  // Darmstadtium,
  // Roentgenium,
  // Copernicium,
  // Nihonium,
  // Flerovium, 
  // Moscovium,
  // Livermorium,
  // Tennessine,
  // Oganesson
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Tooltip } from '../ui/Tooltip';
import { Separator } from '../ui/Separator';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Progress } from '../ui/Progress';
import { SearchBox } from './SearchBox';
import { FilterPanel } from './FilterPanel';
import { SortSelector } from './SortSelector';
import { DifficultyIndicator, DifficultyLevel } from './DifficultyIndicator';
import { SkillTag } from './SkillTag';
import { RewardDisplay } from './RewardDisplay';

// 任务状态枚举
export type TaskStatus = 
  | 'draft' 
  | 'published' 
  | 'in_progress' 
  | 'under_review' 
  | 'completed' 
  | 'cancelled' 
  | 'expired' 
  | 'paused' 
  | 'rejected';

// 任务类型枚举
export type TaskType = 
  | 'development' 
  | 'design' 
  | 'writing' 
  | 'translation' 
  | 'marketing' 
  | 'research' 
  | 'testing' 
  | 'consulting' 
  | 'training' 
  | 'support' 
  | 'data_entry' 
  | 'video_editing' 
  | 'audio_editing' 
  | 'photography' 
  | 'illustration' 
  | 'animation' 
  | 'modeling' 
  | 'other';

// 任务优先级枚举
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

// 任务难度枚举
export type TaskDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// 任务付费类型枚举
export type PaymentType = 'fixed' | 'hourly' | 'milestone' | 'revenue_share' | 'equity' | 'free';

// 任务工作模式枚举
export type WorkMode = 'remote' | 'onsite' | 'hybrid';

// 任务时长类型枚举
export type DurationType = 'short' | 'medium' | 'long' | 'ongoing';

// 任务申请状态枚举
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

// 任务申请者接口
export interface TaskApplicant {
  /** 申请者ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像 */
  avatar?: string;
  /** 申请状态 */
  status: ApplicationStatus;
  /** 申请时间 */
  appliedAt: Date;
  /** 申请消息 */
  message?: string;
  /** 报价 */
  bidAmount?: number;
  /** 预计完成时间 */
  estimatedDuration?: number;
  /** 相关经验 */
  experience?: string;
  /** 作品集 */
  portfolio?: string[];
  /** 评分 */
  rating?: number;
  /** 完成任务数 */
  completedTasks?: number;
}

// 任务里程碑接口
export interface TaskMilestone {
  /** 里程碑ID */
  id: string;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 金额 */
  amount: number;
  /** 截止时间 */
  dueDate?: Date;
  /** 状态 */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  /** 完成时间 */
  completedAt?: Date;
}

// 任务附件接口
export interface TaskAttachment {
  /** 附件ID */
  id: string;
  /** 文件名 */
  name: string;
  /** 文件类型 */
  type: string;
  /** 文件大小 */
  size: number;
  /** 文件URL */
  url: string;
  /** 上传时间 */
  uploadedAt: Date;
}

// 任务评论接口
export interface TaskComment {
  /** 评论ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像 */
  avatar?: string;
  /** 评论内容 */
  content: string;
  /** 评论时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt?: Date;
  /** 父评论ID */
  parentId?: string;
  /** 点赞数 */
  likes?: number;
  /** 是否已点赞 */
  isLiked?: boolean;
}

// 任务数据接口
export interface TaskData {
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
  /** 任务优先级 */
  priority: TaskPriority;
  /** 任务难度 */
  difficulty: TaskDifficulty;
  /** 付费类型 */
  paymentType: PaymentType;
  /** 预算/报酬 */
  budget?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  /** 工作模式 */
  workMode: WorkMode;
  /** 时长类型 */
  durationType: DurationType;
  /** 预计工时 */
  estimatedHours?: number;
  /** 截止时间 */
  deadline?: Date;
  /** 开始时间 */
  startDate?: Date;
  /** 结束时间 */
  endDate?: Date;
  /** 发布者ID */
  publisherId: string;
  /** 发布者信息 */
  publisher: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    rating?: number;
    verified?: boolean;
  };
  /** 执行者ID */
  assigneeId?: string;
  /** 执行者信息 */
  assignee?: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    rating?: number;
  };
  /** 所需技能 */
  skills: string[];
  /** 标签 */
  tags?: string[];
  /** 地点 */
  location?: string;
  /** 语言要求 */
  languages?: string[];
  /** 申请者 */
  applicants?: TaskApplicant[];
  /** 里程碑 */
  milestones?: TaskMilestone[];
  /** 附件 */
  attachments?: TaskAttachment[];
  /** 评论 */
  comments?: TaskComment[];
  /** 浏览量 */
  views?: number;
  /** 收藏数 */
  bookmarks?: number;
  /** 申请数 */
  applicationCount?: number;
  /** 是否紧急 */
  isUrgent?: boolean;
  /** 是否特色 */
  isFeatured?: boolean;
  /** 是否已收藏 */
  isBookmarked?: boolean;
  /** 是否已申请 */
  hasApplied?: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 发布时间 */
  publishedAt?: Date;
}

// 任务列表视图类型
export type TaskListView = 'grid' | 'list' | 'compact' | 'detailed';

// 任务排序字段
export type TaskSortField = 
  | 'created_at' 
  | 'updated_at' 
  | 'deadline' 
  | 'budget' 
  | 'priority' 
  | 'difficulty' 
  | 'views' 
  | 'applications' 
  | 'rating';

// 任务排序方向
export type TaskSortDirection = 'asc' | 'desc';

// 任务过滤器接口
export interface TaskFilters {
  /** 搜索关键词 */
  search?: string;
  /** 任务类型 */
  types?: TaskType[];
  /** 任务状态 */
  statuses?: TaskStatus[];
  /** 任务难度 */
  difficulties?: TaskDifficulty[];
  /** 付费类型 */
  paymentTypes?: PaymentType[];
  /** 工作模式 */
  workModes?: WorkMode[];
  /** 预算范围 */
  budgetRange?: {
    min?: number;
    max?: number;
  };
  /** 技能 */
  skills?: string[];
  /** 标签 */
  tags?: string[];
  /** 地点 */
  location?: string;
  /** 语言 */
  languages?: string[];
  /** 发布者 */
  publisherId?: string;
  /** 是否紧急 */
  isUrgent?: boolean;
  /** 是否特色 */
  isFeatured?: boolean;
  /** 截止时间范围 */
  deadlineRange?: {
    start?: Date;
    end?: Date;
  };
}

// 任务排序配置
export interface TaskSort {
  /** 排序字段 */
  field: TaskSortField;
  /** 排序方向 */
  direction: TaskSortDirection;
}

// TaskList 组件属性接口
export interface TaskListProps {
  /** 任务列表 */
  tasks: TaskData[];
  /** 显示视图 */
  view?: TaskListView;
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 是否显示搜索 */
  showSearch?: boolean;
  /** 是否显示过滤器 */
  showFilters?: boolean;
  /** 是否显示排序 */
  showSort?: boolean;
  /** 是否显示视图切换 */
  showViewToggle?: boolean;
  /** 是否显示分页 */
  showPagination?: boolean;
  /** 是否显示统计 */
  showStats?: boolean;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否可选择 */
  selectable?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 每页显示数量 */
  pageSize?: number;
  /** 当前页码 */
  currentPage?: number;
  /** 总数量 */
  total?: number;
  /** 过滤器 */
  filters?: TaskFilters;
  /** 排序配置 */
  sort?: TaskSort;
  /** 选中的任务ID */
  selectedIds?: string[];
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 空状态文本 */
  emptyText?: string;
  /** 空状态描述 */
  emptyDescription?: string;
  /** 任务点击回调 */
  onTaskClick?: (task: TaskData) => void;
  /** 任务申请回调 */
  onTaskApply?: (taskId: string) => void;
  /** 任务收藏回调 */
  onTaskBookmark?: (taskId: string) => void;
  /** 任务分享回调 */
  onTaskShare?: (task: TaskData) => void;
  /** 任务举报回调 */
  onTaskReport?: (taskId: string) => void;
  /** 任务编辑回调 */
  onTaskEdit?: (task: TaskData) => void;
  /** 任务删除回调 */
  onTaskDelete?: (taskId: string) => void;
  /** 搜索回调 */
  onSearch?: (query: string) => void;
  /** 过滤器变化回调 */
  onFiltersChange?: (filters: TaskFilters) => void;
  /** 排序变化回调 */
  onSortChange?: (sort: TaskSort) => void;
  /** 视图变化回调 */
  onViewChange?: (view: TaskListView) => void;
  /** 页码变化回调 */
  onPageChange?: (page: number) => void;
  /** 页面大小变化回调 */
  onPageSizeChange?: (size: number) => void;
  /** 选择变化回调 */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (result: any) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 任务状态配置
const taskStatusConfig = {
  draft: { color: 'bg-gray-500', label: '草稿', textColor: 'text-gray-600' },
  published: { color: 'bg-blue-500', label: '已发布', textColor: 'text-blue-600' },
  in_progress: { color: 'bg-yellow-500', label: '进行中', textColor: 'text-yellow-600' },
  under_review: { color: 'bg-purple-500', label: '审核中', textColor: 'text-purple-600' },
  completed: { color: 'bg-green-500', label: '已完成', textColor: 'text-green-600' },
  cancelled: { color: 'bg-red-500', label: '已取消', textColor: 'text-red-600' },
  expired: { color: 'bg-orange-500', label: '已过期', textColor: 'text-orange-600' },
  paused: { color: 'bg-indigo-500', label: '已暂停', textColor: 'text-indigo-600' },
  rejected: { color: 'bg-pink-500', label: '已拒绝', textColor: 'text-pink-600' }
};

// 任务类型配置
const taskTypeConfig = {
  development: { icon: Code, label: '开发', color: 'text-blue-600' },
  design: { icon: Palette, label: '设计', color: 'text-purple-600' },
  writing: { icon: Pen, label: '写作', color: 'text-green-600' },
  translation: { icon: Globe, label: '翻译', color: 'text-orange-600' },
  marketing: { icon: TrendingUp, label: '营销', color: 'text-red-600' },
  research: { icon: Search, label: '研究', color: 'text-indigo-600' },
  testing: { icon: Bug, label: '测试', color: 'text-yellow-600' },
  consulting: { icon: Users, label: '咨询', color: 'text-teal-600' },
  training: { icon: GraduationCap, label: '培训', color: 'text-cyan-600' },
  support: { icon: MessageSquare, label: '支持', color: 'text-pink-600' },
  data_entry: { icon: Database, label: '数据录入', color: 'text-gray-600' },
  video_editing: { icon: Video, label: '视频编辑', color: 'text-red-500' },
  audio_editing: { icon: Music, label: '音频编辑', color: 'text-purple-500' },
  photography: { icon: Camera, label: '摄影', color: 'text-blue-500' },
  illustration: { icon: Paintbrush, label: '插画', color: 'text-green-500' },
  animation: { icon: Zap, label: '动画', color: 'text-yellow-500' },
  modeling: { icon: Building, label: '建模', color: 'text-orange-500' },
  other: { icon: MoreHorizontal, label: '其他', color: 'text-gray-500' }
};

// 任务优先级配置
const taskPriorityConfig = {
  low: { color: 'text-gray-500', label: '低' },
  normal: { color: 'text-blue-500', label: '普通' },
  high: { color: 'text-orange-500', label: '高' },
  urgent: { color: 'text-red-500', label: '紧急' }
};

// 付费类型配置
const paymentTypeConfig = {
  fixed: { icon: DollarSign, label: '固定价格', color: 'text-green-600' },
  hourly: { icon: Clock, label: '按小时', color: 'text-blue-600' },
  milestone: { icon: Target, label: '里程碑', color: 'text-purple-600' },
  revenue_share: { icon: TrendingUp, label: '收益分成', color: 'text-orange-600' },
  equity: { icon: Award, label: '股权', color: 'text-red-600' },
  free: { icon: Gift, label: '免费', color: 'text-gray-600' }
};

// 工作模式配置
const workModeConfig = {
  remote: { icon: Home, label: '远程', color: 'text-green-600' },
  onsite: { icon: Building, label: '现场', color: 'text-blue-600' },
  hybrid: { icon: Zap, label: '混合', color: 'text-purple-600' }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'text-sm',
    spacing: 'space-y-2 space-x-2',
    padding: 'p-3',
    icon: 'w-3 h-3',
    avatar: 'w-6 h-6',
    badge: 'text-xs px-1.5 py-0.5',
    button: 'h-8 px-3 text-sm'
  },
  default: {
    container: 'text-sm',
    spacing: 'space-y-3 space-x-3',
    padding: 'p-4',
    icon: 'w-4 h-4',
    avatar: 'w-8 h-8',
    badge: 'text-xs px-2 py-1',
    button: 'h-10 px-4 text-sm'
  },
  lg: {
    container: 'text-base',
    spacing: 'space-y-4 space-x-4',
    padding: 'p-6',
    icon: 'w-5 h-5',
    avatar: 'w-10 h-10',
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

// 格式化截止时间
const formatDeadline = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) {
    return '已过期';
  } else if (days === 0) {
    return '今天截止';
  } else if (days === 1) {
    return '明天截止';
  } else if (days < 7) {
    return `${days} 天后截止`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} 周后截止`;
  } else {
    const months = Math.floor(days / 30);
    return `${months} 个月后截止`;
  }
};

// 格式化预算
const formatBudget = (budget: TaskData['budget']): string => {
  if (!budget) return '面议';
  
  const currency = budget.currency || '¥';
  
  if (budget.min && budget.max) {
    return `${currency}${budget.min} - ${currency}${budget.max}`;
  } else if (budget.min) {
    return `${currency}${budget.min}+`;
  } else if (budget.max) {
    return `最高 ${currency}${budget.max}`;
  }
  
  return '面议';
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

// 任务卡片组件
const TaskCard: React.FC<{
  task: TaskData;
  view: TaskListView;
  size: 'sm' | 'default' | 'lg';
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onApply?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ 
  task, 
  view, 
  size, 
  selectable, 
  selected, 
  onSelect, 
  onClick, 
  onApply, 
  onBookmark, 
  onShare, 
  onReport, 
  onEdit, 
  onDelete 
}) => {
  const sizeStyles = sizeConfig[size];
  const statusConfig = taskStatusConfig[task.status];
  const typeConfig = taskTypeConfig[task.type];
  const priorityConfig = taskPriorityConfig[task.priority];
  const paymentConfig = paymentTypeConfig[task.paymentType];
  const workConfig = workModeConfig[task.workMode];
  
  // 紧凑视图
  if (view === 'compact') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow cursor-pointer', sizeStyles.padding)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectable && (
              <Checkbox
                checked={selected}
                onChange={(e) => onSelect?.(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            <div className="flex-1 min-w-0" onClick={onClick}>
              <div className="flex items-center gap-2 mb-1">
                <typeConfig.icon className={cn(typeConfig.color, sizeStyles.icon)} />
                
                <h3 className={cn('font-semibold truncate', sizeStyles.container)}>
                  {task.title}
                </h3>
                
                {task.isUrgent && (
                  <Badge variant="destructive" className={sizeStyles.badge}>
                    紧急
                  </Badge>
                )}
                
                {task.isFeatured && (
                  <Badge variant="secondary" className={sizeStyles.badge}>
                    特色
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className={statusConfig.textColor}>
                  {statusConfig.label}
                </span>
                
                <span>{formatBudget(task.budget)}</span>
                
                {task.deadline && (
                  <span>{formatDeadline(task.deadline)}</span>
                )}
                
                <span>{formatDate(task.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={task.isBookmarked ? 'default' : 'outline'}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.();
              }}
            >
              <Bookmark className={cn(sizeStyles.icon, task.isBookmarked && 'fill-current')} />
            </Button>
            
            {!task.hasApplied && task.status === 'published' && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply?.();
                }}
              >
                申请
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }
  
  // 列表视图
  if (view === 'list') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow cursor-pointer', sizeStyles.padding)}>
        <div className="flex items-start gap-4">
          {selectable && (
            <Checkbox
              checked={selected}
              onChange={(e) => onSelect?.(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="mr-2"
            />
          )}
          
          <div className="flex-1 min-w-0" onClick={onClick}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <typeConfig.icon className={cn(typeConfig.color, sizeStyles.icon)} />
                  
                  <h3 className={cn('font-semibold', sizeStyles.container)}>
                    {task.title}
                  </h3>
                  
                  <Badge 
                    variant="outline" 
                    className={cn(statusConfig.textColor, sizeStyles.badge)}
                  >
                    {statusConfig.label}
                  </Badge>
                  
                  {task.isUrgent && (
                    <Badge variant="destructive" className={sizeStyles.badge}>
                      紧急
                    </Badge>
                  )}
                  
                  {task.isFeatured && (
                    <Badge variant="secondary" className={sizeStyles.badge}>
                      特色
                    </Badge>
                  )}
                </div>
                
                <p className={cn('text-muted-foreground mb-3 line-clamp-2', sizeStyles.container)}>
                  {task.description}
                </p>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <paymentConfig.icon className={cn(paymentConfig.color, sizeStyles.icon)} />
                    <span className={cn('font-medium', sizeStyles.container)}>
                      {formatBudget(task.budget)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <workConfig.icon className={cn(workConfig.color, sizeStyles.icon)} />
                    <span className={cn(sizeStyles.container)}>
                      {workConfig.label}
                    </span>
                  </div>
                  
                  <DifficultyIndicator
                    difficulty={{ level: parseInt(task.difficulty) as DifficultyLevel }}
                    size={size}
                    variant="minimal"
                  />
                  
                  {task.deadline && (
                    <div className="flex items-center gap-1">
                      <Clock className={cn('text-orange-500', sizeStyles.icon)} />
                      <span className={cn('text-orange-600', sizeStyles.container)}>
                        {formatDeadline(task.deadline)}
                      </span>
                    </div>
                  )}
                </div>
                
                {task.skills && task.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {task.skills.slice(0, 5).map((skill, index) => (
                      <SkillTag
                        key={index}
                        skill={{
                          id: `skill-${index}`,
                          name: skill,
                          category: SkillCategory.OTHER,
                          level: 1,
                          experience: 0,
                          certified: false
                        }}
                        size={size}
                        variant="outline"
                      />
                    ))}
                    
                    {task.skills.length > 5 && (
                      <Badge variant="outline" className={sizeStyles.badge}>
                        +{task.skills.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Avatar className={sizeStyles.avatar}>
                  <AvatarImage
                    src={task.publisher.avatar}
                    alt={task.publisher.displayName || task.publisher.username}
                  />
                  <AvatarFallback>
                    {task.publisher.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                      
                      <span>{task.publisher.displayName || task.publisher.username}</span>
                      
                      {task.publisher.verified && (
                        <Check className={cn('text-green-500', sizeStyles.icon)} />
                      )}
                    </div>
                    
                    <span>{formatDate(task.createdAt)}</span>
                    
                    {task.views && (
                      <div className="flex items-center gap-1">
                        <Eye className={sizeStyles.icon} />
                        <span>{formatNumber(task.views)}</span>
                      </div>
                    )}
                    
                    {task.applicationCount && (
                      <div className="flex items-center gap-1">
                        <Users className={sizeStyles.icon} />
                        <span>{task.applicationCount} 申请</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant={task.isBookmarked ? 'default' : 'outline'}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.();
              }}
            >
              <Bookmark className={cn(sizeStyles.icon, task.isBookmarked && 'fill-current')} />
            </Button>
            
            {!task.hasApplied && task.status === 'published' && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply?.();
                }}
              >
                申请
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onShare?.();
              }}
            >
              <Share className={sizeStyles.icon} />
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  // 网格视图（默认）
  return (
    <Card className={cn('hover:shadow-md transition-shadow cursor-pointer h-full', sizeStyles.padding)}>
      <div className="flex flex-col h-full">
        {selectable && (
          <div className="flex justify-end mb-2">
            <Checkbox
              checked={selected}
              onChange={(e) => onSelect?.(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        
        <div className="flex-1" onClick={onClick}>
          <div className="flex items-center gap-2 mb-3">
            <typeConfig.icon className={cn(typeConfig.color, sizeStyles.icon)} />
            
            <Badge 
              variant="outline" 
              className={cn(statusConfig.textColor, sizeStyles.badge)}
            >
              {statusConfig.label}
            </Badge>
            
            {task.isUrgent && (
              <Badge variant="destructive" className={sizeStyles.badge}>
                紧急
              </Badge>
            )}
            
            {task.isFeatured && (
              <Badge variant="secondary" className={sizeStyles.badge}>
                特色
              </Badge>
            )}
          </div>
          
          <h3 className={cn('font-semibold mb-2 line-clamp-2', sizeStyles.container)}>
            {task.title}
          </h3>
          
          <p className={cn('text-muted-foreground mb-3 line-clamp-3', sizeStyles.container)}>
            {task.description}
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <paymentConfig.icon className={cn(paymentConfig.color, sizeStyles.icon)} />
                <span className={cn('font-medium', sizeStyles.container)}>
                  {formatBudget(task.budget)}
                </span>
              </div>
              
              <DifficultyIndicator
                difficulty={{ level: parseInt(task.difficulty) as DifficultyLevel }}
                size={size}
                variant="minimal"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <workConfig.icon className={cn(workConfig.color, sizeStyles.icon)} />
                <span className={cn(sizeStyles.container)}>
                  {workConfig.label}
                </span>
              </div>
              
              {task.deadline && (
                <div className="flex items-center gap-1">
                  <Clock className={cn('text-orange-500', sizeStyles.icon)} />
                  <span className={cn('text-orange-600', sizeStyles.container)}>
                    {formatDeadline(task.deadline)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {task.skills && task.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {task.skills.slice(0, 3).map((skill, index) => (
                <SkillTag
                  key={index}
                  skill={{
                    id: `skill-${index}`,
                    name: skill,
                    category: SkillCategory.OTHER,
                    level: 3
                  }}
                  size={size}
                  variant="outline"
                />
              ))}
              
              {task.skills.length > 3 && (
                <Badge variant="outline" className={sizeStyles.badge}>
                  +{task.skills.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Avatar className={sizeStyles.avatar}>
                <AvatarImage
                  src={task.publisher.avatar}
                  alt={task.publisher.displayName || task.publisher.username}
                />
                <AvatarFallback>
                  {task.publisher.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <span className="truncate">
                {task.publisher.displayName || task.publisher.username}
              </span>
              
              {task.publisher.verified && (
                <Check className={cn('text-green-500', sizeStyles.icon)} />
              )}
            </div>
            
            <span>{formatDate(task.createdAt)}</span>
          </div>
          
          {(task.views || task.applicationCount) && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              {task.views && (
                <div className="flex items-center gap-1">
                  <Eye className={sizeStyles.icon} />
                  <span>{formatNumber(task.views)}</span>
                </div>
              )}
              
              {task.applicationCount && (
                <div className="flex items-center gap-1">
                  <Users className={sizeStyles.icon} />
                  <span>{task.applicationCount} 申请</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button
            size="sm"
            variant={task.isBookmarked ? 'default' : 'outline'}
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.();
            }}
          >
            <Bookmark className={cn(sizeStyles.icon, task.isBookmarked && 'fill-current')} />
            收藏
          </Button>
          
          {!task.hasApplied && task.status === 'published' ? (
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onApply?.();
              }}
            >
              申请
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled
            >
              {task.hasApplied ? '已申请' : '不可申请'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * TaskList 任务列表组件
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  view = 'grid',
  size = 'default',
  showSearch = true,
  showFilters = true,
  showSort = true,
  showViewToggle = true,
  showPagination = true,
  showStats = true,
  showActions = true,
  selectable = false,
  draggable = false,
  pageSize = 20,
  currentPage = 1,
  total,
  filters,
  sort,
  selectedIds = [],
  loading = false,
  error,
  emptyText = '暂无任务',
  emptyDescription = '当前没有符合条件的任务',
  onTaskClick,
  onTaskApply,
  onTaskBookmark,
  onTaskShare,
  onTaskReport,
  onTaskEdit,
  onTaskDelete,
  onSearch,
  onFiltersChange,
  onSortChange,
  onViewChange,
  onPageChange,
  onPageSizeChange,
  onSelectionChange,
  onDragEnd,
  className
}) => {
  const [localView, setLocalView] = useState(view);
  const [localFilters, setLocalFilters] = useState(filters || {});
  const [localSort, setLocalSort] = useState(sort || { field: 'created_at', direction: 'desc' });
  const [localSelectedIds, setLocalSelectedIds] = useState(selectedIds);
  
  const sizeStyles = sizeConfig[size];
  
  // 处理视图变化
  const handleViewChange = (newView: TaskListView) => {
    setLocalView(newView);
    onViewChange?.(newView);
  };
  
  // 处理过滤器变化
  const handleFiltersChange = (newFilters: TaskFilters) => {
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };
  
  // 处理排序变化
  const handleSortChange = (newSort: TaskSort) => {
    setLocalSort(newSort);
    onSortChange?.(newSort);
  };
  
  // 处理选择变化
  const handleSelectionChange = (taskId: string, selected: boolean) => {
    const newSelectedIds = selected 
      ? [...localSelectedIds, taskId]
      : localSelectedIds.filter(id => id !== taskId);
    
    setLocalSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };
  
  // 处理全选
  const handleSelectAll = (selected: boolean) => {
    const newSelectedIds = selected ? tasks.map(task => task.id) : [];
    setLocalSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };
  
  // 错误状态
  if (error) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <div className="text-lg font-semibold mb-2">加载失败</div>
        <div className="text-muted-foreground">{error}</div>
      </Card>
    );
  }
  
  // 加载状态
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* 工具栏骨架 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        
        {/* 任务列表骨架 */}
        <div className={cn(
          'grid gap-4',
          localView === 'grid' && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          localView === 'list' && 'grid-cols-1',
          localView === 'compact' && 'grid-cols-1'
        )}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className={sizeStyles.padding}>
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-300 rounded" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded" />
                  <div className="h-3 bg-gray-300 rounded w-5/6" />
                  <div className="h-3 bg-gray-300 rounded w-4/6" />
                </div>
                
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-300 rounded w-16" />
                  <div className="h-6 bg-gray-300 rounded w-16" />
                  <div className="h-6 bg-gray-300 rounded w-16" />
                </div>
                
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-300 rounded w-20" />
                  <div className="h-8 bg-gray-300 rounded w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // 空状态
  if (!tasks || tasks.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <div className="text-xl font-semibold mb-2">{emptyText}</div>
        <div className="text-muted-foreground mb-6">{emptyDescription}</div>
        
        <Button onClick={() => window.location.reload()}>
          <Plus className="w-4 h-4 mr-2" />
          刷新页面
        </Button>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* 工具栏 */}
      <div className="flex flex-col gap-4">
        {/* 搜索和过滤器 */}
        <div className="flex flex-col lg:flex-row gap-4">
          {showSearch && (
            <div className="flex-1">
              <SearchBox
                placeholder="搜索任务..."
                onSearch={onSearch}
                size={size}
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {showFilters && (
              /* FilterPanel 暂时注释，需要重构为 FilterConfig[] 格式 */
              /* <FilterPanel
                filters={localFilters}
                onFiltersChange={handleFiltersChange}
                size={size}
                mode="inline"
              /> */
              <div>过滤器功能开发中...</div>
            )}
            
            {showSort && (
              /* SortSelector 暂时注释，需要重构为 SortField[] 格式 */
              /* <SortSelector
                sort={localSort}
                onSortChange={handleSortChange}
                size={size}
                mode="dropdown"
              /> */
              <div>排序功能开发中...</div>
            )}
            
            {showViewToggle && (
              <div className="flex items-center border rounded-lg">
                <Button
                  size="sm"
                  variant={localView === 'grid' ? 'default' : 'ghost'}
                  onClick={() => handleViewChange('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant={localView === 'list' ? 'default' : 'ghost'}
                  onClick={() => handleViewChange('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant={localView === 'compact' ? 'default' : 'ghost'}
                  onClick={() => handleViewChange('compact')}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* 统计和批量操作 */}
        {(showStats || (selectable && localSelectedIds.length > 0)) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showStats && (
                <div className="text-sm text-muted-foreground">
                  共 {total || tasks.length} 个任务
                  {currentPage && pageSize && (
                    <span>
                      ，第 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total || tasks.length)} 个
                    </span>
                  )}
                </div>
              )}
              
              {selectable && (
                <div className="flex items-center gap-2">
                  <Checkbox
                      checked={localSelectedIds.length === tasks.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  
                  <span className="text-sm text-muted-foreground">
                    已选择 {localSelectedIds.length} 个
                  </span>
                </div>
              )}
            </div>
            
            {selectable && localSelectedIds.length > 0 && showActions && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // 批量收藏
                    localSelectedIds.forEach(id => {
                      const task = tasks.find(t => t.id === id);
                      if (task && !task.isBookmarked) {
                        onTaskBookmark?.(id);
                      }
                    });
                  }}
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  批量收藏
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // 批量分享
                    const selectedTasks = tasks.filter(task => localSelectedIds.includes(task.id));
                    selectedTasks.forEach(task => onTaskShare?.(task));
                  }}
                >
                  <Share className="w-4 h-4 mr-2" />
                  批量分享
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 任务列表 */}
      <div className={cn(
        'grid gap-4',
        localView === 'grid' && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        localView === 'list' && 'grid-cols-1',
        localView === 'compact' && 'grid-cols-1',
        localView === 'detailed' && 'grid-cols-1 lg:grid-cols-2'
      )}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            view={localView}
            size={size}
            selectable={selectable}
            selected={localSelectedIds.includes(task.id)}
            onSelect={(selected) => handleSelectionChange(task.id, selected)}
            onClick={() => onTaskClick?.(task)}
            onApply={() => onTaskApply?.(task.id)}
            onBookmark={() => onTaskBookmark?.(task.id)}
            onShare={() => onTaskShare?.(task)}
            onReport={() => onTaskReport?.(task.id)}
            onEdit={() => onTaskEdit?.(task)}
            onDelete={() => onTaskDelete?.(task.id)}
          />
        ))}
      </div>
      
      {/* 分页 */}
      {showPagination && total && total > pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {total} 个任务，每页显示 {pageSize} 个
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              上一页
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                const totalPages = Math.ceil(total / pageSize);
                
                if (page > totalPages) return null;
                
                return (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === currentPage ? 'default' : 'outline'}
                    onClick={() => onPageChange?.(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= Math.ceil(total / pageSize)}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};