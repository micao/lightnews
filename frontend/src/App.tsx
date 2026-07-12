import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, Avatar, Container } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { theme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Home } from './pages/Home';
import { ArticleDetail } from './pages/ArticleDetail';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminRoute } from './components/AdminRoute';
import { MarketTicker } from './components/MarketTicker';

const AppNavigation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hideTicker = ['/login', '/admin'].includes(location.pathname);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: '#0f172a', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {/* Logo */}
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{
                fontWeight: 900,
                color: 'primary.main',
                textDecoration: 'none',
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              LIGHT NEWS <span style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: 'rgba(0,102,255,0.12)', color: '#0066ff', borderRadius: 4, fontWeight: 700 }}>TECH VC</span>
            </Typography>

            {/* 右侧用户菜单 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button component={Link} to="/" sx={{ color: '#94a3b8', '&:hover': { color: 'primary.main' } }}>
                首页推荐
              </Button>
              
              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {user.roles.includes('ROLE_ADMIN_USER') && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<AdminPanelSettingsIcon />}
                      onClick={() => navigate('/admin')}
                      sx={{
                        fontSize: '0.75rem',
                        borderColor: 'rgba(0,102,255,0.3)',
                        py: 0.5,
                        display: { xs: 'none', sm: 'inline-flex' }
                      }}
                    >
                      后台控制台
                    </Button>
                  )}
                  <Box
                    onClick={() => navigate('/profile')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      p: 0.5,
                      borderRadius: 2,
                      transition: 'background 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.04)'
                      }
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: user.roles.includes('ROLE_ADMIN_USER') ? 'primary.main' : 'secondary.main', color: '#fff', fontSize: '0.875rem', fontWeight: 700 }}>
                      {user.nickname?.charAt(0) || user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 600, display: { xs: 'none', md: 'block' } }}>
                      {user.nickname || user.username}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/login"
                  sx={{ color: '#fff', fontWeight: 700 }}
                >
                  登录
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      {!hideTicker && <MarketTicker />}
    </>
  );
};

export const AppContent: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#080c14' }}>
      <AppNavigation />
      
      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/article/:slug" element={<ArticleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </Box>

      {/* 页脚 */}
      <Box component="footer" sx={{ bgcolor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)', py: 4, mt: 'auto', textAlign: 'center', color: '#64748b' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8', mb: 1 }}>
            LIGHT NEWS 科技创投深度资讯门户
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            © 2026 LIGHTNEWS TECH. All rights reserved. 创投快报均来自一手及公开信披，不作为股权融资投资决策依据。
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};
export default App;
