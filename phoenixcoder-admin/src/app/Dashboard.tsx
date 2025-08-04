import React from 'react';
import { useGetIdentity } from 'react-admin';
import { Card, CardContent, Typography, Grid, Box, Avatar, Chip } from '@mui/material';
import { GridProps } from '@mui/material/Grid';
import { OverridableStringUnion } from '@mui/types';
import { GridSize } from '@mui/material/Grid';
import { SvgIconProps } from '@mui/material/SvgIcon';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import { People, Store, Business, BarChart, CalendarToday, CheckCircle, Star, AccessTime, Work } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const Dashboard = () => {
  const { data: user, isLoading } = useGetIdentity();
  const theme = useTheme();

  if (isLoading) return <div>加载中...</div>;

  // 模拟用户等级和成长分数据
  const userLevel = user?.level || 1;
  const userPoints = user?.points || 0;
  const nextLevelPoints = 100 * userLevel;

  // 卡片通用样式
  const cardCommonStyle = {
    height: '100%',
    boxShadow: theme.shadows[2],
    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
    '&:hover': {
      boxShadow: theme.shadows[6],
      transform: 'translateY(-4px)',
    },
    borderRadius: '12px',
  };

  // 标题样式
  const titleStyle = {
    fontWeight: 600,
    color: theme.palette.text.secondary,
    fontSize: '1rem',
  };

  // 数值样式
  const valueStyle = {
    fontWeight: 700,
    fontSize: '1.8rem',
    fontFamily: 'JetBrains Mono, monospace',
  };

  // 根据用户类型显示不同的仪表盘内容
  const renderDashboardContent = () => {
    if (!user) return null;

    switch (user.user_type) {
      case 'admin':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: theme.palette.primary.light }}>
                  <People sx={{ fontSize: 28, color: 'primary' }} />
                </Box>
                  <div>
                    <Typography variant="h6" gutterBottom sx={titleStyle}>
                      用户总数
                    </Typography>
                    <Typography variant="h4" sx={valueStyle}>
                      1,254
                    </Typography> 
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: theme.palette.success.light }}>
                  <Store sx={{ fontSize: 28, color: 'success' }} />
                </Box>
                  <div>
                    <Typography variant="h6" gutterBottom sx={titleStyle}>
                      商家总数
                    </Typography>
                    <Typography variant="h4" sx={valueStyle}>
                      234
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: theme.palette.info.light }}>
                  <Business sx={{ fontSize: 28, color: 'info' }} />
                </Box>
                  <div>
                    <Typography variant="h6" gutterBottom sx={titleStyle}>
                      项目总数
                    </Typography>
                    <Typography variant="h4" sx={valueStyle}>
                      567
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: theme.palette.warning.light }}>
                  <BarChart sx={{ fontSize: 28, color: 'warning' }} />
                </Box>
                  <div>
                    <Typography variant="h6" gutterBottom sx={titleStyle}>
                      今日新增
                    </Typography>
                    <Typography variant="h4" sx={valueStyle}>
                      45
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 'merchant':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: theme.palette.info.light }}>
                  <Work sx={{ fontSize: 28, color: 'info' }} />
                </Box>
                  <div>
                    <Typography variant="h6" gutterBottom sx={titleStyle}>
                      我的项目
                    </Typography>
                    <Typography variant="h4" sx={valueStyle}>
                      24
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: theme.palette.warning.light }}>
                  <AccessTime sx={{ fontSize: 28, color: 'warning' }} />
                </Box>
                  <div>
                    <Typography variant="h6" gutterBottom sx={titleStyle}>
                      待处理订单
                    </Typography>
                    <Typography variant="h4" sx={valueStyle}>
                      7
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 'programmer':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: theme.palette.info.light }}>
                  <Work sx={{ fontSize: 28, color: 'info' }} />
                </Box>
                  <div>
                    <Typography variant="h6" gutterBottom sx={titleStyle}>
                      我参与的项目
                    </Typography>
                    <Typography variant="h4" sx={valueStyle}>
                      12
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: theme.palette.warning.light }}>
                  <AccessTime sx={{ fontSize: 28, color: 'warning' }} />
                </Box>
                  <div>
                    <Typography variant="h6" gutterBottom sx={titleStyle}>
                      待完成任务
                    </Typography>
                    <Typography variant="h4" sx={valueStyle}>
                      5
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return (
          <Typography variant="h6">
            欢迎使用PhoenixCoder平台
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
          欢迎回来，{user?.name}！
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Chip
            icon={<Star sx={{ fontSize: 16 }} />}
            label={`等级 ${userLevel}`}
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: '0.85rem',
              height: '32px',
            }}
          />
        </Box>
      </Box>

      {/* 用户成长进度条 */}
      <Box sx={{ mb: 4, p: 3, bgcolor: theme.palette.background.paper, borderRadius: '12px', boxShadow: theme.shadows[1] }}>
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
          成长进度
        </Typography>
        <Box sx={{ width: '100%', bgcolor: theme.palette.divider, height: 8, borderRadius: 4 }}>
          <Box
            sx={{ width: `${(userPoints / nextLevelPoints) * 100}%`, bgcolor: theme.palette.primary.main, height: 8, borderRadius: 4 }}
          />
        </Box>
        <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
          {userPoints} / {nextLevelPoints} 成长分 (距离下一级还需 {nextLevelPoints - userPoints} 分)
        </Typography>
      </Box>

      {renderDashboardContent()}
    </Box>
  );
};

export default Dashboard;