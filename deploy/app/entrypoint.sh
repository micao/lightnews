#!/bin/sh

# 等待数据库就绪（通过 python 脚本简单测试连接）
echo "Waiting for postgres..."
python << END
import sys
import time
import psycopg2
try:
    while True:
        psycopg2.connect(
            dbname="${DB_NAME}",
            user="${DB_USER}",
            password="${DB_PASSWORD}",
            host="db",
            port="5432"
        )
        break
except psycopg2.OperationalError:
    time.sleep(1)
END
echo "PostgreSQL started"

# 执行数据库迁移
python manage.py migrate --noinput

# 根据环境区分启动模式
if [ "$DEBUG" = "True" ]; then
    echo "Starting Development Server..."
    # 开发环境：允许热重载，代码直接映射
    python manage.py runserver 0.0.0.0:8000
else
    echo "Starting Production Server (Gunicorn)..."
    # 生产环境：收集静态文件，并启动 Gunicorn
    python manage.py collectstatic --noinput
    gunicorn myproject.wsgi:application --bind 0.0.0.0:8000 --workers 3
fi
