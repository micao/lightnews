import React, { useState, useEffect } from 'react';
import { type User, type UserRole } from '../types';
import { apiFetch, API_BASE } from '../utils/api';
import { AuthContext } from './AuthContextObject';





export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 中恢复登录态并向后端请求最新资料验证
    const token = localStorage.getItem('lightnews_token');
    if (token) {
      apiFetch(`${API_BASE}/api/auth/profile/`)
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

  const register = async (
    username: string,
    password: string,
    nickname?: string,
    phoneNumber?: string,
    captchaId?: string,
    captchaAnswer?: string
  ): Promise<boolean> => {
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
          phone_number: phoneNumber,
          captcha_id: captchaId,
          captcha_answer: captchaAnswer
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

  const refreshProfile = async (): Promise<void> => {
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/profile/`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('refreshProfile error:', err);
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, register, logout, hasRole, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

