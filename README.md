# 穿斗式建筑展示后端 API

基于 Flask 的 RESTful API，为穿斗式建筑展示项目提供后端服务支持。

## 功能特性

- **用户系统**：注册、登录、JWT认证、个人资料管理
- **广场功能**：帖子发布、点赞、评论、图片上传
- **游戏记录**：通关记录保存、排行榜、个人成绩统计
- **构件知识库**：建筑构件信息管理、分类查询
- **文件存储**：图片上传与压缩处理

## 技术栈

- **框架**：Flask 2.3.3
- **数据库**：SQLite（开发）/ MySQL（生产）
- **ORM**：SQLAlchemy
- **认证**：JWT（Flask-JWT-Extended）
- **迁移**：Flask-Migrate

## 快速开始

### 1. 安装依赖

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置密钥和数据库配置
```

### 3. 初始化数据库

```bash
python run.py
# 数据库表会自动创建
```

### 4. 初始化构件数据

```bash
# 启动服务器后，调用API初始化构件数据
curl -X POST http://localhost:5000/api/components/init
```

### 5. 启动服务

```bash
# 开发模式
python run.py

# 生产模式（使用gunicorn）
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

服务将在 `http://localhost:5000` 启动。

## API 文档

### 认证相关

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/profile | 获取用户信息 |
| PUT | /api/auth/profile | 更新用户信息 |
| PUT | /api/auth/password | 修改密码 |

### 广场帖子

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/posts | 获取帖子列表 |
| GET | /api/posts/:id | 获取帖子详情 |
| POST | /api/posts | 创建帖子（需登录） |
| DELETE | /api/posts/:id | 删除帖子（需登录） |
| POST | /api/posts/:id/like | 点赞/取消点赞 |
| GET | /api/posts/:id/comments | 获取评论 |
| POST | /api/posts/:id/comments | 添加评论 |

### 游戏记录

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/game/records | 获取排行榜 |
| POST | /api/game/records | 保存游戏记录 |
| GET | /api/game/my-records | 获取我的记录 |
| GET | /api/game/stats | 获取游戏统计 |
| GET | /api/game/rank | 获取我的排名 |

### 构件知识库

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/components | 获取构件列表 |
| GET | /api/components/categories | 获取分类列表 |
| GET | /api/components/:id | 获取构件详情 |
| GET | /api/components/search | 搜索构件 |
| POST | /api/components/init | 初始化数据 |

## 前端集成

在前端页面中引入 API 服务层：

```html
<script type="module" src="./js/api.js"></script>
```

使用示例：

```javascript
import { AuthAPI, PostsAPI, GameAPI } from './js/api.js';

// 登录
await AuthAPI.login('username', 'password');

// 获取帖子列表
const posts = await PostsAPI.getList(1, 'hot');

// 保存游戏记录
await GameAPI.saveRecord(120.5, 3, true);
```

## 部署

### 使用 Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
```

### 生产环境配置

1. 使用 MySQL 数据库
2. 配置 Nginx 反向代理
3. 启用 HTTPS
4. 设置环境变量 `FLASK_ENV=production`

## 目录结构

```
backend/
├── app/
│   ├── __init__.py      # 应用初始化
│   ├── models.py        # 数据库模型
│   └── routes/          # 路由模块
│       ├── auth.py      # 认证路由
│       ├── posts.py     # 帖子路由
│       ├── game.py      # 游戏路由
│       └── components.py # 构件路由
├── config.py            # 配置文件
├── run.py               # 启动入口
├── requirements.txt     # 依赖列表
└── .env                 # 环境变量
```

## 许可证

MIT License
