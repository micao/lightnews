import React, { useState } from 'react';
import { Box, Paper, Typography, Zoom } from '@mui/material';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface MetricChartProps {
  title: string;
  data: ChartDataPoint[];
  type: 'line' | 'bar';
  color?: string;
  valueSuffix?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({
  title,
  data,
  type,
  color = '#ffb300',
  valueSuffix = '次',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) return null;

  // 图表画布尺寸
  const width = 500;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 100); // 最小分度上限 100
  const minValue = 0;

  // 获取点坐标
  const getCoordinates = (index: number, value: number) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const ratio = (value - minValue) / (maxValue - minValue);
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { x, y };
  };

  // 生成折线图路径
  const generateLinePath = () => {
    let path = '';
    data.forEach((d, i) => {
      const { x, y } = getCoordinates(i, d.value);
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    return path;
  };

  // 生成折线图渐变阴影填充路径
  const generateAreaPath = () => {
    const start = getCoordinates(0, minValue);
    const end = getCoordinates(data.length - 1, minValue);
    let path = `M ${start.x} ${start.y - 1}`;
    data.forEach((d, i) => {
      const { x, y } = getCoordinates(i, d.value);
      path += ` L ${x} ${y}`;
    });
    path += ` L ${end.x} ${end.y - 1} Z`;
    return path;
  };

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltipPos({ x, y });
    setHoveredIndex(index);
  };

  return (
    <Paper sx={{ p: 2.5, bgcolor: '#131924', position: 'relative', overflow: 'visible' }}>
      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, mb: 2 }}>
        {title}
      </Typography>

      <Box sx={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          <defs>
            {/* 折线下方阴影渐变 */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
            {/* 柱形图渐变 */}
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.95" />
              <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* 网格背景线 (水平) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const gridVal = Math.round(maxValue - ratio * (maxValue - minValue));
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* X 轴标签 */}
          {data.map((d, i) => {
            const { x } = getCoordinates(i, 0);
            return (
              <text
                key={i}
                x={x}
                y={height - 8}
                fill="#64748b"
                fontSize="9"
                textAnchor="middle"
              >
                {d.label}
              </text>
            );
          })}

          {/* 渲染折线图 */}
          {type === 'line' && (
            <>
              {/* 渐变填充区域 */}
              <path d={generateAreaPath()} fill="url(#areaGradient)" />
              {/* 实体线条 */}
              <path
                d={generateLinePath()}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* 交互数据点 */}
              {data.map((d, i) => {
                const { x, y } = getCoordinates(i, d.value);
                const isHovered = hoveredIndex === i;
                return (
                  <g key={i}>
                    {/* 辅助对齐虚线 */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={paddingTop + chartHeight}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeDasharray="3,3"
                      />
                    )}
                    {/* 激活时数据圆圈外圈 */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 8 : 4}
                      fill={isHovered ? color : '#131924'}
                      fillOpacity={isHovered ? 0.3 : 1}
                      stroke={color}
                      strokeWidth="2"
                      style={{ transition: 'r 0.15s, fill-opacity 0.15s', cursor: 'pointer' }}
                      onMouseEnter={(e) => handleMouseMove(e, i)}
                      onMouseMove={(e) => handleMouseMove(e, i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    {isHovered && (
                      <circle cx={x} cy={y} r={3} fill="#fff" pointerEvents="none" />
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* 渲染柱状图 */}
          {type === 'bar' &&
            data.map((d, i) => {
              const xRange = chartWidth / data.length;
              const barWidth = Math.max(xRange * 0.5, 12);
              const { x, y } = getCoordinates(i, d.value);
              const bottomY = paddingTop + chartHeight;
              const isHovered = hoveredIndex === i;

              return (
                <rect
                  key={i}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={bottomY - y}
                  fill="url(#barGradient)"
                  rx="2"
                  style={{
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    opacity: isHovered ? 1 : 0.8,
                  }}
                  onMouseEnter={(e) => handleMouseMove(e, i)}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
        </svg>

        {/* 浮动 tooltip */}
        {hoveredIndex !== null && (
          <Zoom in={true} timeout={150}>
            <Box
              sx={{
                position: 'absolute',
                left: tooltipPos.x + 12,
                top: tooltipPos.y - 45,
                bgcolor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 1.5,
                p: 1,
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 10,
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600 }}>
                {data[hoveredIndex].label}
              </Typography>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                {data[hoveredIndex].value.toLocaleString()} {valueSuffix}
              </Typography>
            </Box>
          </Zoom>
        )}
      </Box>
    </Paper>
  );
};
