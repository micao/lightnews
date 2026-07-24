import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, Chip, IconButton, Badge, Skeleton } from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { type LiveNews } from '../types';
import { useI18n } from '../context/I18nContext';
import { API_BASE } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export const LiveNewsList: React.FC = () => {
  const [newsList, setNewsList] = useState<LiveNews[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t } = useI18n();

  const fetchLiveNews = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/livenews/`);

      const data = await res.json();
      if (data.success) {
        setNewsList(data.news);
      }
    } catch (err) {
      console.error('Fetch live news error:', err);
    }
  };

  useEffect(() => {
    fetchLiveNews();
    const interval = setInterval(fetchLiveNews, 10000); // 10秒自动刷新一次
    return () => clearInterval(interval);
  }, []);

  const handleToggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getTagColor = (tag: LiveNews['tag']) => {
    switch (tag) {
      case '融资':
        return '#10b981'; // 创投绿
      case '独角兽':
        return '#0066ff'; // 科技蓝
      case '前沿科技':
        return '#06b6d4'; // 极客青
      case '大厂':
        return '#8b5cf6'; // 科技紫
      default:
        return '#94a3b8';
    }
  };

  return (
    <Card sx={{ p: 2, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', pb: 1 }}>
        <FlashOnIcon sx={{ color: '#0066ff', mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {t('7x24 Flash News')}
        </Typography>
        <Badge variant="dot" color="primary" overlap="circular">
          <Chip label={t('Real-time News')} size="small" color="primary" sx={{ fontSize: '0.75rem', height: 20 }} />
        </Badge>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '600px', overflowY: 'auto', pr: 0.5 }}>
        {newsList.length === 0 ? (
          Array.from(new Array(4)).map((_, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                borderLeft: '4px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Skeleton variant="text" width="30%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Skeleton variant="text" width="20%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
              </Box>
              <Skeleton variant="text" width="90%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
              <Skeleton variant="text" width="80%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
            </Box>
          ))
        ) : (
          newsList.map((item) => {
            const isExpanded = expandedId === item.id;
            const contentLimit = item.content.length > 70 ? `${item.content.substring(0, 70)}...` : item.content;

            return (
              <Box
                key={item.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  borderLeft: `4px solid ${getTagColor(item.tag)}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                      {item.publish_time}
                    </Typography>
                    {item.urgency === 'critical' && (
                      <Chip label={t('Exclusive')} size="small" color="error" sx={{ height: 16, fontSize: '0.625rem', fontWeight: 700 }} />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={t(item.tag)}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        bgcolor: `${getTagColor(item.tag)}1a`,
                        color: getTagColor(item.tag),
                        border: `1px solid ${getTagColor(item.tag)}33`,
                      }}
                    />
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#f1f5f9',
                    fontWeight: item.urgency === 'critical' ? 700 : 500,
                    cursor: item.content.length > 70 ? 'pointer' : 'default',
                    lineHeight: 1.5,
                  }}
                  onClick={() => item.content.length > 70 && handleToggleExpand(item.id)}
                >
                  {isExpanded ? item.content : contentLimit}
                </Typography>

                {item.content.length > 70 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <IconButton size="small" onClick={() => handleToggleExpand(item.id)} sx={{ p: 0.25, color: '#64748b' }}>
                      {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Card>
  );
};
export default LiveNewsList;
