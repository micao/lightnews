import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#0a0e17',
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          正在验证安全权限...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    // 未登录用户，重定向到登录页并保存原浏览路径
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole('ROLE_ADMIN_USER')) {
    // 已登录但无管理员角色，重定向到首页
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
