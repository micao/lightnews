/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, type UserRole } from '../types';

// 本地开发使用 http://localhost（Nginx 监听口），生产环境或 IP 访问使用相对路径以适配真实域名
export const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost'
    : '';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string, roleType?: 'admin' | 'user') => Promise<boolean>;
  register: (username: string, password: string, nickname?: string, phoneNumber?: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 中恢复登录态并向后端请求最新资料验证
    const token = localStorage.getItem('lightnews_token');
    if (token) {
      fetch(`${API_BASE}/api/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Unauthorized');
        })
        .then(data => {
          if (data.success) {
            setUser(data.user);
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password?: string, roleType?: 'admin' | 'user'): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, roleType })
      });
      
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('lightnews_token', data.token);
        setUser(data.user);
        return true;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    return false;
  };

  const register = async (username: string, password: string, nickname?: string, phoneNumber?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          nickname,
          phone_number: phoneNumber
        })
      });
      
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('lightnews_token', data.token);
        setUser(data.user);
        return true;
      }
    } catch (err) {
      console.error('Register error:', err);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lightnews_token');
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
