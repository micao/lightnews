import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, type UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, roleType: 'admin' | 'user') => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 中恢复登录态
    const storedUser = localStorage.getItem('lightnews_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('lightnews_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, roleType: 'admin' | 'user'): Promise<boolean> => {
    // 模拟登录过程
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser: User = {
          id: roleType === 'admin' ? 99 : 101,
          username: username,
          email: `${username}@lightnews.com`,
          phone_number: roleType === 'admin' ? '18888888888' : '13333333333',
          roles: roleType === 'admin' ? ['ROLE_USER', 'ROLE_ADMIN_USER'] : ['ROLE_USER'],
          nickname: roleType === 'admin' ? '总编辑 (管理员)' : '特邀财经读者',
          avatar_url: '',
          bio: roleType === 'admin' ? '负责华尔街见闻核心板块采编与审核。' : '热爱宏观经济分析与全球大盘趋势研究。',
          is_analyst: roleType === 'admin',
        };
        setUser(mockUser);
        localStorage.setItem('lightnews_user', JSON.stringify(mockUser));
        resolve(true);
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lightnews_user');
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
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
