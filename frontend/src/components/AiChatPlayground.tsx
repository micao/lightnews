import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TerminalIcon from '@mui/icons-material/Terminal';
import { apiFetch, API_BASE } from '../utils/api';


interface Message {
  sender: 'user' | 'agent';
  text: string;
}


const KEYWORD_ANSWERS = [
  {
    keywords: ['price', 'cost', '价格', '资费', '收费', '便宜'],
    answer: "ST-Chat Sandbox API Pricing Oracle:\n\nDeepSeek-V3:\n - Input: $0.14 / 1M tokens\n - Output: $0.28 / 1M tokens\n\nGPT-4o:\n - Input: $2.50 / 1M tokens\n - Output: $10.00 / 1M tokens\n\nClaude 3.5 Sonnet:\n - Input: $3.00 / 1M tokens\n - Output: $15.00 / 1M tokens\n\n小结：DeepSeek-V3 资费大约是 GPT-4o 的 1.5%，极大地削减了推理的边际边际成本，正在重塑大模型商业化格局。"
  },
  {
    keywords: ['deepseek', '架构', 'mla', 'moe', '深度求索'],
    answer: "正在连接 DeepSeek-V3 架构特征库...\n[MLA Attention & MoE Routing] - ACTIVE\n\nDeepSeek-V3 通过引入 Multi-head Latent Attention (MLA) 压缩 KV Cache，支持 FP8 低精度训练，并使用自适应 MoE (专家混合) 路由算法，在激活 37B 参数的同时维持 671B 的大模型规模。这在保障模型强性能的同时极大地缩减了推理开销。"
  },
  {
    keywords: ['stargate', '星门', '超算', '电力', '核电'],
    answer: "正在调取 OpenAI \"星门计划\" (Stargate) 研报...\n\n微软与 OpenAI 拟投入 1000 亿美元，预计配比超 10 万块下一代顶级 Blackwell/Rubin GPU。其落地的核心瓶颈不在于芯片，而在于百万千瓦级的稳定电网供给。目前项目方正在深度接洽核能发电厂及小型模块化反应堆 (SMR) 方案。"
  },
  {
    keywords: ['agent', '代理', '具身', '机器人'],
    answer: "正在调取具身智能与 AI Agent 闭环控制协议...\n\nAI Agent 通过『感知 - 规划 - 行动』三元闭环自主执行长序列指令。在具身机器人中，大模型作为物理常识大脑，下层由 20ms 环路的实时动力反馈电机控制器执行微小力矩控制。当前企业级 Agent 面临最大的隐患在于凭证与越权访问的安全漏洞。"
  }
];

const DEFAULT_ANSWER = "Stargate Terminal v1.0.2\n\n未匹配到相关指令。您可输入以下关键词触发大模型深度代理分析：\n- 输入 'price' / '价格'：对比分析 DeepSeek 与 GPT 资费\n- 输入 'deepseek' / '架构'：分析 DeepSeek-V3 的架构特征\n- 输入 'stargate' / '星门'：透视 OpenAI 星门超算集群规划\n- 输入 'agent' / '具身'：探索多模态代理与机器人控制机制";

export const AiChatPlayground: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: 'agent', 
      text: 'Stargate Terminal v1.0.2 Ready.\n\n这是一个 AI 专区交互终端，可模拟大模型对前沿 AI 技术的深度研判。支持以下主题分析：\n1. 输入 "价格" / "price"：获取 DeepSeek 与主流大模型 API 资费对比\n2. 输入 "deepseek" / "架构"：透视 DeepSeek-V3 核心 MLA/MoE 技术特色\n3. 输入 "stargate" / "星门"：解密 OpenAI 千亿美金超算工程与核电能源博弈\n4. 输入 "agent" / "具身"：剖析具身智能与物理 Agent 控制闭环架构' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const triggerTypewriter = (text: string) => {
    let currentLength = 0;
    setMessages((prev) => [...prev, { sender: 'agent', text: '' }]);

    const timer = setInterval(() => {
      currentLength += 4;
      if (currentLength >= text.length) {
        clearInterval(timer);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { sender: 'agent', text: text };
          return next;
        });
        setIsTyping(false);
      } else {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { sender: 'agent', text: text.slice(0, currentLength) };
          return next;
        });
      }
    }, 15);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    setInputValue('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsTyping(true);

    setTimeout(() => {
      // 1. 动态匹配最新文章命令
      if (
        userText.toLowerCase().includes('latest') || 
        userText.includes('最新') || 
        userText.toLowerCase().includes('news') || 
        userText.includes('文章')
      ) {
        apiFetch(`${API_BASE}/api/articles/?category=Artificial%20Intelligence`)

          .then(res => res.json())
          .then(data => {
            if (data.success && data.articles && data.articles.length > 0) {
              let answer = "ST-Chat 最新快报检索系统已同步...\n\n";
              data.articles.slice(0, 3).forEach((art: any, i: number) => {
                answer += `[${i+1}] ${art.title}\n - 核心导读: ${art.summary.slice(0, 55)}...\n\n`;
              });
              triggerTypewriter(answer);
            } else {
              triggerTypewriter("ST-Chat 最新快报检索系统: 当前未检索到最新发布的 AI 专区文章。");
            }
          })
          .catch(() => {
            triggerTypewriter("连接 API 服务失败，请检查网络后重试。");
          });
        return;
      }

      // 2. 匹配静态关键词回答
      const matched = KEYWORD_ANSWERS.find(item => 
        item.keywords.some(kw => userText.toLowerCase().includes(kw))
      );
      const finalAnswer = matched ? matched.answer : DEFAULT_ANSWER;
      triggerTypewriter(finalAnswer);
    }, 600);
  };

  return (
    <Card sx={{ bgcolor: '#090515', border: '1px solid rgba(168, 85, 247, 0.3)', boxShadow: '0 8px 32px rgba(168, 85, 247, 0.2)' }}>
      <Box sx={{ bgcolor: 'rgba(168, 85, 247, 0.1)', p: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
        <TerminalIcon sx={{ color: '#c084fc', fontSize: 18 }} />
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#e9d5ff', letterSpacing: '0.05em' }}>
          🤖 AI 终端对话实验沙盒 (ST-Chat Sandbox)
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f43f5e' }} />
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#eab308' }} />
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
        </Box>
      </Box>

      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box ref={chatContainerRef} sx={{ height: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, pr: 0.5 }}>
          {messages.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                bgcolor: msg.sender === 'user' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: msg.sender === 'user' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                p: 1.5,
                borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                maxWidth: '85%',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                color: msg.sender === 'user' ? '#f5f3ff' : '#cbd5e1',
              }}
            >
              {msg.text}
            </Box>
          ))}
          {isTyping && (
            <Typography variant="caption" sx={{ color: '#a855f7', fontFamily: 'monospace', animation: 'pulse 1s infinite', alignSelf: 'flex-start' }}>
              DeepSeek Engine Generating... █
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="输入您要咨询的AI前沿课题 Prompt..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                '& fieldset': { borderColor: 'rgba(168, 85, 247, 0.2)' },
                '&:hover fieldset': { borderColor: '#a855f7' },
                '&.Mui-focused fieldset': { borderColor: '#c084fc' },
              }
            }}
          />
          <IconButton onClick={handleSend} disabled={isTyping || !inputValue.trim()} sx={{ bgcolor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', '&:hover': { bgcolor: '#a855f7', color: '#fff' } }}>
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};
export default AiChatPlayground;
