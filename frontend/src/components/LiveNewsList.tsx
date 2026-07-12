import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, Chip, IconButton, Badge } from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { type LiveNews } from '../types';

const INITIAL_LIVE_NEWS: LiveNews[] = [
  {
    id: 1,
    content: '【融资】大模型独角兽“月之暗面”完成新一轮数亿美元融资，本轮融资由红杉中国、美团龙珠等机构联合领投，投后估值正式攀升至26亿美元。',
    urgency: 'critical',
    tag: '融资',
    publish_time: '15:10:05',
  },
  {
    id: 2,
    content: '【前沿科技】清华大学集成电路学院课题组研制出全球首款“三维芯片智能架构”，相关科研成果已于今日正式发表在《Nature》正刊上，实现算力密度飞跃。',
    urgency: 'normal',
    tag: '前沿科技',
    publish_time: '15:05:42',
  },
  {
    id: 3,
    content: '【大厂】腾讯混元大模型宣布全面开源，并推出面向企业端的大模型API半价优惠策略，正式加入国内主流云厂商的算力性价比大战。',
    urgency: 'warn',
    tag: '大厂',
    publish_time: '14:52:10',
  },
  {
    id: 4,
    content: '【独角兽】商业航天研制商“星河动力”于酒泉卫星发射中心成功实现“谷神星一号”商业运载火箭一日双发，完成了两颗气象遥感卫星的精确定轨。',
    urgency: 'normal',
    tag: '独角兽',
    publish_time: '14:38:00',
  },
  {
    id: 5,
    content: '【融资】低空飞行汽车初创研发商“御风未来”宣布完成1.5亿元A+轮融资，资金将全部用于其2吨级电动垂直起降飞行器(eVTOL)的安全试飞与适航认证。',
    urgency: 'normal',
    tag: '融资',
    publish_time: '14:15:30',
  },
];

export const LiveNewsList: React.FC = () => {
  const [newsList, setNewsList] = useState<LiveNews[]>(INITIAL_LIVE_NEWS);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const mockTemplates = [
      {
        content: '【独角兽】智能芯片独角兽“摩尔线程”宣布启动科创板IPO辅导，海通证券担任辅导机构，国内全功能国产GPU研发商迎来上市关键里程碑。',
        urgency: 'critical',
        tag: '独角兽',
      },
      {
        content: '【融资】具身智能机器人研发商“星动纪元”完成Pre-A+轮超亿元融资，由源码资本领投，资金主要用于人形机器人多模态大脑构建。',
        urgency: 'normal',
        tag: '融资',
      },
      {
        content: '【前沿科技】谷歌DeepMind团队发布全新医疗AlphaFold-Med大模型，能以95%的精确度预测人体蛋白质与化合物分子的复杂交互配体结构。',
        urgency: 'normal',
        tag: '前沿科技',
      },
      {
        content: '【大厂】阿里巴巴阿里云宣布将下调公共云核心云产品海外售价，降价幅度最高达59%，覆盖计算、存储、数据库等核心企业算力服务。',
        urgency: 'warn',
        tag: '大厂',
      },
    ];

    const interval = setInterval(() => {
      const template = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const newNews: LiveNews = {
        id: Date.now(),
        content: template.content,
        urgency: template.urgency as any,
        tag: template.tag as any,
        publish_time: timeStr,
      };

      setNewsList((prev) => [newNews, ...prev.slice(0, 9)]);
    }, 15000);

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
          7x24 创投快讯
        </Typography>
        <Badge variant="dot" color="primary" overlap="circular">
          <Chip label="实时快报" size="small" color="primary" sx={{ fontSize: '0.75rem', height: 20 }} />
        </Badge>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '600px', overflowY: 'auto', pr: 0.5 }}>
        {newsList.map((item) => {
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
                    <Chip label="首发" size="small" color="error" sx={{ height: 16, fontSize: '0.625rem', fontWeight: 700 }} />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    label={item.tag}
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
        })}
      </Box>
    </Card>
  );
};
export default LiveNewsList;
