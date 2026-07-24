import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, Avatar, Container } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';


import { I18nProvider, useI18n } from './context/I18nContext';
const Home = React.lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const AiHome = React.lazy(() => import('./pages/AiHome').then((m) => ({ default: m.AiHome })));
const ArticleDetail = React.lazy(() => import('./pages/ArticleDetail').then((m) => ({ default: m.ArticleDetail })));
const Login = React.lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Profile = React.lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
import { AdminRoute } from './components/AdminRoute';
import { MarketTicker } from './components/MarketTicker';
import { CookieConsentComponent } from './components/CookieConsentComponent';

const AppNavigation: React.FC = () => {
  const { user } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const hideTicker = ['/login', '/admin-dashboard', '/ai'].includes(location.pathname);

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
              LIGHT IN THE BRAIN <span style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: 'rgba(0,102,255,0.12)', color: '#0066ff', borderRadius: 4, fontWeight: 700 }}>TECH VC</span>
            </Typography>

            {/* 右侧用户菜单 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button component={Link} to="/" sx={{ color: '#94a3b8', '&:hover': { color: 'primary.main' } }}>
                {t('Home Recommend')}
              </Button>
              <Button
                component={Link}
                to="/ai"
                sx={{
                  color: location.pathname === '/ai' ? '#a855f7' : '#94a3b8',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: '#a855f7',
                    textShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
                  }
                }}
              >
                🤖 {t('AI Zone')}
              </Button>

              {/* 国际化语言切换按钮 */}
              <Button
                size="small"
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  border: '1px solid rgba(0, 102, 255, 0.2)',
                  px: 1.5,
                  borderRadius: 1.5,
                  fontSize: '0.75rem',
                  textTransform: 'none'
                }}
              >
                {language === 'zh' ? 'English' : '中文'}
              </Button>
              
              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {user.roles.includes('ROLE_ADMIN_USER') && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<AdminPanelSettingsIcon />}
                      onClick={() => navigate('/admin-dashboard')}
                      sx={{
                        fontSize: '0.75rem',
                        borderColor: 'rgba(0,102,255,0.3)',
                        py: 0.5,
                        display: { xs: 'none', sm: 'inline-flex' }
                      }}
                    >
                      {t('Console')}
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
                  {t('Login')}
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
  const { t } = useI18n();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#080c14' }}>
      <AppNavigation />
      
      <Box sx={{ flexGrow: 1 }}>
        <React.Suspense fallback={<Box sx={{ minHeight: '60vh', bgcolor: '#080c14' }} />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai" element={<AiHome />} />
            <Route path="/article/:slug" element={<ArticleDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/admin-dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </React.Suspense>
      </Box>

      {/* 页脚 */}
      <Box component="footer" sx={{ bgcolor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)', py: 4, mt: 'auto', textAlign: 'center', color: '#64748b' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8', mb: 1 }}>
            {t('LIGHT IN THE BRAIN Venture Capital Portal')}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            © 2026 LIGHT IN THE BRAIN. All rights reserved. {t('All news are sourced from public disclosures, not for investment decisions.')}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppContent />
            <CookieConsentComponent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};

export default App;
