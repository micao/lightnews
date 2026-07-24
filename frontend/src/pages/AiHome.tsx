import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Container, Grid, Typography, Card, CardContent, Chip, Avatar, Skeleton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BoltIcon from '@mui/icons-material/Bolt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarIcon from '@mui/icons-material/Star';

import { AiToolkitDirectory } from '../components/AiToolkitDirectory';
import { AiChatPlayground } from '../components/AiChatPlayground';
import { type Article } from '../types';
import { useI18n } from '../context/I18nContext';
import { apiFetch, API_BASE } from '../utils/api';


// 嵌套专区局部赛博主题: 紫色与青色未来极客风
const aiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#a855f7', // 霓虹紫
    },
    secondary: {
      main: '#06b6d4', // 极客青
    },
    background: {
      default: '#070514', // 深邃紫黑底色
      paper: '#120d26',   // 紫灰色卡片底板
    },
    text: {
      primary: '#f3e8ff',
      secondary: '#c084fc',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
    h3: {
      fontWeight: 900,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 800,
    },
  },
});

export const AiHome: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickerItems, setTickerItems] = useState<string[]>([]);

  const fetchAiArticles = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE}/api/articles/?category=Artificial%20Intelligence`);

      const data = await res.json();
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error('Fetch AI articles error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickerNews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/livenews/`);
      const data = await res.json();
      if (data.success && data.news) {
        // 取最新 5 条已过审快讯作为跑马灯滚动条内容
        const items = data.news.slice(0, 5).map((item: any) => item.content);
        setTickerItems(items);
      }
    } catch (err) {
      console.error('Fetch ticker news error:', err);
    }
  };

  useEffect(() => {
    fetchAiArticles();
    fetchTickerNews();
    window.scrollTo(0, 0);

    const interval = setInterval(fetchTickerNews, 30000); // 30秒定时轮询更新
    return () => clearInterval(interval);
  }, []);

  const handleArticleClick = (slug: string) => {
    navigate(`/article/${slug}`);
  };

  const DEFAULT_TICKER = [
    "DeepSeek-V3 API: 输入 $0.14/百万 Token | 输出 $0.28/百万 Token - 运行正常 (99.99% SLA)",
    "OpenAI “星门”超算集群项目拟部署 10 万块顶级 GPU，已展开核裂变电力合作接洽",
    "Anthropic Claude 3.5 Sonnet 在代码编写与计算机控制（Computer Use）测试中独占鳌头",
    "英伟达 (NVIDIA) Blackwell Ultra 系列顶级芯片开始向全球云数据中心厂商大批量交付"
  ];

  const displayedTicker = tickerItems.length > 0 ? tickerItems : DEFAULT_TICKER;

  return (
    <ThemeProvider theme={aiTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8, transition: 'all 0.3s' }}>
        
        {/* AI 专区专用行情跑马灯 (AI Status Ticker) */}
        <Box sx={{ width: '100%', bgcolor: '#0b061e', borderBottom: '1px solid rgba(168,85,247,0.2)', py: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              whiteSpace: 'nowrap',
              animation: 'scrollAiTicker 30s linear infinite',
              '@keyframes scrollAiTicker': {
                '0%': { transform: 'translateX(0%)' },
                '100%': { transform: 'translateX(-50%)' },
              },
            }}
          >
            {Array.from(new Array(2)).map((_, cycleIdx) => (
              <Box key={cycleIdx} sx={{ display: 'inline-flex', alignItems: 'center', gap: 4, pr: 4 }}>
                {displayedTicker.map((text, idx) => (
                  <Typography
                    key={idx}
                    variant="caption"
                    sx={{
                      color: idx % 3 === 0 ? '#06b6d4' : idx % 3 === 1 ? '#a855f7' : '#e0f2fe',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    {idx === 0 && <BoltIcon fontSize="small" />}
                    • {text}
                  </Typography>
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {/* Header 标语区 */}
          <Box sx={{ mb: 6, textAlign: 'center', position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 300,
                height: 150,
                background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
                filter: 'blur(30px)',
                zIndex: 0
              }}
            />
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 900, mb: 1, zIndex: 1, position: 'relative', textShadow: '0 0 15px rgba(168,85,247,0.3)' }}>
              🤖 STARGATE AI HUB
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', zIndex: 1, position: 'relative' }}>
              全球生成式人工智能与大模型软硬件链深度解析
            </Typography>
          </Box>

          {/* Bento-Grid 首屏焦点区 */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {/* 左侧大卡片: AI 深度头条或首篇报道 */}
            <Grid size={{ xs: 12, md: 7 }}>
              {loading ? (
                <Card sx={{ height: '100%', bgcolor: 'background.paper', border: '1px solid rgba(168,85,247,0.15)' }}>
                  <Skeleton variant="rectangular" height={260} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                  <CardContent sx={{ p: 3 }}>
                    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.03)' }} />
                    <Skeleton variant="text" width="90%" height={32} sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.03)' }} />
                    <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                  </CardContent>
                </Card>
              ) : articles[0] ? (
                <Card
                  onClick={() => handleArticleClick(articles[0].slug)}
                  sx={{
                    height: '100%',
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(168,85,247,0.15)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'radial-gradient(circle at 100% 0%, rgba(168,85,247,0.08) 0%, transparent 50%)',
                      zIndex: 1,
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'primary.main',
                      boxShadow: '0 8px 30px rgba(168, 85, 247, 0.25)',
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    {articles[0].thumbnail ? (
                      <Box
                        component="img"
                        src={articles[0].thumbnail}
                        alt={articles[0].title}
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        sx={{ width: '100%', height: 260, objectFit: 'cover', borderBottom: '1px solid rgba(168,85,247,0.15)' }}
                      />
                    ) : null}
                    <Box
                      className="image-fallback"
                      sx={{
                        display: !articles[0].thumbnail ? 'flex' : 'none',
                        width: '100%',
                        height: 260,
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #120d26 0%, #1e1548 100%)',
                        borderBottom: '1px solid rgba(168,85,247,0.15)',
                        position: 'relative'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 900, letterSpacing: '0.15em' }}>
                        STARGATE AI
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1 }}>
                      <Chip icon={<AutoAwesomeIcon sx={{ color: '#000 !important', fontSize: 14 }} />} label="AI Focus" sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 900 }} />
                      {articles[0].is_vip_only && (
                        <Chip icon={<StarIcon sx={{ color: '#000 !important', fontSize: 14 }} />} label={t('Exclusive')} sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 800 }} />
                      )}
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3, zIndex: 2 }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 1.5, '&:hover': { color: 'primary.main' } }}>
                      {articles[0].title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {articles[0].summary}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                          {articles[0].author.nickname.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>
                          {articles[0].author.nickname}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VisibilityIcon fontSize="inherit" />
                          <Typography variant="caption">{articles[0].views_count.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FavoriteIcon fontSize="inherit" />
                          <Typography variant="caption">{articles[0].likes_count}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ height: '100%', bgcolor: 'background.paper', p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'text.secondary' }}>暂无焦点文章</Typography>
                </Card>
              )}
            </Grid>

            {/* 右侧交互沙盒 */}
            <Grid size={{ xs: 12, md: 5 }}>
              <AiChatPlayground />
            </Grid>
          </Grid>

          {/* 二屏多维信息板 */}
          <Grid container spacing={3}>
            {/* 左侧: 时间线形式的前沿资讯动态 */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon sx={{ color: 'primary.main' }} /> AI 前沿深度观察线 (AI Intelligence Feed)
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {loading ? (
                  Array.from(new Array(2)).map((_, idx) => (
                    <Card key={idx} sx={{ bgcolor: 'background.paper', border: '1px solid rgba(168,85,247,0.1)' }}>
                      <Grid container>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Skeleton variant="rectangular" height={140} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.03)' }} />
                            <Skeleton variant="text" width="90%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                          </CardContent>
                        </Grid>
                      </Grid>
                    </Card>
                  ))
                ) : articles.length <= 1 ? (
                  <Card sx={{ p: 4, bgcolor: 'background.paper', textAlign: 'center', border: '1px solid rgba(168,85,247,0.1)' }}>
                    <Typography sx={{ color: 'text.secondary' }}>暂无其他 AI 相关报道草稿</Typography>
                  </Card>
                ) : (
                  articles.slice(1).map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => handleArticleClick(item.slug)}
                      sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid rgba(168,85,247,0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 20px rgba(168, 85, 247, 0.15)',
                        }
                      }}
                    >
                      <Grid container>
                        {item.thumbnail ? (
                          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative' }}>
                            <Box
                              component="img"
                              src={item.thumbnail}
                              alt={item.title}
                              onError={(e: any) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.nextSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              sx={{ width: '100%', minHeight: 140, objectFit: 'cover' }}
                            />
                            <Box
                              className="image-fallback"
                              sx={{
                                display: 'none',
                                width: '100%',
                                minHeight: 140,
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #120d26 0%, #1e1548 100%)',
                              }}
                            >
                              <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 900 }}>
                                STARGATE AI
                              </Typography>
                            </Box>
                          </Grid>
                        ) : (
                          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #120d26 0%, #1e1548 100%)', overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 900 }}>
                              STARGATE AI
                            </Typography>
                          </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: item.thumbnail ? 8 : 12 }}>
                          <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Box>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                <Chip label={t(item.category.name)} size="small" sx={{ bgcolor: 'rgba(168,85,247,0.1)', color: 'primary.main', height: 18, fontSize: '0.6875rem', fontWeight: 700 }} />
                                {item.is_vip_only && (
                                  <Chip icon={<StarIcon sx={{ color: 'secondary.main !important', fontSize: 10 }} />} label={t('Exclusive Column')} size="small" sx={{ bgcolor: 'rgba(6,182,212,0.12)', color: 'secondary.main', height: 18, fontSize: '0.6875rem', fontWeight: 700 }} />
                                )}
                              </Box>
                              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mb: 1, '&:hover': { color: 'primary.main' } }}>
                                {item.title}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item.summary}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                              <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                                {item.author.nickname} • {item.publish_at.split(' ')[0]}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1.5, color: '#cbd5e1' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  <VisibilityIcon fontSize="inherit" />
                                  <Typography variant="caption">{(item.views_count / 1000).toFixed(1)}k</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  <FavoriteIcon fontSize="inherit" />
                                  <Typography variant="caption">{item.likes_count}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Grid>
                      </Grid>
                    </Card>
                  ))
                )}
              </Box>
            </Grid>

            {/* 右侧: 大模型与工具导航黄页 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <AiToolkitDirectory />
            </Grid>
          </Grid>

        </Container>
      </Box>
    </ThemeProvider>
  );
};
export default AiHome;
