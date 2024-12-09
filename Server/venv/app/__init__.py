# app.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set the database URI using environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pymssql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure email settings
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME') 
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD') 
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER') 

db = SQLAlchemy(app)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

#All Routes
from app.Controllers.EWayBillReport.EWayBillReportController import *

#Login Routes
from app.Controllers.Login.LoginController import *

#Email Routes
from app.Controllers.EmailIntegration.EmailInterationController import *

# Initialize JWTManager with your app 
app.config['JWT_SECRET_KEY'] = 'ABCEFGHIJKLMNOPQRSTUVWXYZ'
jwt = JWTManager(app)

if __name__ == '__main__':
    socketio.run(app, host='localhost', port=8080, debug=True)
