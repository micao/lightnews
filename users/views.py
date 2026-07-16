import json
import uuid

from django.conf import settings
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from antispam.utils import verify_and_burn_captcha
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
        'analyst_status': profile.analyst_status,
        'roles': get_user_roles(user)
    }

@csrf_exempt
@require_POST
def register_view(request):

    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        phone_number = data.get('phone_number', '').strip()
        nickname = data.get('nickname', '').strip()
        captcha_id = data.get('captcha_id', '').strip()
        captcha_answer = data.get('captcha_answer', '').strip()

        if not username or not password:
            return JsonResponse({'success': False, 'message': '用户名和密码不能为空'}, status=400)

        if not captcha_id or not captcha_answer:
            return JsonResponse({'success': False, 'message': '验证码不能为空'}, status=400)

        # 校验验证码
        is_captcha_valid, captcha_msg = verify_and_burn_captcha(captcha_id, captcha_answer)
        if not is_captcha_valid:
            return JsonResponse({'success': False, 'message': captcha_msg}, status=400)

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
@require_POST
def login_view(request):

    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        role_type = data.get('roleType', 'user') # 'admin' 或 'user'

        # 开发及快捷调试便捷机制：仅允许在 DEBUG 模式下通过默认模拟用户进行无密码快捷登陆，其余情况强制使用密码验证
        user = None
        if settings.DEBUG and not password and username in ['', 'guest_user', 'admin_editor']:
            # 如果没有输入密码，且为默认的模拟用户名，则进入快捷调试通道
            if role_type == 'admin' or username == 'admin_editor':
                username = 'admin_editor'
            else:
                username = 'guest_user'

            # 自动创建或获取模拟用户
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
                    nickname='昨日重现' if username == 'admin_editor' else username,
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
            # 标准密码校验
            if not password:
                return JsonResponse({'success': False, 'message': '密码不能为空'}, status=400)

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
@require_http_methods(["GET", "POST"])
def profile_view(request):
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': '未授权或 Token 已过期'}, status=401)

    if request.method == 'GET':
        return JsonResponse({
            'success': True,
            'user': serialize_user(user)
        })

    else:
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




@csrf_exempt
@require_POST
def apply_writer_view(request):
    """普通注册用户申请成为专栏作者/写作者"""

    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': '未登录或 Token 无效'}, status=401)

    try:
        data = json.loads(request.body)
        credentials = data.get('credentials', '').strip()
    except Exception:
        credentials = ''

    profile = user.profile
    if profile.is_analyst or profile.analyst_status == 'approved':
        return JsonResponse({'success': False, 'message': '您已经是认证分析师/写作者，无需再次申请'}, status=400)

    profile.analyst_status = 'pending'
    if credentials:
        profile.analyst_credentials = credentials
    profile.save()

    return JsonResponse({
        'success': True,
        'message': '申请提交成功，请等待系统管理员审核',
        'user': serialize_user(user)
    })


@csrf_exempt
@require_GET
def admin_pending_writers_view(request):
    """总管理员查看所有待审核的专栏作者申请"""

    user = get_authenticated_user(request)
    if not user or 'ROLE_ADMIN_USER' not in get_user_roles(user):
        return JsonResponse({'success': False, 'message': '无管理员权限'}, status=403)

    profiles = UserProfile.objects.filter(analyst_status='pending').select_related('user')
    pending_list = []
    for p in profiles:
        pending_list.append({
            'user_id': p.user.id,
            'username': p.user.username,
            'nickname': p.nickname or p.user.username,
            'credentials': p.analyst_credentials or '',
            'status': p.analyst_status
        })

    return JsonResponse({
        'success': True,
        'pending_users': pending_list
    })


@csrf_exempt
@require_POST
def admin_approve_writer_view(request):
    """总管理员审核审批写作者申请"""

    user = get_authenticated_user(request)
    if not user or 'ROLE_ADMIN_USER' not in get_user_roles(user):
        return JsonResponse({'success': False, 'message': '无管理员权限'}, status=403)

    try:
        data = json.loads(request.body)
        target_user_id = data.get('user_id')
        action = data.get('action', '').strip() # 'approve' 或 'reject'

        if not target_user_id or action not in ['approve', 'reject']:
            return JsonResponse({'success': False, 'message': '参数无效'}, status=400)

        target_user = User.objects.get(id=target_user_id)
        profile = target_user.profile

        if action == 'approve':
            profile.analyst_status = 'approved'
            profile.is_analyst = True
            profile.save()
            message = f"已批准用户 {target_user.username} 的作者申请"
        else:
            profile.analyst_status = 'rejected'
            profile.is_analyst = False
            profile.save()
            message = f"已驳回用户 {target_user.username} 的作者申请"

        return JsonResponse({
            'success': True,
            'message': message
        })
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': '目标用户不存在'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'审核操作失败: {str(e)}'}, status=500)
