import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  Avatar,
  Paper,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import StarIcon from '@mui/icons-material/Star';
import { LiveNewsList } from '../components/LiveNewsList';
import { TradingViewMarketOverview } from '../components/TradingViewMarketOverview';
import { type Article } from '../types';
import { useI18n } from '../context/I18nContext';
import { apiFetch, API_BASE } from '../utils/api';


export const Home: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  // 无限滚动状态
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const categories = ['All Recommendations', 'Frontier Tech', 'Unicorn Dynamics', 'VC/PE Insights'];
  const currentCategory = categories[activeTab];

  // 1. 初始化拉取首屏文章
  const fetchArticles = async (pageNum: number, isReset: boolean = false) => {
    try {
      if (isReset) {
        setLoadingMore(true);
        setDisplayedArticles([]); // Clear articles to trigger skeleton loading immediately and keep layout consistent
      }

      const categoryParam = currentCategory === 'All Recommendations' ? '' : currentCategory;
      const res = await apiFetch(
        `${API_BASE}/api/articles/?page=${pageNum}&limit=3&category=${encodeURIComponent(categoryParam)}`
      );

      const data = await res.json();
      
      if (data.success) {
        if (isReset) {
          setDisplayedArticles(data.articles);
        } else {
          setDisplayedArticles((prev) => [...prev, ...data.articles]);
        }
        setHasMore(data.has_more);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Fetch articles error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // 选项卡变动时，重置页面并重拉
  useEffect(() => {
    fetchArticles(1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleArticleClick = (slug: string) => {
    navigate(`/article/${slug}`);
  };

  // 下拉触底触发函数
  const triggerLoad = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchArticles(page + 1, false);
  };

  // 使用 IntersectionObserver 监听触底
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          triggerLoad();
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedArticles, hasMore, loadingMore, page, activeTab]);

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }}>
      {/* 头部精选导航栏 */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              color: '#94a3b8',
              px: 3,
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
          }}
        >
          {categories.map((cat, i) => (
            <Tab key={i} label={t(cat)} />
          ))}
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {/* 左侧及中间主要新闻内容流 */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* 头条大卡片 - 仅在“全部推荐”第一页且有数据时展现 */}
          {activeTab === 0 && (
            loadingMore && displayedArticles.length === 0 ? (
              <Card sx={{ mb: 4, bgcolor: '#101726' }}>
                <Box
                  sx={{
                    height: 260,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      display: 'flex',
                      gap: 1,
                      zIndex: 2,
                    }}
                  >
                    <Chip label={t('Deep Research')} color="primary" size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="h3" sx={{ color: '#fff', textAlign: 'center', px: 4, fontWeight: 900, zIndex: 2, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {t('LIGHT IN THE BRAIN')}
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.06)' }} />
                  <Skeleton variant="text" width="90%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2.5, bgcolor: 'rgba(255,255,255,0.06)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                      <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                    </Box>
                    <Skeleton variant="text" width={100} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                  </Box>
                </CardContent>
              </Card>
            ) : displayedArticles[0] ? (
              <Card
                sx={{
                  mb: 4,
                  bgcolor: '#101726',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.15)',
                  },
                }}
                onClick={() => handleArticleClick(displayedArticles[0].slug)}
              >
                <Box
                  sx={{
                    height: 260,
                    backgroundImage: displayedArticles[0].thumbnail ? `url(${displayedArticles[0].thumbnail})` : 'none',
                    background: !displayedArticles[0].thumbnail ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {displayedArticles[0].thumbnail && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(15, 23, 42, 0.65)',
                        zIndex: 1,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      display: 'flex',
                      gap: 1,
                      zIndex: 2,
                    }}
                  >
                    <Chip label={t('Deep Research')} color="primary" size="small" sx={{ fontWeight: 700 }} />
                    {displayedArticles[0].is_vip_only && (
                      <Chip
                        icon={<StarIcon sx={{ color: 'secondary.main !important' }} />}
                        label={t('Exclusive')}
                        size="small"
                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: 'secondary.main', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                  <Typography variant="h3" sx={{ color: '#fff', textAlign: 'center', px: 4, fontWeight: 900, zIndex: 2, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {t('LIGHT IN THE BRAIN')}
                  </Typography>
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#f8fafc' }}>
                    {displayedArticles[0].title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {displayedArticles[0].summary}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main', color: '#fff' }}>
                        {displayedArticles[0].author.nickname.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        {displayedArticles[0].author.nickname}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569' }}>
                        •
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {displayedArticles[0].publish_at}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#64748b' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <VisibilityIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption">{displayedArticles[0].views_count.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FavoriteIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption">{displayedArticles[0].likes_count}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CommentIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption">{displayedArticles[0].comments_count}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : null
          )}

          {/* 新闻文章流列表 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {loadingMore && displayedArticles.length === 0 ? (
              Array.from(new Array(activeTab === 0 ? 2 : 3)).map((_, idx) => (
                <Card key={idx} sx={{ bgcolor: '#101726' }}>
                  <Grid container>
                    <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'stretch', overflow: 'hidden', borderRadius: '10px 0 0 10px' }}>
                      <Skeleton variant="rectangular" width="100%" height={140} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                          <Skeleton variant="text" width="20%" height={18} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.06)' }} />
                          <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.06)' }} />
                          <Skeleton variant="text" width="95%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                          <Skeleton variant="text" width="90%" height={16} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.06)' }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                            <Skeleton variant="text" width={40} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                          </Box>
                          <Skeleton variant="text" width={50} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                        </Box>
                      </CardContent>
                    </Grid>
                  </Grid>
                </Card>
              ))
            ) : (
              displayedArticles
                .filter((_, idx) => !(activeTab === 0 && idx === 0))
                .map((item) => (
                  <Card
                    key={item.id}
                    sx={{
                      bgcolor: '#101726',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        borderColor: 'rgba(0, 102, 255, 0.2)',
                      },
                    }}
                    onClick={() => handleArticleClick(item.slug)}
                  >
                    <Grid container>
                      <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'stretch', overflow: 'hidden', borderRadius: '10px 0 0 10px' }}>
                        <Box
                          sx={{
                            width: '100%',
                            minHeight: 140,
                            backgroundImage: item.thumbnail ? `url(${item.thumbnail})` : 'none',
                            background: !item.thumbnail ? (item.id % 2 === 0
                              ? 'linear-gradient(135deg, #101726 0%, #1e293b 100%)'
                              : 'linear-gradient(135deg, #080c14 0%, #111827 100%)') : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: item.thumbnail ? 'scale(1.05)' : 'none',
                            }
                          }}
                        >
                          {!item.thumbnail && (
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {t(item.category.name)}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                              <Chip label={t(item.category.name)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', height: 18, fontSize: '0.6875rem' }} />
                              {item.is_vip_only && (
                                <Chip
                                  icon={<StarIcon sx={{ color: 'secondary.main !important', fontSize: '10px !important' }} />}
                                  label={t('Exclusive Column')}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: 'secondary.main', height: 18, fontSize: '0.6875rem', fontWeight: 700 }}
                                />
                              )}
                            </Box>
                            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1, '&:hover': { color: 'primary.main' } }}>
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.summary}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                {item.author.nickname}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#475569' }}>
                                •
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {item.publish_at.split(' ')[0]}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#64748b' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                <VisibilityIcon sx={{ fontSize: 14 }} />
                                <Typography variant="caption">{(item.views_count / 1000).toFixed(1)}k</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                <FavoriteIcon sx={{ fontSize: 14 }} />
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

          {/* 无限滚动监听锚点与Loading指示器 */}
          <Box
            ref={observerRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
              mt: 2,
            }}
          >
            {loadingMore && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={20} color="primary" />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {t('Loading articles...')}
                </Typography>
              </Box>
            )}

            {!hasMore && displayedArticles.length > 0 && (
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                {t('All articles loaded')}
              </Typography>
            )}
          </Box>
        </Grid>

        {/* 右侧边栏 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <LiveNewsList />
            <TradingViewMarketOverview />

            <Paper sx={{ p: 2.5, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', pb: 1 }}>
                {t('Read Rank')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {displayedArticles.slice(0, 3).map((item, idx) => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => handleArticleClick(item.slug)}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: idx === 0 ? 'primary.main' : idx === 1 ? 'secondary.main' : '#64748b',
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        lineHeight: 1,
                        width: 24,
                        textAlign: 'center',
                      }}
                    >
                      0{idx + 1}
                    </Typography>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc', lineHeight: 1.4, '&:hover': { color: 'primary.main' } }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                        {(item.views_count / 1000).toFixed(1)}k {t('Read')}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
