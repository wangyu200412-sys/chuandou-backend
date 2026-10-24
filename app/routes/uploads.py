"""
上传文件访问路由

说明：
- Render 免费实例的文件系统是临时存储，重启或重新部署后上传文件会丢失。
- 这里提供 /uploads/<filename> 访问能力，保证演示期间图片可正常显示。
- 若设置 UPLOAD_STORAGE=disabled，则创建帖子时不再保存本地文件。
"""
import os

from flask import Blueprint, current_app, send_from_directory
from werkzeug.exceptions import NotFound

uploads_bp = Blueprint('uploads', __name__)


@uploads_bp.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_file(filename):
    """提供上传文件的访问"""
    upload_folder = current_app.config.get('UPLOAD_FOLDER')

    # 防止路径穿越
    safe_name = os.path.basename(filename)
    file_path = os.path.join(upload_folder, safe_name)
    if not os.path.isfile(file_path):
        raise NotFound()

    return send_from_directory(upload_folder, safe_name)
