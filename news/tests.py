import json
from django.test import TestCase, Client
from django.urls import reverse
from news.models import Category, Article, LiveNews
from users.models import User, UserToken

class NewsArticleAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        # 创建分类
        self.category_tech = Category.objects.create(name='前沿科技', slug='frontier-tech')
        self.category_unicorn = Category.objects.create(name='独角兽动态', slug='unicorn-dynamics')

        # 创建研究员/作者
        self.author = User.objects.create_user(username='news_author', password='password123')
        
        # 创建管理员
        self.admin_user = User.objects.create_user(
            username='admin_editor',
            password='admin_password_123',
            roles=['ROLE_USER', 'ROLE_ADMIN_USER']
        )
        self.admin_token = UserToken.objects.create(
            user=self.admin_user,
            token='admin_token_string_123'
        )

        # 创建测试文章
        self.article_1 = Article.objects.create(
            title='ASML 2026年最新光刻机出货分析',
            slug='asml-2026-lithography-report',
            summary='ASML季度财报与半导体设备出货趋势。',
            content='<p>这是ASML光刻机出货的详细分析内容。包含EUV和DUV出货量统计数据。</p>',
            category=self.category_tech,
            author=self.author,
            status='published',
            is_vip_only=False
        )

        self.article_2 = Article.objects.create(
            title='VIP专属：马斯克脑机接口公司最新独角兽估值调查',
            slug='brain-computer-interface-valuation-2026',
            summary='脑机接口领头羊新一轮估值分析。',
            content='<p>这篇是VIP专属内容。详细解密新一轮融资估值细节，涉及多家中外顶级VC/PE资方名单。</p>',
            category=self.category_unicorn,
            author=self.author,
            status='published',
            is_vip_only=True
        )

        self.draft_article = Article.objects.create(
            title='测试草稿文章标题',
            slug='test-draft-slug',
            summary='草稿摘要。',
            content='<p>草稿内容。</p>',
            category=self.category_tech,
            author=self.author,
            status='draft',
            is_vip_only=False
        )

    def test_article_list_default_pagination(self):
        """测试文章列表默认分页与状态过滤"""
        response = self.client.get(reverse('article_list_view'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['total'], 2) # 只返回 published 的两篇
        self.assertEqual(len(data['articles']), 2)

    def test_article_list_category_filter(self):
        """测试按分类筛选文章"""
        response = self.client.get(
            reverse('article_list_view'),
            {'category': '独角兽动态'}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['articles'][0]['slug'], 'brain-computer-interface-valuation-2026')

    def test_article_list_keyword_search(self):
        """测试模糊搜索功能 (q)"""
        response = self.client.get(
            reverse('article_list_view'),
            {'q': 'ASML'}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['articles'][0]['slug'], 'asml-2026-lithography-report')

    def test_article_list_status_all_unauthorized(self):
        """测试非管理员无法通过 status=all 检索非已发布文章"""
        response = self.client.get(
            reverse('article_list_view'),
            {'status': 'all'}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 非管理员（无Token）请求，自动回退到只显示 published
        self.assertEqual(data['total'], 2)

    def test_article_list_status_all_authorized(self):
        """测试管理员携带 Token 可以请求 status=all，检索到草稿"""
        response = self.client.get(
            reverse('article_list_view'),
            {'status': 'all'},
            HTTP_AUTHORIZATION='Bearer admin_token_string_123'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total'], 3) # 包括 draft 在内的全部 3 篇

    def test_article_detail_unlocked(self):
        """测试普通免费文章的详情获取（内容无遮罩）"""
        response = self.client.get(
            reverse('article_detail_view', kwargs={'slug': 'asml-2026-lithography-report'})
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertFalse(data['article']['is_locked'])
        self.assertEqual(
            data['article']['content'],
            '<p>这是ASML光刻机出货的详细分析内容。包含EUV和DUV出货量统计数据。</p>'
        )

    def test_article_detail_vip_locked(self):
        """测试未登录用户请求 VIP 专属文章，内容被截断且 locked=True"""
        response = self.client.get(
            reverse('article_detail_view', kwargs={'slug': 'brain-computer-interface-valuation-2026'})
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertTrue(data['article']['is_locked'])
        self.assertTrue(data['article']['content'].endswith('...'))
        # 验证剥离了 HTML
        self.assertNotIn('<p>', data['article']['content'])

    def test_article_detail_vip_unlocked(self):
        """测试登录用户请求 VIP 专属文章，内容完整且 locked=False"""
        # 签署一个普通用户的 Token
        user = User.objects.create_user(username='regular_member', password='password')
        token = UserToken.objects.create(user=user, token='regular_member_token')

        response = self.client.get(
            reverse('article_detail_view', kwargs={'slug': 'brain-computer-interface-valuation-2026'}),
            HTTP_AUTHORIZATION='Bearer regular_member_token'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertFalse(data['article']['is_locked'])
        self.assertIn('<p>', data['article']['content'])

    def test_admin_create_article_unauthorized(self):
        """测试未授权请求发布文章返回拒绝"""
        payload = {
            'title': '越权发布文章',
            'summary': '越权',
            'content': '越权内容',
            'category_id': self.category_tech.id,
            'status': 'published'
        }
        response = self.client.post(
            reverse('admin_article_create_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

    def test_admin_create_article_success_with_relations(self):
        """测试管理员发布创投分析并建立双向关联推荐"""
        payload = {
            'title': '2026年中国半导体材料国产替代投资机遇',
            'summary': '聚焦核心卡脖子领域投资脉络。',
            'content': '<p>详细材料替代投资细节。</p>',
            'category_id': self.category_tech.id,
            'status': 'published',
            'is_vip_only': False,
            'source_url': 'https://example.com/source',
            'related_article_ids': [self.article_1.id] # 关联 ASML 文章
        }
        response = self.client.post(
            reverse('admin_article_create_view'),
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer admin_token_string_123'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        
        # 验证关联文章的双向对称绑定效果
        new_article = Article.objects.get(title='2026年中国半导体材料国产替代投资机遇')
        self.assertEqual(new_article.related_articles.count(), 1)
        self.assertEqual(new_article.related_articles.first().id, self.article_1.id)

        # 检查被关联的文章 ASML，是否也反向自动绑定了这篇新文章 (symmetrical=True)
        self.article_1.refresh_from_db()
        self.assertEqual(self.article_1.related_articles.count(), 1)
        self.assertEqual(self.article_1.related_articles.first().id, new_article.id)

    def test_admin_update_article(self):
        """测试管理员编辑更新文章及相关文章关联列表"""
        # 先单独关联一篇文章
        self.article_1.related_articles.add(self.article_2)

        payload = {
            'title': 'ASML 2026年最新光刻机出货分析（已修正）',
            'summary': '修改后的摘要。',
            'content': '<p>修改后的内容。</p>',
            'category_id': self.category_unicorn.id, # 修改分类
            'status': 'published',
            'is_vip_only': True, # 变为 VIP 专属
            'source_url': 'https://example.com/modified',
            'related_article_ids': [] # 移除所有关联推荐
        }

        response = self.client.put(
            reverse('admin_article_update_view', kwargs={'article_id': self.article_1.id}),
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer admin_token_string_123'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

        self.article_1.refresh_from_db()
        self.assertEqual(self.article_1.title, 'ASML 2026年最新光刻机出货分析（已修正）')
        self.assertTrue(self.article_1.is_vip_only)
        self.assertEqual(self.article_1.related_articles.count(), 0) # 关联确实被移除
