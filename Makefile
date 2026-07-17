.PHONY: dev destroy dev-frontend dev-frontend-docker makemigrations migrate check shell seed sync-deals sync-financial sync-tech sync-articles test lint-backend lint-frontend lint

# 启动后端 Docker 容器环境
dev:
	docker compose --env-file .env.dev up --build

# 停止并清理 Docker 容器及相关数据卷
destroy:
	docker compose --env-file .env.dev down --rmi all -v --remove-orphans

# 运行前端开发服务器 (宿主机本地)
dev-frontend:
	cd frontend && npm run dev

# 运行前端开发服务器 (Node 容器化)
dev-frontend-docker:
	docker run -it --rm -p 5173:5173 -v $(shell pwd)/frontend:/app -w /app node:20-alpine npm run dev -- --host

# 生成数据库迁移脚本
makemigrations:
	docker compose --env-file .env.dev exec web python manage.py makemigrations

# 执行数据库迁移
migrate:
	docker compose --env-file .env.dev exec web python manage.py migrate

# 执行 Django 静态合法性检查
check:
	docker compose --env-file .env.dev exec web python manage.py check

# 打开 Django 交互式 Shell 终端
shell:
	docker compose --env-file .env.dev exec web python manage.py shell

# 填充开发环境创投种子数据 (分类、文章、快讯及作者)
seed:
	docker compose --env-file .env.dev exec web python manage.py shell -c "from news.views import seed_data_view; from django.test import RequestFactory; print(seed_data_view(RequestFactory().get('/api/seed/')).content)"

# 同步中外双源最新大额投融资动态数据
sync-deals:
	docker compose --env-file .env.dev exec web python manage.py sync_latest_funding_deals

# 自动分析全球金融大盘数据生成快讯
sync-financial:
	docker compose --env-file .env.dev exec web python manage.py sync_financial_news

# 自动抓取外文科技快讯翻译生成草稿待审
sync-tech:
	docker compose --env-file .env.dev exec web python manage.py sync_tech_news

# 自动抓取英文深度报道文章，进行全文高保真翻译并自动配图生成待审草稿
sync-articles:
	docker compose --env-file .env.dev exec web python manage.py sync_tech_articles

# 自动抓取英文 AI 相关深度报道并高保真翻译，并自动配图生成待审草稿
sync-ai-articles:
	docker compose --env-file .env.dev exec web python manage.py sync_ai_articles

# 运行后端 Django 单元与功能测试套件
test:
	docker compose --env-file .env.dev exec web python manage.py test

# 后端代码质量检测 (Ruff)
lint-backend:
	docker compose --env-file .env.dev exec web ruff check .

# 前端代码质量与类型安全检测 (Oxlint & tsc)
lint-frontend:
	cd frontend && npm run lint
	cd frontend && npx tsc --noEmit

# 全栈代码质量统一核查
lint: lint-backend lint-frontend
