import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import StarIcon from '@mui/icons-material/Star';
import ShowChartIcon from '@mui/icons-material/ShowChart';

export const Profile: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
        <Paper sx={{ p: 4, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="h5" sx={{ color: '#f8fafc', mb: 2 }}>
            您尚未登录
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            请先登录以访问个人中心、自选关注赛道和您的订阅权益。
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/login')} sx={{ color: '#fff' }}>
            去登录
          </Button>
        </Paper>
      </Container>
    );
  }

  // 模拟自选赛道监控列表
  const mockWatchlist = [
    { symbol: 'AI.SaaS', name: '生成式 AI 与大模型', count: '142 家创企', activity: '极度活跃' },
    { symbol: 'SPACE.VC', name: '商业航天与液体火箭', count: '34 家创企', activity: '高度活跃' },
    { symbol: 'DRONE.VC', name: '低空飞行器与eVTOL', count: '21 家创企', activity: '平稳增长' },
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* 头部资料卡片 */}
      <Paper sx={{ p: 4, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 4, mb: 4 }}>
        <Grid container spacing={3} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 3 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: hasRole('ROLE_ADMIN_USER') ? 'primary.main' : 'secondary.main',
                color: '#fff',
                fontSize: '2.5rem',
                fontWeight: 800,
              }}
            >
              {user.nickname?.charAt(0) || user.username.charAt(0).toUpperCase()}
            </Avatar>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 9 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h3" sx={{ color: '#f8fafc', fontWeight: 800 }}>
                  {user.nickname || user.username}
                </Typography>
                
                {hasRole('ROLE_ADMIN_USER') && (
                  <Chip
                    icon={<AdminPanelSettingsIcon style={{ color: '#fff', fontSize: 16 }} />}
                    label="系统管理员"
                    sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
                  />
                )}
                {user.roles.includes('ROLE_USER') && !hasRole('ROLE_ADMIN_USER') && (
                  <Chip label="特邀财经创投读者" color="secondary" sx={{ color: '#000', fontWeight: 600 }} />
                )}
              </Box>
              
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                账号用户名: {user.username}
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 1 }}>
                个人简介: {user.bio || '这个读者很神秘，什么也没有写。'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.05)' }} />

        {/* 核心动作组 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {hasRole('ROLE_ADMIN_USER') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => navigate('/admin')}
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(0, 102, 255, 0.25)',
                }}
              >
                进入后台管理 (Admin Dashboard)
              </Button>
            )}
            
            <Button
              variant="outlined"
              sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', color: '#94a3b8' }}
            >
              修改资料
            </Button>
          </Box>

          <Button
            variant="text"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => {
              logout();
              navigate('/login');
            }}
            sx={{ fontWeight: 600 }}
          >
            注销登录
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* 左半部分自选股监控 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 3, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <ShowChartIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                自选追踪赛道 (Watchlist)
              </Typography>
            </Box>
            
            <List sx={{ p: 0 }}>
              {mockWatchlist.map((stock, i) => (
                <Box key={stock.symbol}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 600, color: '#f1f5f9' }}>
                          {stock.name}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>
                          {stock.symbol}
                        </Typography>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {stock.count}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
                        {stock.activity}
                      </Typography>
                    </Box>
                  </ListItem>
                  {i < mockWatchlist.length - 1 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.04)' }} />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 右半部分会员中心权益 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 3, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <StarIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                特邀研究员订阅权益
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(0, 102, 255, 0.05)', border: '1px dashed rgba(0, 102, 255, 0.2)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}>
                  {hasRole('ROLE_ADMIN_USER') ? '终身特邀研究员黄金合伙人' : '已解锁 VC 观察哨专栏'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  有效期: 2029-12-31 | 自动续费: 已开启
                </Typography>
              </Box>

              <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1.5 }}>
                • 尊享国内外头部创投机构直投趋势周报阅读特权。<br />
                • 拥有前沿科技、商业航天等硬科技板块自选消息定制。<br />
                • 控制台特邀创新项目投递通道绿灯免审。
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
export default Profile;
