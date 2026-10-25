#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
通过 Render 官方 API 全自动创建并部署 chuandou-backend。

用法（PowerShell）：
  $env:RENDER_API_KEY = "rnd_xxxxxxxxxxxx"
  python deploy_render.py

可选参数：
  --region singapore      部署区域（默认 singapore）
  --no-wait               创建后不等待构建完成
"""

import argparse
import os
import secrets
import sys
import time

import requests

API = "https://api.render.com/v1"

REPO = "https://github.com/wangyu200412-sys/chuandou-backend"
BRANCH = "main"
SERVICE_NAME = "chuandou-backend"
BUILD_COMMAND = "pip install -r requirements.txt"
START_COMMAND = (
    "python init_db.py && gunicorn --bind 0.0.0.0:$PORT "
    "--workers 2 --threads 2 --timeout 120 run:app"
)
HEALTH_PATH = "/health"

# 已验证可用的 Supabase Session pooler 连接串
DEFAULT_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "",
)


def headers(token):
    return {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def get_owner_id(token):
    r = requests.get(API + "/owners", headers=headers(token), timeout=30)
    if r.status_code != 200:
        die("获取工作区列表失败", r)
    items = r.json()
    # 接口可能返回 list，也可能返回 {"owners": [...]}
    owners = items if isinstance(items, list) else items.get("owners") or []
    if not owners:
        die("没有可用的 Render 工作区，请先登录 dashboard.render.com 确认账号状态", r)
    owner = owners[0]
    oid = owner.get("id") or owner.get("owner", {}).get("id")
    print("[OK] 工作区: %s (%s)" % (owner.get("name", "-"), oid))
    return oid


def env_vars():
    secret = secrets.token_urlsafe(48)
    jwt = secrets.token_urlsafe(48)
    return [
        {"key": "PYTHON_VERSION", "value": "3.13.0"},
        {"key": "FLASK_ENV", "value": "production"},
        {"key": "WEB_CONCURRENCY", "value": "2"},
        {"key": "INIT_DB_ON_START", "value": "true"},
        {"key": "UPLOAD_STORAGE", "value": "local"},
        {"key": "SECRET_KEY", "value": secret},
        {"key": "JWT_SECRET_KEY", "value": jwt},
        {"key": "DATABASE_URL", "value": DEFAULT_DATABASE_URL},
        {"key": "AI_CONTENT_CHECK", "value": "false"},
    ]


def create_service(token, owner_id, region):
    payload = {
        "type": "web_service",
        "name": SERVICE_NAME,
        "ownerId": owner_id,
        "repo": REPO,
        "branch": BRANCH,
        "autoDeployTrigger": "commit",
        "serviceDetails": {
            "runtime": "python",
            "plan": "free",
            "region": region,
            "buildCommand": BUILD_COMMAND,
            "startCommand": START_COMMAND,
            "healthCheckPath": HEALTH_PATH,
            "numInstances": 1,
        },
        "envVars": env_vars(),
    }
    r = requests.post(API + "/services", headers=headers(token),
                      json=payload, timeout=60)
    if r.status_code not in (200, 201):
        die("创建服务失败", r)
    svc = r.json().get("service", r.json())
    print("[OK] 服务已创建: %s" % svc.get("name"))
    print("     Dashboard: %s" % svc.get("dashboardUrl"))
    print("     URL: https://%s.onrender.com" % svc.get("slug", SERVICE_NAME))
    return svc


def wait_live(token, service_id, timeout=1800):
    url = "https://%s.onrender.com%s" % (SERVICE_NAME, HEALTH_PATH)
    print("[..] 等待构建与部署（最多 %d 秒）..." % timeout)
    start = time.time()
    last_status = None
    while time.time() - start < timeout:
        try:
            r = requests.get(API + "/services/%s/deploys?limit=1" % service_id,
                             headers=headers(token), timeout=30)
            deploys = r.json()
            deploys = deploys if isinstance(deploys, list) else deploys.get("deploys", [])
            if deploys:
                d = deploys[0]
                st = d.get("status")
                if st != last_status:
                    print("     deploy %s -> %s" % (d.get("id", "")[:8], st))
                    last_status = st
                if st == "live":
                    print("[OK] 部署已上线")
                    return url
                if st in ("failed", "canceled", "deactivated"):
                    print("[ERROR] 部署失败，请打开 Dashboard 查看构建日志")
                    return None
        except Exception as exc:
            print("     [warn] 查询部署状态异常: %s" % exc)

        # 同时直接探活，构建完成后 health 会先于 API 状态可用
        try:
            hr = requests.get(url, timeout=15)
            if hr.status_code == 200:
                print("[OK] %s 已响应: %s" % (HEALTH_PATH, hr.text.strip()[:120]))
                return url
        except Exception:
            pass

        time.sleep(20)
    print("[WARN] 超时，请手动访问 %s" % url)
    return url


def die(msg, resp=None):
    print("[ERROR] " + msg)
    if resp is not None:
        print("        HTTP %s: %s" % (resp.status_code, resp.text[:600]))
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--region", default="singapore")
    ap.add_argument("--no-wait", action="store_true")
    args = ap.parse_args()

    token = os.environ.get("RENDER_API_KEY", "").strip()
    if not token:
        print("[ERROR] 未设置 RENDER_API_KEY")
        print("        到 https://dashboard.render.com/account/api-keys 创建后：")
        print('        $env:RENDER_API_KEY = "rnd_xxx"; python deploy_render.py')
        sys.exit(1)

    if not DEFAULT_DATABASE_URL:
        print("[ERROR] 未设置 DATABASE_URL（Supabase 连接串）")
        sys.exit(1)

    owner_id = get_owner_id(token)
    svc = create_service(token, owner_id, args.region)

    if args.no_wait:
        print("[OK] 已触发创建，不等待构建。")
        return

    url = wait_live(token, svc.get("id"))
    if url:
        print("\n=== 完成 ===")
        print("站点: https://%s.onrender.com" % SERVICE_NAME)
        print("健康检查: %s" % url)


if __name__ == "__main__":
    main()
