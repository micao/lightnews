import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/profile';

  const handleLogin = async (e: React.FormEvent, roleType: 'admin' | 'user') => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginUser = roleType === 'admin' ? 'admin_editor' : (username.trim() || 'guest_user');
    
    try {
      const success = await login(loginUser, roleType);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('模拟身份认证失败，请重试。');
      }
    } catch (err) {
      setError('登录时发生网络错误。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        bgcolor: '#080c14',
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          bgcolor: '#101726',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* 标题 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                bgcolor: 'rgba(0, 102, 255, 0.12)',
                p: 1.5,
                borderRadius: '50%',
                mb: 1.5,
                color: 'primary.main',
              }}
            >
              <LockOutlinedIcon fontSize="medium" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#f8fafc', mb: 1, letterSpacing: '-0.025em' }}>
              LIGHT IN THE BRAIN
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
              全球前沿科技创投快讯与硬科技研究洞察
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, bgcolor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
              {error}
            </Alert>
          )}

          {/* 表单 */}
          <Box
            component="form"
            onSubmit={(e) => handleLogin(e, 'user')}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="用户名"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入您的用户名"
              sx={{
                '& .MuiInputLabel-root': { color: '#64748b' },
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.01)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                },
              }}
            />
            <TextField
              label="密码"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码 (模拟登录可留空)"
              sx={{
                '& .MuiInputLabel-root': { color: '#64748b' },
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.01)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ color: '#fff', py: 1.2, mt: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : '普通用户登录'}
            </Button>
          </Box>

          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="caption" sx={{ color: '#475569' }}>
              快捷调试与多角色模拟
            </Typography>
          </Divider>

          {/* 快捷多角色按钮 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PersonIcon />}
              onClick={(e) => handleLogin(e, 'user')}
              disabled={loading}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  borderColor: '#94a3b8',
                },
              }}
            >
              模拟读者
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<AdminPanelSettingsIcon />}
              onClick={(e) => handleLogin(e, 'admin')}
              disabled={loading}
              sx={{
                borderColor: 'rgba(0, 102, 255, 0.3)',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(0, 102, 255, 0.05)',
                  borderColor: 'primary.main',
                },
              }}
            >
              模拟管理员
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
export default Login;
