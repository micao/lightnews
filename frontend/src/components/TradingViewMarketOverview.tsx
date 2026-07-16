import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useI18n } from '../context/I18nContext';

export const TradingViewMarketOverview: React.FC = () => {
  const { t } = useI18n();
  const theme = useTheme();
  const colorMode = theme.palette.mode; // 'dark' 或 'light'
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // 清空先前可能渲染的旧 iframe 组件，防止重复堆叠
    currentContainer.innerHTML = '';

    // 创建 TradingView 所需的标准外层 DOM 节点
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '450px';
    widgetContainer.style.width = '100%';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = '450px';
    widget.style.width = '100%';
    widgetContainer.appendChild(widget);

    // 动态构建官方支持的 JSON 配置型 Script 标签
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.async = true;

    const config = {
      colorTheme: colorMode, // 'dark' 或 'light'
      dateRange: "12M",
      showChart: true,
      locale: "zh_CN",
      largeChartUrl: "",
      isTransparent: true, // 开启透明底色以完全融合我们网站的高级蓝黑卡片背景色
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: "450",
      plotLineColorGrowing: "rgba(0, 102, 255, 1)",
      plotLineColorFalling: "rgba(0, 102, 255, 1)",
      gridLineColor: colorMode === 'dark' ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
      scaleFontColor: colorMode === 'dark' ? "rgba(148, 163, 184, 1)" : "rgba(71, 85, 105, 1)",
      belowLineFillColorGrowing: "rgba(0, 102, 255, 0.12)",
      belowLineFillColorFalling: "rgba(0, 102, 255, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(0, 102, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(0, 102, 255, 0)",
      symbolActiveColor: "rgba(0, 102, 255, 0.12)",
      tabs: [
        {
          title: t("Indices"),
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "标普500" },
            { s: "FOREXCOM:NSXUSD", d: "纳指100" },
            { s: "FOREXCOM:DJI", d: "道琼斯" },
            { s: "FOREXCOM:UKXGBP", d: "富时100" }
          ]
        },
        {
          title: t("Stocks"),
          symbols: [
            { s: "NASDAQ:AAPL", d: "苹果" },
            { s: "NASDAQ:ADBE", d: "Adobe" },
            { s: "NASDAQ:NVDA", d: "英伟达" },
            { s: "NASDAQ:TSLA", d: "特斯拉" }
          ]
        },
        {
          title: t("Crypto"),
          symbols: [
            { s: "BITSTAMP:BTCUSD", d: "比特币" },
            { s: "BITSTAMP:ETHUSD", d: "以太坊" },
            { s: "CRYPTO:XRPUSD", d: "瑞波币" }
          ]
        }
      ]
    };

    script.text = JSON.stringify(config);
    widgetContainer.appendChild(script);
    currentContainer.appendChild(widgetContainer);

    // 组件卸载或主题色切换时，清除容器内的脚本及产生的 iframe
    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [colorMode, t]);

  return (
    <Paper sx={{ p: 2, bgcolor: '#101726', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', pb: 1, color: '#f8fafc' }}>
        {t('Financial Overview')}
      </Typography>
      <Box ref={containerRef} sx={{ minHeight: 450, position: 'relative', width: '100%' }} />
    </Paper>
  );
};
export default TradingViewMarketOverview;
