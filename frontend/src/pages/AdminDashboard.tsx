import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Pagination,
  Skeleton,
  IconButton,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';
import { MetricChart } from '../components/MetricChart';
import { type Article } from '../types';
import { API_BASE } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { EditorJSComponent } from '../components/EditorJSComponent';
import { htmlToBlocks, blocksToHtml, type EditorBlock } from '../utils/editorHtmlConverter';
import { apiFetch } from '../utils/api';

export const AdminDashboard: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // 评论与快讯审核相关状态
  const [pendingComments, setPendingComments] = useState<any[]>([]);
  const [pendingLiveNews, setPendingLiveNews] = useState<any[]>([]);
  const [pendingWriters, setPendingWriters] = useState<any[]>([]);

  // 主编手动发布快讯表单状态
  const [newFlashContent, setNewFlashContent] = useState('');
  const [newFlashUrgency, setNewFlashUrgency] = useState('normal');
  const [newFlashTag, setNewFlashTag] = useState('前沿科技');

  // 弹窗与提示
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // 编辑文章弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState<EditorBlock[]>([]);
  const [editStatus, setEditStatus] = useState('draft');
  const [editIsVip, setEditIsVip] = useState(false);
  const [editAllowComments, setEditAllowComments] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number>(1);
  const [editRelatedArticles, setEditRelatedArticles] = useState<Article[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 新建文章弹窗状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createSummary, setCreateSummary] = useState('');
  const [createContent, setCreateContent] = useState<EditorBlock[]>([]);
  const [createCategoryId, setCreateCategoryId] = useState<number>(1);
  const [createStatus, setCreateStatus] = useState('draft');
  const [createIsVip, setCreateIsVip] = useState(false);
  const [createAllowComments, setCreateAllowComments] = useState(false);
  const [createSourceUrl, setCreateSourceUrl] = useState('');
  const [createRelatedArticles, setCreateRelatedArticles] = useState<Article[]>([]);
  const [createSaving, setCreateSaving] = useState(false);

  // 动态获取分类列表
  const [categoriesList, setCategoriesList] = useState<{ id: number; name: string; slug: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/api/categories/`);
        const data = await res.json();
        if (data.success && data.categories) {
          setCategoriesList(data.categories);
          if (data.categories.length > 0) {
            setCreateCategoryId(data.categories[0].id);
          }
        }
      } catch (err) {
        console.error('Fetch categories error:', err);
      }
    };
    fetchCategories();
  }, []);

  // 关联文章搜索检索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // 异步检索相关文章的防抖 Hook
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        // 由于是选择关联文章，为了方便匹配所有状态的文章，传递 status=all
        const res = await apiFetch(`${API_BASE}/api/articles/?q=${encodeURIComponent(searchQuery)}&status=all&limit=10`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.articles);
        }
      } catch (err) {
        console.error('Search articles error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);


  // 创投统计指标：每周收到的商业计划书数量
  const proposalsTrendData = [
    { label: 'Mon', value: 14 },
    { label: 'Tue', value: 28 },
    { label: 'Wed', value: 35 },
    { label: 'Thu', value: 42 },
    { label: 'Fri', value: 58 },
    { label: 'Sat', value: 21 },
    { label: 'Sun', value: 30 },
  ];

  // 创投统计指标：各赛道稿件发布数量分布
  const sectorShareData = [
    { label: t('Frontier Tech'), value: 45 },
    { label: t('Unicorn Dynamics'), value: 28 },
    { label: t('VC/PE Insights'), value: 32 },
    { label: t('Console'), value: 19 },
  ];

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/articles/?page=${page}&limit=${itemsPerPage}&status=all`);
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles);
        setTotalCount(data.total);
      }
    } catch (err) {
      console.error('Fetch admin articles error:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  // 拉取待审核评论列表
  const fetchPendingComments = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/comments/`);
      const data = await res.json();
      if (data.success) {
        setPendingComments(data.comments);
      }
    } catch (err) {
      console.error('Fetch pending comments error:', err);
    }
  };

  // 拉取待审核快报列表
  const fetchPendingLiveNews = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/livenews/`);
      const data = await res.json();
      if (data.success) {
        setPendingLiveNews(data.news);
      }
    } catch (err) {
      console.error('Fetch pending livenews error:', err);
    }
  };

  // 拉取待审核写作者申请列表
  const fetchPendingWriters = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/users/pending/`);
      const data = await res.json();
      if (data.success) {
        setPendingWriters(data.pending_users);
      }
    } catch (err) {
      console.error('Fetch pending writers error:', err);
    }
  };

  // 审批写作者入驻申请
  const handleApproveWriter = async (userId: number, action: 'approve' | 'reject') => {
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/users/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, action })
      });
      const data = await res.json();
      if (data.success) {
        setSnackbarMsg(data.message || '操作成功');
        setSnackbarOpen(true);
        fetchPendingWriters();
      } else {
        setSnackbarMsg(data.message || '操作失败');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Approve writer error:', err);
      setSnackbarMsg('网络错误，请稍后重试');
      setSnackbarOpen(true);
    }
  };


  useEffect(() => {
    if (activeTab === 0) {
      fetchArticles();
    } else if (activeTab === 2) {
      fetchPendingComments();
    } else if (activeTab === 3) {
      fetchPendingLiveNews();
    } else if (activeTab === 4) {
      fetchPendingWriters();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1); // 重置页码
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId !== null) {
      try {
        const token = localStorage.getItem('lightnews_token');
        const res = await fetch(`${API_BASE}/api/admin/articles/${deleteConfirmId}/delete/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setArticles((prev) => prev.filter((art) => art.id !== deleteConfirmId));
          setTotalCount((prev) => prev - 1);
          setSnackbarMsg(data.message || t('Article unpublished successfully'));
        } else {
          setSnackbarMsg(data.message || t('Delete failed'));
        }
      } catch (err) {
        setSnackbarMsg(t('Delete failed'));
        console.error('Delete article error:', err);
      }
      setDeleteConfirmId(null);
      setSnackbarOpen(true);
    }
  };

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditSummary(article.summary);
    // 将 HTML 正文还原为 Editor.js 兼容的 Blocks 结构
    setEditContent(htmlToBlocks(article.content));
    setEditStatus(article.status || 'published');
    setEditIsVip(article.is_vip_only);
    setEditAllowComments(!!article.allow_comments);
    setEditThumbnail(article.thumbnail || '');
    setEditSourceUrl(article.source_url || '');
    setEditCategoryId(article.category.id);
    setEditRelatedArticles(article.related_articles || []);
    setEditDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingArticle) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('lightnews_token');
      const res = await fetch(`${API_BASE}/api/admin/articles/${editingArticle.id}/upload-image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setEditThumbnail(data.thumbnail);
        setSnackbarMsg(data.message || t('Image uploaded successfully'));
      } else {
        setSnackbarMsg(data.message || t('Upload failed'));
      }
    } catch (err) {
      setSnackbarMsg(t('Upload failed'));
      console.error('Upload image error:', err);
    }
    setUploadingImage(false);
    setSnackbarOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingArticle) return;
    setEditSaving(true);
    // 将 Editor.js Blocks 序列化为标准的 HTML 字符串存盘
    const formattedContent = blocksToHtml(editContent);

    try {
      const token = localStorage.getItem('lightnews_token');
      const res = await fetch(`${API_BASE}/api/admin/articles/${editingArticle.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
          content: formattedContent,
          status: editStatus,
          is_vip_only: editIsVip,
          allow_comments: editAllowComments,
          source_url: editSourceUrl,
          category_id: editCategoryId,
          related_article_ids: editRelatedArticles.map(a => a.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSnackbarMsg(data.message || t('Article updated'));
        setEditDialogOpen(false);
        fetchArticles(); // 重新加载列表
      } else {
        setSnackbarMsg(data.message || t('Update failed'));
      }
    } catch (err) {
      setSnackbarMsg(t('Update failed'));
      console.error('Edit article error:', err);
    }
    setEditSaving(false);
    setSnackbarOpen(true);
  };

  const handleCreateSave = async () => {
    if (!createTitle.trim() || createContent.length === 0) {
      setSnackbarMsg('标题和正文不能为空');
      setSnackbarOpen(true);
      return;
    }
    setCreateSaving(true);
    // 将 Editor.js Blocks 序列化为标准的 HTML 字符串存盘
    const formattedContent = blocksToHtml(createContent);

    try {
      const token = localStorage.getItem('lightnews_token');
      const res = await fetch(`${API_BASE}/api/admin/articles/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: createTitle,
          summary: createSummary,
          content: formattedContent,
          status: createStatus,
          is_vip_only: createIsVip,
          allow_comments: createAllowComments,
          source_url: createSourceUrl,
          category_id: createCategoryId,
          related_article_ids: createRelatedArticles.map((a) => a.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSnackbarMsg('文章发布成功！');
        setCreateDialogOpen(false);
        // 重置新建状态
        setCreateTitle('');
        setCreateSummary('');
        setCreateContent([]);
        setCreateStatus('draft');
        setCreateIsVip(false);
        setCreateAllowComments(false);
        setCreateSourceUrl('');
        setCreateRelatedArticles([]);
        fetchArticles(); // 重新加载
      } else {
        setSnackbarMsg(data.message || '发布失败');
      }
    } catch (err) {
      console.error('Create article error:', err);
      setSnackbarMsg('网络错误');
    } finally {
      setCreateSaving(false);
      setSnackbarOpen(true);
    }
  };

  // 处理评论审核动作
  const handleCommentModerate = async (commentId: number, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('lightnews_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/admin/comments/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment_id: commentId, action })
      });
      const data = await res.json();
      if (data.success) {
        setSnackbarMsg(data.message || t('Audit action successful'));
        setSnackbarOpen(true);
        fetchPendingComments(); // 重新加载
      } else {
        setSnackbarMsg(data.message || t('Audit action failed'));
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Moderate comment error:', err);
    }
  };

  // 处理快讯审核动作
  const handleLiveNewsModerate = async (newsId: number, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('lightnews_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/admin/livenews/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ news_id: newsId, action })
      });
      const data = await res.json();
      if (data.success) {
        setSnackbarMsg(data.message || t('Audit action successful'));
        setSnackbarOpen(true);
        fetchPendingLiveNews(); // 刷新待审核快讯
      } else {
        setSnackbarMsg(data.message || t('Audit action failed'));
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Moderate livenews error:', err);
    }
  };

  // 主编手动快速发布新快讯
  const handleLiveNewsCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlashContent.trim()) return;

    try {
      const token = localStorage.getItem('lightnews_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/admin/livenews/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newFlashContent,
          urgency: newFlashUrgency,
          tag: newFlashTag
        })
      });
      const data = await res.json();
      if (data.success) {
        setSnackbarMsg(data.message || t('Flash news published'));
        setSnackbarOpen(true);
        setNewFlashContent('');
      } else {
        setSnackbarMsg(data.message || t('Flash news publish failed'));
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Create livenews error:', err);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* 头部标题 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/profile')} sx={{ color: '#94a3b8' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h3" sx={{ color: '#f8fafc', fontWeight: 850 }}>
            {t('Dashboard Title')}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
          sx={{ color: '#fff' }}
        >
          {t('Publish Analysis')}
        </Button>
      </Box>

      {/* 核心 Tab 选项卡 */}
      <Paper sx={{ bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            px: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            '& .MuiTab-root': { fontWeight: 600, color: '#94a3b8' },
          }}
        >
          <Tab label={t('Article Management')} />
          <Tab label={t('Sector Stats')} />
          <Tab label={t('Comment Moderation')} />
          <Tab label={t('Flash News Panel')} />
          <Tab label={t('User Auditing')} />
        </Tabs>

        {/* Tab 1: 稿件列表管理 */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer sx={{ bgcolor: 'transparent', border: 'none' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ '& th': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#64748b', fontWeight: 700 } }}>
                  <TableRow>
                    <TableCell sx={{ width: '35%' }}>{t('Article Title')}</TableCell>
                    <TableCell sx={{ width: '12%' }}>{t('Category')}</TableCell>
                    <TableCell align="right" sx={{ width: '10%' }}>{t('Views')}</TableCell>
                    <TableCell align="right" sx={{ width: '10%' }}>{t('Likes')}</TableCell>
                    <TableCell sx={{ width: '12%' }}>{t('VIP Type')}</TableCell>
                    <TableCell sx={{ width: '11%' }}>{t('Publish Time')}</TableCell>
                    <TableCell align="center" sx={{ width: '10%' }}>{t('Action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#cbd5e1' } }}>
                  {loadingArticles ? (
                    Array.from(new Array(itemsPerPage)).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Skeleton variant="text" width="70%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} /></TableCell>
                        <TableCell><Skeleton variant="text" width="40%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} /></TableCell>
                        <TableCell align="right"><Skeleton variant="text" width="30%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.04)', ml: 'auto' }} /></TableCell>
                        <TableCell align="right"><Skeleton variant="text" width="30%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.04)', ml: 'auto' }} /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} /></TableCell>
                        <TableCell><Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} /></TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                            <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748b' }}>
                        {t('No articles found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((art) => (
                      <TableRow key={art.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{art.title}</TableCell>
                        <TableCell>
                          <Chip label={t(art.category.name)} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8' }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {art.views_count.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {art.likes_count}
                        </TableCell>
                        <TableCell>
                          {art.is_vip_only ? (
                            <Chip
                              icon={<StarIcon style={{ color: '#000', fontSize: 12 }} />}
                              label={t('Exclusive')}
                              size="small"
                              sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 700 }}
                            />
                          ) : (
                            <Chip label={t('Free')} size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#475569' }} />
                          )}
                        </TableCell>
                        <TableCell>{art.publish_at.split(' ')[0]}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton size="small" color="primary" onClick={() => handleEditClick(art)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteClick(art.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#94a3b8',
                      fontWeight: 600,
                    },
                    '& .Mui-selected': {
                      color: '#fff',
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Tab 2: 图表数据统计 */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricChart
                  title={t('Weekly BP Trend')}
                  data={proposalsTrendData}
                  type="line"
                  color="#0066ff"
                  valueSuffix={t('BP Suffix')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricChart
                  title={t('Sector Articles Volume')}
                  data={sectorShareData}
                  type="bar"
                  color="#10b981"
                  valueSuffix={t('Articles Suffix')}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 3: 评论审核中心 */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <TableContainer sx={{ bgcolor: 'transparent', border: 'none' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ '& th': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#64748b', fontWeight: 700 } }}>
                  <TableRow>
                    <TableCell sx={{ width: '15%' }}>{t('Moderation User')}</TableCell>
                    <TableCell sx={{ width: '30%' }}>{t('Belongs Article')}</TableCell>
                    <TableCell sx={{ width: '35%' }}>{t('Comment Content')}</TableCell>
                    <TableCell sx={{ width: '12%' }}>{t('Publish Time')}</TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>{t('Action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#cbd5e1' } }}>
                  {pendingComments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#64748b' }}>
                        {t('No Pending Comments')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingComments.map((cmt) => (
                      <TableRow key={cmt.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{cmt.user.nickname || cmt.user.username}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cmt.article_title}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300, wordBreak: 'break-all' }}>{cmt.content}</TableCell>
                        <TableCell>{cmt.created_at}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              startIcon={<CheckIcon />}
                              onClick={() => handleCommentModerate(cmt.id, 'approve')}
                            >
                              {t('Approve')}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CloseIcon />}
                              onClick={() => handleCommentModerate(cmt.id, 'reject')}
                            >
                              {t('Reject')}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 4: 快报发布与审核中心 */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              {/* 左侧：手动发布表单 */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 700 }}>
                    {t('Publish Fast News')}
                  </Typography>

                  <Box component="form" onSubmit={handleLiveNewsCreate}>
                    <TextField
                      fullWidth
                      label={t('Fast News Content')}
                      multiline
                      rows={3}
                      value={newFlashContent}
                      onChange={(e) => setNewFlashContent(e.target.value)}
                      placeholder={t('Enter fast news here...')}
                      sx={{
                        mb: 2.5,
                        '& .MuiInputLabel-root': { color: '#64748b' },
                        '& .MuiOutlinedInput-root': {
                          color: '#f8fafc',
                          '& fieldset': { borderColor: '#334155' },
                          '&:hover fieldset': { borderColor: '#475569' },
                        },
                      }}
                    />

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#64748b' }}>{t('Urgency')}</InputLabel>
                          <Select
                            value={newFlashUrgency}
                            label={t('Urgency')}
                            onChange={(e) => setNewFlashUrgency(e.target.value)}
                            sx={{
                              color: '#f8fafc',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                            }}
                          >
                            <MenuItem value="normal">{t('Normal')}</MenuItem>
                            <MenuItem value="warn">{t('Warn')}</MenuItem>
                            <MenuItem value="critical">{t('Critical')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#64748b' }}>{t('Tag')}</InputLabel>
                          <Select
                            value={newFlashTag}
                            label={t('Tag')}
                            onChange={(e) => setNewFlashTag(e.target.value)}
                            sx={{
                              color: '#f8fafc',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                            }}
                          >
                            <MenuItem value="前沿科技">{t('Frontier Tech')}</MenuItem>
                            <MenuItem value="融资">{t('VC/PE Insights')}</MenuItem>
                            <MenuItem value="独角兽">{t('Unicorn Dynamics')}</MenuItem>
                            <MenuItem value="大厂">{t('Console')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      startIcon={<SendIcon />}
                      sx={{ color: '#fff', py: 1.2, fontWeight: 700 }}
                    >
                      {t('Publish Straight')}
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* 右侧：AI 快讯草稿审核列表 */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 700 }}>
                  {t('AI Draft Audits')}
                </Typography>

                <TableContainer sx={{ bgcolor: 'transparent', border: 'none' }}>
                  <Table>
                    <TableHead sx={{ '& th': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#64748b', fontWeight: 700 } }}>
                      <TableRow>
                        <TableCell>{t('Draft Content')}</TableCell>
                        <TableCell align="center" style={{ width: 180 }}>{t('Action')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#cbd5e1' } }}>
                      {pendingLiveNews.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} align="center" sx={{ py: 6, color: '#64748b' }}>
                            {t('No Pending Fast News')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingLiveNews.map((news) => (
                          <TableRow key={news.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                            <TableCell sx={{ fontSize: '0.875rem', lineHeight: 1.5, py: 2 }}>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                <Chip
                                  label={t(news.tag)}
                                  size="small"
                                  sx={{
                                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3b82f6',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                />
                                {news.urgency !== 'normal' && (
                                  <Chip
                                    label={news.urgency === 'critical' ? t('Critical') : t('Warn')}
                                    size="small"
                                    color={news.urgency === 'critical' ? 'error' : 'warning'}
                                    sx={{ fontSize: '0.75rem', fontWeight: 700 }}
                                  />
                                )}
                                <Typography variant="caption" sx={{ color: '#475569', ml: 'auto' }}>
                                  {news.publish_time}
                                </Typography>
                              </Box>
                              {news.content}
                            </TableCell>
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  color="success"
                                  size="small"
                                  startIcon={<CheckIcon />}
                                  onClick={() => handleLiveNewsModerate(news.id, 'approve')}
                                  sx={{ py: 0.5, fontSize: '0.75rem' }}
                                >
                                  {t('Approve')}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<CloseIcon />}
                                  onClick={() => handleLiveNewsModerate(news.id, 'reject')}
                                  sx={{ py: 0.5, fontSize: '0.75rem' }}
                                >
                                  {t('Reject')}
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 5: 分析师/作者入驻审核面板 */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <TableContainer sx={{ bgcolor: 'transparent', border: 'none' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ '& th': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#64748b', fontWeight: 700 } }}>
                  <TableRow>
                    <TableCell sx={{ width: '20%' }}>用户名 (Username)</TableCell>
                    <TableCell sx={{ width: '20%' }}>昵称 (Nickname)</TableCell>
                    <TableCell sx={{ width: '45%' }}>资质说明 (Credentials)</TableCell>
                    <TableCell align="center" sx={{ width: '15%' }}>动作 (Action)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#cbd5e1' } }}>
                  {pendingWriters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#64748b' }}>
                        暂无待审核的写作者申请
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingWriters.map((writer) => (
                      <TableRow key={writer.user_id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{writer.username}</TableCell>
                        <TableCell>{writer.nickname}</TableCell>
                        <TableCell>{writer.credentials || '未填写'}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              startIcon={<CheckIcon />}
                              onClick={() => handleApproveWriter(writer.user_id, 'approve')}
                            >
                              批准 (Approve)
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CloseIcon />}
                              onClick={() => handleApproveWriter(writer.user_id, 'reject')}
                            >
                              拒绝 (Reject)
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* 确认下架 */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        sx={{ '& .MuiDialog-paper': { bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('Unpublish Confirm')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#94a3b8' }}>
            {t('Unpublish Desc')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ color: '#94a3b8' }}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" autoFocus>
            {t('Confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑文章弹窗 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: '#101726',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundImage: 'none',
            maxHeight: '85vh',
          },
        }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {t('Edit Article')}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {editThumbnail && (
            <Box sx={{ mb: 2.5, textAlign: 'center' }}>
              <img
                src={editThumbnail.startsWith('http') ? editThumbnail : `${API_BASE}${editThumbnail}`}
                alt={t('Article Thumbnail')}
                style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Box>
          )}

          <Button
            variant="outlined"
            component="label"
            fullWidth
            disabled={uploadingImage}
            sx={{
              mb: 2.5,
              borderColor: '#334155',
              color: '#cbd5e1',
              textTransform: 'none',
              fontWeight: 650,
              '&:hover': { borderColor: '#475569', bgcolor: 'rgba(255,255,255,0.02)' }
            }}
          >
            {uploadingImage ? t('Uploading...') : t('Upload New Image')}
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </Button>

          <TextField
            autoFocus
            fullWidth
            label={t('Article Title')}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{
              mt: 1, mb: 2.5,
              '& .MuiInputLabel-root': { color: '#64748b' },
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
              },
            }}
          />
          <TextField
            fullWidth
            label={t('Source Link')}
            value={editSourceUrl}
            onChange={(e) => setEditSourceUrl(e.target.value)}
            placeholder="https://example.com/original-article"
            sx={{
              mb: 2.5,
              '& .MuiInputLabel-root': { color: '#64748b' },
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
              },
            }}
          />
          <TextField
            fullWidth
            label={t('Summary')}
            multiline
            rows={2}
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiInputLabel-root': { color: '#64748b' },
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
              },
            }}
          />
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '0.75rem' }}>
              {t('Content')}
            </Typography>
            {editDialogOpen && (
              <EditorJSComponent
                holder="editorjs-edit"
                data={editContent}
                onChange={(blocks) => setEditContent(blocks)}
              />
            )}
          </Box>
          {/* 相关文章关联智能搜索与展示 */}
          <Typography variant="subtitle2" sx={{ color: '#cbd5e1', mb: 1, fontWeight: 700 }}>
            {t('Related Articles')}
          </Typography>
          <Autocomplete
            options={searchResults}
            loading={searchLoading}
            getOptionLabel={(option) => option.title}
            filterOptions={(x) => x}
            onInputChange={(_e, newInputValue) => setSearchQuery(newInputValue)}
            onChange={(_e, value) => {
              if (value) {
                if (value.id === editingArticle?.id) return;
                if (editRelatedArticles.some((x) => x.id === value.id)) return;
                setEditRelatedArticles((prev) => [...prev, value]);
                setSearchQuery('');
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('Search related articles...')}
                placeholder={t('Search by title...')}
                sx={{
                  mb: 1.5,
                  '& .MuiInputLabel-root': { color: '#64748b' },
                  '& .MuiOutlinedInput-root': {
                    color: '#f8fafc',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#475569' },
                  },
                }}
              />
            )}
            sx={{
              mb: 1,
              '& .MuiAutocomplete-paper': { bgcolor: '#101726', color: '#fff', border: '1px solid #334155' },
            }}
          />
          {/* 展示已选相关文章的 Chip 堆叠区 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {editRelatedArticles.map((art) => (
              <Chip
                key={art.id}
                label={art.title}
                onDelete={() => setEditRelatedArticles((prev) => prev.filter((x) => x.id !== art.id))}
                sx={{
                  bgcolor: 'rgba(0, 102, 255, 0.1)',
                  color: 'primary.main',
                  border: '1px solid rgba(0, 102, 255, 0.2)',
                  fontWeight: 600,
                  maxWidth: '100%',
                  '& .MuiChip-deleteIcon': { color: 'primary.main', '&:hover': { color: '#ff4d4f' } },
                }}
              />
            ))}
            {editRelatedArticles.length === 0 && (
              <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                暂无关联的推荐文章
              </Typography>
            )}
          </Box>

          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth sx={{ mb: 1.5 }}>
                <InputLabel sx={{ color: '#64748b' }}>{t('Category')}</InputLabel>
                <Select
                  value={editCategoryId}
                  label={t('Category')}
                  onChange={(e) => setEditCategoryId(Number(e.target.value))}
                  sx={{
                    color: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                  }}
                >
                  {categoriesList.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {t(cat.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#64748b' }}>{t('Status')}</InputLabel>
                <Select
                  value={editStatus}
                  label={t('Status')}
                  onChange={(e) => setEditStatus(e.target.value)}
                  sx={{
                    color: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                  }}
                >
                  <MenuItem value="draft">{t('Draft')}</MenuItem>
                  <MenuItem value="under_review">{t('Under Review')}</MenuItem>
                  <MenuItem value="published">{t('Published')}</MenuItem>
                  <MenuItem value="archived">{t('Archived')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editIsVip}
                    onChange={(e) => setEditIsVip(e.target.checked)}
                    color="secondary"
                  />
                }
                label={t('VIP Exclusive')}
                sx={{ color: '#94a3b8', ml: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editAllowComments}
                    onChange={(e) => setEditAllowComments(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('Allow Comments') || '开启评论'}
                sx={{ color: '#94a3b8', ml: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={editSaving}
            sx={{ color: '#fff', fontWeight: 700 }}
          >
            {editSaving ? t('Saving...') : t('Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 发布创投分析弹窗 */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: '#101726',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundImage: 'none',
            maxHeight: '85vh',
          },
        }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {t('Publish Analysis')}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label={t('Article Title')}
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            sx={{
              mt: 1, mb: 2.5,
              '& .MuiInputLabel-root': { color: '#64748b' },
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
              },
            }}
          />
          <TextField
            fullWidth
            label={t('Source Link')}
            value={createSourceUrl}
            onChange={(e) => setCreateSourceUrl(e.target.value)}
            placeholder="https://example.com/original-article"
            sx={{
              mb: 2.5,
              '& .MuiInputLabel-root': { color: '#64748b' },
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
              },
            }}
          />
          <TextField
            fullWidth
            label={t('Summary')}
            multiline
            rows={2}
            value={createSummary}
            onChange={(e) => setCreateSummary(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiInputLabel-root': { color: '#64748b' },
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
              },
            }}
          />
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '0.75rem' }}>
              {t('Content')}
            </Typography>
            {createDialogOpen && (
              <EditorJSComponent
                holder="editorjs-create"
                data={createContent}
                onChange={(blocks) => setCreateContent(blocks)}
              />
            )}
          </Box>

          {/* 相关文章关联智能搜索与展示 */}
          <Typography variant="subtitle2" sx={{ color: '#cbd5e1', mb: 1, fontWeight: 700 }}>
            {t('Related Articles')}
          </Typography>
          <Autocomplete
            options={searchResults}
            loading={searchLoading}
            getOptionLabel={(option) => option.title}
            filterOptions={(x) => x}
            onInputChange={(_e, newInputValue) => setSearchQuery(newInputValue)}
            onChange={(_e, value) => {
              if (value) {
                if (createRelatedArticles.some((x) => x.id === value.id)) return;
                setCreateRelatedArticles((prev) => [...prev, value]);
                setSearchQuery('');
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('Search related articles...')}
                placeholder={t('Search by title...')}
                sx={{
                  mb: 1.5,
                  '& .MuiInputLabel-root': { color: '#64748b' },
                  '& .MuiOutlinedInput-root': {
                    color: '#f8fafc',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#475569' },
                  },
                }}
              />
            )}
            sx={{
              mb: 1,
              '& .MuiAutocomplete-paper': { bgcolor: '#101726', color: '#fff', border: '1px solid #334155' },
            }}
          />
          {/* 展示已选相关文章的 Chip 堆叠区 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {createRelatedArticles.map((art) => (
              <Chip
                key={art.id}
                label={art.title}
                onDelete={() => setCreateRelatedArticles((prev) => prev.filter((x) => x.id !== art.id))}
                sx={{
                  bgcolor: 'rgba(0, 102, 255, 0.1)',
                  color: 'primary.main',
                  border: '1px solid rgba(0, 102, 255, 0.2)',
                  fontWeight: 600,
                  maxWidth: '100%',
                  '& .MuiChip-deleteIcon': { color: 'primary.main', '&:hover': { color: '#ff4d4f' } },
                }}
              />
            ))}
            {createRelatedArticles.length === 0 && (
              <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                暂无关联的推荐文章
              </Typography>
            )}
          </Box>

          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth sx={{ mb: 1.5 }}>
                <InputLabel sx={{ color: '#64748b' }}>{t('Category')}</InputLabel>
                <Select
                  value={createCategoryId}
                  label={t('Category')}
                  onChange={(e) => setCreateCategoryId(Number(e.target.value))}
                  sx={{
                    color: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                  }}
                >
                  {categoriesList.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {t(cat.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#64748b' }}>{t('Status')}</InputLabel>
                <Select
                  value={createStatus}
                  label={t('Status')}
                  onChange={(e) => setCreateStatus(e.target.value)}
                  sx={{
                    color: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                  }}
                >
                  <MenuItem value="draft">{t('Draft')}</MenuItem>
                  <MenuItem value="under_review">{t('Under Review')}</MenuItem>
                  <MenuItem value="published">{t('Published')}</MenuItem>
                  <MenuItem value="archived">{t('Archived')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={createIsVip}
                    onChange={(e) => setCreateIsVip(e.target.checked)}
                    color="secondary"
                  />
                }
                label={t('VIP Exclusive')}
                sx={{ color: '#94a3b8', ml: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={createAllowComments}
                    onChange={(e) => setCreateAllowComments(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('Allow Comments') || '开启评论'}
                sx={{ color: '#94a3b8', ml: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleCreateSave}
            variant="contained"
            disabled={createSaving}
            sx={{ color: '#fff', fontWeight: 700 }}
          >
            {createSaving ? t('Saving...') : t('Publish Straight')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="info" onClose={() => setSnackbarOpen(false)} sx={{ bgcolor: '#080c14', color: '#fff', border: '1px solid rgba(255,255,255,0.05)' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
};
export default AdminDashboard;
