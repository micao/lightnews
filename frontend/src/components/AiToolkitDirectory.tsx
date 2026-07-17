import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface AiModel {
  name: string;
  provider: string;
  category: 'Text' | 'Code' | 'Vision' | 'Audio';
  mmlu: string;
  pricingInput: string; // per 1M tokens
  pricingOutput: string; // per 1M tokens
  status: 'Active' | 'Beta' | 'Deprecated';
}

const INITIAL_MODELS: AiModel[] = [
  { name: 'GPT-4o', provider: 'OpenAI', category: 'Text', mmlu: '88.7%', pricingInput: '$2.50', pricingOutput: '$10.00', status: 'Active' },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', category: 'Text', mmlu: '88.7%', pricingInput: '$3.00', pricingOutput: '$15.00', status: 'Active' },
  { name: 'Gemini 1.5 Pro', provider: 'Google', category: 'Vision', mmlu: '85.9%', pricingInput: '$1.25', pricingOutput: '$5.00', status: 'Active' },
  { name: 'DeepSeek-V3', provider: 'DeepSeek', category: 'Text', mmlu: '88.5%', pricingInput: '$0.14', pricingOutput: '$0.28', status: 'Active' },
  { name: 'DeepSeek-Coder-V2', provider: 'DeepSeek', category: 'Code', mmlu: '81.1%', pricingInput: '$0.14', pricingOutput: '$0.28', status: 'Active' },
  { name: 'Llama 3.1 405B', provider: 'Meta', category: 'Text', mmlu: '88.6%', pricingInput: '$2.66', pricingOutput: '$2.66', status: 'Active' },
  { name: 'Whisper Large v3', provider: 'OpenAI', category: 'Audio', mmlu: 'N/A', pricingInput: '$0.006/min', pricingOutput: 'N/A', status: 'Active' },
  { name: 'Sora', provider: 'OpenAI', category: 'Vision', mmlu: 'N/A', pricingInput: 'Custom', pricingOutput: 'Custom', status: 'Beta' },
];

export const AiToolkitDirectory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Text', 'Code', 'Vision', 'Audio'];

  const filteredModels = INITIAL_MODELS.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || model.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card sx={{ bgcolor: 'rgba(23, 12, 46, 0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(168, 85, 247, 0.25)', boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#c084fc', mb: 2, display: 'flex', alignItems: 'center', gap: 1, textShadow: '0 0 10px rgba(192, 132, 252, 0.3)' }}>
          🛠️ AI 大模型与工具黄页 (LLM Directory)
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setSelectedCategory(cat)}
              sx={{
                bgcolor: selectedCategory === cat ? '#a855f7' : 'rgba(255, 255, 255, 0.03)',
                color: '#fff',
                fontWeight: 700,
                border: '1px solid',
                borderColor: selectedCategory === cat ? '#c084fc' : 'rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  bgcolor: selectedCategory === cat ? '#a855f7' : 'rgba(255, 255, 255, 0.08)',
                },
              }}
            />
          ))}
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="搜索模型名称或提供商..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: '#c084fc', mr: 1 }} />,
            }
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: '#f8fafc',
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              '& fieldset': { borderColor: 'rgba(168, 85, 247, 0.2)' },
              '&:hover fieldset': { borderColor: '#a855f7' },
              '&.Mui-focused fieldset': { borderColor: '#c084fc' },
            }
          }}
        />

        <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ borderBottom: '2px solid rgba(168, 85, 247, 0.3)' }}>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: 'none' }}>模型名称</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: 'none' }}>提供商</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: 'none' }}>MMLU基准</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: 'none' }}>API输入价(/1M)</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, borderBottom: 'none' }}>API输出价(/1M)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow
                  key={model.name}
                  sx={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.05)' }
                  }}
                >
                  <TableCell sx={{ color: '#f8fafc', fontWeight: 800, borderBottom: 'none' }}>
                    {model.name}
                  </TableCell>
                  <TableCell sx={{ color: '#cbd5e1', borderBottom: 'none' }}>{model.provider}</TableCell>
                  <TableCell sx={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700, borderBottom: 'none' }}>{model.mmlu}</TableCell>
                  <TableCell sx={{ color: '#34d399', fontFamily: 'monospace', fontWeight: 700, borderBottom: 'none' }}>{model.pricingInput}</TableCell>
                  <TableCell sx={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 700, borderBottom: 'none' }}>{model.pricingOutput}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
export default AiToolkitDirectory;
