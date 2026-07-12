import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from users.models import User, UserProfile, UserToken

def get_authenticated_user(request):
    """从 Authorization 头部解析 Token 并获取用户"""
    auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION')
    if not auth_header:
        return None
    try:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() in ['bearer', 'token']:
            token_str = parts[1]
            token_obj = UserToken.objects.select_related('user').get(token=token_str)
            return token_obj.user
    except UserToken.DoesNotExist:
        pass
    except Exception:
        pass
    return None

def get_user_roles(user):
    """返回用户的角色列表"""
    if hasattr(user, 'roles') and isinstance(user.roles, list) and user.roles:
        return user.roles
    return ['ROLE_USER']

def serialize_user(user):
    """序列化用户信息"""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'phone_number': user.phone_number,
        'nickname': profile.nickname or user.username,
        'avatar_url': profile.avatar_url or '',
        'bio': profile.bio or '',
        'is_analyst': profile.is_analyst,
        'roles': get_user_roles(user)
    }

@csrf_exempt
def register_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持 POST 请求'}, status=405)
    
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        phone_number = data.get('phone_number', '').strip()
        nickname = data.get('nickname', '').strip()
        
        if not username or not password:
            return JsonResponse({'success': False, 'message': '用户名和密码不能为空'}, status=400)
            
        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'message': '用户名已存在'}, status=400)
            
        if phone_number and User.objects.filter(phone_number=phone_number).exists():
            return JsonResponse({'success': False, 'message': '手机号已被绑定'}, status=400)
            
        # 创建用户并保存默认角色
        user = User.objects.create_user(
            username=username,
            password=password,
            phone_number=phone_number if phone_number else None,
            roles=['ROLE_USER']
        )
        
        # 创建 Profile
        profile = UserProfile.objects.create(
            user=user,
            nickname=nickname if nickname else username,
            avatar_url='',
            bio='新注册研究员'
        )
        
        # 创建 Token
        token_str = uuid.uuid4().hex
        UserToken.objects.create(user=user, token=token_str)
        
        return JsonResponse({
            'success': True,
            'token': token_str,
            'user': serialize_user(user)
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'注册失败: {str(e)}'}, status=500)

@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持 POST 请求'}, status=405)
        
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        role_type = data.get('roleType', 'user') # 'admin' 或 'user'
        
        # 开发及快捷调试便捷机制：支持一键模拟登录
        user = None
        if not password:
            # 如果没有输入密码，检测是否为快捷模拟
            if role_type == 'admin':
                username = 'admin_editor'
            else:
                username = username or 'guest_user'
                
            # 自动创建模拟用户
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_password('default_pass_123')
                if username == 'admin_editor':
                    user.is_staff = True
                    user.is_superuser = True
                    user.roles = ['ROLE_USER', 'ROLE_ADMIN_USER']
                else:
                    user.roles = ['ROLE_USER']
                user.save()
                UserProfile.objects.create(
                    user=user,
                    nickname='系统管理员' if username == 'admin_editor' else username,
                    bio='快捷调试模拟用户'
                )
            else:
                # 检查现有模拟用户以同步角色
                updated = False
                if username == 'admin_editor':
                    if not user.is_superuser or not user.is_staff or 'ROLE_ADMIN_USER' not in user.roles:
                        user.is_staff = True
                        user.is_superuser = True
                        user.roles = ['ROLE_USER', 'ROLE_ADMIN_USER']
                        updated = True
                else:
                    if not user.roles:
                        user.roles = ['ROLE_USER']
                        updated = True
                if updated:
                    user.save()
        else:
            # 标准密码认证
            user = authenticate(username=username, password=password)
            if not user:
                # 尝试用手机号认证
                try:
                    user_by_phone = User.objects.get(phone_number=username)
                    user = authenticate(username=user_by_phone.username, password=password)
                except User.DoesNotExist:
                    pass
                    
        if not user:
            return JsonResponse({'success': False, 'message': '用户名或密码错误'}, status=400)
            
        # 签发 Token
        token_str = uuid.uuid4().hex
        UserToken.objects.create(user=user, token=token_str)
        
        return JsonResponse({
            'success': True,
            'token': token_str,
            'user': serialize_user(user)
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'登录异常: {str(e)}'}, status=500)

@csrf_exempt
def profile_view(request):
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': '未授权或 Token 已过期'}, status=401)
        
    if request.method == 'GET':
        return JsonResponse({
            'success': True,
            'user': serialize_user(user)
        })
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            profile = user.profile
            if 'nickname' in data:
                profile.nickname = data['nickname'].strip()
            if 'bio' in data:
                profile.bio = data['bio'].strip()
            if 'avatar_url' in data:
                profile.avatar_url = data['avatar_url'].strip()
            profile.save()
            return JsonResponse({
                'success': True,
                'user': serialize_user(user)
            })
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'更新个人信息失败: {str(e)}'}, status=500)
            
    return JsonResponse({'success': False, 'message': '不支持的请求方法'}, status=405)
