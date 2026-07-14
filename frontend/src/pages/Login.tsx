import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
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
  const { t } = useI18n();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 表单输入状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // 验证码状态
  const [captchaId, setCaptchaId] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // 界面状态
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/profile';

  const fetchCaptcha = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/antispam/captcha/`);
      const data = await res.json();
      if (data.success) {
        setCaptchaId(data.captcha_id);
        setCaptchaQuestion(data.question);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Error fetching captcha:', err);
    }
  };

  useEffect(() => {
    if (isRegister) {
      fetchCaptcha();
    }
  }, [isRegister]);

  // 处理严格密码登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('用户名和密码不能为空');
      return;
    }

    setLoading(true);
    try {
      const success = await login(trimmedUsername, trimmedPassword);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('登录失败：用户名或密码错误');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setError(t('Network Error'));
    } finally {
      setLoading(false);
    }
  };

  // 处理快捷调试模拟登录
  const handleShortcutLogin = async (roleType: 'admin' | 'user') => {
    setError('');
    setLoading(true);
    const mockUser = roleType === 'admin' ? 'admin_editor' : 'guest_user';

    try {
      // 快捷通道显式传递空密码，后端判断为 mock 登录
      const success = await login(mockUser, undefined, roleType);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('快捷登录失败');
      }
    } catch (err) {
      console.error('Mock login submit error:', err);
      setError(t('Network Error'));
    } finally {
      setLoading(false);
    }
  };

  // 处理研究员注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedNickname = nickname.trim();
    const trimmedPhone = phoneNumber.trim();

    // 输入校验
    if (!trimmedUsername || !trimmedPassword) {
      setError('用户名和密码不能为空');
      return;
    }
    if (!captchaAnswer.trim()) {
      setError('请输入验证码以证明您不是机器人');
      return;
    }
    if (trimmedUsername.length < 3) {
      setError('用户名长度不能少于 3 位');
      return;
    }
    if (trimmedPassword.length < 6) {
      setError('密码长度不能少于 6 位');
      return;
    }
    if (trimmedPhone) {
      // 中国大陆手机号校验正则
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setError('请输入合规的 11 位手机号码');
        return;
      }
    }

    setLoading(true);
    try {
      const success = await register(
        trimmedUsername,
        trimmedPassword,
        trimmedNickname || undefined,
        trimmedPhone || undefined,
        captchaId,
        captchaAnswer.trim()
      );
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('注册失败：验证码无效，或用户名/手机号已被占用');
        fetchCaptcha();
      }
    } catch (err) {
      console.error('Register submit error:', err);
      setError(t('Network Error'));
      fetchCaptcha();
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
              {t('LIGHT IN THE BRAIN')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
              {isRegister ? '加入前沿硬科技创投研究平台' : t('Venture Research Insight')}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, bgcolor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
              {error}
            </Alert>
          )}

          {/* 核心登录/注册表单 */}
          {!isRegister ? (
            <Box
              component="form"
              onSubmit={handleLogin}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label={t('Username')}
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('Enter Username')}
                sx={{
                  '& .MuiInputLabel-root': { color: '#64748b' },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.01)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                  },
                }}
              />
              <TextField
                label={t('Password')}
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Enter Password')}
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
                {loading ? <CircularProgress size={24} /> : t('Regular User Login')}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                    setUsername('');
                    setPassword('');
                  }}
                >
                  没有账号？注册成为创投研究员
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box
              component="form"
              onSubmit={handleRegister}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label="用户名 (Username) *"
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="作为登录唯一凭证，不少于3位"
                sx={{
                  '& .MuiInputLabel-root': { color: '#64748b' },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.01)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                  },
                }}
              />
              <TextField
                label="昵称 (Nickname)"
                variant="outlined"
                fullWidth
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="展示在评论和分析师页的别名"
                sx={{
                  '& .MuiInputLabel-root': { color: '#64748b' },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.01)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                  },
                }}
              />
              <TextField
                label="手机号码 (Phone Number)"
                variant="outlined"
                fullWidth
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="11位中国大陆手机号（可选）"
                sx={{
                  '& .MuiInputLabel-root': { color: '#64748b' },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.01)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                  },
                }}
              />
              <TextField
                label="密码 (Password) *"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="作为登录密码，不少于6位"
                sx={{
                  '& .MuiInputLabel-root': { color: '#64748b' },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.01)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                  },
                }}
              />

              {/* 人机校验数学验证码 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <TextField
                  label="验证码 (CAPTCHA) *"
                  variant="outlined"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="计算结果"
                  sx={{
                    flex: 1,
                    '& .MuiInputLabel-root': { color: '#64748b' },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.01)',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={fetchCaptcha}
                  sx={{
                    height: 56,
                    minWidth: 120,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                    }
                  }}
                >
                  {captchaQuestion ? (
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#38bdf8' }}>
                      {captchaQuestion}
                    </Typography>
                  ) : (
                    '...'
                  )}
                </Button>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                fullWidth
                disabled={loading}
                sx={{ color: '#fff', py: 1.2, mt: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : '注册并加入平台'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                    setUsername('');
                    setPassword('');
                  }}
                >
                  已有账号？返回登录
                </Typography>
              </Box>
            </Box>
          )}

          {import.meta.env.DEV && (
            <>
              <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="caption" sx={{ color: '#475569' }}>
                  {t('Debug Shortcuts')}
                </Typography>
              </Divider>

              {/* 快捷多角色按钮 */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PersonIcon />}
                  onClick={() => handleShortcutLogin('user')}
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
                  {t('Mock Reader')}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={() => handleShortcutLogin('admin')}
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
                  {t('Mock Admin')}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
export default Login;
