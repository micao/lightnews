import re
from django.http import JsonResponse
from django.db import models
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from news.models import Category, Tag, Article, LiveNews
from users.models import User, UserProfile
from users.views import get_authenticated_user

def serialize_article(article, request=None, is_detail=False):
    # 如果是详情页，检测 VIP 锁定状态
    content = article.content
    is_locked = False
    
    if article.is_vip_only:
        # 检测用户登录态
        user = None
        if request:
            user = get_authenticated_user(request)
        if not user:
            is_locked = True
            if not is_detail:
                content = "" # 列表页不显示详情
            else:
                # 剥离 HTML 标签，防止截断时产生不闭合的 HTML 标签导致前台布局破坏
                text_content = re.sub(r'<[^>]+>', '', content)
                content = text_content[:150] + "..."

    author_profile = getattr(article.author, 'profile', None)
    author_name = author_profile.nickname if author_profile else article.author.username

    return {
        'id': article.id,
        'title': article.title,
        'slug': article.slug,
        'summary': article.summary or '',
        'content': content,
        'is_vip_only': article.is_vip_only,
        'is_locked': is_locked,
        'views_count': article.views_count,
        'likes_count': article.likes_count,
        'comments_count': article.comments_count,
        'publish_at': article.publish_at.strftime('%Y-%m-%d %H:%M:%S') if article.publish_at else '',
        'category': {
            'id': article.category.id,
            'name': article.category.name,
        },
        'author': {
            'id': article.author.id,
            'nickname': author_name,
        }
    }

def article_list_view(request):
    try:
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 5))
        category_name = request.GET.get('category', '').strip()
        status_filter = request.GET.get('status', 'published') # Default to published
    except ValueError:
        page = 1
        limit = 5
        category_name = ''
        status_filter = 'published'

    # 对普通用户，强制只看已发布文章
    user = get_authenticated_user(request)
    is_admin = False
    if user:
        from users.views import get_user_roles
        is_admin = 'ROLE_ADMIN_USER' in get_user_roles(user)

    queryset = Article.objects.select_related('category', 'author', 'author__profile').all()
    
    if not is_admin or status_filter == 'published':
        queryset = queryset.filter(status=Article.Status.PUBLISHED)
    elif status_filter == 'draft':
        queryset = queryset.filter(status=Article.Status.DRAFT)

    if category_name and category_name != '全部推荐':
        queryset = queryset.filter(category__name=category_name)

    queryset = queryset.order_index = queryset.order_by('-publish_at', '-id')

    # 分页计算
    total_count = queryset.count()
    start = (page - 1) * limit
    end = page * limit
    articles_slice = queryset[start:end]

    serialized = [serialize_article(art, request) for art in articles_slice]

    return JsonResponse({
        'success': True,
        'total': total_count,
        'page': page,
        'limit': limit,
        'articles': serialized,
        'has_more': end < total_count
    })

def article_detail_view(request, slug):
    try:
        article = Article.objects.select_related('category', 'author', 'author__profile').get(slug=slug)
    except Article.DoesNotExist:
        return JsonResponse({'success': False, 'message': '文章未找到'}, status=404)

    # 累加阅读量
    Article.objects.filter(id=article.id).update(views_count=models.F('views_count') + 1)
    article.refresh_from_db()

    return JsonResponse({
        'success': True,
        'article': serialize_article(article, request, is_detail=True)
    })

def live_news_list_view(request):
    # 获取最新的 10 条快讯
    news_qs = LiveNews.objects.select_related('author', 'author__profile').order_by('-id')[:10]
    
    # 模拟数据转换，把 models.py 的 impact 利多/利空机制转换成创投快报需要的 tag 类别
    # 允许在 model 字段缺失时安全回退，如果 LiveNews 具有 impact 则进行映射
    serialized = []
    for item in news_qs:
        tag_str = '前沿科技'
        if item.impact == LiveNews.Impact.BULLISH:
            tag_str = '融资'
        elif item.impact == LiveNews.Impact.BEARISH:
            tag_str = '独角兽'
        elif item.impact == LiveNews.Impact.NEUTRAL:
            tag_str = '大厂'

        serialized.append({
            'id': item.id,
            'content': item.content,
            'urgency': item.urgency,
            'tag': tag_str,
            'publish_time': item.publish_time.strftime('%H:%M:%S')
        })

    return JsonResponse({
        'success': True,
        'news': serialized
    })

@csrf_exempt
def seed_data_view(request):
    """一键填充创投数据 API (开发及测试环境专用)"""
    try:
        # 1. 创建分类
        cats = ['前沿科技', '独角兽动态', 'VC/PE观察']
        cat_objs = {}
        for c in cats:
            obj, _ = Category.objects.get_or_create(name=c, defaults={'slug': c.lower()})
            cat_objs[c] = obj

        # 2. 创建默认作者
        author_user, created = User.objects.get_or_create(username='analyst_author', defaults={'email': 'author@lightnews.com'})
        if created:
            author_user.set_password('pass123')
            author_user.save()
            UserProfile.objects.create(user=author_user, nickname='肖杰克 (前沿科技分析师)', bio='深耕硬科技及半导体流片方向')

        admin_user, _ = User.objects.get_or_create(username='admin_editor')
        # 确保 admin_editor 存在 Profile
        UserProfile.objects.get_or_create(user=admin_user, defaults={'nickname': '系统管理员', 'bio': '平台主编'})

        # 3. 创建文章数据
        seed_articles = [
            {
                'title': '【重磅深度】全球AI芯片大变局：高算力红利退潮后的商业化突围',
                'slug': 'global-ai-chip-market-and-commercialization',
                'summary': '随着各大AI云大厂对资本开支产出比的要求更加苛刻，AI算力泡沫正面临重构。本研究聚焦先进制程代工逻辑、边缘端AI芯片爆发节点，以及国内独角兽的流片进度。',
                'content': '在经历了近三年来疯狂的算力算大开支后，全球科技产业正在迎来更为务实的落地重组。大语言模型不仅需要极高的峰值浮点计算速度，更面临单位耗电成本与吞吐效率的严酷约束。本文将探讨：1. 存算一体等新兴微架构在端侧推理芯片中的效率跃升；2. 3D堆叠与先进封装工艺在缓解HBM显存带宽限制上的关键作用；3. 创投基金在中早期半导体项目估值回归理性后的重仓赛道。这标志着人工智能硬件链正式迈入了拼“单位性价比”的新常态。',
                'category': cat_objs['前沿科技'],
                'author': author_user,
                'is_vip_only': True,
                'views_count': 42100,
                'likes_count': 1050,
                'comments_count': 2
            },
            {
                'title': '中国具身智能独角兽密集融资，2026是否能迎来商用落地拐点？',
                'slug': 'embodied-ai-unicorns-funding-and-commercialization',
                'summary': '人形机器人与大模型大脑深度融合，星动纪元、逐际动力等创企最近数月密集宣布完成数亿级融资，资本重新涌入硬科技孵化池。',
                'content': '人形机器人之所以在最近迎来爆发式增长，主要得益于多模态物理大模型赋予其通用任务规划与泛化执行能力。在仓储搬运、新能源汽车装配车间，首批测试样机已经正式入驻进行试工。VC们更关心的是：量产后的BOM（物料清单）成本能否控制在2万美元以内，以及核心力矩传感器与谐波减速器的国产替代替代率。未来18个月，将是具身智能从“实验室Demo”走向“工厂流水线”的关键分水岭。',
                'category': cat_objs['独角兽动态'],
                'author': author_user,
                'is_vip_only': False,
                'views_count': 31200,
                'likes_count': 920,
                'comments_count': 0
            },
            {
                'title': '光刻机巨头ASML二季报透视：国内先进制程客户设备需求坚挺',
                'slug': 'asml-q2-earnings-and-china-foundry-demand',
                'summary': 'ASML今日开盘大涨。虽然欧洲对高端先进制程DUV设备出口审核有收紧趋势，但国内二线晶圆厂在特色工艺与成熟制程上的强劲扩张抵消了地缘扰动。',
                'content': '全球半导体设备需求依然保持着可观的惯性。国内半导体晶圆代工厂在模拟芯片、射频、电源管理及功率半导体等成熟应用赛道上正处于扩产高峰。这也反映在ASML前道光刻设备的积压订单交付上。行业调研显示，尽管面对重重政策阻力，通过Chiplet先进封装等折中技术路径，国内算力芯片初创企业依然在寻找可行的自主突围通路。',
                'category': cat_objs['前沿科技'],
                'author': author_user,
                'is_vip_only': False,
                'views_count': 24500,
                'likes_count': 530,
                'comments_count': 0
            },
            {
                'title': '【中东资本观察】主权财富基金2026年直投重心全面转向AI与新材料',
                'slug': 'mideast-sovereign-wealth-funds-direct-investment-trends',
                'summary': '阿布扎比投资局与沙特PIF近期密集宣布在华设立硬科技直投办公室。生成式人工智能与新型固态电池研发商成为其高额领投的最热标的。',
                'content': '随着全球传统能源转型加剧，中东主权财富基金正在以惊人的速度推进其资本结构调整。过去单纯依靠跟投欧美大型PE的方式，正逐步转变为在重点市场设立本土投资团队直接挑选“中国硬科技独角兽”进行直投。中东资本雄厚的财力配比与超长的资金周期，几乎成了当前硬科技创投寒冬里各大初创项目竞相争取的“源头活水”。',
                'category': cat_objs['VC/PE观察'],
                'author': author_user,
                'is_vip_only': True,
                'views_count': 27800,
                'likes_count': 670,
                'comments_count': 0
            }
        ]

        for item in seed_articles:
            Article.objects.get_or_create(
                slug=item['slug'],
                defaults={
                    'title': item['title'],
                    'summary': item['summary'],
                    'content': item['content'],
                    'category': item['category'],
                    'author': item['author'],
                    'is_vip_only': item['is_vip_only'],
                    'views_count': item['views_count'],
                    'likes_count': item['likes_count'],
                    'comments_count': item['comments_count'],
                    'status': Article.Status.PUBLISHED,
                    'publish_at': timezone.now()
                }
            )

        # 4. 创建快讯数据
        seed_news = [
            {'content': '【融资】大模型独角兽“月之暗面”完成新一轮数亿美元融资，本轮融资由红杉中国、美团龙珠等机构联合领投，投后估值正式攀升至26亿美元。', 'urgency': LiveNews.Urgency.CRITICAL, 'impact': LiveNews.Impact.BULLISH},
            {'content': '【前沿科技】清华大学集成电路学院课题组研制出全球首款“三维芯片智能架构”，相关科研成果已于今日正式发表在《Nature》正刊上，实现算力密度飞跃。', 'urgency': LiveNews.Urgency.NORMAL, 'impact': LiveNews.Impact.NEUTRAL},
            {'content': '【大厂】腾讯混元大模型宣布全面开源，并推出面向企业端的大模型API半价优惠策略，正式加入国内主流云厂商的算力性价比大战。', 'urgency': LiveNews.Urgency.WARN, 'impact': LiveNews.Impact.NEUTRAL},
            {'content': '【独角兽】商业航天研制商“星河动力”于酒泉卫星发射中心成功实现“谷神星一号”商业运载火箭一日双发，完成了两颗气象遥感卫星的精确定轨。', 'urgency': LiveNews.Urgency.NORMAL, 'impact': LiveNews.Impact.BEARISH},
        ]

        for news in seed_news:
            LiveNews.objects.get_or_create(
                content=news['content'],
                defaults={
                    'urgency': news['urgency'],
                    'impact': news['impact'],
                    'author': admin_user
                }
            )

        return JsonResponse({'success': True, 'message': '种子数据填充成功'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'填充异常: {str(e)}'}, status=500)
