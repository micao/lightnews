/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'zh';

const ZH_TRANSLATIONS: Record<string, string> = {
  // App Navigation & Common
  'All Recommendations': '全部推荐',
  'Frontier Tech': '前沿科技',
  'Unicorn Dynamics': '独角兽动态',
  'VC/PE Insights': 'VC/PE观察',
  'Search': '搜索',
  'Login': '登录',
  'Logout': '注销登录',
  'Back to Home': '返回首页',
  'Home Recommend': '首页推荐',
  'Console': '后台控制台',
  'Insight': '洞察',
  'LIGHT IN THE BRAIN': 'LIGHT IN THE BRAIN',
  'LIGHT IN THE BRAIN Venture Capital Portal': 'LIGHT IN THE BRAIN 科技创投深度资讯门户',
  'All news are sourced from public disclosures, not for investment decisions.': '创投快报均来自一手及公开信披，不作为股权融资投资决策依据。',
  'Verifying credentials...': '正在验证安全权限...',

  // Home
  '7x24 Flash News': '7x24 创投快讯',
  'Real-time News': '实时快报',
  'Read Rank': '热门阅读排行榜',
  'Loading articles...': '正在获取最新创投资讯...',
  'All articles loaded': '— 已为您加载全部最新创投快报 —',
  'Read': '阅读',
  'Deep Research': '首发深度',
  'Exclusive': '独家',

  // Article Detail
  'Exclusive Column': '创投独家专栏',
  'Published at': '发布于',
  'Abstract / Summary': '核心导读 / 摘要',
  'Likes': '赞',
  'VIP Lock Title': '本内容为创投独家专栏深度解析',
  'VIP Lock Desc': 'LIGHT IN THE BRAIN 独家深度创投研报。包含全球科技巨头布局、细分赛道梳理与初创企业评级，登录或升级会员即可解锁全文。',
  'Login Account': '登录账户',
  'Apply VIP': '申请加入VIP',
  'Comments': '评论互动',
  'Comments are closed for this article': '该文章已关闭评论功能',
  'Write comment...': '输入您的专业财经见解...',
  'Login to comment': '登录后发表您的见解...',
  'Submit Comment': '发表评论',
  'Comment Success': '评论提交成功，等待后台审核！',
  'Comment Failed': '评论发表失败',
  'Disclaimer': '免责声明 & 创投资讯提示',
  'Disclaimer Desc 1': '本报道研究所载的全部内容仅代表分析师个人及机构的研究观点，不构成任何形式的投资建议或直接交易指令。',
  'Disclaimer Desc 2': '一级创投市场风险极高，早期初创企业具有很高的死亡率和较弱的清算保护。请理性判定产业发展阶段与商业模型。',
  'Loading article or it has been removed': '文章正在拉取，或已被下架。',
  'Please log in first to write comments': '请先登录再发表评论',
  'Please log in first to bookmark': '请先登录再进行收藏',
  'Likes open for logged in only': '点赞功能仅在登录后开放！',
  'Venture End Warning': '随着未来三个季度全球主要云大厂资本开支在AI模型落地上的比拼，初创企业的估值将逐步进入“挤水”周期。我们将持续跟踪硬科技、商业航天和AI垂直细分应用赛道，敬请锁定自选看盘与分析后台。',

  // Profile
  'Not Logged In': '您尚未登录',
  'Login Please': '请先登录以访问个人中心、自选关注赛道和您的订阅权益。',
  'Go Login': '去登录',
  'Administrator': '系统管理员',
  'Username': '用户名',
  'Bio': '个人简介',
  'Modify Profile': '修改资料',
  'Admin Dashboard Portal': '进入后台管理 (Admin Dashboard)',
  'Watchlist Sectors': '自选追踪赛道',
  'Research Benefits': '特邀研究员订阅权益',
  'VIP Partner': '终身特邀研究员黄金合伙人',
  'VIP Observer': '已解锁 VC 观察哨专栏',
  'Expiry': '有效期',
  'Auto Renew': '自动续费',
  'Active': '已开启',
  'Benefit 1': '• 尊享国内外头部创投机构直投趋势周报阅读特权。',
  'Benefit 2': '• 拥有前沿科技、商业航天等硬科技板块自选消息定制。',
  'Benefit 3': '• 控制台特邀创新项目投递通道绿灯免审。',
  'Special Guest Reader': '特邀财经创投读者',
  'This reader is mysterious and has written nothing.': '这个读者很神秘，什么也没有写。',
  'Generative AI and Large Models': '生成式 AI 与大模型',
  'Commercial Space and Liquid Rockets': '商业航天与液体火箭',
  'Low-altitude Aircraft and eVTOL': '低空飞行器与eVTOL',
  '142 startups': '142 家创企',
  '34 startups': '34 家创企',
  '21 startups': '21 家创企',
  'Extremely Active': '极度活跃',
  'Highly Active': '高度活跃',
  'Steady Growth': '平稳增长',

  // Login Page
  'Venture Research Insight': '全球前沿科技创投快讯与硬科技研究洞察',
  'Enter Username': '请输入您的用户名',
  'Enter Password': '请输入密码 (模拟登录可留空)',
  'Regular User Login': '普通用户登录',
  'Debug Shortcuts': '快捷调试与多角色模拟',
  'Mock Reader': '模拟读者',
  'Mock Admin': '模拟管理员',
  'Password Error': '用户名或密码错误',
  'Auth Error': '模拟身份认证失败，请重试。',
  'Network Error': '登录时发生网络错误。',

  // Admin Dashboard
  'Dashboard Title': '创投控制台管理后台',
  'Publish Analysis': '发布创投分析',
  'Article Management': '稿件库管理',
  'Sector Stats': '赛道数据统计',
  'Comment Moderation': '评论审核中心',
  'Article Title': '文章标题',
  'Category': '大类分类',
  'Views': '浏览量',
  'VIP Type': '专栏属性',
  'Publish Time': '发布时间',
  'Action': '操作',
  'Free': '免费',
  'Moderation User': '评论用户',
  'Belongs Article': '所属文章',
  'Comment Content': '评论内容',
  'Approve': '准予通过',
  'Reject': '驳回下架',
  'No Pending Comments': '暂无需要审核的读者评论',
  'Unpublish Confirm': '确认下架该创投分析吗？',
  'Unpublish Desc': '下架后该深度分析文章将不可在首页前台展现，所有相关的读者评论将物理级级联清空。',
  'Cancel': '取消',
  'Confirm': '确认下架',
  'Weekly BP Trend': '本周收到初创项目商业计划书(BP)趋势',
  'Sector Articles Volume': '创投快报各细分赛道稿件发布数量分布',
  'BP Suffix': '份BP',
  'Articles Suffix': '篇',
  'Article unpublished successfully': '创投分析文章已成功从数据库下架',
  'Opening edit panel for': '正在打开编辑面板',
  'Audit action successful': '审核操作成功！',
  'Audit action failed': '审核失败',
  'Flash News Panel': '快报发布与审核',
  'Publish Fast News': '发布新创投快报',
  'Fast News Content': '快讯内容正文',
  'Urgency': '紧急程度',
  'Tag': '分类标签',
  'Publish Straight': '主编直接发布',
  'AI Draft Audits': 'AI 自动编译待审草稿',
  'Draft Content': '草稿内容与翻译',
  'No Pending Fast News': '当前没有待审核的海外快报草稿',
  'Normal': '普通',
  'Warn': '警告 (黄框)',
  'Critical': '特急突发 (红框)',
  'Enter fast news here...': '输入 7x24 小时创投快讯正文...',
  'Flash news published': '快报发布成功！',
  'Flash news publish failed': '快报发布失败',
  'Financial Overview': '全球金融大盘行情',
  'Edit Article': '编辑文章',
  'Summary': '摘要',
  'Content': '正文内容',
  'Status': '发布状态',
  'Draft': '草稿',
  'Under Review': '待审核',
  'Published': '已发布',
  'Archived': '已存档',
  'VIP Exclusive': 'VIP 专属',
  'Save': '保存修改',
  'Saving...': '保存中...',
  'Article updated': '文章更新成功！',
  'Delete failed': '删除失败',
  'Update failed': '更新失败',
  'Upload New Image': '上传/修改配图',
  'Uploading...': '正在上传...',
  'Image uploaded successfully': '图片上传并生成缩略图成功！',
  'Article Thumbnail': '文章缩略图',
  'Upload failed': '图片上传失败',
  'Source Link': '原文章链接 / 出处',
  'Related Research': '相关推荐研究',
  'Search related articles...': '搜索关联推荐文章...',
  'Search by title...': '输入标题关键字进行搜索...',
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('light_i18n_lang') as Language;
    if (saved) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('light_i18n_lang', lang);
  };

  const EN_TRANSLATIONS: Record<string, string> = {
    '前沿科技': 'Frontier Tech',
    '独角兽动态': 'Unicorn Dynamics',
    'VC/PE观察': 'VC/PE Insights',
    '全部推荐': 'All Recommendations',
    '系统管理员': 'Administrator',
    '新注册研究员': 'Research Associate',
    '快捷调试模拟用户': 'Mock User for Debugging',
  };

  const t = (key: string): string => {
    if (language === 'zh') {
      return ZH_TRANSLATIONS[key] || key;
    }
    if (language === 'en' && EN_TRANSLATIONS[key]) {
      return EN_TRANSLATIONS[key];
    }
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
