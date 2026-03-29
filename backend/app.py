from flask import Flask
from config import Config
from models import db
from routes import api
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for the React frontend
    CORS(app)
    
    db.init_app(app)
    
    app.register_blueprint(api, url_prefix='/api')
    
    with app.app_context():
        # Will automatically create tables based on models.py
        # It won't overwrite existing ones
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5001)
