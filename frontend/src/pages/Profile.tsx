import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE, apiFetch } from '../utils/api';

import { useI18n } from '../context/I18nContext';
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
  TextField,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import StarIcon from '@mui/icons-material/Star';
import ShowChartIcon from '@mui/icons-material/ShowChart';

export const Profile: React.FC = () => {
  const { user, logout, hasRole, refreshProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applySuccess, setApplySuccess] = useState<boolean | null>(null);

  const handleApplyWriter = async () => {
    setApplying(true);
    setApplyMessage('');
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/apply-writer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credentials })
      });
      const data = await res.json();
      if (data.success) {
        setApplySuccess(true);
        setApplyMessage('申请提交成功，请等待系统管理员审核。');
        await refreshProfile();
      } else {
        setApplySuccess(false);
        setApplyMessage(data.message || '提交失败');
      }
    } catch (err) {
      console.error(err);
      setApplySuccess(false);
      setApplyMessage('网络连接错误，请稍后重试');
    } finally {
      setApplying(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
        <Paper sx={{ p: 4, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="h5" sx={{ color: '#f8fafc', mb: 2 }}>
            {t('Not Logged In')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            {t('Login Please')}
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/login')} sx={{ color: '#fff' }}>
            {t('Go Login')}
          </Button>
        </Paper>
      </Container>
    );
  }

  // 模拟自选赛道监控列表
  const mockWatchlist = [
    { symbol: 'AI.SaaS', name: t('Generative AI and Large Models'), count: t('142 startups'), activity: t('Extremely Active') },
    { symbol: 'SPACE.VC', name: t('Commercial Space and Liquid Rockets'), count: t('34 startups'), activity: t('Highly Active') },
    { symbol: 'DRONE.VC', name: t('Low-altitude Aircraft and eVTOL'), count: t('21 startups'), activity: t('Steady Growth') },
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
                    label={t('Administrator')}
                    sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
                  />
                )}
                {user.roles.includes('ROLE_USER') && !hasRole('ROLE_ADMIN_USER') && !user.is_analyst && (
                   <Chip label={t('Special Guest Reader')} color="secondary" sx={{ color: '#000', fontWeight: 600 }} />
                 )}
                 {user.is_analyst && (
                   <Chip label={t('Certified Writer/Analyst')} color="success" sx={{ color: '#fff', fontWeight: 700 }} />
                 )}
                 {user.analyst_status === 'pending' && (
                   <Chip label={t('Writer Audit Pending')} color="warning" sx={{ color: '#fff', fontWeight: 600 }} />
                 )}
                 {user.analyst_status === 'rejected' && (
                   <Chip label={t('Application Rejected')} color="error" sx={{ color: '#fff', fontWeight: 600 }} />
                 )}
              </Box>

              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {t('Username')}: {user.username}
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 1 }}>
                {t('Bio')}: {t(user.bio || 'This reader is mysterious and has written nothing.')}
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
                onClick={() => navigate('/admin-dashboard')}
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(0, 102, 255, 0.25)',
                }}
              >
                {t('Admin Dashboard Portal')}
              </Button>
            )}

            <Button
              variant="outlined"
              sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', color: '#94a3b8' }}
            >
              {t('Modify Profile')}
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
            {t('Logout')}
          </Button>
        </Box>
      </Paper>

      {/* 专栏作者/写作者入驻申请 */}
      {!user.is_analyst && (
        <Paper sx={{ p: 3, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1 }}>
            {t('Apply to Become a Writer/Analyst')}
          </Typography>
          
          {user.analyst_status === 'pending' ? (
            <Box sx={{ p: 2, bgcolor: 'rgba(234, 179, 8, 0.05)', border: '1px dashed rgba(234, 179, 8, 0.3)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                ⏳ 您的专栏作者申请正在审核中，请耐心等待总管理员批准。
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                申请认证为专栏分析师后，您将拥有发布行业分析文章与滚动快讯的权限。管理员审核通过后即可激活作者功能。
              </Typography>
              
              {user.analyst_status === 'rejected' && (
                <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                  ❌ 您此前的申请已被管理员驳回。您可以修改申请说明后重新提交。
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="职业资质或申请说明 (Credentials / Note)"
                  variant="outlined"
                  fullWidth
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder="例如：某基金硬科技投资经理 / 执业证号：Axxxx"
                  sx={{
                    '& .MuiInputLabel-root': { color: '#64748b' },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.01)',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleApplyWriter}
                  disabled={applying}
                  sx={{ color: '#000', fontWeight: 700, px: 4, height: 56 }}
                >
                  {applying ? '提交中...' : '提交申请'}
                </Button>
              </Box>
              {applyMessage && (
                <Typography variant="caption" sx={{ color: applySuccess ? 'success.main' : 'error.main', mt: 1 }}>
                  {applyMessage}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* 左半部分自选股监控 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 3, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <ShowChartIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                {t('Watchlist Sectors')}
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
                {t('Research Benefits')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(0, 102, 255, 0.05)', border: '1px dashed rgba(0, 102, 255, 0.2)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}>
                  {hasRole('ROLE_ADMIN_USER') ? t('VIP Partner') : t('VIP Observer')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {t('Expiry')}: 2029-12-31 | {t('Auto Renew')}: {t('Active')}
                </Typography>
              </Box>

              <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1.5 }}>
                {t('Benefit 1')}<br />
                {t('Benefit 2')}<br />
                {t('Benefit 3')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
export default Profile;
