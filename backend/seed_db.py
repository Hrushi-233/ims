from app import create_app
from models import db, User, Category, Supplier, Product, Sale, SaleItem, StockAlert, ActivityLog
from datetime import datetime, timedelta
import random

app = create_app()

with app.app_context():
    print("Dropping all existing tables...")
    db.drop_all()
    print("Creating fresh tables...")
    db.create_all()
    print("Seeding database with rich input data...")
    
    # Create Users
    admin = User(name='Admin User', email='admin@example.com', role='admin')
    admin.set_password('password123')
    
    staff = User(name='Staff Member', email='staff@example.com', role='staff')
    staff.set_password('password123')
    
    db.session.add(admin)
    db.session.add(staff)
    db.session.commit()
    
    # Create Categories
    c1 = Category(name='Electronics')
    c2 = Category(name='Furniture')
    c3 = Category(name='Office Supplies')
    c4 = Category(name='Clothing')
    db.session.add_all([c1, c2, c3, c4])
    db.session.commit()
    
    # Create Suppliers
    s1 = Supplier(name='TechCorp Logistics', contact='123-456-7890', email='sales@techcorp.com', address='123 Tech Lane, Silicon Valley')
    s2 = Supplier(name='WoodWorks Home', contact='098-765-4321', email='wood@works.com', address='456 Forest Rd, Portland')
    s3 = Supplier(name='OfficePlus Direct', contact='555-666-7777', email='contact@officeplus.com', address='789 Business Blvd, Seattle')
    db.session.add_all([s1, s2, s3])
    db.session.commit()
    
    # Create Products
    p1 = Product(name='Laptop Pro X', description='High performance developer laptop.', category_id=c1.id, price=1200.00, quantity=15, supplier_id=s1.id)
    p2 = Product(name='Wireless OLED Mouse', description='Ergonomic wireless mouse.', category_id=c1.id, price=45.50, quantity=50, supplier_id=s1.id)
    p3 = Product(name='Mechanical Keyboard', description='RGB mechanical keyboard.', category_id=c1.id, price=125.00, quantity=8, supplier_id=s1.id) # Low stock
    p4 = Product(name='Ergonomic Mesh Chair', description='Comfortable office chair with lumbar support.', category_id=c2.id, price=250.00, quantity=20, supplier_id=s2.id)
    p5 = Product(name='Bamboo Standing Desk', description='Adjustable height bamboo desk.', category_id=c2.id, price=450.00, quantity=5, supplier_id=s2.id) # Low stock
    p6 = Product(name='Notebook 5-pack', description='College ruled premium notebooks.', category_id=c3.id, price=15.00, quantity=100, supplier_id=s3.id)
    p7 = Product(name='Gel Pens (12-pack)', description='Smooth writing gel pens.', category_id=c3.id, price=12.00, quantity=200, supplier_id=s3.id)
    p8 = Product(name='Bluetooth Headphones', description='Noise-cancelling headphones.', category_id=c1.id, price=199.99, quantity=12, supplier_id=s1.id)
    
    db.session.add_all([p1, p2, p3, p4, p5, p6, p7, p8])
    db.session.commit()
    
    # Generate past 30 days of sales
    print("Generating 30 days of synthetic sales history...")
    for day in range(30):
        sale_date = datetime.utcnow() - timedelta(days=30 - day)
        # Random 0-3 sales per day
        for _ in range(random.randint(0, 3)):
            sale_user = random.choice([admin, staff])
            product_choices = [p1, p2, p3, p4, p6, p7, p8]
            num_items = random.randint(1, 3)
            
            total_sale_amount = 0
            sale = Sale(user_id=sale_user.id, total_amount=0, date=sale_date)
            db.session.add(sale)
            db.session.flush() # get sale id
            
            # Select random products
            selected_products = random.sample(product_choices, num_items)
            
            for prod in selected_products:
                qty = random.randint(1, 2)
                item_price = prod.price
                total_sale_amount += float(item_price) * qty
                si = SaleItem(sale_id=sale.id, product_id=prod.id, quantity=qty, price=item_price)
                db.session.add(si)
            
            sale.total_amount = total_sale_amount
            
    # Activity Logs
    log1 = ActivityLog(user_id=admin.id, action='System Initialized and Seeded', timestamp=datetime.utcnow() - timedelta(days=30))
    log2 = ActivityLog(user_id=admin.id, action='Created initial product catalog', timestamp=datetime.utcnow() - timedelta(days=30))
    db.session.add_all([log1, log2])
    
    db.session.commit()
    print("Successfully populated the database with rich input data!")
