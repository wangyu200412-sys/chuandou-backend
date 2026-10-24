# 文件共享 API 服务 - 使用指南

## 快速启动

### Windows 用户
双击运行 `start_file_share.bat`

### 手动启动
```bash
cd f:\item\chuandou\backend
venv\Scripts\activate
pip install flask flask-cors
python file_share_server.py
```

## 默认配置

- **服务地址**: http://0.0.0.0:8000 (局域网内可通过 IP 访问)
- **默认账号**: admin / admin123
- **共享目录**: `./shared_files/` (自动创建)
- **最大文件**: 100MB

## API 使用说明

### 1. 登录获取 Token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"admin\", \"password\": \"admin123\"}"
```

返回示例:
```json
{
  "success": true,
  "token": "abc123...",
  "expires_at": "2026-04-29T12:00:00",
  "user": {"username": "admin", "role": "admin"}
}
```

### 2. 列出所有文件

```bash
curl -X GET http://localhost:8000/api/files \
  -H "Authorization: Bearer <your_token>"
```

### 3. 上传文件

```bash
curl -X POST http://localhost:8000/api/files/upload \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@C:\path\to\your\file.txt"
```

### 4. 下载文件

```bash
curl -X GET http://localhost:8000/api/files/filename.txt \
  -H "Authorization: Bearer <your_token>" \
  -o downloaded_file.txt
```

### 5. 删除文件

```bash
curl -X DELETE http://localhost:8000/api/files/filename.txt \
  -H "Authorization: Bearer <your_token>"
```

### 6. 查看 API 文档

浏览器访问: http://localhost:8000/api/docs

## 局域网访问配置

1. 查看本机 IP 地址:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. 其他设备访问 (替换 YOUR_IP):
   ```
   http://YOUR_IP:8000/api/files
   ```

3. 防火墙设置 (如无法访问):
   - Windows: 在防火墙中允许端口 8000
   - 或关闭防火墙 (仅测试环境)

## 修改配置

编辑 `file_share_config.json`:

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 8000
  },
  "auth": {
    "enabled": true,
    "users": [
      {
        "username": "admin",
        "password_hash": "请使用 SHA256 哈希后的密码",
        "role": "admin"
      }
    ]
  },
  "storage": {
    "shared_dir": "./shared_files",
    "max_file_size_mb": 100,
    "allowed_extensions": ["*"],
    "allow_overwrite": true
  }
}
```

### 生成密码哈希

```python
import hashlib
password = "your_password"
hash_value = hashlib.sha256(password.encode()).hexdigest()
print(hash_value)
```

## 安全建议

1. **立即修改默认密码**
2. 设置 `allowed_extensions` 限制文件类型
3. 生产环境设置 `debug: false`
4. 使用 API Key 替代 Token (配置 `security.api_keys`)
5. 不要将服务暴露在公网，仅限局域网使用

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | 修改 `file_share_config.json` 中的 `port` |
| 无法访问 | 检查防火墙，确保端口开放 |
| 认证失败 | 检查密码哈希是否正确 |
| 文件上传失败 | 检查 `max_file_size_mb` 和目录权限 |
