from app import app, db,socketio
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from flask import jsonify, request
from datetime import datetime
from flask_socketio import SocketIO
from app.models.EWayBillReportModels import EWayBillPortal
import os
from flask_mail import Mail, Message

API_URL = os.getenv('API_URL')

# Initialize Mail object
mail = Mail(app)

# Purchase Bill Report Data
@app.route(API_URL+'/send-pdf-email', methods=['POST'])
def send_pdf_email():
    try:
        email = request.form.get('email')
        pdf_file = request.files.get('pdf')

        if not email or not pdf_file:
            return jsonify({'error': 'Email and PDF file are required'}), 400

        msg = Message('Pending Report', recipients=[email])
        msg.body = 'Please find attached the PDF report.'

        msg.attach(pdf_file.filename, 'application/pdf', pdf_file.read())

        mail.send(msg)

        return jsonify({'message': 'Email sent successfully'}), 200
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({'error': 'Failed to send email'}), 500