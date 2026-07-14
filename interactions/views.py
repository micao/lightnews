import json

from django.db import models
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from antispam.utils import verify_and_burn_captcha
from interactions.models import Comment, Like
from news.models import Article
from users.views import get_authenticated_user, get_user_roles


def serialize_comment(cmt):
    """序列化评论信息"""
    user_profile = getattr(cmt.user, 'profile', None)
    user_nickname = user_profile.nickname if user_profile else cmt.user.username
    user_avatar = user_profile.avatar_url if user_profile else ''

    serialized = {
        'id': cmt.id,
        'content': cmt.content,
        'created_at': cmt.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'likes_count': cmt.likes_count,
        'user': {
            'username': cmt.user.username,
            'nickname': user_nickname,
            'avatar_url': user_avatar,
        },
        'replies': []
    }

    # 递归序列化子回复 (只取审核通过的回复)
    replies_qs = cmt.replies.filter(is_approved=True).select_related('user', 'user__profile').order_by('id')
    for reply in replies_qs:
        serialized['replies'].append(serialize_comment(reply))

    return serialized

def comment_list_view(request):
    """获取文章的评论树列表"""
    article_slug = request.GET.get('article_slug', '').strip()
    if not article_slug:
        return JsonResponse({'success': False, 'message': '参数 article_slug 不能为空'}, status=400)

    try:
        article = Article.objects.get(slug=article_slug)
    except Article.DoesNotExist:
        return JsonResponse({'success': False, 'message': '文章未找到'}, status=404)

    # 读取根评论（即没有 parent_id 的顶级评论）
    comments_qs = Comment.objects.filter(
        article=article,
        parent__isnull=True,
        is_approved=True
    ).select_related('user', 'user__profile').order_by('-id')

    serialized = [serialize_comment(cmt) for cmt in comments_qs]
    return JsonResponse({'success': True, 'comments': serialized})

@csrf_exempt
def comment_create_view(request):
    """提交评论 (需要登录)"""
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': '需要登录才能发表评论'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持 POST 请求'}, status=405)

    try:
        data = json.loads(request.body)
        article_slug = data.get('article_slug', '').strip()
        content = data.get('content', '').strip()
        parent_id = data.get('parent_id')
        captcha_id = data.get('captcha_id', '').strip()
        captcha_answer = data.get('captcha_answer', '').strip()

        if not captcha_id or not captcha_answer:
            return JsonResponse({'success': False, 'message': '验证码不能为空'}, status=400)

        is_captcha_valid, captcha_msg = verify_and_burn_captcha(captcha_id, captcha_answer)
        if not is_captcha_valid:
            return JsonResponse({'success': False, 'message': captcha_msg}, status=400)

        if not article_slug or not content:
            return JsonResponse({'success': False, 'message': '文章标识和评论内容不能为空'}, status=400)

        try:
            article = Article.objects.get(slug=article_slug)
        except Article.DoesNotExist:
            return JsonResponse({'success': False, 'message': '文章不存在'}, status=404)

        if not article.allow_comments:
            return JsonResponse({'success': False, 'message': '该文章已关闭评论功能'}, status=403)

        parent_cmt = None
        if parent_id:
            try:
                parent_cmt = Comment.objects.get(id=parent_id)
            except Comment.DoesNotExist:
                return JsonResponse({'success': False, 'message': '回复的父评论不存在'}, status=404)

        # 写入评论，默认不审核通过 (is_approved=False)
        comment = Comment.objects.create(
            user=user,
            article=article,
            parent=parent_cmt,
            content=content,
            is_approved=False
        )

        # 累加文章的评论计数 (待审核的暂时也计入或仅审核后计入，这里先直接累加以提供即时写回感)
        Article.objects.filter(id=article.id).update(comments_count=models.F('comments_count') + 1)

        user_profile = getattr(user, 'profile', None)
        user_nickname = user_profile.nickname if user_profile else user.username

        return JsonResponse({
            'success': True,
            'message': '评论提交成功，已送入后台审核',
            'comment': {
                'id': comment.id,
                'content': comment.content,
                'created_at': '刚刚',
                'likes_count': 0,
                'user': {
                    'username': user.username,
                    'nickname': user_nickname,
                }
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'发表评论异常: {str(e)}'}, status=500)

@csrf_exempt
def like_toggle_view(request):
    """点赞 / 取消点赞 (需要登录)"""
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': '需要登录才能点赞'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持 POST 请求'}, status=405)

    try:
        data = json.loads(request.body)
        target_type = data.get('target_type', 'article') # 'article' 或 'comment'
        target_id = data.get('target_id')

        if not target_id:
            return JsonResponse({'success': False, 'message': '点赞目标 ID 不能为空'}, status=400)

        like_filter = {
            'user': user,
            'target_type': target_type,
            'target_id': target_id
        }

        liked = False
        likes_qs = Like.objects.filter(**like_filter)

        if likes_qs.exists():
            likes_qs.delete()
            change = -1
        else:
            Like.objects.create(**like_filter)
            liked = True
            change = 1

        # 更新相应表的数据统计
        new_count = 0
        if target_type == 'article':
            Article.objects.filter(id=target_id).update(likes_count=models.F('likes_count') + change)
            art = Article.objects.get(id=target_id)
            new_count = art.likes_count
        elif target_type == 'comment':
            Comment.objects.filter(id=target_id).update(likes_count=models.F('likes_count') + change)
            cmt = Comment.objects.get(id=target_id)
            new_count = cmt.likes_count

        return JsonResponse({
            'success': True,
            'liked': liked,
            'likes_count': max(0, new_count)
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'点赞异常: {str(e)}'}, status=500)

@csrf_exempt
def admin_comments_view(request):
    """拉取所有待审核评论 (仅限管理员)"""
    user = get_authenticated_user(request)
    if not user or 'ROLE_ADMIN_USER' not in get_user_roles(user):
        return JsonResponse({'success': False, 'message': '无权访问管理员面板'}, status=403)

    comments_qs = Comment.objects.filter(is_approved=False).select_related('user', 'user__profile', 'article').order_by('-id')

    serialized = []
    for c in comments_qs:
        user_profile = getattr(c.user, 'profile', None)
        serialized.append({
            'id': c.id,
            'content': c.content,
            'created_at': c.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'article_title': c.article.title if c.article else '未绑定文章',
            'user': {
                'username': c.user.username,
                'nickname': user_profile.nickname if user_profile else c.user.username,
            }
        })

    return JsonResponse({'success': True, 'comments': serialized})

@csrf_exempt
def admin_comment_approve_view(request):
    """审核评论通过或删除 (仅限管理员)"""
    user = get_authenticated_user(request)
    if not user or 'ROLE_ADMIN_USER' not in get_user_roles(user):
        return JsonResponse({'success': False, 'message': '无权进行此操作'}, status=403)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持 POST 请求'}, status=405)

    try:
        data = json.loads(request.body)
        comment_id = data.get('comment_id')
        action = data.get('action') # 'approve' 或 'reject'

        if not comment_id or not action:
            return JsonResponse({'success': False, 'message': '参数不全'}, status=400)

        try:
            comment = Comment.objects.get(id=comment_id)
        except Comment.DoesNotExist:
            return JsonResponse({'success': False, 'message': '评论不存在'}, status=404)

        if action == 'approve':
            comment.is_approved = True
            comment.save()
            return JsonResponse({'success': True, 'message': '评论审核通过'})
        elif action == 'reject':
            # 驳回直接物理删除
            if comment.article:
                Article.objects.filter(id=comment.article.id).update(comments_count=models.F('comments_count') - 1)
            comment.delete()
            return JsonResponse({'success': True, 'message': '评论已被驳回并下架'})

        return JsonResponse({'success': False, 'message': '非法操作 action'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'审核处理异常: {str(e)}'}, status=500)
