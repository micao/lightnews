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

export const AdminDashboard: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 3;
  const navigate = useNavigate();

  // 评论与快讯审核相关状态
  const [pendingComments, setPendingComments] = useState<any[]>([]);
  const [pendingLiveNews, setPendingLiveNews] = useState<any[]>([]);

  // 主编手动发布快讯表单状态
  const [newFlashContent, setNewFlashContent] = useState('');
  const [newFlashUrgency, setNewFlashUrgency] = useState('normal');
  const [newFlashTag, setNewFlashTag] = useState('前沿科技');

  // 弹窗与提示
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

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

  // 拉取后端文章列表
  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem('lightnews_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/articles/?page=${page}&limit=${itemsPerPage}&status=all`, { headers });
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles);
        setTotalCount(data.total);
      }
    } catch (err) {
      console.error('Fetch admin articles error:', err);
    }
  };

  // 拉取待审核评论列表
  const fetchPendingComments = async () => {
    try {
      const token = localStorage.getItem('lightnews_token');
      if (!token) return;
      
      const res = await fetch(`${API_BASE}/api/admin/comments/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      const token = localStorage.getItem('lightnews_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/admin/livenews/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPendingLiveNews(data.news);
      }
    } catch (err) {
      console.error('Fetch pending livenews error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchArticles();
    } else if (activeTab === 2) {
      fetchPendingComments();
    } else if (activeTab === 3) {
      fetchPendingLiveNews();
    }
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
      setArticles((prev) => prev.filter((art) => art.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setSnackbarMsg(t('Article unpublished successfully'));
      setSnackbarOpen(true);
    }
  };

  const handleEditClick = (title: string) => {
    setSnackbarMsg(`${t('Opening edit panel for')}《${title.substring(0, 10)}...》`);
    setSnackbarOpen(true);
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

        <Button variant="contained" color="primary" sx={{ color: '#fff' }}>
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
        </Tabs>

        {/* Tab 1: 稿件列表管理 */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer sx={{ bgcolor: 'transparent', border: 'none' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ '& th': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#64748b', fontWeight: 700 } }}>
                  <TableRow>
                    <TableCell>{t('Article Title')}</TableCell>
                    <TableCell>{t('Category')}</TableCell>
                    <TableCell align="right">{t('Views')}</TableCell>
                    <TableCell align="right">{t('Likes')}</TableCell>
                    <TableCell>{t('VIP Type')}</TableCell>
                    <TableCell>{t('Publish Time')}</TableCell>
                    <TableCell align="center">{t('Action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#cbd5e1' } }}>
                  {articles.map((art) => (
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
                          <IconButton size="small" color="primary" onClick={() => handleEditClick(art.title)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(art.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
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
                    <TableCell>{t('Moderation User')}</TableCell>
                    <TableCell>{t('Belongs Article')}</TableCell>
                    <TableCell>{t('Comment Content')}</TableCell>
                    <TableCell>{t('Publish Time')}</TableCell>
                    <TableCell align="center">{t('Action')}</TableCell>
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
