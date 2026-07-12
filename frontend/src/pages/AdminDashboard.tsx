import React, { useState } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { MetricChart } from '../components/MetricChart';
import { MOCK_ARTICLES } from './Home';
import { type Article } from '../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [page, setPage] = useState(1);
  const itemsPerPage = 3;
  const navigate = useNavigate();

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // 创投统计指标：每周收到的商业计划书 (Business Proposals) 数量
  const proposalsTrendData = [
    { label: '周一', value: 14 },
    { label: '周二', value: 28 },
    { label: '周三', value: 35 },
    { label: '周四', value: 42 },
    { label: '周五', value: 58 },
    { label: '周六', value: 21 },
    { label: '周日', value: 30 },
  ];

  // 创投统计指标：各赛道稿件发布数量分布
  const sectorShareData = [
    { label: '前沿科技', value: 45 },
    { label: '独角兽动态', value: 28 },
    { label: 'VC/PE观察', value: 32 },
    { label: '大厂生态', value: 19 },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId !== null) {
      setArticles((prev) => prev.filter((art) => art.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setSnackbarMsg('文章删除成功 (模拟已从库中移除)');
      setSnackbarOpen(true);
    }
  };

  const handleEditClick = (title: string) => {
    setSnackbarMsg(`正在打开文章《${title.substring(0, 10)}...》的编辑面板`);
    setSnackbarOpen(true);
  };

  const paginatedArticles = articles.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(articles.length / itemsPerPage);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* 头部标题 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/profile')} sx={{ color: '#94a3b8' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h3" sx={{ color: '#f8fafc', fontWeight: 850 }}>
            创投控制台管理后台
          </Typography>
        </Box>

        <Button variant="contained" color="primary" sx={{ color: '#fff' }}>
          发布创投分析
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
          <Tab label="稿件库管理" />
          <Tab label="赛道数据统计" />
        </Tabs>

        {/* Tab 1: 稿件列表管理 */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer sx={{ bgcolor: 'transparent', border: 'none' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ '& th': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#64748b', fontWeight: 700 } }}>
                  <TableRow>
                    <TableCell>文章标题</TableCell>
                    <TableCell>大类分类</TableCell>
                    <TableCell align="right">浏览量</TableCell>
                    <TableCell align="right">收藏数</TableCell>
                    <TableCell>专栏属性</TableCell>
                    <TableCell>发布时间</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#cbd5e1' } }}>
                  {paginatedArticles.map((art) => (
                    <TableRow key={art.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{art.title}</TableCell>
                      <TableCell>
                        <Chip label={art.category.name} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8' }} />
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
                            label="独家"
                            size="small"
                            sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 700 }}
                          />
                        ) : (
                          <Chip label="免费" size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#475569' }} />
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
                  title="本周收到初创项目商业计划书(BP)趋势"
                  data={proposalsTrendData}
                  type="line"
                  color="#0066ff"
                  valueSuffix="份BP"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricChart
                  title="创投快报各细分赛道稿件发布数量分布"
                  data={sectorShareData}
                  type="bar"
                  color="#10b981"
                  valueSuffix="篇"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* 确认删除 */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        sx={{ '& .MuiDialog-paper': { bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700 }}>确认下架该创投分析吗？</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#94a3b8' }}>
            下架后该深度分析文章将不可在首页前台展现，所有相关的读者评论将物理级级联清空。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ color: '#94a3b8' }}>
            取消
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" autoFocus>
            确认下架
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
