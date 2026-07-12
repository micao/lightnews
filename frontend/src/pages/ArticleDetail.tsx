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
import { type Article, type Comment } from '../types';

export const ArticleDetail: React.FC = () => {
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
        <Typography color="error">文章正在拉取，或已被下架。</Typography>
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
        alert('请先登录再发表评论');
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
        alert(data.message || '评论提交成功，等待后台审核！');
        setNewCommentText('');
        // 重新拉取
        fetchArticleAndComments();
      } else {
        alert(data.message || '评论发表失败');
      }
    } catch (err) {
      console.error('Comment submit error:', err);
    }
  };

  const handleLike = async () => {
    if (!authUser) {
      alert('点赞功能仅在登录后开放！');
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
      alert('请先登录再进行收藏');
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
        返回首页
      </Button>

      <Grid container spacing={3}>
        {/* 文章主体 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Box sx={{ mb: 2 }}>
              <Chip label={article.category.name} color="primary" variant="outlined" size="small" sx={{ mb: 2, borderColor: 'primary.main', color: 'primary.main' }} />
              {article.is_vip_only && (
                <Chip
                  icon={<StarIcon style={{ color: '#000' }} />}
                  label="创投独家专栏"
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
                    发布于 {article.publish_at}
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
                      本内容为创投独家专栏深度解析
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, maxWidth: 450 }}>
                      LIGHT IN THE BRAIN 独家深度创投研报。包含全球科技巨头布局、细分赛道梳理与初创企业评级，登录或升级会员即可解锁全文。
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button variant="contained" color="primary" onClick={() => navigate('/login')} sx={{ color: '#fff', px: 4 }}>
                        登录账户
                      </Button>
                      <Button variant="outlined" color="secondary" sx={{ px: 3 }}>
                        申请加入VIP
                      </Button>
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {article.content}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    随着未来三个季度全球主要云大厂资本开支在AI模型落地上的比拼，初创企业的估值将逐步进入“挤水”周期。我们将持续跟踪硬科技、商业航天和AI垂直细分应用赛道，敬请锁定自选看盘与分析后台。
                  </Typography>
                </>
              )}
            </Box>
          </Paper>

          {/* 评论区 */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700, mb: 3 }}>
              评论互动 ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})
            </Typography>

            {/* 发送评论框 */}
            <Paper component="form" onSubmit={handleSendComment} sx={{ p: 2, mb: 4, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder={authUser ? "输入您的专业财经见解..." : "登录后发表您的见解..."}
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
                  发表评论
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
                          赞 ({cmt.likes_count})
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
                免责声明 & 创投资讯提示
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
                本报道研究所载的全部内容仅代表分析师个人及机构的研究观点，不构成任何形式的投资建议或直接交易指令。
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                一级创投市场风险极高，早期初创企业具有很高的死亡率和较弱的清算保护。请理性判定产业发展阶段与商业模型。
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
export default ArticleDetail;
