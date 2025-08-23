import React, { useState } from 'react';

import {
  AccountTree,
  Timeline,
  Psychology,
  Add,
  Settings,
  Analytics,
  Download,
  Upload,
  TrendingUp,
  EmojiEvents,
  Insights,
  AutoGraph,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import CognitiveGrowth from './components/CognitiveGrowth';
import InteractionManager from './components/InteractionManager';
import KnowledgeGraph from './components/KnowledgeGraph';
import LearningPath from './components/LearningPath';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`knowledge-tabpanel-${index}`}
      aria-labelledby={`knowledge-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const KnowledgeBase: React.FC = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const speedDialActions = [
    { icon: <Add />, name: '创建知识', action: () => console.log('创建知识') },
    {
      icon: <Upload />,
      name: '导入数据',
      action: () => console.log('导入数据'),
    },
    {
      icon: <Download />,
      name: '导出数据',
      action: () => console.log('导出数据'),
    },
    {
      icon: <Analytics />,
      name: '数据分析',
      action: () => console.log('数据分析'),
    },
    {
      icon: <Settings />,
      name: '系统设置',
      action: () => console.log('系统设置'),
    },
  ];

  // 统计数据
  const stats = {
    totalNodes: 156,
    totalConnections: 89,
    learningPaths: 8,
    completedMilestones: 23,
    cognitiveGrowth: 15.2,
    weeklyProgress: 8.5,
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部欢迎区域 */}
      <Paper
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
          p: 3,
          mb: 0,
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'JetBrains Mono',
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              🧠 个人知识图谱
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontFamily: 'JetBrains Mono' }}
            >
              Personal Time-Space Multi-dimensional Knowledge Graph
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              记录个人认知发展轨迹，构建多维度知识体系，规划成长路线
            </Typography>
          </Box>

          {/* 快速统计 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              maxWidth: 400,
            }}
          >
            <Card sx={{ textAlign: 'center', bgcolor: 'background.paper' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography
                  variant="h4"
                  color="primary"
                  sx={{ fontFamily: 'JetBrains Mono' }}
                >
                  {stats.totalNodes}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  知识节点
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ textAlign: 'center', bgcolor: 'background.paper' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography
                  variant="h4"
                  color="secondary"
                  sx={{ fontFamily: 'JetBrains Mono' }}
                >
                  {stats.learningPaths}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  学习路径
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ textAlign: 'center', bgcolor: 'background.paper' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography
                  variant="h4"
                  color="success.main"
                  sx={{ fontFamily: 'JetBrains Mono' }}
                >
                  +{stats.cognitiveGrowth}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  认知增长
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ textAlign: 'center', bgcolor: 'background.paper' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography
                  variant="h4"
                  color="warning.main"
                  sx={{ fontFamily: 'JetBrains Mono' }}
                >
                  {stats.weeklyProgress}h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  本周学习
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Paper>

      {/* 导航标签 */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="knowledge base tabs"
          sx={{
            px: 3,
            '& .MuiTab-root': {
              fontFamily: 'JetBrains Mono',
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '1rem',
              minHeight: 64,
            },
          }}
        >
          <Tab
            icon={<AccountTree />}
            iconPosition="start"
            label="知识图谱"
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<Timeline />}
            iconPosition="start"
            label="学习路径"
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<Psychology />}
            iconPosition="start"
            label="认知成长"
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<Settings />}
            iconPosition="start"
            label="交互管理"
            sx={{ gap: 1 }}
          />
        </Tabs>
      </Box>

      {/* 内容区域 */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={currentTab} index={0}>
          <KnowledgeGraph />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <LearningPath />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <CognitiveGrowth />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <InteractionManager />
        </TabPanel>
      </Box>

      {/* 快速操作悬浮按钮 */}
      <SpeedDial
        ariaLabel="快速操作"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          '& .MuiSpeedDial-fab': {
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #1BA3D3 90%)',
            },
          },
        }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
        direction="up"
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.action();
              setSpeedDialOpen(false);
            }}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                },
              },
            }}
          />
        ))}
      </SpeedDial>

      {/* 底部快捷操作 */}
      <Paper
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Insights />}
            size="small"
            sx={{ fontFamily: 'JetBrains Mono' }}
          >
            生成学习报告
          </Button>
          <Button
            variant="outlined"
            startIcon={<AutoGraph />}
            size="small"
            sx={{ fontFamily: 'JetBrains Mono' }}
          >
            导出知识图谱
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmojiEvents />}
            size="small"
            sx={{ fontFamily: 'JetBrains Mono' }}
          >
            查看成就
          </Button>
          <Button
            variant="contained"
            startIcon={<TrendingUp />}
            size="small"
            sx={{ fontFamily: 'JetBrains Mono' }}
          >
            AI 学习建议
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default KnowledgeBase;
