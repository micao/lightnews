FROM python:3.14-slim

# 设置环境变量，防止 python 生成 pyc 字节码，并让输出直接打印不缓存
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /code

# 安装系统依赖（编译 psycopg2 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt /code/
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目代码
COPY . /code/

# 赋予执行脚本权限
RUN chmod +x /code/deploy/app/entrypoint.sh
