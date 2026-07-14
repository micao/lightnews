from django.test import TestCase, Client
from django.urls import reverse
from market.models import FundingDeal

class MarketTickerAPITests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_funding_deals_list_auto_seeding(self):
        """测试当数据库中没有投融资成交记录时，接口能自动注入初始化种子数据，且能正常返回"""
        # 1. 验证最初数据库无数据
        self.assertEqual(FundingDeal.objects.count(), 0)

        # 2. 发送请求，应该触发自动填充
        response = self.client.get(reverse('funding_deals_list_view'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        
        # 3. 验证数据库中已经产生了种子数据记录
        self.assertTrue(FundingDeal.objects.count() > 0)
        self.assertEqual(len(data['deals']), 10) # 返回最新的 10 条
        
        # 验证返回结构包含公司名和融资金额等关键要素
        first_deal = data['deals'][0]
        self.assertIn('company', first_deal)
        self.assertIn('amount', first_deal)
        self.assertIn('investor', first_deal)

    def test_funding_deals_list_normal_retrieve(self):
        """测试当数据库中已有数据时，正常直接返回已有数据，不再重复注入"""
        # 1. 手动写入一条创投事件
        FundingDeal.objects.create(
            company='月之暗面 (Moonshot AI)',
            round='C轮',
            amount='20亿美元',
            investor='腾讯领投',
            sector='LLM 大模型'
        )
        self.assertEqual(FundingDeal.objects.count(), 1)

        # 2. 请求接口
        response = self.client.get(reverse('funding_deals_list_view'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        
        # 3. 验证接口仅返回手动写入的那 1 条，并没有触发自动填充
        self.assertEqual(len(data['deals']), 1)
        self.assertEqual(data['deals'][0]['company'], '月之暗面 (Moonshot AI)')
        self.assertEqual(data['deals'][0]['amount'], '20亿美元')
        self.assertEqual(FundingDeal.objects.count(), 1)
