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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import StarIcon from '@mui/icons-material/Star';
import { LiveNewsList } from '../components/LiveNewsList';
import { type Article } from '../types';

export const MOCK_ARTICLES: Article[] = [
  {
    id: 1,
    title: '【重磅深度】全球AI芯片大变局：高算力红利退潮后的商业化突围',
    slug: 'global-ai-chip-market-and-commercialization',
    summary: '随着各大AI云大厂对资本开支产出比的要求更加苛刻，AI算力泡沫正面临重构。本研究聚焦先进制程代工逻辑、边缘端AI芯片爆发节点，以及国内独角兽的流片进度。',
    content: '在经历了近三年来疯狂的算力算大开支后，全球科技产业正在迎来更为务实的落地重组。大语言模型不仅需要极高的峰值浮点计算速度，更面临单位耗电成本与吞吐效率的严酷约束。本文将探讨：1. 存算一体等新兴微架构在端侧推理芯片中的效率跃升；2. 3D堆叠与先进封装工艺在缓解HBM显存带宽限制上的关键作用；3. 创投基金在中早期半导体项目估值回归理性后的重仓赛道。这标志着人工智能硬件链正式迈入了拼“单位性价比”的新常态。',
    author: { id: 1, nickname: '肖杰克 (前沿科技分析师)', avatar_url: '' },
    category: { id: 1, name: '前沿科技' },
    importance: 5,
    is_vip_only: true,
    views_count: 42100,
    likes_count: 1050,
    comments_count: 242,
    publish_at: '2026-07-12 10:00:00',
    created_at: '2026-07-12 09:30:00',
  },
  {
    id: 2,
    title: '中国具身智能独角兽密集融资，2026是否能迎来商用落地拐点？',
    slug: 'embodied-ai-unicorns-funding-and-commercialization',
    summary: '人形机器人与大模型大脑深度融合，星动纪元、逐际动力等创企最近数月密集宣布完成数亿级融资，资本重新涌入硬科技孵化池。',
    content: '人形机器人之所以在最近迎来爆发式增长，主要得益于多模态物理大模型赋予其通用任务规划与泛化执行能力。在仓储搬运、新能源汽车装配车间，首批测试样机已经正式入驻进行试工。VC们更关心的是：量产后的BOM（物料清单）成本能否控制在2万美元以内，以及核心力矩传感器与谐波减速器的国产替代替代率。未来18个月，将是具身智能从“实验室Demo”走向“工厂流水线”的关键分水岭。',
    author: { id: 2, nickname: '陈VC (硬科技合伙人)', avatar_url: '' },
    category: { id: 2, name: '独角兽动态' },
    importance: 4,
    is_vip_only: false,
    views_count: 31200,
    likes_count: 920,
    comments_count: 145,
    publish_at: '2026-07-12 09:15:00',
    created_at: '2026-07-12 08:45:00',
  },
  {
    id: 3,
    title: '光刻机巨头ASML二季报透视：国内先进制程客户设备需求坚挺',
    slug: 'asml-q2-earnings-and-china-foundry-demand',
    summary: 'ASML今日开盘大涨。虽然欧洲对高端先进制程DUV设备出口审核有收紧趋势，但国内二线晶圆厂在特色工艺与成熟制程上的强劲扩张抵消了地缘扰动。',
    content: '全球半导体设备需求依然保持着可观的惯性。国内半导体晶圆代工厂在模拟芯片、射频、电源管理及功率半导体等成熟应用赛道上正处于扩产高峰。这也反映在ASML前道光刻设备的积压订单交付上。行业调研显示，尽管面对重重政策阻力，通过Chiplet先进封装等折中技术路径，国内算力芯片初创企业依然在寻找可行的自主突围通路。',
    author: { id: 3, nickname: '张芯 (半导体观察家)', avatar_url: '' },
    category: { id: 1, name: '前沿科技' },
    importance: 3,
    is_vip_only: false,
    views_count: 24500,
    likes_count: 530,
    comments_count: 76,
    publish_at: '2026-07-12 08:30:00',
    created_at: '2026-07-12 08:00:00',
  },
  {
    id: 4,
    title: '【中东资本观察】主权财富基金2026年直投重心全面转向AI与新材料',
    slug: 'mideast-sovereign-wealth-funds-direct-investment-trends',
    summary: '阿布扎比投资局与沙特PIF近期密集宣布在华设立硬科技直投办公室。生成式人工智能与新型固态电池研发商成为其高额领投的最热标的。',
    content: '随着全球传统能源转型加剧，中东主权财富基金正在以惊人的速度推进其资本结构调整。过去单纯依靠跟投欧美大型PE的方式，正逐步转变为在重点市场设立本土投资团队直接挑选“中国硬科技独角兽”进行直投。中东资本雄厚的财力配比与超长的资金周期，几乎成了当前硬科技创投寒冬里各大初创项目竞相争取的“源头活水”。',
    author: { id: 4, nickname: '林风 (VC观察哨)', avatar_url: '' },
    category: { id: 3, name: 'VC/PE观察' },
    importance: 3,
    is_vip_only: true,
    views_count: 27800,
    likes_count: 670,
    comments_count: 89,
    publish_at: '2026-07-11 18:20:00',
    created_at: '2026-07-11 18:00:00',
  },
];

// 自动生成更多创投新闻以展示无限加载
const generateMockArticles = (startIndex: number, count: number, categoryName: string): Article[] => {
  const categoriesMap: { [key: string]: string[] } = {
    '前沿科技': ['量子计算在金融风控中的应用探索', '商业固体火箭新型引擎地面试车成功', '全固态电池中试生产线正式落成投产', '低空避障激光雷达芯片通过车规级测试'],
    '独角兽动态': ['SaaS平台独角兽完成新一轮并购', '通用智能机器人完成1.2亿美元融资', '芯片独角兽发布全新边缘芯片架构', '低空eVTOL适航首飞成功完成'],
    'VC/PE观察': ['红杉中国设立新一期智能硬件种子基金', '深创投披露二季度先进制造直投榜单', '经纬创投：2026年硬科技出海的新机遇', '启明创投完成医疗大健康垂直赛道闭门会'],
  };

  const selectedTitles = categoriesMap[categoryName] || ['未分类科技投融资动态文章标题'];
  
  return Array.from({ length: count }).map((_, index) => {
    const id = startIndex + index;
    const title = `【加载内容】${selectedTitles[index % selectedTitles.length]} (#${id})`;
    const categoryNameSelected = categoryName === '全部推荐' 
      ? ['前沿科技', '独角兽动态', 'VC/PE观察'][index % 3]
      : categoryName;

    return {
      id,
      title,
      slug: `mock-slug-article-${id}`,
      summary: `这是自动下拉滚动加载出来的第 ${id} 篇模拟创投文章。主要讨论了在 ${categoryNameSelected} 细分赛道下最新的创投估值趋势与项目研发流片进程。`,
      content: '详细文章数据加载中...',
      author: { id: 10 + index, nickname: 'LightNews 研究员', avatar_url: '' },
      category: { id: id, name: categoryNameSelected },
      importance: 3,
      is_vip_only: index % 4 === 0,
      views_count: 12000 + (index * 420),
      likes_count: 200 + (index * 12),
      comments_count: 45 + index,
      publish_at: '2026-07-12',
      created_at: '2026-07-12',
    };
  });
};

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  // 无限滚动状态
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const categories = ['全部推荐', '前沿科技', '独角兽动态', 'VC/PE观察'];
  const currentCategory = categories[activeTab];

  // 切换选项卡重置数据
  useEffect(() => {
    const initialArticles = activeTab === 0
      ? MOCK_ARTICLES
      : MOCK_ARTICLES.filter(art => art.category.name === currentCategory);
    
    setDisplayedArticles(initialArticles);
    setHasMore(true);
    setLoadingMore(false);
  }, [activeTab, currentCategory]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleArticleClick = (slug: string) => {
    // 允许模拟加载出来的跳转
    if (slug.startsWith('mock-slug-')) {
      navigate(`/article/magnificent-seven-q2-earnings-preview`);
    } else {
      navigate(`/article/${slug}`);
    }
  };

  // 下拉触底加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore) {
          loadMoreContent();
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [displayedArticles, hasMore, loadingMore]);

  const loadMoreContent = () => {
    setLoadingMore(true);
    // 延迟 800ms 模拟网络请求
    setTimeout(() => {
      setDisplayedArticles((prev) => {
        const currentLength = prev.length;
        if (currentLength >= 15) {
          setHasMore(false); // 加载上限，防止死循环
          setLoadingMore(false);
          return prev;
        }
        const newBatch = generateMockArticles(currentLength + 1, 3, currentCategory === '全部推荐' ? '前沿科技' : currentCategory);
        setLoadingMore(false);
        return [...prev, ...newBatch];
      });
    }, 80000000000000000000); // 正常是 800ms，哎呀这写错位数了，让我们改成正常的 800ms
  };

  // 修复刚才的 setTimeout 真实网络延时
  const triggerLoad = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const currentLength = displayedArticles.length;
      if (currentLength >= 15) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      const newBatch = generateMockArticles(currentLength + 1, 3, currentCategory === '全部推荐' ? '前沿科技' : currentCategory);
      setDisplayedArticles((prev) => [...prev, ...newBatch]);
      setLoadingMore(false);
    }, 800);
  };

  // 使用 IntersectionObserver 直接调用修正后的触发器
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
  }, [displayedArticles, hasMore, loadingMore, activeTab]);

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
            <Tab key={i} label={cat} />
          ))}
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {/* 左侧及中间主要新闻内容流 */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* 头条大卡片 - 仅在“全部推荐”第一页时展现 */}
          {activeTab === 0 && MOCK_ARTICLES[0] && (
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
              onClick={() => handleArticleClick(MOCK_ARTICLES[0].slug)}
            >
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
                  }}
                >
                  <Chip label="深度观察" color="primary" size="small" sx={{ fontWeight: 700 }} />
                  {MOCK_ARTICLES[0].is_vip_only && (
                    <Chip
                      icon={<StarIcon sx={{ color: 'secondary.main !important' }} />}
                      label="深度独家"
                      size="small"
                      sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: 'secondary.main', fontWeight: 700 }}
                    />
                  )}
                </Box>
                <Typography variant="h3" sx={{ color: 'primary.main', textAlign: 'center', px: 4, fontWeight: 900 }}>
                  LIGHT NEWS • TECH VC
                </Typography>
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#f8fafc' }}>
                  {MOCK_ARTICLES[0].title}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {MOCK_ARTICLES[0].summary}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main', color: '#fff' }}>
                      {MOCK_ARTICLES[0].author.nickname.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                      {MOCK_ARTICLES[0].author.nickname}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569' }}>
                      •
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {MOCK_ARTICLES[0].publish_at}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#64748b' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VisibilityIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{MOCK_ARTICLES[0].views_count.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FavoriteIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{MOCK_ARTICLES[0].likes_count}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CommentIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{MOCK_ARTICLES[0].comments_count}</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* 新闻文章流列表 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {displayedArticles
              .filter((item, idx) => !(activeTab === 0 && idx === 0 && item.id === 1))
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
                    <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'stretch' }}>
                      <Box
                        sx={{
                          width: '100%',
                          minHeight: 140,
                          background: item.id % 2 === 0
                            ? 'linear-gradient(135deg, #101726 0%, #1e293b 100%)'
                            : 'linear-gradient(135deg, #080c14 0%, #111827 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {item.category.name}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                            <Chip label={item.category.name} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', height: 18, fontSize: '0.6875rem' }} />
                            {item.is_vip_only && (
                              <Chip
                                icon={<StarIcon sx={{ color: 'secondary.main !important', fontSize: '10px !important' }} />}
                                label="独家专栏"
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
              ))}
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
                  正在获取最新创投资讯...
                </Typography>
              </Box>
            )}

            {!hasMore && (
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                — 已为您加载全部最新创投快报 —
              </Typography>
            )}
          </Box>
        </Grid>

        {/* 右侧边栏 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <LiveNewsList />

            <Paper sx={{ p: 2.5, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', pb: 1 }}>
                热门阅读排行榜
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {MOCK_ARTICLES.slice(0, 3).map((item, idx) => (
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
                        {(item.views_count / 1000).toFixed(1)}k 阅读
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
