import os
import requests
from flask import current_app
from urllib.parse import quote


def get_baidu_access_token():
    """向百度申请临时通行证 (Access Token)"""
    api_key = os.getenv("AI_API_KEY")
    secret_key = os.getenv("AI_SECRET_KEY")

    url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={api_key}&client_secret={secret_key}"
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    response = requests.post(url, headers=headers)
    return response.json().get("access_token")

def check_content_safety(text_content):
    """
    对外统一入口：未开启 AI_CONTENT_CHECK 时直接放行，避免无凭据时误拦截。
    """
    try:
        enabled = current_app.config.get('AI_CONTENT_CHECK', False)
    except Exception:
        enabled = os.getenv('AI_CONTENT_CHECK', '').strip().lower() in ('1', 'true', 'yes', 'on')

    if not enabled:
        return "Pass"

    return _check_content_safety(text_content)


def _check_content_safety(text_content):
    """
    调用百度文本审核 API 
    返回: 'Pass' (通过), 'Review' (嫌疑/人工复核), 'Block' (违规)
    """
    print(f"🔍 正在召唤百度 AI 审核内容: {text_content[:10]}...")
    
    token = get_baidu_access_token()
    if not token:
        print("❌ 获取 Token 失败，请检查 .env 里的 KEY 是否正确！")
        return "Review" 

    url = f"https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token={token}"
    payload = f'text={quote(text_content)}'
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    try:
        response = requests.post(url, headers=headers, data=payload.encode('utf-8'))
        result = response.json()
        conclusion = result.get("conclusionType")
        print(f"🤖 百度 AI 审核结果: {result.get('conclusion')} (代码: {conclusion})")
        
        if conclusion == 1:
            return "Pass"
        elif conclusion == 2:
            return "Block"
        else:
            return "Review"
            
    except Exception as e:
        print(f"❌ 调用百度接口报错: {e}")
        return "Review"