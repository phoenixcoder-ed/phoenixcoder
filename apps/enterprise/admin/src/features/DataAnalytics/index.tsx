import React, { useState, useEffect } from 'react';

import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';

// 统计卡片组件
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2, color: 'primary.main' }}>{icon}</Box>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {trend && (
          <Typography
            variant="body2"
            sx={{
              color: trend.isPositive ? 'success.main' : 'error.main',
            }}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}% 相比上月
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * 数据分析模块
 */
const DataAnalytics: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalRevenue: 0,
    completionRate: 0,
  });

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setStats({
        totalUsers: 1250,
        totalTasks: 856,
        totalRevenue: 125000,
        completionRate: 87.5,
      });
    }, 1000);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        数据分析
      </Typography>

      {/* 统计卡片 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <StatCard
          title="总用户数"
          value={stats.totalUsers.toLocaleString()}
          icon={<PeopleIcon />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="总任务数"
          value={stats.totalTasks.toLocaleString()}
          icon={<AssignmentIcon />}
          trend={{ value: 8.3, isPositive: true }}
        />
        <StatCard
          title="总收入"
          value={`¥${stats.totalRevenue.toLocaleString()}`}
          icon={<MoneyIcon />}
          trend={{ value: 15.2, isPositive: true }}
        />
        <StatCard
          title="完成率"
          value={`${stats.completionRate}%`}
          icon={<TrendingUpIcon />}
          trend={{ value: -2.1, isPositive: false }}
        />
      </Box>

      {/* 详细分析 */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="用户分析" />
          <Tab label="任务分析" />
          <Tab label="收入分析" />
          <Tab label="趋势分析" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {currentTab === 0 && <Typography>用户分析图表开发中...</Typography>}
          {currentTab === 1 && <Typography>任务分析图表开发中...</Typography>}
          {currentTab === 2 && <Typography>收入分析图表开发中...</Typography>}
          {currentTab === 3 && <Typography>趋势分析图表开发中...</Typography>}
        </Box>
      </Paper>
    </Box>
  );
};

export default DataAnalytics;
