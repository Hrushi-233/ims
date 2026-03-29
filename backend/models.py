from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(255))
    role = db.Column(db.String(20), default='staff')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password_text):
        self.password = generate_password_hash(password_text)

    def check_password(self, password_text):
        return check_password_hash(self.password, password_text)

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100))

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100))
    contact = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100))
    description = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    price = db.Column(db.Numeric(10, 2))
    quantity = db.Column(db.Integer)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    category = db.relationship('Category', backref='products')
    supplier = db.relationship('Supplier', backref='products')

class Sale(db.Model):
    __tablename__ = 'sales'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    total_amount = db.Column(db.Numeric(10, 2))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='sales')

class SaleItem(db.Model):
    __tablename__ = 'sales_items'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    quantity = db.Column(db.Integer)
    price = db.Column(db.Numeric(10, 2))
    
    sale = db.relationship('Sale', backref='items')
    product = db.relationship('Product')

class Purchase(db.Model):
    __tablename__ = 'purchases'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    total_cost = db.Column(db.Numeric(10, 2))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    supplier = db.relationship('Supplier', backref='purchases')

class PurchaseItem(db.Model):
    __tablename__ = 'purchase_items'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    purchase_id = db.Column(db.Integer, db.ForeignKey('purchases.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    quantity = db.Column(db.Integer)
    cost_price = db.Column(db.Numeric(10, 2))
    
    purchase = db.relationship('Purchase', backref='items')
    product = db.relationship('Product')

class StockAlert(db.Model):
    __tablename__ = 'stock_alerts'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    threshold = db.Column(db.Integer)
    alert_status = db.Column(db.Boolean)
    
    product = db.relationship('Product', backref='alerts')

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='activity_logs')
