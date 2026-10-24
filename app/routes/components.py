"""
建筑构件知识库路由
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Component, User

components_bp = Blueprint('components', __name__)


@components_bp.route('', methods=['GET'])
def get_components():
    """获取构件列表"""
    category = request.args.get('category')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # 构建查询
    query = Component.query.filter_by(is_active=True)
    
    # 按分类筛选
    if category:
        query = query.filter_by(category=category)
    
    # 按顺序排序
    query = query.order_by(Component.order_index.asc(), Component.created_at.asc())
    
    # 分页
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # 获取所有分类
    categories = db.session.query(Component.category).distinct().all()
    
    return jsonify({
        'success': True,
        'data': {
            'components': [c.to_dict() for c in pagination.items],
            'categories': [c[0] for c in categories],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'has_next': pagination.has_next
            }
        }
    })


@components_bp.route('/categories', methods=['GET'])
def get_categories():
    """获取所有分类"""
    categories = db.session.query(
        Component.category,
        db.func.count(Component.id).label('count')
    ).filter_by(is_active=True).group_by(Component.category).all()
    
    return jsonify({
        'success': True,
        'data': {
            'categories': [
                {'name': c[0], 'count': c[1]} for c in categories
            ]
        }
    })


@components_bp.route('/<int:component_id>', methods=['GET'])
def get_component(component_id):
    """获取单个构件详情"""
    component = Component.query.filter_by(id=component_id, is_active=True).first()
    
    if not component:
        return jsonify({'success': False, 'message': '构件不存在'}), 404
    
    return jsonify({
        'success': True,
        'data': component.to_dict()
    })


@components_bp.route('/by-name/<string:name>', methods=['GET'])
def get_component_by_name(name):
    """根据名称获取构件"""
    component = Component.query.filter(
        Component.name == name,
        Component.is_active == True
    ).first()
    
    if not component:
        return jsonify({'success': False, 'message': '构件不存在'}), 404
    
    return jsonify({
        'success': True,
        'data': component.to_dict()
    })


@components_bp.route('/search', methods=['GET'])
def search_components():
    """搜索构件"""
    keyword = request.args.get('q', '').strip()
    
    if not keyword:
        return jsonify({'success': False, 'message': '搜索关键词不能为空'}), 400
    
    # 搜索名称和描述
    components = Component.query.filter(
        Component.is_active == True,
        db.or_(
            Component.name.contains(keyword),
            Component.description.contains(keyword),
            Component.category.contains(keyword)
        )
    ).order_by(Component.order_index.asc()).all()
    
    return jsonify({
        'success': True,
        'data': {
            'keyword': keyword,
            'results': [c.to_dict() for c in components],
            'count': len(components)
        }
    })


# ==================== 管理员接口 ====================

@components_bp.route('', methods=['POST'])
@jwt_required()
def create_component():
    """创建新构件（管理员）"""
    user_id = int(get_jwt_identity())  # 转换为整数
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': '无权访问'}), 403
    
    data = request.get_json()
    
    # 验证必填字段
    if not data or not data.get('name') or not data.get('category'):
        return jsonify({'success': False, 'message': '名称和分类不能为空'}), 400
    
    # 检查名称是否已存在
    existing = Component.query.filter_by(name=data['name']).first()
    if existing:
        return jsonify({'success': False, 'message': '构件名称已存在'}), 409
    
    # 创建构件
    component = Component(
        name=data['name'].strip(),
        category=data['category'].strip(),
        description=data.get('description', ''),
        short_desc=data.get('short_desc', ''),
        image_url=data.get('image_url'),
        model_file=data.get('model_file'),
        order_index=data.get('order_index', 0)
    )
    
    db.session.add(component)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '创建成功',
        'data': component.to_dict()
    }), 201


@components_bp.route('/<int:component_id>', methods=['PUT'])
@jwt_required()
def update_component(component_id):
    """更新构件信息（管理员）"""
    user_id = int(get_jwt_identity())  # 转换为整数
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': '无权访问'}), 403
    
    component = Component.query.get(component_id)
    if not component:
        return jsonify({'success': False, 'message': '构件不存在'}), 404
    
    data = request.get_json()
    
    # 更新字段
    if 'name' in data:
        component.name = data['name'].strip()
    if 'category' in data:
        component.category = data['category'].strip()
    if 'description' in data:
        component.description = data['description']
    if 'short_desc' in data:
        component.short_desc = data['short_desc']
    if 'image_url' in data:
        component.image_url = data['image_url']
    if 'model_file' in data:
        component.model_file = data['model_file']
    if 'order_index' in data:
        component.order_index = data['order_index']
    if 'is_active' in data:
        component.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '更新成功',
        'data': component.to_dict()
    })


@components_bp.route('/<int:component_id>', methods=['DELETE'])
@jwt_required()
def delete_component(component_id):
    """删除构件（管理员）"""
    user_id = int(get_jwt_identity())  # 转换为整数
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': '无权访问'}), 403
    
    component = Component.query.get(component_id)
    if not component:
        return jsonify({'success': False, 'message': '构件不存在'}), 404
    
    # 软删除
    component.is_active = False
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '删除成功'
    })


@components_bp.route('/init', methods=['POST'])
def init_components():
    """初始化构件数据"""
    # 检查是否已有数据
    if Component.query.count() > 0:
        return jsonify({'success': False, 'message': '构件数据已存在'}), 409
    
    # 初始化数据（从您的前端代码中提取）
    components_data = [
        # 立柱类
        {'name': '中柱（前）', 'category': '立柱', 'model_file': 'zhongzhu_qian.glb', 
         'description': '位于建筑前侧中央的核心承重柱，承受主要的垂直荷载，是穿斗式建筑的中心支撑构件。'},
        {'name': '中柱（后）', 'category': '立柱', 'model_file': 'zhongzhu_hou.glb',
         'description': '位于建筑后侧中央的承重柱，与前中柱对称布置，共同承担房屋中部的荷载传递。'},
        {'name': '右柱（前）', 'category': '立柱', 'model_file': 'youzhu_qian.glb',
         'description': '位于建筑前侧右侧的承重柱，与中柱共同构成前部承重框架。'},
        {'name': '右柱（后）', 'category': '立柱', 'model_file': 'youzhu_hou.glb',
         'description': '位于建筑后侧右侧的承重柱，支撑后部结构，确保整体稳定性。'},
        {'name': '左柱（前）', 'category': '立柱', 'model_file': 'zuozhu_qian.glb',
         'description': '位于建筑前侧左侧的承重柱，与前右柱对称，形成前部两侧支撑。'},
        {'name': '左柱（后）', 'category': '立柱', 'model_file': 'zuozhu_hou.glb',
         'description': '位于建筑后侧左侧的承重柱，与后右柱共同支撑后部结构。'},
        
        # 穿枋类
        {'name': '穿枋（前上）', 'category': '穿枋', 'model_file': 'chuanfang_shang_qian.glb',
         'description': '位于建筑前侧上部的水平连接构件，横向穿过柱子，增强建筑的横向刚度，防止柱子外倾。'},
        {'name': '穿枋（前下）', 'category': '穿枋', 'model_file': 'chuanfang_xia_qian.glb',
         'description': '位于建筑前侧下部的水平连接构件，与上穿枋对应布置，形成上下拉结的稳定结构。'},
        {'name': '穿枋（后上）', 'category': '穿枋', 'model_file': 'chuanfang_shang_hou.glb',
         'description': '位于建筑后侧上部的水平连接构件，与前侧上穿枋共同作用，确保房屋前后方向的稳定性。'},
        {'name': '穿枋（后下）', 'category': '穿枋', 'model_file': 'chuanfang_xia_hou.glb',
         'description': '位于建筑后侧下部的水平连接构件，与前侧下穿枋对应，形成完整的穿枋体系。'},
        
        # 金枋类
        {'name': '金枋（右）', 'category': '金枋', 'model_file': 'jinfang_you.glb',
         'description': '位于建筑右侧的金枋，连接前后柱子，起到加固侧墙和传递荷载的作用。'},
        {'name': '金枋（左）', 'category': '金枋', 'model_file': 'jinfang_zuo.glb',
         'description': '位于建筑左侧的金枋，与右侧金枋对称布置，增强建筑的侧向稳定性。'},
        
        # 檩条类
        {'name': '金檩（上右）', 'category': '脊檩', 'model_file': 'jinlin_shang_you.glb',
         'description': '位于屋顶上部的右侧脊檩，是屋顶最高点的承重构件，承受屋面瓦片的全部重量。'},
        {'name': '金檩（上左）', 'category': '脊檩', 'model_file': 'jinlin_shang_zuo.glb',
         'description': '位于屋顶上部的左侧脊檩，与右侧脊檩构成屋顶的主骨架。'},
        {'name': '檐檩（右）', 'category': '檐檩', 'model_file': 'yanlin_you.glb',
         'description': '位于房屋右侧檐口处的檩条，承接檐部椽子传来的荷载，是房屋出檐结构的重要支撑。'},
        {'name': '檐檩（左）', 'category': '檐檩', 'model_file': 'yanlin_zuo.glb',
         'description': '位于房屋左侧檐口处的檩条，与右侧檐檩对称布置，形成房屋出檐的支撑体系。'},
        {'name': '脊檩', 'category': '脊檩', 'model_file': 'jiling.glb',
         'description': '位于屋顶最高处的横向构件，是整个屋顶结构的顶点，承受屋脊的荷载并起到固定屋顶的作用。'},
        
        # 瓜柱类
        {'name': '瓜柱（前右）', 'category': '瓜柱', 'model_file': 'youguazhu_you_qian.glb',
         'description': '位于前侧右侧的短柱（瓜柱），架设在穿枋之上，用于支撑上部的檩条和屋顶。'},
        {'name': '瓜柱（后右）', 'category': '瓜柱', 'model_file': 'youguazhu_you_hou.glb',
         'description': '位于后侧右侧的短柱，与前侧瓜柱对应，支撑后部檩条。'},
        {'name': '瓜柱（前左）', 'category': '瓜柱', 'model_file': 'zuoguazhu_zuo_qian.glb',
         'description': '位于前侧左侧的短柱，缩短了柱子与柱子之间的距离，增加了建筑的稳定性。'},
        {'name': '瓜柱（后左）', 'category': '瓜柱', 'model_file': 'zuoguazhu_zuo_hou.glb',
         'description': '位于后侧左侧的短柱，是穿斗式建筑后部的重要支撑构件。'},
        
        # 屋顶
        {'name': '屋顶', 'category': '屋顶', 'model_file': 'wuding.glb',
         'description': '古建筑屋顶，覆盖整个建筑，最具中国传统建筑特色。屋顶形式多为悬山顶或硬山顶，具有良好的防水、保温和装饰功能。'},
        
        # 装饰
        {'name': '装饰构件', 'category': '装饰', 'model_file': 'zhuangshi.glb',
         'description': '中国传统建筑中的装饰构件，具有丰富的雕刻和造型，体现了中国古代建筑的工艺水平和审美价值。'},
    ]
    
    for i, data in enumerate(components_data):
        component = Component(
            name=data['name'],
            category=data['category'],
            description=data['description'],
            model_file=data['model_file'],
            order_index=i
        )
        db.session.add(component)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'成功初始化 {len(components_data)} 个构件数据'
    })
