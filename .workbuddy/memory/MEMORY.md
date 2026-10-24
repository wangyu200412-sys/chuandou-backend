# 项目长期约定（backend）

## 部署形态

- 目标平台：Render 免费 Web Service + Supabase 免费 Postgres。
- 应用入口：`run:app`；Start Command 为 `python init_db.py && gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120 run:app`。
- 健康检查：`/health`（含数据库 `SELECT 1` 检查，异常返回 503）。
- Python 版本固定：`runtime.txt` 为 `python-3.13.0`。

## 配置约定

- 所有密钥与地址从环境变量读取：`SECRET_KEY`、`JWT_SECRET_KEY`、`DATABASE_URL`、`AI_API_KEY`/`AI_SECRET_KEY`、`UPLOAD_FOLDER`、`CORS_ORIGINS`。
- 生产环境（FLASK_ENV=production）缺少密钥直接报错，不使用默认值。
- 数据库地址支持 `postgres://` 自动转换为 `postgresql+psycopg2://` 并补充 `sslmode=require`。
- 本地开发通过 `.env` 加载；`.env` 不提交到 Git，其中不得存放真实凭据。

## 已知限制

- Render 免费实例文件系统为临时存储，上传图片重启后会丢失；长期方案应改对象存储。
- Render 免费实例 15 分钟无访问会休眠，唤醒约需数十秒。
- Supabase 免费项目约一周无数据库活动会被暂停，可在后台恢复。
- `file_share_server.py` 为本地局域网文件共享服务，认证默认关闭，不要部署到公网。
- 本项目无机器学习权重；36 个 `.glb` 合计约 8.19 MB，未超过 100 MB 阈值。
