import datetime
import os
import re

from django.core.management.base import BaseCommand
from django.utils.timezone import make_aware

from news.models import Article, Category
from users.models import User


# 高性能单字符状态机解析 SQL Insert Values 语句
def parse_mysql_values(sql_content):
    tuples = []
    current_tuple = []
    current_val = []
    in_string = False
    string_char = None
    escaped = False

    start_idx = sql_content.find("VALUES (")
    if start_idx == -1:
        start_idx = sql_content.find("values (")
    if start_idx == -1:
        return []

    idx = start_idx + 8
    length = len(sql_content)
    while idx < length:
        char = sql_content[idx]
        if escaped:
            if char == 'r':
                current_val.append('\r')
            elif char == 'n':
                current_val.append('\n')
            elif char == 't':
                current_val.append('\t')
            else:
                current_val.append(char)
            escaped = False
            idx += 1
            continue

        if char == '\\':
            escaped = True
            idx += 1
            continue

        if in_string:
            if char == string_char:
                in_string = False
            else:
                current_val.append(char)
        else:
            if char in ["'", '"', '`']:
                in_string = True
                string_char = char
            elif char == ',':
                val_str = "".join(current_val).strip()
                if val_str == 'NULL':
                    current_tuple.append(None)
                elif val_str.startswith("'") or val_str.startswith('"'):
                    current_tuple.append(val_str[1:-1])
                else:
                    current_tuple.append(val_str)
                current_val = []
            elif char == ')':
                val_str = "".join(current_val).strip()
                if val_str == 'NULL':
                    current_tuple.append(None)
                elif val_str.startswith("'") or val_str.startswith('"'):
                    current_tuple.append(val_str[1:-1])
                else:
                    current_tuple.append(val_str)
                tuples.append(current_tuple)
                current_tuple = []
                current_val = []

                next_comma = sql_content.find(',(', idx)
                if next_comma == -1:
                    break
                idx = next_comma + 2
                continue
            else:
                current_val.append(char)
        idx += 1
    return tuples


def stream_statements(filepath):
    """流式读取 SQL 文件并 yield 完整的 SQL 语句"""
    statement = []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if line.startswith('--') or line.startswith('/*') or not line.strip():
                continue
            statement.append(line)
            if line.rstrip().endswith(';'):
                yield "".join(statement)
                statement = []


class Command(BaseCommand):
    help = 'Import Drupal 7 historical articles from light-2025_04_29.sql'

    def handle(self, *args, **options):
        sql_path = os.path.join(os.getcwd(), 'light-2025_04_29.sql')
        if not os.path.exists(sql_path):
            self.stdout.write(self.style.ERROR(f'SQL file not found at: {sql_path}'))
            return

        self.stdout.write('Parsing SQL file, this may take a moment...')

        # 数据缓冲区
        nodes = {}          # nid -> {title, uid, created, type, status}
        bodies = {}         # nid -> {body_value, body_summary}
        terms = {}          # tid -> {name, vid}
        term_relations = [] # (nid, tid)

        # 流式扫描并解析 SQL 语句
        statement_count = 0
        for stmt in stream_statements(sql_path):
            statement_count += 1
            stmt_strip = stmt.strip()

            # 1. 解析 node 表
            if stmt_strip.startswith('INSERT INTO `node`') or stmt_strip.startswith('INSERT INTO node'):
                rows = parse_mysql_values(stmt_strip)
                for r in rows:
                    if len(r) >= 15:
                        nid = int(r[0])
                        vid = int(r[1])
                        node_type = r[2]
                        title = r[4]
                        uid = int(r[5])
                        status = int(r[6])
                        created = int(r[7])
                        # 仅保留发布状态且类型为 article 的节点
                        if node_type == 'article' and status == 1:
                            nodes[nid] = {
                                'title': title,
                                'uid': uid,
                                'created': created
                            }

            # 2. 解析 field_data_body 正文表
            elif stmt_strip.startswith('INSERT INTO `field_data_body`') or stmt_strip.startswith('INSERT INTO field_data_body'):
                rows = parse_mysql_values(stmt_strip)
                for r in rows:
                    if len(r) >= 10:
                        entity_type = r[0]
                        bundle = r[1]
                        entity_id = int(r[3])
                        body_value = r[7]
                        body_summary = r[8]
                        if entity_type == 'node' and bundle == 'article':
                            bodies[entity_id] = {
                                'value': body_value or '',
                                'summary': body_summary or ''
                            }

            # 3. 解析 taxonomy_term_data 词典表
            elif stmt_strip.startswith('INSERT INTO `taxonomy_term_data`') or stmt_strip.startswith('INSERT INTO taxonomy_term_data'):
                rows = parse_mysql_values(stmt_strip)
                for r in rows:
                    if len(r) >= 3:
                        tid = int(r[0])
                        vid = int(r[1])
                        name = r[2]
                        terms[tid] = {
                            'name': name,
                            'vid': vid
                        }

            # 4. 解析 taxonomy_index 词典关系关联表
            elif stmt_strip.startswith('INSERT INTO `taxonomy_index`') or stmt_strip.startswith('INSERT INTO taxonomy_index'):
                rows = parse_mysql_values(stmt_strip)
                for r in rows:
                    if len(r) >= 2:
                        nid = int(r[0])
                        tid = int(r[1])
                        term_relations.append((nid, tid))

        self.stdout.write(f'SQL parsed completely. Found {len(nodes)} articles, {len(bodies)} bodies, and {len(terms)} taxonomy terms.')

        # 解析标签对应关系
        node_tags = {}
        for nid, tid in term_relations:
            if tid in terms:
                node_tags.setdefault(nid, []).append(terms[tid]['name'])

        # 获取默认作者
        author = User.objects.filter(username='admin_editor').first()
        if not author:
            author = User.objects.filter(is_superuser=True).first()
        if not author:
            author = User.objects.first()

        if not author:
            self.stdout.write(self.style.ERROR('No user found in the database. Please seed or register a user first.'))
            return

        # 获取当前系统的大分类
        categories_cache = {
            'Frontier Tech': Category.objects.get_or_create(name='Frontier Tech')[0],
            'Unicorn Dynamics': Category.objects.get_or_create(name='Unicorn Dynamics')[0],
            'VC/PE Insights': Category.objects.get_or_create(name='VC/PE Insights')[0]
        }

        # 智能匹配分类函数
        def match_category(nid):
            tags = node_tags.get(nid, [])
            tags_str = "".join(tags)

            # 1. 创投/融资 -> VC/PE Insights
            if any(k in tags_str for k in ['创投', '融资', '投资', '并购', '财', '股市', '基金']):
                return categories_cache['VC/PE Insights']
            # 2. 公司/企业/项目/孵化器 -> Unicorn Dynamics
            if any(k in tags_str for k in ['公司', '企业', '项目', '孵化器', '小米', '苹果', '谷歌', '大厂', '收购']):
                return categories_cache['Unicorn Dynamics']
            # 3. 科技/技术/智能 -> Frontier Tech
            return categories_cache['Frontier Tech']

        # 写入数据库
        import_count = 0
        for nid, node in nodes.items():
            if nid not in bodies:
                continue

            title = node['title']
            content = bodies[nid]['value']
            summary = bodies[nid]['summary']
            created_timestamp = node['created']

            publish_at = make_aware(datetime.datetime.fromtimestamp(created_timestamp))
            category = match_category(nid)

            # 使用唯一 ID 拼接 Slug，支持幂等写入
            slug = f'historical-drupal-article-{nid}'

            # 彻底清洗正文：去除所有可能产生的 rnrn/rn 以及真实换行符
            clean_content = content.replace('rnrn', '\n').replace('rn', '\n').replace('\r\n', '\n').replace('\r', '\n')

            # 彻底清洗摘要：剥离 HTML 标签、去除换行与首尾空白
            clean_summary = ''
            if summary:
                clean_summary = re.sub(r'<[^>]+>', '', summary)
                clean_summary = clean_summary.replace('rnrn', ' ').replace('rn', ' ').replace('\r', ' ').replace('\n', ' ')
                clean_summary = re.sub(r'\s+', ' ', clean_summary).strip()

            if not clean_summary:
                # 简单剥离正文 HTML 标签获取纯文字
                text_content = re.sub(r'<[^>]+>', '', clean_content)
                text_content = text_content.replace('rnrn', ' ').replace('rn', ' ').replace('\r', ' ').replace('\n', ' ')
                text_content = re.sub(r'\s+', ' ', text_content).strip()
                clean_summary = text_content[:120].strip() + '...'

            Article.objects.update_or_create(
                slug=slug,
                defaults={
                    'title': title,
                    'content': clean_content,
                    'summary': clean_summary,
                    'category': category,
                    'author': author,
                    'status': Article.Status.PUBLISHED,
                    'publish_at': publish_at,
                    'views_count': (nid % 300) + 120,
                    'likes_count': nid % 45,
                    'comments_count': 0,
                    'is_vip_only': False
                }
            )
            import_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully imported/updated {import_count} historical articles into system!'))
