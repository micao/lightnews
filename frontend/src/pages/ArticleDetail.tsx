import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  TextField,
  Divider,
  Paper,
  IconButton,
  Grid,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { type Article, type Comment } from '../types';

export const ArticleDetail: React.FC = () => {
  const { t } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // 加载文章和评论数据
  const fetchArticleAndComments = async () => {
    try {
      const token = localStorage.getItem('lightnews_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 获取文章详情
      const artRes = await fetch(`${API_BASE}/api/articles/${slug}/`, { headers });
      const artData = await artRes.json();
      if (artData.success) {
        setArticle(artData.article);
      }

      // 获取审核过的评论树
      const cmtRes = await fetch(`${API_BASE}/api/interactions/comment/?article_slug=${slug}`);
      const cmtData = await cmtRes.json();
      if (cmtData.success) {
        setComments(cmtData.comments);
      }
    } catch (err) {
      console.error('Fetch detail error:', err);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchArticleAndComments();
    }
  }, [slug, authUser]);

  if (!article) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', bgcolor: '#080c14' }}>
        <Typography color="error">{t('Loading article or it has been removed')}</Typography>
      </Box>
    );
  }

  // 接口中返回的 is_locked 决定了是否遮罩锁定
  const isVipLocked = (article as any).is_locked;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const token = localStorage.getItem('lightnews_token');
      if (!token) {
        alert(t('Please log in first to write comments'));
        return;
      }

      const res = await fetch(`${API_BASE}/api/interactions/comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          article_slug: slug,
          content: newCommentText
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || t('Comment Success'));
        setNewCommentText('');
        // 重新拉取
        fetchArticleAndComments();
      } else {
        alert(data.message || t('Comment Failed'));
      }
    } catch (err) {
      console.error('Comment submit error:', err);
    }
  };

  const handleLike = async () => {
    if (!authUser) {
      alert(t('Likes open for logged in only'));
      return;
    }

    try {
      const token = localStorage.getItem('lightnews_token');
      const res = await fetch(`${API_BASE}/api/interactions/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_type: 'article',
          target_id: article.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setArticle(prev => prev ? { ...prev, likes_count: data.likes_count } : null);
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  const handleBookmark = () => {
    if (!authUser) {
      alert(t('Please log in first to bookmark'));
      return;
    }
    setBookmarked((prev) => !prev);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }}>
      {/* 返回按钮 */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ color: '#94a3b8', mb: 3, '&:hover': { color: 'primary.main' } }}
      >
        {t('Back to Home')}
      </Button>

      <Grid container spacing={3}>
        {/* 文章主体 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {article.thumbnail && (
              <Box
                component="img"
                src={article.thumbnail}
                alt={article.title}
                sx={{
                  width: '100%',
                  maxHeight: 380,
                  objectFit: 'cover',
                  borderRadius: 2,
                  mb: 4,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              />
            )}
            <Box sx={{ mb: 2 }}>
              <Chip label={t(article.category.name)} color="primary" variant="outlined" size="small" sx={{ mb: 2, borderColor: 'primary.main', color: 'primary.main' }} />
              {article.is_vip_only && (
                <Chip
                  icon={<StarIcon style={{ color: '#000' }} />}
                  label={t('Exclusive Column')}
                  size="small"
                  sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 700, ml: 1 }}
                />
              )}
            </Box>

            <Typography variant="h1" sx={{ color: '#f8fafc', fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, mb: 2.5, lineHeight: 1.3 }}>
              {article.title}
            </Typography>

            {/* 作者和元数据 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}>
                  {article.author.nickname.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                    {article.author.nickname}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {t('Published at')} {article.publish_at}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                <IconButton onClick={handleLike} sx={{ color: liked ? 'error.main' : '#64748b' }}>
                  {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <Typography variant="body2" sx={{ mr: 1 }}>{article.likes_count}</Typography>
                
                <IconButton onClick={handleBookmark} sx={{ color: bookmarked ? 'primary.main' : '#64748b' }}>
                  {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>

                <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 1 }}>
                  <VisibilityIcon fontSize="small" />
                  <Typography variant="caption">{article.views_count.toLocaleString()}</Typography>
                </Box>
              </Box>
            </Box>

            {/* 核心导读 / 摘要 */}
            {article.summary && (
              <Box
                sx={{
                  p: 2.5,
                  mb: 4,
                  bgcolor: 'rgba(0, 102, 255, 0.03)',
                  borderLeft: '4px solid',
                  borderColor: 'secondary.main',
                  borderRadius: '0 8px 8px 0',
                  borderTop: '1px solid rgba(255, 255, 255, 0.01)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.01)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.01)',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: 'secondary.main',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 1
                  }}
                >
                  {t('Abstract / Summary')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {article.summary}
                </Typography>
              </Box>
            )}

            {/* 文章内容 */}
            <Box sx={{ color: '#cbd5e1', fontSize: '1.0625rem', lineHeight: 1.8 }}>
              {isVipLocked ? (
                <>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {article.content}
                  </Typography>
                  
                  {/* VIP 遮蔽锁屏 */}
                  <Box
                    sx={{
                      position: 'relative',
                      mt: 4,
                      p: 4,
                      borderRadius: 3,
                      bgcolor: 'rgba(16, 23, 38, 0.95)',
                      border: '1px solid rgba(0, 102, 255, 0.3)',
                      background: 'linear-gradient(180deg, rgba(16, 23, 38, 0.4) 0%, #101726 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -100,
                        width: '100%',
                        height: 100,
                        background: 'linear-gradient(to bottom, transparent, #101726)',
                      }
                    }}
                  >
                    <Box sx={{ bgcolor: 'rgba(0, 102, 255, 0.12)', p: 2, borderRadius: '50%', mb: 2 }}>
                      <LockIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    </Box>
                    <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1 }}>
                      {t('VIP Lock Title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, maxWidth: 450 }}>
                      {t('VIP Lock Desc')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button variant="contained" color="primary" onClick={() => navigate('/login')} sx={{ color: '#fff', px: 4 }}>
                        {t('Login Account')}
                      </Button>
                      <Button variant="outlined" color="secondary" sx={{ px: 3 }}>
                        {t('Apply VIP')}
                      </Button>
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    dangerouslySetInnerHTML={{ __html: article.content }}
                    sx={{
                      color: '#cbd5e1',
                      fontSize: '1.0625rem',
                      lineHeight: 1.8,
                      '& p': { mb: 2.5 },
                      '& h3, & h4, & h2': { color: '#f8fafc', mt: 3.5, mb: 1.5, fontWeight: 700 },
                      '& ul, & ol': { pl: 3, mb: 2.5 },
                      '& li': { mb: 1 },
                      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 2, my: 2 }
                    }}
                  />
                  <Typography variant="body2" sx={{ mb: 2, mt: 3, color: 'text.secondary', fontStyle: 'italic', borderTop: '1px dashed rgba(255,255,255,0.05)', pt: 2 }}>
                    {t('Venture End Warning')}
                  </Typography>
                </>
              )}
            </Box>
          </Paper>

          {/* 评论区 */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700, mb: 3 }}>
              {t('Comments')} ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})
            </Typography>

            {/* 发送评论框 */}
            <Paper component="form" onSubmit={handleSendComment} sx={{ p: 2, mb: 4, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder={authUser ? t('Write comment...') : t('Login to comment')}
                disabled={!authUser}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button type="submit" variant="contained" color="primary" disabled={!authUser || !newCommentText.trim()} sx={{ color: '#fff', px: 3 }}>
                  {t('Submit Comment')}
                </Button>
              </Box>
            </Paper>

            {/* 评论树 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {comments.map((cmt) => (
                <Paper key={cmt.id} sx={{ p: 2.5, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                      {cmt.user.nickname?.charAt(0) || cmt.user.username.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                          {cmt.user.nickname || cmt.user.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {cmt.created_at}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1.5 }}>
                        {cmt.content}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2, color: '#64748b' }}>
                        <Button size="small" startIcon={<FavoriteBorderIcon fontSize="small" />} sx={{ color: '#64748b', fontSize: '0.75rem', p: 0 }}>
                          {t('Likes')} ({cmt.likes_count})
                        </Button>
                      </Box>

                      {/* 子回复 */}
                      {cmt.replies && cmt.replies.map((reply) => (
                        <Box key={reply.id} sx={{ mt: 2, pl: 2, borderLeft: '2px solid rgba(255, 255, 255, 0.06)' }}>
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                            <Avatar sx={{ bgcolor: '#475569', width: 28, height: 28, fontSize: '0.75rem' }}>
                              {reply.user.nickname?.charAt(0) || reply.user.username.charAt(0)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                                  {reply.user.nickname || reply.user.username}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {reply.created_at}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                                {reply.content}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* 右侧边栏 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 2.5, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                {t('Disclaimer')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
                {t('Disclaimer Desc 1')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {t('Disclaimer Desc 2')}
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
export default ArticleDetail;
