import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  AccountTree,
  Timeline,
  Radar,
  Add,
  ZoomIn,
  ZoomOut,
  Refresh,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// 知识节点类型定义
interface KnowledgeNode {
  id: string;
  title: string;
  category: string;
  level: number; // 掌握程度 1-5
  tags: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
  connections: string[]; // 关联的其他节点ID
  position: { x: number; y: number; z: number };
  color: string;
  size: number;
}

// 学习路径类型
// 移除未使用的接口定义

const KnowledgeGraph: React.FC = () => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'radar'>(
    'graph'
  );
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [openNodeDialog, setOpenNodeDialog] = useState(false);
  // 移除未使用的路径对话框状态
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLevel, setFilterLevel] = useState([1, 5]);

  // 模拟数据
  const [knowledgeNodes] = useState<KnowledgeNode[]>([
    {
      id: '1',
      title: 'React 基础',
      category: '前端开发',
      level: 4,
      tags: ['JavaScript', 'UI', '组件'],
      description: 'React 框架的基础概念和使用方法',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      connections: ['2', '3'],
      position: { x: 0, y: 0, z: 0 },
      color: '#61DAFB',
      size: 20,
    },
    {
      id: '2',
      title: 'TypeScript',
      category: '编程语言',
      level: 3,
      tags: ['类型系统', '静态检查'],
      description: 'JavaScript 的超集，提供静态类型检查',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      connections: ['1', '4'],
      position: { x: 100, y: 50, z: 0 },
      color: '#3178C6',
      size: 18,
    },
    {
      id: '3',
      title: 'Node.js',
      category: '后端开发',
      level: 3,
      tags: ['服务器', 'JavaScript'],
      description: 'JavaScript 运行时环境',
      createdAt: '2024-01-12',
      updatedAt: '2024-01-22',
      connections: ['1', '5'],
      position: { x: -80, y: 80, z: 0 },
      color: '#339933',
      size: 16,
    },
    {
      id: '4',
      title: 'GraphQL',
      category: 'API设计',
      level: 2,
      tags: ['查询语言', 'API'],
      description: 'API 查询语言和运行时',
      createdAt: '2024-01-25',
      updatedAt: '2024-01-25',
      connections: ['2'],
      position: { x: 150, y: -30, z: 0 },
      color: '#E10098',
      size: 14,
    },
    {
      id: '5',
      title: 'Docker',
      category: '运维部署',
      level: 3,
      tags: ['容器化', '部署'],
      description: '容器化平台',
      createdAt: '2024-01-20',
      updatedAt: '2024-01-24',
      connections: ['3'],
      position: { x: -120, y: 150, z: 0 },
      color: '#2496ED',
      size: 16,
    },
  ]);

  // 技能维度数据（用于雷达图）
  const skillDimensions = [
    { name: '前端开发', value: 85, maxValue: 100, color: '#61DAFB' },
    { name: '后端开发', value: 70, maxValue: 100, color: '#339933' },
    { name: '数据库', value: 60, maxValue: 100, color: '#336791' },
    { name: '运维部署', value: 55, maxValue: 100, color: '#2496ED' },
    { name: '算法设计', value: 75, maxValue: 100, color: '#FF6B6B' },
    { name: '系统架构', value: 65, maxValue: 100, color: '#4ECDC4' },
  ];

  // 绘制知识图谱
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置画布中心
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 绘制连接线
    ctx.strokeStyle = theme.palette.divider;
    ctx.lineWidth = 2;
    knowledgeNodes.forEach((node) => {
      node.connections.forEach((connectionId) => {
        const connectedNode = knowledgeNodes.find((n) => n.id === connectionId);
        if (connectedNode) {
          ctx.beginPath();
          ctx.moveTo(
            centerX + node.position.x * zoomLevel,
            centerY + node.position.y * zoomLevel
          );
          ctx.lineTo(
            centerX + connectedNode.position.x * zoomLevel,
            centerY + connectedNode.position.y * zoomLevel
          );
          ctx.stroke();
        }
      });
    });

    // 绘制节点
    knowledgeNodes.forEach((node) => {
      if (filterCategory !== 'all' && node.category !== filterCategory) return;
      if (node.level < filterLevel[0] || node.level > filterLevel[1]) return;

      const x = centerX + node.position.x * zoomLevel;
      const y = centerY + node.position.y * zoomLevel;
      const radius = node.size * zoomLevel;

      // 绘制节点圆圈
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // 绘制节点边框
      ctx.strokeStyle = theme.palette.background.paper;
      ctx.lineWidth = 3;
      ctx.stroke();

      // 绘制节点标题
      ctx.fillStyle = theme.palette.text.primary;
      ctx.font = `${12 * zoomLevel}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(node.title, x, y + radius + 20 * zoomLevel);

      // 绘制掌握程度指示器
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < node.level ? node.color : theme.palette.divider;
        ctx.fillRect(
          x - 25 * zoomLevel + i * 10 * zoomLevel,
          y + radius + 25 * zoomLevel,
          8 * zoomLevel,
          3 * zoomLevel
        );
      }
    });
  }, [knowledgeNodes, theme, zoomLevel, filterCategory, filterLevel]);

  // 处理画布点击
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 检查点击的节点
    knowledgeNodes.forEach((node) => {
      const nodeX = centerX + node.position.x * zoomLevel;
      const nodeY = centerY + node.position.y * zoomLevel;
      const radius = node.size * zoomLevel;

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= radius) {
        setSelectedNode(node);
        setOpenNodeDialog(true);
      }
    });
  };

  // 渲染时间轴视图
  const renderTimelineView = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontFamily: 'JetBrains Mono' }}>
        📚 学习时间轴
      </Typography>
      <Box sx={{ position: 'relative', pl: 4 }}>
        {/* 时间轴线 */}
        <Box
          sx={{
            position: 'absolute',
            left: 20,
            top: 0,
            bottom: 0,
            width: 2,
            bgcolor: theme.palette.primary.main,
          }}
        />
        {knowledgeNodes
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .map((node) => (
            <Box key={node.id} sx={{ mb: 4, position: 'relative' }}>
              {/* 时间点 */}
              <Box
                sx={{
                  position: 'absolute',
                  left: -28,
                  top: 8,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: node.color,
                  border: `3px solid ${theme.palette.background.paper}`,
                }}
              />
              <Card
                sx={{
                  ml: 2,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontFamily: 'JetBrains Mono' }}
                    >
                      {node.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {node.createdAt}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {node.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={node.category}
                      size="small"
                      sx={{ bgcolor: node.color, color: 'white' }}
                    />
                    {node.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption">掌握程度:</Typography>
                    {[...Array(5)].map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor:
                            i < node.level ? node.color : theme.palette.divider,
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
      </Box>
    </Box>
  );

  // 渲染雷达图视图
  const renderRadarView = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontFamily: 'JetBrains Mono' }}>
        🎯 技能雷达图
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* 雷达图画布 */}
        <Card sx={{ flex: '1 1 400px', p: 3 }}>
          <canvas
            width={300}
            height={300}
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '300px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
            }}
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  // 绘制雷达图背景
                  const centerX = 150;
                  const centerY = 150;
                  const maxRadius = 120;

                  ctx.clearRect(0, 0, 300, 300);

                  // 绘制同心圆
                  for (let i = 1; i <= 5; i++) {
                    ctx.beginPath();
                    ctx.arc(
                      centerX,
                      centerY,
                      (maxRadius / 5) * i,
                      0,
                      2 * Math.PI
                    );
                    ctx.strokeStyle = theme.palette.divider;
                    ctx.stroke();
                  }

                  // 绘制轴线
                  const angleStep = (2 * Math.PI) / skillDimensions.length;
                  skillDimensions.forEach((_, index) => {
                    const angle = index * angleStep - Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(
                      centerX + Math.cos(angle) * maxRadius,
                      centerY + Math.sin(angle) * maxRadius
                    );
                    ctx.strokeStyle = theme.palette.divider;
                    ctx.stroke();
                  });

                  // 绘制数据多边形
                  ctx.beginPath();
                  skillDimensions.forEach((skill, index) => {
                    const angle = index * angleStep - Math.PI / 2;
                    const radius = (skill.value / skill.maxValue) * maxRadius;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;

                    if (index === 0) {
                      ctx.moveTo(x, y);
                    } else {
                      ctx.lineTo(x, y);
                    }
                  });
                  ctx.closePath();
                  ctx.fillStyle = `${theme.palette.primary.main}40`;
                  ctx.fill();
                  ctx.strokeStyle = theme.palette.primary.main;
                  ctx.lineWidth = 2;
                  ctx.stroke();

                  // 绘制数据点
                  skillDimensions.forEach((skill, index) => {
                    const angle = index * angleStep - Math.PI / 2;
                    const radius = (skill.value / skill.maxValue) * maxRadius;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;

                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, 2 * Math.PI);
                    ctx.fillStyle = skill.color;
                    ctx.fill();
                  });

                  // 绘制标签
                  ctx.fillStyle = theme.palette.text.primary;
                  ctx.font = '12px JetBrains Mono';
                  ctx.textAlign = 'center';
                  skillDimensions.forEach((skill, index) => {
                    const angle = index * angleStep - Math.PI / 2;
                    const labelRadius = maxRadius + 20;
                    const x = centerX + Math.cos(angle) * labelRadius;
                    const y = centerY + Math.sin(angle) * labelRadius;

                    ctx.fillText(skill.name, x, y);
                  });
                }
              }
            }}
          />
        </Card>

        {/* 技能详情 */}
        <Box sx={{ flex: '1 1 300px' }}>
          {skillDimensions.map((skill) => (
            <Box key={skill.name} sx={{ mb: 2 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'JetBrains Mono' }}
                >
                  {skill.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {skill.value}/{skill.maxValue}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  bgcolor: theme.palette.divider,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${(skill.value / skill.maxValue) * 100}%`,
                    height: '100%',
                    bgcolor: skill.color,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  useEffect(() => {
    if (viewMode === 'graph') {
      drawGraph();
    }
  }, [
    knowledgeNodes,
    zoomLevel,
    filterCategory,
    filterLevel,
    viewMode,
    theme,
    drawGraph,
  ]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}
        >
          🧠 个人知识图谱
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="图谱视图">
            <IconButton
              onClick={() => setViewMode('graph')}
              color={viewMode === 'graph' ? 'primary' : 'default'}
            >
              <AccountTree />
            </IconButton>
          </Tooltip>
          <Tooltip title="时间轴视图">
            <IconButton
              onClick={() => setViewMode('timeline')}
              color={viewMode === 'timeline' ? 'primary' : 'default'}
            >
              <Timeline />
            </IconButton>
          </Tooltip>
          <Tooltip title="技能雷达">
            <IconButton
              onClick={() => setViewMode('radar')}
              color={viewMode === 'radar' ? 'primary' : 'default'}
            >
              <Radar />
            </IconButton>
          </Tooltip>

          {viewMode === 'graph' && (
            <>
              <Tooltip title="放大">
                <IconButton
                  onClick={() =>
                    setZoomLevel((prev) => Math.min(prev + 0.2, 3))
                  }
                >
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="缩小">
                <IconButton
                  onClick={() =>
                    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))
                  }
                >
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="重置视图">
                <IconButton onClick={() => setZoomLevel(1)}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </>
          )}

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenNodeDialog(true)}
            sx={{ ml: 2 }}
          >
            添加知识点
          </Button>
        </Box>
      </Box>

      {/* 侧边栏过滤器 */}
      {viewMode === 'graph' && (
        <Box
          sx={{
            position: 'absolute',
            top: 80,
            left: 16,
            width: 250,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
            zIndex: 10,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontFamily: 'JetBrains Mono' }}>
            🔍 筛选器
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>分类</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="分类"
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="前端开发">前端开发</MenuItem>
              <MenuItem value="后端开发">后端开发</MenuItem>
              <MenuItem value="编程语言">编程语言</MenuItem>
              <MenuItem value="API设计">API设计</MenuItem>
              <MenuItem value="运维部署">运维部署</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ mb: 1 }}>
            掌握程度: {filterLevel[0]} - {filterLevel[1]}
          </Typography>
          <Slider
            value={filterLevel}
            onChange={(_, newValue) => setFilterLevel(newValue as number[])}
            valueLabelDisplay="auto"
            min={1}
            max={5}
            marks={[
              { value: 1, label: '1' },
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
              { value: 5, label: '5' },
            ]}
          />
        </Box>
      )}

      {/* 主内容区域 */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {viewMode === 'graph' && (
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            onClick={handleCanvasClick}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              backgroundColor: theme.palette.background.default,
            }}
          />
        )}
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'radar' && renderRadarView()}
      </Box>

      {/* 节点详情对话框 */}
      <Dialog
        open={openNodeDialog}
        onClose={() => setOpenNodeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedNode ? '编辑知识点' : '添加知识点'}</DialogTitle>
        <DialogContent>
          {/* 这里可以添加节点编辑表单 */}
          <Typography>知识点编辑表单将在这里实现</Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default KnowledgeGraph;
