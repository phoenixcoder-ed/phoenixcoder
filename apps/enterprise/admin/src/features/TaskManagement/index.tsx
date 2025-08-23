import React, { useState } from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';

import { Box, Tabs, Tab, Paper } from '@mui/material';

import TaskAnalytics from './components/TaskAnalytics';
import TaskCategories from './components/TaskCategories';
import TaskDetail from './components/TaskDetail';
import TaskList from './components/TaskList';
import TaskReports from './components/TaskReports';

/**
 * 任务管理主模块
 * 包含任务列表、详情、分析、分类管理等功能
 */
const TaskManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="任务列表" />
          <Tab label="任务分析" />
          <Tab label="分类管理" />
          <Tab label="报告统计" />
        </Tabs>
      </Paper>

      <Routes>
        <Route path="/" element={<Navigate to="/tasks/list" replace />} />
        <Route path="/list" element={<TaskList />} />
        <Route path="/detail/:id" element={<TaskDetail />} />
        <Route path="/analytics" element={<TaskAnalytics />} />
        <Route path="/categories" element={<TaskCategories />} />
        <Route path="/reports" element={<TaskReports />} />
      </Routes>
    </Box>
  );
};

export default TaskManagement;
