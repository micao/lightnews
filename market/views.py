from django.http import JsonResponse

from market.models import FundingDeal


def funding_deals_list_view(request):
    """获取最新投融资项目列表 (MarketTicker 专属接口)"""
    try:
        # 1. 自动注入初始化的高端真实 2025/2026 年创投种子数据 (保证开箱即用)
        if not FundingDeal.objects.exists():
            seed_deals = [
                {'company': '月之暗面 (Moonshot AI)', 'round': 'B轮', 'amount': '10亿美元', 'investor': '阿里领投，红杉中国跟投', 'sector': 'LLM 大模型'},
                {'company': '宇树科技 (Unitree)', 'round': 'B轮', 'amount': '10亿人民币', 'investor': '美团龙珠领投，深创投跟投', 'sector': '具身智能机器人'},
                {'company': '趋境科技', 'round': 'A轮', 'amount': '超10亿人民币', 'investor': '河南投资集团汇融基金等', 'sector': 'AI算力与Token生产'},
                {'company': '聆思科技', 'round': 'B轮', 'amount': '近5亿人民币', 'investor': '合肥国资平台联合领投', 'sector': '端侧AI推理芯片'},
                {'company': 'Mistral AI', 'round': 'Series B', 'amount': '€600M', 'investor': 'DST Global, General Catalyst', 'sector': 'Artificial Intelligence'},
                {'company': 'Cohere', 'round': 'Series D', 'amount': '$500M', 'investor': 'Nvidia, Oracle, Salesforce', 'sector': 'AI Infra'},
                {'company': '新奥聚变', 'round': 'Pre-A轮', 'amount': '数亿人民币', 'investor': '龙芯创投、中科创星、经纬创投', 'sector': '受控核聚变能源'},
                {'company': '灵境智源', 'round': '天使轮', 'amount': '超1亿人民币', 'investor': '经纬创投领投', 'sector': '具身智能计算底座'},
                {'company': '逸文科技', 'round': 'Pre-B轮', 'amount': '1.5亿美元', 'investor': '美团龙珠、美团战投领投', 'sector': 'AI 智能眼镜'},
                {'company': '珞博智能', 'round': 'Pre-A轮', 'amount': '亿元级', 'investor': '华映资本、广和通联合领投', 'sector': 'AI 情感陪伴硬件'},
            ]
            for deal in seed_deals:
                FundingDeal.objects.create(**deal)

        # 2. 从数据库读取前 10 条最新大额成交事件
        deals = FundingDeal.objects.all().order_by('-id')[:10]
        deals_data = [{
            'company': item.company,
            'round': item.round,
            'amount': item.amount,
            'investor': item.investor,
            'sector': item.sector
        } for item in deals]

        return JsonResponse({
            'success': True,
            'deals': deals_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)
