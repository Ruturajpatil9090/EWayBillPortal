from app import db

class EWayBillPortal(db.Model):
    __tablename__ = 'EWayBillPortalDetails'  

    id = db.Column(db.Integer,primary_key=True,autoincrement=True,nullable=False)    
    supplyType = db.Column(db.String(50), nullable=False) 
    ewbNo = db.Column(db.Integer, primary_key=True)       
    ewayBillDate = db.Column(db.Date, nullable=False)    
    docNo = db.Column(db.String(50), nullable=False)     
    docDate = db.Column(db.Date, nullable=False)       
    fromPlace = db.Column(db.String(250), nullable=False)  
    fromStateCode = db.Column(db.Integer, nullable=False)    
    fromAddr1 = db.Column(db.String(250), nullable=False)  
    fromAddr2 = db.Column(db.String(250), nullable=False)  
    fromGstin = db.Column(db.Integer, nullable=False)  
    toAddr1 = db.Column(db.String(250), nullable=False)  
    toAddr2 = db.Column(db.String(250), nullable=False)   
    toPlace = db.Column(db.String(250), nullable=False)    
    toStateCode = db.Column(db.Integer, nullable=False)   
    toGstin = db.Column(db.String(250), nullable=False)  
    vehicleNo = db.Column(db.String(250), nullable=False)  
    taxableAmount = db.Column(db.Numeric(18, 2), nullable=False)  
    cgstValue = db.Column(db.Numeric(18, 2), nullable=False)     
    sgstValue = db.Column(db.Numeric(18, 2), nullable=False)   
    igstValue = db.Column(db.Numeric(18, 2), nullable=False)     
    hsnCode = db.Column(db.Integer, nullable=False)            
    productId = db.Column(db.Integer, nullable=False)         
    productName = db.Column(db.String(250), nullable=False)     
    transporterId = db.Column(db.String(250), nullable=False)   
    actualDist = db.Column(db.Integer, nullable=False)         
    quantity = db.Column(db.Numeric(18, 2), nullable=False)     

