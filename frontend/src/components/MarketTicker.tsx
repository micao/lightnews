import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { type FundingTickerItem } from '../types';

const INITIAL_FUNDING: FundingTickerItem[] = [
  { company: '智谱AI', round: 'B-2轮', amount: '10亿人民币', investor: '君联资本、腾讯投资', sector: '生成式AI' },
  { company: '银河航天', round: 'B+轮', amount: '数亿人民币', investor: '深创投、建银国际', sector: '商业航天' },
  { company: '逐际动力', round: 'Pre-A轮', amount: '1.2亿人民币', investor: '绿洲资本、联想创投', sector: '具身智能' },
  { company: 'Vercel', round: 'D轮', amount: '1.5亿美元', investor: 'GGV, Accel Partners', sector: 'DevOps' },
  { company: '深势科技', round: 'B轮', amount: '数千万美元', investor: '高瓴创投、启明创投', sector: 'AI for Science' },
  { company: '星河动力', round: 'C轮', amount: '5亿人民币', investor: '中信证券、金航深创', sector: '商业航天' },
];

export const MarketTicker: React.FC = () => {
  const [fundingDeals, setFundingDeals] = useState<FundingTickerItem[]>(INITIAL_FUNDING);

  // 模拟每隔数秒产生一个大额投融资快报更新
  useEffect(() => {
    const mockCompanies = ['月之暗面', '摩尔线程', '东方空间', '极佳科技', '小马智行'];
    const mockRounds = ['A+轮', 'B-轮', '战略投资', 'C+轮'];
    const mockAmounts = ['2亿人民币', '数千万美元', '1.5亿人民币', '4.5亿人民币'];
    const mockInvestors = ['红杉中国', '顺为资本', '真格基金', '源码资本', 'IDG资本'];
    const mockSectors = ['大语言模型', 'GPU芯片', '商业航天', '自动驾驶'];

    const interval = setInterval(() => {
      const company = mockCompanies[Math.floor(Math.random() * mockCompanies.length)];
      const round = mockRounds[Math.floor(Math.random() * mockRounds.length)];
      const amount = mockAmounts[Math.floor(Math.random() * mockAmounts.length)];
      const investor = mockInvestors[Math.floor(Math.random() * mockInvestors.length)] + '领投';
      const sector = mockSectors[Math.floor(Math.random() * mockSectors.length)];

      const newDeal: FundingTickerItem = { company, round, amount, investor, sector };

      setFundingDeals((prev) => {
        const next = [newDeal, ...prev];
        if (next.length > 8) next.pop();
        return next;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

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
              {item.round}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'secondary.main', mr: 1 }}>
              {item.amount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, mr: 1.5 }}>
              ({item.investor})
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
              {item.sector}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
export default MarketTicker;
