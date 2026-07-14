import json
from django.test import TestCase, Client
from django.urls import reverse
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
        """测试用户成功自注册"""
        payload = {
            'username': 'new_researcher',
            'password': 'secure_password_999',
            'phone_number': '13900139000',
            'nickname': '前沿追风人'
        }
        response = self.client.post(
            reverse('register_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('token', data)
        self.assertEqual(data['user']['username'], 'new_researcher')
        self.assertEqual(data['user']['phone_number'], '13900139000')

        # 验证数据库中用户与资料是否正确落库
        new_user = User.objects.get(username='new_researcher')
        self.assertTrue(new_user.check_password('secure_password_999'))
        self.assertEqual(new_user.profile.nickname, '前沿追风人')

    def test_register_duplicate_username(self):
        """测试使用已存在用户名注册失败"""
        payload = {
            'username': 'test_user',
            'password': 'another_password',
        }
        response = self.client.post(
            reverse('register_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('用户名已存在', data['message'])

    def test_register_duplicate_phone(self):
        """测试使用已被绑定的手机号注册失败"""
        payload = {
            'username': 'unique_user',
            'password': 'password123',
            'phone_number': '13800138000' # 与 setUp 中的手机号重复
        }
        response = self.client.post(
            reverse('register_view'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('手机号已被绑定', data['message'])

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
