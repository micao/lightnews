import { createContext } from 'react';
import type { User, UserRole } from '../types';

export interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string, roleType?: 'admin' | 'user') => Promise<boolean>;
  register: (
    username: string,
    password: string,
    nickname?: string,
    phoneNumber?: string,
    captchaId?: string,
    captchaAnswer?: string
  ) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
