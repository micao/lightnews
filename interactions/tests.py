import json

from django.test import Client, TestCase
from django.urls import reverse

from interactions.models import Comment, Like
from news.models import Article, Category
from users.models import User, UserToken


class InteractionsAPITests(TestCase):
    def setUp(self):
        self.client = Client()

        # 创建用户及 Token
        self.user = User.objects.create_user(username='commenter', password='password123')
        self.user_token = UserToken.objects.create(user=self.user, token='commenter_token')

        self.admin = User.objects.create_user(
            username='admin_editor',
            password='admin_password_123',
            roles=['ROLE_USER', 'ROLE_ADMIN_USER']
        )
        self.admin_token = UserToken.objects.create(user=self.admin, token='admin_token')

        # 创建文章分类与文章
        self.category = Category.objects.create(name='前沿科技', slug='tech')
        self.article = Article.objects.create(
            title='测试互动深度文章',
            slug='test-interactive-article',
            summary='文章简述。',
            content='<p>文章详细内容。</p>',
            category=self.category,
            author=self.user,
            status='published'
        )

    def test_toggle_like_unauthorized(self):
        """测试未登录点赞被拦截并返回 401"""
        payload = {'target_id': self.article.id, 'target_type': 'article'}
        response = self.client.post(
            reverse('like_toggle_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

    def test_toggle_like_success(self):
        """测试正常点赞切换逻辑"""
        payload = {'target_id': self.article.id, 'target_type': 'article'}

        # 1. 首次点赞，点赞数增加，且落库 Like 记录
        response = self.client.post(
            reverse('like_toggle_view'),
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer commenter_token'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertTrue(data['liked'])
        self.article.refresh_from_db()
        self.assertEqual(self.article.likes_count, 1)
        self.assertTrue(Like.objects.filter(user=self.user, target_type='article', target_id=self.article.id).exists())

        # 2. 再次调用，取消点赞，点赞数减少，且 Like 记录删除
        response2 = self.client.post(
            reverse('like_toggle_view'),
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer commenter_token'
        )
        self.assertEqual(response2.status_code, 200)
        data2 = response2.json()
        self.assertTrue(data2['success'])
        self.assertFalse(data2['liked'])
        self.article.refresh_from_db()
        self.assertEqual(self.article.likes_count, 0)
        self.assertFalse(Like.objects.filter(user=self.user, target_type='article', target_id=self.article.id).exists())

    def test_comment_lifecycle(self):
        """测试评论发布、拉取和管理员审核流"""
        # 1. 未登录发布评论 -> 401
        payload = {
            'article_slug': self.article.slug,
            'content': '这是一条越权评论测试'
        }
        response = self.client.post(
            reverse('comment_dispatch'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

        # 2. 登录发布评论 -> 成功，但默认 is_approved=False
        payload_ok = {
            'article_slug': self.article.slug,
            'content': '支持国产替代，这篇分析写得太棒了！'
        }
        response2 = self.client.post(
            reverse('comment_dispatch'),
            data=json.dumps(payload_ok),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer commenter_token'
        )
        self.assertEqual(response2.status_code, 200)
        data2 = response2.json()
        self.assertTrue(data2['success'])
        self.assertIn('已送入后台审核', data2['message'])

        # 验证数据库中评论是否正确，且状态为未审核
        comment = Comment.objects.get(content='支持国产替代，这篇分析写得太棒了！')
        self.assertFalse(comment.is_approved)

        # 3. 前端读取评论树，由于未审核，列表中应该为空
        response_list = self.client.get(
            reverse('comment_dispatch'),
            {'article_slug': self.article.slug}
        )
        self.assertEqual(response_list.status_code, 200)
        data_list = response_list.json()
        self.assertEqual(len(data_list['comments']), 0)

        # 4. 管理员后台获取待审评论
        response_admin_list = self.client.get(
            reverse('admin_comments_view'),
            HTTP_AUTHORIZATION='Bearer admin_token'
        )
        self.assertEqual(response_admin_list.status_code, 200)
        admin_data = response_admin_list.json()
        self.assertTrue(any(c['id'] == comment.id for c in admin_data['comments']))

        # 5. 管理员审核通过该评论
        approve_payload = {
            'comment_id': comment.id,
            'action': 'approve'
        }
        response_approve = self.client.post(
            reverse('admin_comment_approve_view'),
            data=json.dumps(approve_payload),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer admin_token'
        )
        self.assertEqual(response_approve.status_code, 200)
        self.assertTrue(response_approve.json()['success'])

        # 验证评论状态已变更为已审核
        comment.refresh_from_db()
        self.assertTrue(comment.is_approved)

        # 6. 前端再次拉取评论树，应该能成功获取到该评论
        response_list2 = self.client.get(
            reverse('comment_dispatch'),
            {'article_slug': self.article.slug}
        )
        self.assertEqual(response_list2.status_code, 200)
        data_list2 = response_list2.json()
        self.assertEqual(len(data_list2['comments']), 1)
        self.assertEqual(data_list2['comments'][0]['content'], '支持国产替代，这篇分析写得太棒了！')
