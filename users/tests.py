import json

from django.test import Client, TestCase, override_settings
from django.urls import reverse

from antispam.models import Captcha
from users.models import User, UserProfile, UserToken


class UsersAuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        # 创建默认测试用户
        self.user = User.objects.create_user(
            username='test_user',
            password='test_password_123',
            phone_number='13800138000',
            roles=['ROLE_USER']
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            nickname='测试研究员',
            bio='专注于前沿科技硬核分析。'
        )
        # 签发 Token
        self.token = UserToken.objects.create(
            user=self.user,
            token='test_token_string_123'
        )

    def test_register_success(self):
        """注册功能已暂时关闭，应返回 403 维护提示"""
        captcha = Captcha.objects.create(answer='12')
        payload = {
            'username': 'new_researcher',
            'password': 'secure_password_999',
            'phone_number': '13900139000',
            'nickname': '前沿追风人',
            'captcha_id': str(captcha.id),
            'captcha_answer': '12'
        }
        response = self.client.post(
            reverse('register_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('系统维护中，暂时关闭新用户注册。', data['message'])

        # 验证数据库中确实未创建任何新用户
        self.assertFalse(User.objects.filter(username='new_researcher').exists())

    def test_register_duplicate_username(self):
        """注册已关闭，应返回 403 而非 400"""
        captcha = Captcha.objects.create(answer='15')
        payload = {
            'username': 'test_user',
            'password': 'another_password',
            'captcha_id': str(captcha.id),
            'captcha_answer': '15'
        }
        response = self.client.post(
            reverse('register_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('系统维护中，暂时关闭新用户注册。', data['message'])

    def test_register_duplicate_phone(self):
        """注册已关闭，应返回 403 而非 400"""
        captcha = Captcha.objects.create(answer='18')
        payload = {
            'username': 'unique_user',
            'password': 'password123',
            'phone_number': '13800138000',
            'captcha_id': str(captcha.id),
            'captcha_answer': '18'
        }
        response = self.client.post(
            reverse('register_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('系统维护中，暂时关闭新用户注册。', data['message'])

    def test_login_strict_success(self):
        """测试常规用户使用正确密码登录成功"""
        payload = {
            'username': 'test_user',
            'password': 'test_password_123'
        }
        response = self.client.post(
            reverse('login_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('token', data)

    def test_login_strict_failed_wrong_password(self):
        """测试常规用户使用错误密码登录失败"""
        payload = {
            'username': 'test_user',
            'password': 'wrong_password_abc'
        }
        response = self.client.post(
            reverse('login_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('用户名或密码错误', data['message'])

    def test_login_strict_failed_empty_password(self):
        """测试非默认快捷用户（如 test_user）不填密码登录时强制拦截"""
        payload = {
            'username': 'test_user',
            'password': '' # 密码为空
        }
        response = self.client.post(
            reverse('login_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('密码不能为空', data['message'])

    @override_settings(DEBUG=True)
    def test_login_shortcut_guest_success(self):
        """测试默认 guest_user 免密快捷通道是否正常畅通"""
        payload = {
            'username': 'guest_user',
            'password': ''
        }
        response = self.client.post(
            reverse('login_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['username'], 'guest_user')

    def test_profile_get_success(self):
        """测试携带 valid token 获取个人资料成功"""
        response = self.client.get(
            reverse('profile_view'),
            HTTP_AUTHORIZATION='Bearer test_token_string_123'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['nickname'], '测试研究员')

    def test_profile_get_unauthorized(self):
        """测试不带 token 或带错误 token 获取资料返回 401 拦截"""
        response = self.client.get(reverse('profile_view'))
        self.assertEqual(response.status_code, 401)

        response_bad_token = self.client.get(
            reverse('profile_view'),
            HTTP_AUTHORIZATION='Bearer invalid_token_xyz'
        )
        self.assertEqual(response_bad_token.status_code, 401)

    def test_profile_post_edit_success(self):
        """测试编辑个人昵称及简介"""
        payload = {
            'nickname': '修改后的研究员',
            'bio': '新简介内容'
        }
        response = self.client.post(
            reverse('profile_view'),
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer test_token_string_123'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['nickname'], '修改后的研究员')

        # 检查数据库
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.nickname, '修改后的研究员')
        self.assertEqual(self.profile.bio, '新简介内容')

    def test_captcha_generation(self):
        """测试验证码生成接口是否正常工作"""
        response = self.client.get(reverse('captcha_view'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('captcha_id', data)
        self.assertIn('question', data)

        # 检查数据库中是否记录了该验证码
        captcha = Captcha.objects.filter(id=data['captcha_id']).first()
        self.assertIsNotNone(captcha)

    def test_registration_with_incorrect_captcha(self):
        """测试验证码错误导致注册失败"""
        # 1. 生成验证码
        captcha = Captcha.objects.create(answer='10')

        payload = {
            'username': 'new_user_1',
            'password': 'password123',
            'captcha_id': str(captcha.id),
            'captcha_answer': '9'  # 错误的回答
        }
        response = self.client.post(
            reverse('register_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        # self.assertEqual(response.status_code, 400)
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertFalse(data['success'])
        # self.assertIn('验证码错误', data['message'])
        self.assertIn('系统维护中，暂时关闭新用户注册。', data['message'])

    def test_registration_with_correct_captcha_success(self):
        """注册已关闭，即使验证码正确也应返回 403"""
        captcha = Captcha.objects.create(answer='8')

        payload = {
            'username': 'new_user_success',
            'password': 'password123',
            'captcha_id': str(captcha.id),
            'captcha_answer': '8'
        }
        response = self.client.post(
            reverse('register_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('系统维护中，暂时关闭新用户注册。', data['message'])
        self.assertFalse(User.objects.filter(username='new_user_success').exists())

    def test_apply_writer_and_admin_approval(self):
        """测试申请写作者以及管理员审核的完整生命周期"""
        # 创建管理员 Token
        admin_user = User.objects.create_user(
            username='admin_boss',
            password='admin_password_123',
            roles=['ROLE_USER', 'ROLE_ADMIN_USER']
        )
        admin_token = UserToken.objects.create(user=admin_user, token='admin_token_string_456')

        # 1. 普通用户提交写作者申请
        payload = {'credentials': '资深科技主笔'}
        response = self.client.post(
            reverse('apply_writer_view'),
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer test_token_string_123'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['analyst_status'], 'pending')

        # 2. 管理员查看待审核列表
        list_response = self.client.get(
            reverse('admin_pending_writers_view'),
            HTTP_AUTHORIZATION='Bearer admin_token_string_456'
        )
        self.assertEqual(list_response.status_code, 200)
        list_data = list_response.json()
        self.assertTrue(list_data['success'])
        pending_ids = [u['user_id'] for u in list_data['pending_users']]
        self.assertIn(self.user.id, pending_ids)

        # 3. 管理员批准申请
        approve_payload = {
            'user_id': self.user.id,
            'action': 'approve'
        }
        approve_response = self.client.post(
            reverse('admin_approve_writer_view'),
            data=json.dumps(approve_payload),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer admin_token_string_456'
        )
        self.assertEqual(approve_response.status_code, 200)
        approve_data = approve_response.json()
        self.assertTrue(approve_data['success'])

        # 4. 检查用户属性是否已成功变更
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.is_analyst)
        self.assertEqual(self.profile.analyst_status, 'approved')

