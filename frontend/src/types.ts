export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN_USER';

export interface User {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  roles: UserRole[]; // 多角色并存模型
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  is_analyst?: boolean;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author: {
    id: number;
    nickname: string;
    avatar_url?: string;
  };
  category: {
    id: number;
    name: string;
  };
  importance: number; // 1-5级重要星级
  is_vip_only: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  publish_at: string;
  created_at: string;
}

export interface LiveNews {
  id: number;
  content: string;
  urgency: 'normal' | 'warn' | 'critical';
  tag: '融资' | '大厂' | '独角兽' | '前沿科技'; // 创投标签
  publish_time: string;
}

export interface Comment {
  id: number;
  user: {
    username: string;
    nickname: string;
    avatar_url?: string;
  };
  content: string;
  created_at: string;
  likes_count: number;
  replies?: Comment[];
}

export interface FundingTickerItem {
  company: string;   // 初创公司
  round: string;     // 融资轮次，如 "A轮", "战略融资"
  amount: string;    // 金额，如 "数千万人民币", "$50M"
  investor: string;  // 领投/跟投机构
  sector: string;    // 行业赛道
}
