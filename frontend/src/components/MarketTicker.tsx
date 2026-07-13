import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { type FundingTickerItem } from '../types';
import { API_BASE } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export const MarketTicker: React.FC = () => {
  const [fundingDeals, setFundingDeals] = useState<FundingTickerItem[]>([]);
  const { t } = useI18n();

  const fetchDeals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/market/ticker/`);
      const data = await res.json();
      if (data.success) {
        setFundingDeals(data.deals);
      }
    } catch (err) {
      console.error('Fetch funding deals error:', err);
    }
  };

  useEffect(() => {
    fetchDeals();
    // 每隔 30 秒后台静默拉取最新的投融资动态
    const interval = setInterval(fetchDeals, 30000);
    return () => clearInterval(interval);
  }, []);

  if (fundingDeals.length === 0) {
    return null; // 加载中或空数据时不渲染
  }

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: '#0f172a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        py: 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: 'scrollTicker 35s linear infinite',
          '&:hover': {
            animationPlayState: 'paused',
          },
          '@keyframes scrollTicker': {
            '0%': { transform: 'translateX(0%)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        }}
      >
        {[...fundingDeals, ...fundingDeals].map((item, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 3,
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', mr: 1 }}>
              {item.company}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'rgba(0, 102, 255, 0.12)',
                color: 'primary.main',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: '0.6875rem',
                fontWeight: 700,
                mr: 1,
              }}
            >
              {t(item.round)}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'secondary.main', mr: 1 }}>
              {item.amount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, mr: 1.5 }}>
              ({t(item.investor)})
            </Typography>
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                color: '#64748b',
                px: 0.8,
                py: 0.25,
                borderRadius: 1,
                fontSize: '0.625rem',
                fontWeight: 600,
              }}
            >
              {t(item.sector)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
export default MarketTicker;
