import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart, LineChart, Activity, Target, Calendar, Users, Award, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';
import { Card } from '../ui/Card';

// 图表类型枚举
export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'donut' 
  | 'area' 
  | 'progress' 
  | 'radial' 
  | 'gauge'
  | 'heatmap'
  | 'radar';

// 时间范围枚举
export type TimeRange = 
  | 'today' 
  | 'week' 
  | 'month' 
  | 'quarter' 
  | 'year' 
  | 'all';

// 趋势方向枚举
export type TrendDirection = 'up' | 'down' | 'stable';

// 数据点接口
export interface DataPoint {
  /** 标签 */
  label: string;
  /** 值 */
  value: number;
  /** 颜色 */
  color?: string;
  /** 描述 */
  description?: string;
  /** 时间戳 */
  timestamp?: Date;
  /** 目标值 */
  target?: number;
  /** 是否高亮 */
  highlighted?: boolean;
  /** 额外数据 */
  metadata?: Record<string, any>;
}

// 图表数据接口
export interface ChartData {
  /** 数据集 */
  datasets: {
    /** 数据集名称 */
    name: string;
    /** 数据点 */
    data: DataPoint[];
    /** 颜色 */
    color?: string;
    /** 是否显示 */
    visible?: boolean;
    /** 数据集类型 */
    type?: 'line' | 'bar' | 'area';
  }[];
  /** X轴标签 */
  xAxisLabels?: string[];
  /** Y轴标签 */
  yAxisLabel?: string;
  /** 图表标题 */
  title?: string;
  /** 图表描述 */
  description?: string;
}

// 统计信息接口
export interface ChartStats {
  /** 当前值 */
  current: number;
  /** 上期值 */
  previous?: number;
  /** 目标值 */
  target?: number;
  /** 最大值 */
  max?: number;
  /** 最小值 */
  min?: number;
  /** 平均值 */
  average?: number;
  /** 总计 */
  total?: number;
  /** 增长率 */
  growthRate?: number;
  /** 完成率 */
  completionRate?: number;
  /** 趋势方向 */
  trend?: TrendDirection;
  /** 单位 */
  unit?: string;
  /** 格式化函数 */
  formatter?: (value: number) => string;
}

// ProgressChart 组件属性接口
export interface ProgressChartProps {
  /** 图表类型 */
  type?: ChartType;
  /** 图表数据 */
  data?: ChartData;
  /** 统计信息 */
  stats?: ChartStats;
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 显示变体 */
  variant?: 'default' | 'minimal' | 'detailed' | 'card' | 'compact';
  /** 时间范围 */
  timeRange?: TimeRange;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 是否显示网格 */
  showGrid?: boolean;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 是否显示统计 */
  showStats?: boolean;
  /** 是否显示趋势 */
  showTrend?: boolean;
  /** 是否显示目标线 */
  showTarget?: boolean;
  /** 是否动画效果 */
  animated?: boolean;
  /** 是否可交互 */
  interactive?: boolean;
  /** 高度 */
  height?: number;
  /** 宽度 */
  width?: number;
  /** 颜色主题 */
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray' | 'rainbow';
  /** 点击数据点回调 */
  onDataPointClick?: (dataPoint: DataPoint, datasetIndex: number, pointIndex: number) => void;
  /** 时间范围变化回调 */
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 颜色主题配置
const colorSchemes = {
  blue: {
    primary: '#3B82F6',
    secondary: '#93C5FD',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE']
  },
  green: {
    primary: '#10B981',
    secondary: '#6EE7B7',
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    text: 'text-green-600',
    colors: ['#10B981', '#34D399', '#6EE7B7', '#D1FAE5']
  },
  purple: {
    primary: '#8B5CF6',
    secondary: '#C4B5FD',
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#EDE9FE']
  },
  orange: {
    primary: '#F59E0B',
    secondary: '#FCD34D',
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7']
  },
  red: {
    primary: '#EF4444',
    secondary: '#FCA5A5',
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    text: 'text-red-600',
    colors: ['#EF4444', '#F87171', '#FCA5A5', '#FEE2E2']
  },
  gray: {
    primary: '#6B7280',
    secondary: '#D1D5DB',
    gradient: 'from-gray-500 to-gray-600',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    colors: ['#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6']
  },
  rainbow: {
    primary: '#3B82F6',
    secondary: '#93C5FD',
    gradient: 'from-blue-500 via-purple-500 to-pink-500',
    bg: 'bg-gradient-to-r from-blue-50 to-purple-50',
    text: 'text-blue-600',
    colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444']
  }
};

// 时间范围配置
const timeRangeConfig = {
  today: { label: '今天', icon: Calendar },
  week: { label: '本周', icon: Calendar },
  month: { label: '本月', icon: Calendar },
  quarter: { label: '本季度', icon: Calendar },
  year: { label: '本年', icon: Calendar },
  all: { label: '全部', icon: Calendar }
};

// 图表类型配置
const chartTypeConfig = {
  line: { label: '折线图', icon: LineChart },
  bar: { label: '柱状图', icon: BarChart3 },
  pie: { label: '饼图', icon: PieChart },
  donut: { label: '环形图', icon: PieChart },
  area: { label: '面积图', icon: Activity },
  progress: { label: '进度条', icon: Target },
  radial: { label: '径向图', icon: Target },
  gauge: { label: '仪表盘', icon: Target },
  heatmap: { label: '热力图', icon: BarChart3 },
  radar: { label: '雷达图', icon: Target }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'p-3 gap-2',
    height: 200,
    text: 'text-xs',
    title: 'text-sm font-medium',
    stat: 'text-lg font-bold',
    icon: 'w-4 h-4'
  },
  default: {
    container: 'p-4 gap-3',
    height: 300,
    text: 'text-sm',
    title: 'text-base font-medium',
    stat: 'text-xl font-bold',
    icon: 'w-5 h-5'
  },
  lg: {
    container: 'p-6 gap-4',
    height: 400,
    text: 'text-base',
    title: 'text-lg font-medium',
    stat: 'text-2xl font-bold',
    icon: 'w-6 h-6'
  }
};

// 格式化数值
const formatValue = (value: number, formatter?: (value: number) => string, unit?: string): string => {
  if (formatter) {
    return formatter(value);
  }
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M${unit || ''}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K${unit || ''}`;
  } else {
    return `${value}${unit || ''}`;
  }
};

// 计算增长率
const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// 计算完成率
const calculateCompletionRate = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

// 获取趋势方向
const getTrendDirection = (current: number, previous: number): TrendDirection => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
};

// 趋势图标组件
const TrendIcon: React.FC<{ direction: TrendDirection; className?: string }> = ({ direction, className }) => {
  switch (direction) {
    case 'up':
      return <TrendingUp className={cn('text-green-500', className)} />;
    case 'down':
      return <TrendingDown className={cn('text-red-500', className)} />;
    case 'stable':
    default:
      return <Minus className={cn('text-gray-500', className)} />;
  }
};

// 简单进度条图表
const SimpleProgressChart: React.FC<{
  stats: ChartStats;
  colorScheme: keyof typeof colorSchemes;
  size: 'sm' | 'default' | 'lg';
  showStats: boolean;
  showTrend: boolean;
}> = ({ stats, colorScheme, size, showStats, showTrend }) => {
  const colors = colorSchemes[colorScheme];
  const sizeStyles = sizeConfig[size];
  
  const completionRate = stats.target ? calculateCompletionRate(stats.current, stats.target) : 0;
  const growthRate = stats.previous ? calculateGrowthRate(stats.current, stats.previous) : 0;
  const trend = stats.previous ? getTrendDirection(stats.current, stats.previous) : 'stable';

  return (
    <div className="space-y-3">
      {showStats && (
        <div className="flex items-center justify-between">
          <div>
            <div className={cn('font-bold', sizeStyles.stat, colors.text)}>
              {formatValue(stats.current, stats.formatter, stats.unit)}
            </div>
            {stats.target && (
              <div className={cn('text-muted-foreground', sizeStyles.text)}>
                目标: {formatValue(stats.target, stats.formatter, stats.unit)}
              </div>
            )}
          </div>
          
          {showTrend && stats.previous && (
            <div className="flex items-center gap-1">
              <TrendIcon direction={trend} className={sizeStyles.icon} />
              <span className={cn(
                sizeStyles.text,
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              )}>
                {Math.abs(growthRate).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        <Progress 
          value={completionRate} 
          className={cn('h-3', size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3')}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>{completionRate.toFixed(1)}%</span>
          <span>{stats.target ? formatValue(stats.target, stats.formatter, stats.unit) : '100%'}</span>
        </div>
      </div>
    </div>
  );
};

// 径向进度图表
const RadialProgressChart: React.FC<{
  stats: ChartStats;
  colorScheme: keyof typeof colorSchemes;
  size: 'sm' | 'default' | 'lg';
  showStats: boolean;
}> = ({ stats, colorScheme, size, showStats }) => {
  const colors = colorSchemes[colorScheme];
  const sizeStyles = sizeConfig[size];
  
  const completionRate = stats.target ? calculateCompletionRate(stats.current, stats.target) : 0;
  const radius = size === 'sm' ? 40 : size === 'lg' ? 60 : 50;
  const strokeWidth = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* 背景圆环 */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          
          {/* 进度圆环 */}
          <circle
            stroke={colors.primary}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        
        {/* 中心文本 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showStats && (
            <>
              <div className={cn('font-bold', colors.text, size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base')}>
                {completionRate.toFixed(0)}%
              </div>
              <div className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
                {formatValue(stats.current, stats.formatter, stats.unit)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 仪表盘图表
const GaugeChart: React.FC<{
  stats: ChartStats;
  colorScheme: keyof typeof colorSchemes;
  size: 'sm' | 'default' | 'lg';
  showStats: boolean;
}> = ({ stats, colorScheme, size, showStats }) => {
  const colors = colorSchemes[colorScheme];
  const sizeStyles = sizeConfig[size];
  
  const completionRate = stats.target ? calculateCompletionRate(stats.current, stats.target) : 0;
  const radius = size === 'sm' ? 50 : size === 'lg' ? 70 : 60;
  const strokeWidth = size === 'sm' ? 8 : size === 'lg' ? 12 : 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * Math.PI; // 半圆
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          height={radius + 20}
          width={radius * 2}
          className="overflow-visible"
        >
          {/* 背景弧线 */}
          <path
            d={`M ${strokeWidth} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth} ${radius}`}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          
          {/* 进度弧线 */}
          <path
            d={`M ${strokeWidth} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth} ${radius}`}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-in-out"
          />
          
          {/* 指针 */}
          <g transform={`translate(${radius}, ${radius})`}>
            <line
              x1="0"
              y1="0"
              x2={`${(normalizedRadius - 10) * Math.cos((completionRate / 100) * Math.PI - Math.PI)}`}
              y2={`${(normalizedRadius - 10) * Math.sin((completionRate / 100) * Math.PI - Math.PI)}`}
              stroke={colors.primary}
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
            <circle
              cx="0"
              cy="0"
              r="4"
              fill={colors.primary}
            />
          </g>
        </svg>
        
        {/* 底部文本 */}
        {showStats && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
            <div className={cn('font-bold', colors.text, sizeStyles.stat)}>
              {formatValue(stats.current, stats.formatter, stats.unit)}
            </div>
            {stats.target && (
              <div className={cn('text-muted-foreground', sizeStyles.text)}>
                / {formatValue(stats.target, stats.formatter, stats.unit)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 简单柱状图
const SimpleBarChart: React.FC<{
  data: ChartData;
  colorScheme: keyof typeof colorSchemes;
  size: 'sm' | 'default' | 'lg';
  height: number;
}> = ({ data, colorScheme, size, height }) => {
  const colors = colorSchemes[colorScheme];
  const sizeStyles = sizeConfig[size];
  
  if (!data.datasets.length || !data.datasets[0].data.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className={sizeStyles.text}>暂无数据</div>
        </div>
      </div>
    );
  }
  
  const dataset = data.datasets[0];
  const maxValue = Math.max(...dataset.data.map(d => d.value));
  const barWidth = Math.max(20, (100 / dataset.data.length) - 2);

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between" style={{ height: height - 40 }}>
        {dataset.data.map((point, index) => {
          const barHeight = (point.value / maxValue) * (height - 60);
          const color = point.color || colors.colors[index % colors.colors.length];
          
          return (
            <Tooltip
              key={index}
              content={
                <div className="text-sm">
                  <div className="font-medium">{point.label}</div>
                  <div className="text-muted-foreground">{point.value}</div>
                  {point.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {point.description}
                    </div>
                  )}
                </div>
              }
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className="rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{
                    width: `${barWidth}px`,
                    height: `${barHeight}px`,
                    backgroundColor: color,
                    minHeight: '4px'
                  }}
                />
                <div className={cn('text-center text-muted-foreground', sizeStyles.text)}>
                  {point.label}
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

// 简单折线图
const SimpleLineChart: React.FC<{
  data: ChartData;
  colorScheme: keyof typeof colorSchemes;
  size: 'sm' | 'default' | 'lg';
  height: number;
}> = ({ data, colorScheme, size, height }) => {
  const colors = colorSchemes[colorScheme];
  const sizeStyles = sizeConfig[size];
  
  if (!data.datasets.length || !data.datasets[0].data.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <LineChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className={sizeStyles.text}>暂无数据</div>
        </div>
      </div>
    );
  }
  
  const dataset = data.datasets[0];
  const maxValue = Math.max(...dataset.data.map(d => d.value));
  const minValue = Math.min(...dataset.data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;
  const chartHeight = height - 60;
  const chartWidth = 300;
  const pointSpacing = chartWidth / (dataset.data.length - 1 || 1);

  // 生成路径
  const pathData = dataset.data.map((point, index) => {
    const x = index * pointSpacing;
    const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="space-y-2">
      <div className="relative" style={{ height: height - 40 }}>
        <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* 网格线 */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />
          
          {/* 面积填充 */}
          <path
            d={`${pathData} L ${(dataset.data.length - 1) * pointSpacing} ${chartHeight} L 0 ${chartHeight} Z`}
            fill={colors.primary}
            fillOpacity="0.1"
          />
          
          {/* 折线 */}
          <path
            d={pathData}
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* 数据点 */}
          {dataset.data.map((point, index) => {
            const x = index * pointSpacing;
            const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            
            return (
              <Tooltip
                key={index}
                content={
                  <div className="text-sm">
                    <div className="font-medium">{point.label}</div>
                    <div className="text-muted-foreground">{point.value}</div>
                    {point.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {point.description}
                      </div>
                    )}
                  </div>
                }
              >
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={colors.primary}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-6 transition-all duration-200"
                />
              </Tooltip>
            );
          })}
        </svg>
        
        {/* X轴标签 */}
        <div className="flex justify-between mt-2">
          {dataset.data.map((point, index) => (
            <div key={index} className={cn('text-center text-muted-foreground', sizeStyles.text)}>
              {point.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * ProgressChart 进度图表组件
 */
export const ProgressChart: React.FC<ProgressChartProps> = ({
  type = 'progress',
  data,
  stats,
  title,
  description,
  size = 'default',
  variant = 'default',
  timeRange = 'month',
  showLegend = false,
  showGrid = true,
  showTooltip = true,
  showStats = true,
  showTrend = true,
  showTarget = true,
  animated = true,
  interactive = true,
  height,
  width,
  colorScheme = 'blue',
  onDataPointClick,
  onTimeRangeChange,
  className
}) => {
  const colors = colorSchemes[colorScheme];
  const sizeStyles = sizeConfig[size];
  const chartHeight = height || sizeStyles.height;
  const typeConfig = chartTypeConfig[type];
  const timeConfig = timeRangeConfig[timeRange];
  const IconComponent = typeConfig.icon;

  // 如果没有数据和统计信息，显示空状态
  if (!data && !stats) {
    return (
      <div className={cn(
        'rounded-lg border bg-white shadow-sm',
        sizeStyles.container,
        className
      )}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <IconComponent className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className={sizeStyles.title}>暂无数据</div>
            <div className={sizeStyles.text}>请提供图表数据或统计信息</div>
          </div>
        </div>
      </div>
    );
  }

  // 紧凑模式
  if (variant === 'compact') {
    return (
      <div className={cn(
        'inline-flex items-center rounded-lg border bg-white',
        sizeStyles.container,
        className
      )}>
        <div className={cn('p-2 rounded-full', colors.bg)}>
          <IconComponent className={cn(sizeStyles.icon, colors.text)} />
        </div>
        
        <div className="flex flex-col">
          {title && (
            <span className={cn('font-medium', sizeStyles.title)}>
              {title}
            </span>
          )}
          
          {stats && (
            <div className="flex items-center gap-2">
              <span className={cn('font-bold', colors.text, sizeStyles.text)}>
                {formatValue(stats.current, stats.formatter, stats.unit)}
              </span>
              
              {showTrend && stats.previous && (
                <div className="flex items-center gap-1">
                  <TrendIcon 
                    direction={getTrendDirection(stats.current, stats.previous)} 
                    className="w-3 h-3" 
                  />
                  <span className={cn('text-xs', 
                    getTrendDirection(stats.current, stats.previous) === 'up' ? 'text-green-600' : 
                    getTrendDirection(stats.current, stats.previous) === 'down' ? 'text-red-600' : 'text-gray-600'
                  )}>
                    {Math.abs(calculateGrowthRate(stats.current, stats.previous)).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 最小模式
  if (variant === 'minimal') {
    return (
      <div className={cn('space-y-2', className)}>
        {title && (
          <div className={cn('font-medium', sizeStyles.title)}>
            {title}
          </div>
        )}
        
        {stats && type === 'progress' && (
          <SimpleProgressChart
            stats={stats}
            colorScheme={colorScheme}
            size={size}
            showStats={showStats}
            showTrend={showTrend}
          />
        )}
        
        {data && type === 'bar' && (
          <SimpleBarChart
            data={data}
            colorScheme={colorScheme}
            size={size}
            height={chartHeight}
          />
        )}
        
        {data && type === 'line' && (
          <SimpleLineChart
            data={data}
            colorScheme={colorScheme}
            size={size}
            height={chartHeight}
          />
        )}
      </div>
    );
  }

  // 卡片模式（默认）
  const content = (
    <div className={cn(
      'rounded-lg border bg-white shadow-sm',
      sizeStyles.container,
      className
    )}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-full', colors.bg)}>
            <IconComponent className={cn(sizeStyles.icon, colors.text)} />
          </div>
          
          <div>
            {title && (
              <div className={cn('font-medium', sizeStyles.title)}>
                {title}
              </div>
            )}
            {description && (
              <div className={cn('text-muted-foreground', sizeStyles.text)}>
                {description}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onTimeRangeChange && (
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => {
                // 这里可以实现时间范围选择器
                const ranges: TimeRange[] = ['today', 'week', 'month', 'quarter', 'year', 'all'];
                const currentIndex = ranges.indexOf(timeRange);
                const nextIndex = (currentIndex + 1) % ranges.length;
                onTimeRangeChange(ranges[nextIndex]);
              }}
            >
              <timeConfig.icon className="w-3 h-3 mr-1" />
              {timeConfig.label}
            </Badge>
          )}
          
          {showTrend && stats && stats.previous && (
            <div className="flex items-center gap-1">
              <TrendIcon 
                direction={getTrendDirection(stats.current, stats.previous)} 
                className={sizeStyles.icon} 
              />
              <span className={cn(
                sizeStyles.text,
                getTrendDirection(stats.current, stats.previous) === 'up' ? 'text-green-600' : 
                getTrendDirection(stats.current, stats.previous) === 'down' ? 'text-red-600' : 'text-gray-600'
              )}>
                {Math.abs(calculateGrowthRate(stats.current, stats.previous)).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* 图表内容 */}
      <div style={{ height: chartHeight }}>
        {stats && type === 'progress' && (
          <SimpleProgressChart
            stats={stats}
            colorScheme={colorScheme}
            size={size}
            showStats={showStats}
            showTrend={showTrend}
          />
        )}
        
        {stats && type === 'radial' && (
          <RadialProgressChart
            stats={stats}
            colorScheme={colorScheme}
            size={size}
            showStats={showStats}
          />
        )}
        
        {stats && type === 'gauge' && (
          <GaugeChart
            stats={stats}
            colorScheme={colorScheme}
            size={size}
            showStats={showStats}
          />
        )}
        
        {data && type === 'bar' && (
          <SimpleBarChart
            data={data}
            colorScheme={colorScheme}
            size={size}
            height={chartHeight}
          />
        )}
        
        {data && type === 'line' && (
          <SimpleLineChart
            data={data}
            colorScheme={colorScheme}
            size={size}
            height={chartHeight}
          />
        )}
        
        {data && (type === 'pie' || type === 'donut') && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <PieChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className={sizeStyles.text}>饼图功能开发中</div>
            </div>
          </div>
        )}
      </div>
      
      {/* 统计信息 */}
      {showStats && stats && variant === 'detailed' && (
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="grid grid-cols-2 gap-4">
            {stats.target && (
              <div>
                <div className={cn('text-muted-foreground', sizeStyles.text)}>目标</div>
                <div className={cn('font-medium', sizeStyles.text)}>
                  {formatValue(stats.target, stats.formatter, stats.unit)}
                </div>
              </div>
            )}
            
            {stats.average && (
              <div>
                <div className={cn('text-muted-foreground', sizeStyles.text)}>平均</div>
                <div className={cn('font-medium', sizeStyles.text)}>
                  {formatValue(stats.average, stats.formatter, stats.unit)}
                </div>
              </div>
            )}
            
            {stats.max && (
              <div>
                <div className={cn('text-muted-foreground', sizeStyles.text)}>最大</div>
                <div className={cn('font-medium', sizeStyles.text)}>
                  {formatValue(stats.max, stats.formatter, stats.unit)}
                </div>
              </div>
            )}
            
            {stats.min && (
              <div>
                <div className={cn('text-muted-foreground', sizeStyles.text)}>最小</div>
                <div className={cn('font-medium', sizeStyles.text)}>
                  {formatValue(stats.min, stats.formatter, stats.unit)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 图例 */}
      {showLegend && data && data.datasets.length > 1 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-3">
            {data.datasets.map((dataset, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dataset.color || colors.colors[index % colors.colors.length] }}
                />
                <span className={cn('text-muted-foreground', sizeStyles.text)}>
                  {dataset.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return content;
};

// 类型已在文件开头导出

export default ProgressChart;