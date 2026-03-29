from flask import Blueprint, request, jsonify, current_app
from models import db, Product, Category, Supplier, Sale, SaleItem, Purchase, PurchaseItem, StockAlert, User, ActivityLog
import jwt
from functools import wraps
import datetime

api = Blueprint('api', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin privileges required!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@api.route('/auth/signup', methods=['POST'])
def signup():
    data = request.json
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    new_user = User(
        name=data.get('name'),
        email=data.get('email'),
        role=data.get('role', 'staff')
    )
    new_user.set_password(data.get('password'))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201

@api.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Could not verify'}), 401
        
    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not user.check_password(data.get('password')):
        return jsonify({'message': 'Invalid credentials'}), 401
        
    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    })

@api.route('/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'user': {
            'id': current_user.id,
            'name': current_user.name,
            'email': current_user.email,
            'role': current_user.role
        }
    })

@api.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    total_products = Product.query.count()
    
    # Check low stock alerts
    low_stock_products = StockAlert.query.filter_by(alert_status=True).count()
    if low_stock_products == 0:
        # Fallback if alerts table isn't fully populated yet: just check quantity < 10
        low_stock_products = Product.query.filter(Product.quantity < 10).count()
        
    recent_sales = Sale.query.order_by(Sale.date.desc()).limit(5).count()
    
    return jsonify({
        'totalProducts': total_products,
        'lowStockAlerts': low_stock_products,
        'recentSales': recent_sales
    })

@api.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    categories = Category.query.all()
    return jsonify([{'id': c.id, 'name': c.name} for c in categories])

@api.route('/suppliers', methods=['GET'])
@token_required
def get_suppliers(current_user):
    suppliers = Supplier.query.all()
    return jsonify([{'id': s.id, 'name': s.name, 'contact': s.contact, 'email': s.email, 'address': s.address} for s in suppliers])

@api.route('/products', methods=['GET'])
@token_required
def get_products(current_user):
    products = Product.query.all()
    result = []
    for p in products:
        result.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'category_id': p.category_id,
            'category_name': p.category.name if p.category else None,
            'price': float(p.price) if p.price else 0.0,
            'quantity': p.quantity,
            'supplier_id': p.supplier_id,
            'supplier_name': p.supplier.name if p.supplier else None,
            'created_at': p.created_at
        })
    return jsonify(result)

@api.route('/products', methods=['POST'])
@token_required
@admin_required
def add_product(current_user):
    data = request.json
    try:
        new_product = Product(
            name=data['name'],
            description=data.get('description', ''),
            price=data['price'],
            quantity=data.get('quantity', 0),
            category_id=data.get('category_id'),
            supplier_id=data.get('supplier_id')
        )
        db.session.add(new_product)
        db.session.commit()
        return jsonify({'message': 'Product added successfully', 'id': new_product.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/products/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_product(current_user, id):
    product = Product.query.get_or_404(id)
    data = request.json
    try:
        product.name = data.get('name', product.name)
        product.description = data.get('description', product.description)
        product.price = data.get('price', product.price)
        product.quantity = data.get('quantity', product.quantity)
        
        if 'category_id' in data:
           product.category_id = data.get('category_id')
        if 'supplier_id' in data:
           product.supplier_id = data.get('supplier_id')

        db.session.commit()
        return jsonify({'message': 'Product updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/products/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_product(current_user, id):
    product = Product.query.get_or_404(id)
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Product deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/sales', methods=['POST'])
@token_required
@admin_required
def create_sale(current_user):
    data = request.json
    items = data.get('items', [])
    if not items:
        return jsonify({'message': 'No items in sale'}), 400
        
    total_amount = 0
    try:
        sale = Sale(user_id=current_user.id, total_amount=0)
        db.session.add(sale)
        db.session.flush() # get sale.id
        
        for item in items:
            product = Product.query.get(item['product_id'])
            if not product:
                raise ValueError(f"Product ID {item['product_id']} not found")
            if product.quantity < item['quantity']:
                raise ValueError(f"Not enough stock for {product.name}")
                
            product.quantity -= item['quantity']
            item_price = product.price
            total_amount += float(item_price) * int(item['quantity'])
            
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=item['quantity'],
                price=item_price
            )
            db.session.add(sale_item)
            
        sale.total_amount = total_amount
        db.session.commit()

        # Generate a simple bill data dict
        bill_data = {
            'sale_id': sale.id,
            'total_amount': total_amount,
            'date': sale.date.strftime('%Y-%m-%d %H:%M:%S'),
            'cashier': current_user.name,
            'items': items
        }
        return jsonify({'message': 'Sale completed successfully', 'bill': bill_data}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@api.route('/sales-trend', methods=['GET'])
@token_required
def get_sales_trend(current_user):
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    sales = Sale.query.filter(Sale.date >= thirty_days_ago).all()
    
    trend = {}
    for s in sales:
        date_str = s.date.strftime('%Y-%m-%d')
        if date_str not in trend:
            trend[date_str] = 0
        trend[date_str] += float(s.total_amount)
        
    result = [{'name': k, 'sales': v} for k, v in sorted(trend.items())]
    return jsonify(result)

@api.route('/sales', methods=['GET'])
@token_required
def get_sales(current_user):
    sales = Sale.query.order_by(Sale.date.desc()).limit(100).all()
    result = []
    for s in sales:
        items = []
        for i in s.items:
            items.append({
                'product_name': i.product.name if i.product else 'Unknown',
                'quantity': i.quantity,
                'price': float(i.price)
            })
        result.append({
            'id': s.id,
            'cashier': s.user.name if s.user else 'Unknown',
            'total_amount': float(s.total_amount),
            'date': s.date.strftime('%Y-%m-%d %H:%M:%S'),
            'items': items
        })
    return jsonify(result)

@api.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    users = User.query.all()
    return jsonify([{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role, 'created_at': u.created_at} for u in users])

@api.route('/purchases', methods=['GET'])
@token_required
def get_purchases(current_user):
    purchases = Purchase.query.order_by(Purchase.date.desc()).limit(100).all()
    result = []
    for p in purchases:
        items = []
        for i in p.items:
            items.append({
                'product_name': i.product.name if i.product else 'Unknown',
                'quantity': i.quantity,
                'cost_price': float(i.cost_price)
            })
        result.append({
            'id': p.id,
            'supplier_name': p.supplier.name if p.supplier else 'Unknown',
            'total_cost': float(p.total_cost),
            'date': p.date.strftime('%Y-%m-%d %H:%M:%S'),
            'items': items
        })
    return jsonify(result)

@api.route('/stock-alerts', methods=['GET'])
@token_required
def get_stock_alerts(current_user):
    # Retrieve directly directly checking products
    low_stock = Product.query.filter(Product.quantity < 10).all()
    result = [{'product_id': p.id, 'product_name': p.name, 'quantity': p.quantity, 'threshold': 10} for p in low_stock]
    return jsonify(result)

@api.route('/activity-logs', methods=['GET'])
@token_required
@admin_required
def get_activity_logs(current_user):
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(200).all()
    return jsonify([{'id': l.id, 'user_name': l.user.name if l.user else 'System', 'action': l.action, 'timestamp': l.timestamp} for l in logs])

@api.route('/categories', methods=['POST'])
@token_required
@admin_required
def add_category(current_user):
    data = request.get_json()
    new_cat = Category(name=data['name'])
    db.session.add(new_cat)
    db.session.commit()
    return jsonify({'message': 'Category added successfully'}), 201

@api.route('/suppliers', methods=['POST'])
@token_required
@admin_required
def add_supplier(current_user):
    data = request.get_json()
    new_sup = Supplier(name=data['name'], contact=data.get('contact'), email=data.get('email'), address=data.get('address'))
    db.session.add(new_sup)
    db.session.commit()
    return jsonify({'message': 'Supplier added successfully'}), 201

@api.route('/users', methods=['POST'])
@token_required
@admin_required
def add_user(current_user):
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists!'}), 400
    new_user = User(name=data['name'], email=data['email'], role=data.get('role', 'staff'))
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User added successfully'}), 201
