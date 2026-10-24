# Render 免费部署步骤（Flask + Supabase 免费 Postgres）

目标：只使用免费额度，把 `backend` 部署成公网可访问的网站与接口。

## 0. 本次已完成的改造

| 文件 | 改动 |
| --- | --- |
| `run.py` | 新增 `/health`（含数据库检查）；本地启动读取 `$PORT` 并绑定 `0.0.0.0`；生产不再强制 debug；移除启动期删除帖子的破坏性 SQL |
| `config.py` | 密钥、数据库地址、AI 凭据全部从环境变量读取；生产缺少密钥直接报错；支持 `postgres://` 自动转换与 SSL |
| `app/__init__.py` | 移除强制 SQLite 覆盖；CORS 改为白名单可选（同源默认不开启）；建表改为可控，避免多 worker 并发建表 |
| `app/routes/uploads.py` | 新增 `/uploads/<filename>` 访问路由，修复上传图片 404 |
| `app/routes/posts.py` | 支持 `UPLOAD_STORAGE=disabled` 关闭上传 |
| `app/utils/risk_control.py` | 未开启 `AI_CONTENT_CHECK` 时直接放行，避免无凭据时误拦截 |
| `app/utils/env.py` | 本地加载 `.env`，云端使用平台环境变量 |
| 前端模板与脚本 | `http://localhost:5000/api` 全部改为同源 `/api` |
| `requirements.txt` | 补充 `requests`、`psycopg2-binary`，锁定兼容版本区间 |
| `render.yaml` | 新增 Blueprint：Start Command 绑定 `$PORT`，健康检查 `/health` |
| `runtime.txt` | 固定 Python 3.13.0 |
| `app/routes/pages.py` | 新增：页面路由与 `/health` 从 `run.py` 移入应用工厂，`create_app()` 产出的应用即完整，避免启动命令写错导致整站 404 |
| `config.py` | 开发环境不再被误判为生产环境而强要密钥 |
| `push_and_deploy.ps1` | 新增：一条命令完成推送并打开 Supabase / Render 页面 |
| `.gitignore` | 补充排除 `.env`、数据库、上传目录、日志、共享服务配置与临时脚本 |

冒烟验证结果：临时 SQLite 建表成功；`/health` 返回 200；`/`、`/square`、`/api/components` 返回 200；`/uploads/missing.png` 返回 404。

## 1. 先做安全处理

1. 到百度智能云重新生成文本审核的 API Key / Secret Key，旧密钥已明文暴露过。
2. `.env` 已被替换为本地开发模板，不再包含真实凭据。
3. 确认 `.env`、`*.db`、`uploads/` 不会被提交到 Git。

## 2. 创建 Supabase 免费数据库

1. 注册并登录 Supabase，创建一个 Free 项目。
2. 打开项目，点击 **Connect**。
3. 选择 **Session pooler**（端口 `5432`，IPv4 可用，适合 Render 这类长期运行的后端）。
4. 复制连接串，形如：
   ```text
   postgresql://postgres.<PROJECT-REF>:<PASSWORD>@<POOLER-HOST>:5432/postgres
   ```
5. 密码中的特殊字符需要 URL 编码后再粘贴。
6. 免费项目若连续约一周没有数据库活动会被暂停，可在 Supabase 后台点 **Resume project** 恢复。

## 3. 初始化 Git 并推送

本地仓库已初始化并完成首次提交，敏感文件已确认排除。你只需要两步：

1. 在 GitHub / GitLab 新建一个**空仓库**（不要勾选初始化 README）。
2. 在 `D:\backend` 执行：

```bash
git remote add origin <你的仓库地址>
git push -u origin main
```

推送前已核对过，以下文件均**不会**进入仓库：

- `.env`（真实凭据）
- `chuandou.db`（本地 SQLite）
- `uploads/`（上传图片）
- `file_share_config.json`（共享服务弱口令配置）
- `*.log`、`.workbuddy/scripts/`（临时脚本与日志）

如需复查，执行 `git status --short`。

## 3.5 把本地 SQLite 数据搬到 Supabase（可选）

本地 `chuandou.db` 现有 10 行数据（3 个用户、2 个帖子、4 个点赞、1 条游戏记录）。
如果希望线上不是空库，在 Supabase 建好项目后执行一次迁移即可：

```bash
# Windows PowerShell
$env:DATABASE_URL = "postgresql://postgres.<PROJECT-REF>:<PASSWORD>@<POOLER-HOST>:5432/postgres"
python migrate_sqlite_to_pg.py --dry-run   # 先只看行数，不写入
python migrate_sqlite_to_pg.py             # 确认无误后真正迁移
```

脚本行为：

- 目标库表结构由 ORM 创建（`db.create_all`），与线上代码完全一致
- 插入前清空目标表，**可以重复执行**，不会重复灌数据
- 迁移后自动重置 Postgres 自增序列，避免新注册用户主键冲突
- 不改动业务代码，迁移失败不会影响应用启动

只想让线上有管理员账号、不需要历史数据的话，可以跳过这一步，改用：

```bash
python init_db.py --create-admin --admin-password <你的强密码>
```

## 4. 在 Render 创建服务

1. 打开 Render Dashboard，选择 **New > Blueprint**。
2. 连接刚才推送的仓库与 `main` 分支。
3. Render 会读取仓库根目录的 `render.yaml`。
4. 按提示填写需要手工输入的变量：
   - `DATABASE_URL`：粘贴 Supabase 的 Session pooler 连接串
   - `AI_API_KEY`、`AI_SECRET_KEY`：可选，不填则不启用审核
   - `SECRET_KEY`、`JWT_SECRET_KEY`：由 `generateValue: true` 自动生成
5. 确认服务配置：
   - **Build Command**：`pip install -r requirements.txt`
   - **Start Command**：`python init_db.py && gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120 run:app`
   - **Health Check Path**：`/health`
6. 点击创建，等待构建与部署完成。

若不用 Blueprint，也可手动创建 **Web Service**：

- Language：`Python 3`
- Build Command：`pip install -r requirements.txt`
- Start Command：`python init_db.py && gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120 run:app`
- Health Check Path：`/health`
- 在 Environment 中手动添加上表中的环境变量

## 5. 部署后验证

按顺序检查：

1. 构建日志中出现 `Successfully installed`，没有依赖报错。
2. 运行日志中出现 Gunicorn 启动信息。
3. 访问 `https://<服务名>.onrender.com/health`，应返回：
   ```json
   {"status": "ok", "service": "chuandou-api", "database": "ok"}
   ```
4. 访问根路径，首页与 3D 页面应正常加载。
5. 注册账号、登录、发帖、点赞、评论、保存游戏记录。
6. 登录 Supabase 的 Table Editor，确认 `users`、`posts`、`game_records` 已写入数据。

## 6. 免费方案的已知限制

| 项目 | 限制 | 应对 |
| --- | --- | --- |
| Render 免费 Web Service | 15 分钟无访问会休眠，下次唤醒约需数十秒 | 演示前先访问一次；或改用付费实例 |
| Render 免费实例文件系统 | 临时存储，重启或重新部署后上传图片丢失 | 图片仅作临时演示；长期方案改为 Supabase Storage 或 S3 |
| Supabase 免费项目 | 约一周无数据库活动会被暂停 | 后台手动恢复；或保持有访问量 |
| Supabase 免费容量 | 数据库超过 500 MB 会进入只读模式 | 控制数据量 |
| Render 免费 Postgres | 创建后 30 天过期 | 本方案不使用，已改用 Supabase |
| Render 免费套餐额度 | Hobby 工作区每月 5 GB 出网流量、500 构建分钟、最多 25 个服务 | 3D 模型较大，注意流量；超额且未绑定支付方式会被暂停到次月 |

## 7. 上传图片后续升级建议

当前使用本地临时上传，可正常演示但重启后文件会丢失。需要长期保存时：

1. 在 Supabase 创建公开 Bucket。
2. 在后端改为上传成功后返回对象存储公开 URL。
3. 移除或保留 `/uploads` 路由作为兼容。

## 7.5 不要部署本地文件共享服务

`file_share_server.py` 是独立的局域网文件共享服务，监听 8000 端口：

- 默认配置 `auth.enabled: false`，任何人可列目录、上传、删除文件。
- Render 单个 Web Service 只转发 `PORT` 一个端口，该服务在云端不会对外可达。
- 因此不要把它加入启动命令；若确需公网使用，必须先开启认证并修改默认口令。

## 8. 模型文件超过 100 MB 时的处理

本项目当前没有超过 100 MB 的文件：36 个 `.glb` 合计约 8.19 MB，最大图片约 6.08 MB。

若后续加入大模型权重：

1. 不要把权重提交到 Git。
2. 权重放到对象存储，首次使用时按需下载并校验 SHA-256。
3. 下载目录优先放 `/tmp`，需要跨重启缓存则改用 Render 付费 Persistent Disk。
4. 推理模型用模块级单例懒加载，避免每次请求重复加载。
5. 浏览器端资源（GLB、图片、视频）建议走对象存储或 CDN，不要由 Python 进程转发。
