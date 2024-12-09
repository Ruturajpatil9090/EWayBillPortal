from app import app, db,socketio
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from flask import jsonify, request
from datetime import datetime
from flask_socketio import SocketIO
from app.models.EWayBillReportModels import EWayBillPortal
import os
import requests
import uuid

API_URL = os.getenv('API_URL')

# Function to generate a random request ID.
def generate_request_id():
    return str(uuid.uuid4())

#Format Dated
def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
        "EWayBillDate": task.EWayBillDate.strftime('%Y-%m-%d') if task.EWayBillDate else None,
    }

# Purchase Bill Report Data
@app.route(API_URL + '/purchasebill-reportdata', methods=['GET'])
def purchasebill_reportdata():
    try:
        doc_date = request.args.get('doc_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        # Validate required parameters
        if not doc_date:
            return jsonify({'error': 'doc_date is required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT 
                    ROW_NUMBER() OVER(ORDER BY doc_date, doc_no) AS SR_No, 
                    'PS' + CONVERT(NVARCHAR, doc_no) AS OurNo, 
                    Bill_No AS MillInvoiceNo, 
                    EWay_Bill_No AS MillEwayBill_NO, 
                    suppliergstno AS FromGSTNo, 
                    Ac_Code AS Party_Code, 
                    suppliername AS Party_Name, 
                    GSTStateCode AS FromStateCode, 
                    CONVERT(VARCHAR(10), doc_date, 103) AS Date, 
                    LORRYNO AS Vehicle_No, 
                    SUM(ISNULL(Quantal, 0)) AS Quintal, 
                    rate AS Rate, 
                    subTotal AS TaxableAmount, 
                    CGSTAmount AS CGST, 
                    SGSTAmount AS SGST, 
                    IGSTAmount AS IGST, 
                    Bill_Amount AS Payable_Amount, 
                    PURCNO AS DO, 
                    millshortname
                FROM dbo.qrypurchaseheaddetail
                WHERE 
                    doc_date = :doc_date
                    AND Company_Code = :Company_Code
                    AND Year_Code = :Year_Code
                GROUP BY 
                    doc_no, Bill_No, Ac_Code, suppliername, suppliergstno, GSTStateCode, 
                    doc_date, LORRYNO, rate, subTotal, CGSTAmount, SGSTAmount, IGSTAmount, 
                    Bill_Amount, PURCNO, EWay_Bill_No, millshortname
                ORDER BY doc_date, doc_no
            '''), {
                'doc_date': doc_date,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
            })

            # Fetch all results and map to dictionaries
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

#Create a EWay Bills
@app.route(API_URL + '/create-eway-bill', methods=['POST'])
def create_eway_bill():
    try:
        data = request.get_json()

        if isinstance(data, list):
            new_eway_bills = []
            
            for bill_data in data:
                new_eway_bill = EWayBillPortal(**bill_data)
                new_eway_bills.append(new_eway_bill)

            db.session.add_all(new_eway_bills)
            db.session.commit()
            socketio.emit('createdata',data)

            return jsonify({"message": "E-Way Bills created successfully!"}), 201
        else:
            return jsonify({"error": "Expected an array of E-Way Bills"}), 400

    except KeyError as e:
        db.session.rollback()
        return jsonify({"error": f"Missing key: {str(e)}"}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

#GET All record from the database according to the that particular date.
@app.route(API_URL + '/get-eway-bills', methods=['GET'])
def get_all_eway_bills():
    try:
        eway_bill_date_str = request.args.get('ewayBillDate', None)

        if eway_bill_date_str:
            try:
                filter_date = datetime.strptime(eway_bill_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD."}), 400
            
            eway_bills = EWayBillPortal.query.filter_by(ewayBillDate=filter_date).all()
        else:
            eway_bills = EWayBillPortal.query.all()

        records = []
        for bill in eway_bills:
            bill_dict = bill.__dict__
            
            bill_dict.pop('_sa_instance_state', None)

            if 'ewayBillDate' in bill_dict and bill_dict['ewayBillDate']:
                bill_dict['ewayBillDate'] = bill_dict['ewayBillDate'].strftime('%Y-%m-%d')
            if 'docDate' in bill_dict and bill_dict['docDate']:
                bill_dict['docDate'] = bill_dict['docDate'].strftime('%Y-%m-%d')

            records.append(bill_dict)

        return jsonify({"data": records, "message": "E-Way Bills fetched successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#Remove all eway bills that already present in the database API
@app.route(API_URL + '/check-remove-eway-bills', methods=['POST'])
def check_remove_eway_bills():
    try:
        data = request.get_json()

        if not isinstance(data, list):
            return jsonify({"error": "Expected an array of E-Way Bill Numbers"}), 400
        
        existing_eway_bills = EWayBillPortal.query.filter(EWayBillPortal.ewbNo.in_(data)).all()

        existing_eway_bill_nos = {bill.ewbNo for bill in existing_eway_bills}

        remaining_eway_bills = [bill_no for bill_no in data if bill_no not in existing_eway_bill_nos]

        return jsonify({"remainingEwayBillNos": remaining_eway_bills}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

#GET all Data from the database that purchase and eway bills vehicle number matches
@app.route(API_URL + '/getMatchingPurchaseewaybills', methods=['GET'])
def getMatchingPurchaseewaybills():
    try:
        doc_date = request.args.get('doc_date')
       
        # Validate required parameters
        if not doc_date:
            return jsonify({'error': 'doc_date is required'}), 400
     

        query = db.session.execute(text('''
SELECT        dbo.qrypurcdata.doc_no, dbo.qrypurcdata.doc_date, dbo.EWayBillPortalDetails.ewayBillDate AS EWayBillDate, dbo.qrypurcdata.NETQNTL, dbo.EWayBillPortalDetails.quantity AS EwayBillQuantity, dbo.qrypurcdata.vehno, 
                         dbo.nt_1_accountmaster.Gst_No, dbo.EWayBillPortalDetails.fromGstin AS EwayBillGSTN, nt_1_accountmaster_1.Pincode AS shiptopin, dbo.nt_1_accountmaster.Ac_Name_E AS purcname, 
                         nt_1_accountmaster_2.Short_Name AS millname, nt_1_accountmaster_1.Ac_Name_E AS billtoname, nt_1_accountmaster_1.Gst_No AS billtogst, dbo.nt_1_sugarsale.EWay_Bill_No AS saleewaybillno, 
                         dbo.nt_1_sugarsale.doc_no AS salebillno, dbo.nt_1_sugarsale.saleid, dbo.EWayBillPortalDetails.toGstin AS toGSTIN, ISNULL(dbo.qrypurcdata.NETQNTL, 0) - ISNULL(dbo.EWayBillPortalDetails.quantity, 0) AS qtyDiff, 
                         ISNULL(dbo.qrypurcdata.subTotal, 0) - ISNULL(dbo.EWayBillPortalDetails.taxableAmount, 0) AS taxableAmtDiff, 
                         CASE WHEN dbo.EWayBillPortalDetails.toGstin = nt_1_accountmaster_1.Pincode THEN 'YES' ELSE 'NO' END AS shipToDiff, dbo.qrypurcdata.purchaseid, dbo.qrypurcdata.subTotal, dbo.EWayBillPortalDetails.taxableAmount, 
                         dbo.nt_1_deliveryorder.doid AS doId
FROM            dbo.qrypurcdata INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.qrypurcdata.Ac_Code = dbo.nt_1_accountmaster.Ac_Code AND dbo.qrypurcdata.Company_Code = dbo.nt_1_accountmaster.company_code INNER JOIN
                         dbo.nt_1_sugarsale ON dbo.qrypurcdata.PURCNO = dbo.nt_1_sugarsale.DO_No AND dbo.qrypurcdata.Company_Code = dbo.nt_1_sugarsale.Company_Code INNER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_1 ON dbo.nt_1_sugarsale.Unit_Code = nt_1_accountmaster_1.Ac_Code AND dbo.nt_1_sugarsale.Company_Code = nt_1_accountmaster_1.company_code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_2 ON dbo.qrypurcdata.mill_code = nt_1_accountmaster_2.Ac_Code AND dbo.qrypurcdata.Company_Code = nt_1_accountmaster_2.company_code LEFT OUTER JOIN
                         dbo.EWayBillPortalDetails ON dbo.qrypurcdata.doc_date = dbo.EWayBillPortalDetails.ewayBillDate AND dbo.qrypurcdata.vehno = dbo.EWayBillPortalDetails.vehicleNo AND 
                         dbo.qrypurcdata.NETQNTL = dbo.EWayBillPortalDetails.quantity LEFT OUTER JOIN
                         dbo.nt_1_deliveryorder ON dbo.qrypurcdata.PURCNO = dbo.nt_1_deliveryorder.doc_no AND dbo.qrypurcdata.Company_Code = dbo.nt_1_deliveryorder.company_code AND 
                         dbo.qrypurcdata.Year_Code = dbo.nt_1_deliveryorder.Year_Code
            WHERE dbo.qrypurcdata.doc_date = :doc_date
            ORDER BY EwayBillGSTN DESC, salebillno
        '''), {'doc_date': doc_date})

        results = query.mappings().all()
        response_data = [dict(row) for row in results]

        return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Database error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

#GET max Doc_no in the sail ID
@app.route(API_URL + '/update-doc-no', methods=['POST'])
def update_doc_no():
    try:
        data = request.get_json()
        saleids = data.get('saleids')

        if not saleids or not isinstance(saleids, list):
            return jsonify({"error": "saleids should be an array of saleid values."}), 400

        for saleid in saleids:
            query = db.session.execute(text(''' 
                SELECT MAX(doc_no) AS max_doc_no 
                FROM dbo.nt_1_sugarsale 
            '''))

            result = query.fetchone()

            max_doc_no = result[0] if result and result[0] else 0 

            new_doc_no = max_doc_no + 1

            update_query = db.session.execute(text(''' 
                UPDATE dbo.nt_1_sugarsale 
                SET doc_no = :new_doc_no 
                WHERE saleid = :saleid
            '''), {'new_doc_no': new_doc_no, 'saleid': saleid})

        db.session.commit()
        socketio.emit('updatedocno')

        return jsonify({"message": f"Document numbers updated successfully for saleids {', '.join(map(str, saleids))}."}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
#EWayGenration 
@app.route(API_URL+"/get_eWayBill_generationData", methods=["GET"])
def get_eWayBill_generationData():
    try:
        saleId = request.args.get('saleId')
        companyCode = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')

        if not saleId or not companyCode or not yearCode:
            return jsonify({"error": "Missing 'saleId' or 'Company_Code' or 'Year_Code' Parameter"}), 400

        query = ('''SELECT        dbo.NT_1qryEInvoice.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoice.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoice.BuyerGst_No) AS BuyerGst_No, UPPER(dbo.NT_1qryEInvoice.Buyer_Name) 
                         AS Buyer_Name, UPPER(dbo.NT_1qryEInvoice.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoice.Buyer_City) AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) 
                         AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoice.Buyer_State_name) AS Buyer_State_name, dbo.NT_1qryEInvoice.Buyer_State_Code, dbo.NT_1qryEInvoice.Buyer_Phno, dbo.NT_1qryEInvoice.Buyer_Email_Id, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchGst_No) AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoice.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoice.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoice.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) AS Dispatch_Pincode, 
                         UPPER(dbo.NT_1qryEInvoice.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoice.ShipTo_Name) AS ShipTo_Name, UPPER(dbo.NT_1qryEInvoice.ShipTo_Address) AS ShipTo_Address, 
                         UPPER(dbo.NT_1qryEInvoice.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoice.ShipTo_GSTStateCode, (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, 
                         dbo.NT_1qryEInvoice.NETQNTL, dbo.NT_1qryEInvoice.rate, dbo.NT_1qryEInvoice.CGSTAmount, dbo.NT_1qryEInvoice.SGSTAmount, dbo.NT_1qryEInvoice.IGSTAmount, dbo.NT_1qryEInvoice.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoice.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoice.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoice.IGSTRate, 0) AS IGSTRate, dbo.NT_1qryEInvoice.Distance, 
                         dbo.NT_1qryEInvoice.LORRYNO, dbo.NT_1qryEInvoice.System_Name_E, dbo.NT_1qryEInvoice.HSN, dbo.NT_1qryEInvoice.GSTRate, dbo.NT_1qryEInvoice.LESS_FRT_RATE, dbo.nt_1_companyparameters.GSTStateCode, 
                         dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.PHONE, dbo.company.GST, dbo.eway_bill.Mode_of_Payment, 
                         dbo.eway_bill.Account_Details, dbo.tbluser.EmailId, dbo.eway_bill.Branch, dbo.NT_1qryEInvoice.saleId, dbo.NT_1qryEInvoice.IsService, dbo.NT_1qryEInvoice.Bill_Amount AS billAmount
FROM            dbo.tbluser INNER JOIN
                         dbo.nt_1_companyparameters ON dbo.tbluser.User_Name = dbo.nt_1_companyparameters.Created_By RIGHT OUTER JOIN
                         dbo.NT_1qryEInvoice INNER JOIN
                         dbo.company ON dbo.NT_1qryEInvoice.Company_Code = dbo.company.Company_Code INNER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoice.Company_Code = dbo.eway_bill.Company_Code ON dbo.nt_1_companyparameters.Company_Code = dbo.NT_1qryEInvoice.Company_Code AND 
                         dbo.nt_1_companyparameters.Year_Code = dbo.NT_1qryEInvoice.Year_Code
                 where dbo.NT_1qryEInvoice.Company_Code  = :companyCode and dbo.NT_1qryEInvoice.Year_Code = :yearCode and dbo.NT_1qryEInvoice.saleId = :saleId
                                 '''
            )
        additional_data = db.session.execute(text(query), {"companyCode": companyCode, "yearCode": yearCode, "saleId": saleId})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data and data['doc_date']:
                date_obj = datetime.strptime(data['doc_date'], "%d/%m/%Y")
                data['doc_date'] = date_obj.strftime("%Y-%m-%d")
            else:
                data['doc_date'] = None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

#Eway Bill Print
@app.route(API_URL + "/get_eWayBill_print", methods=["GET"])
def get_eWayBill_print():
    try:
        saleId = request.args.get('saleId')
       

        if not saleId :
            return jsonify({"error": "Missing 'saleId', parameter"}), 400

        corporate_sale_check_query = '''
            SELECT Carporate_Sale_No 
            FROM dbo.NT_1qryEInvoiceCarporateSale
            WHERE saleId = :saleId
        '''

        corporate_sale_check = db.session.execute(
            text(corporate_sale_check_query), 
            {"saleId": saleId}
        ).fetchone()

        if corporate_sale_check and 'Carporate_Sale_No' in corporate_sale_check and corporate_sale_check['Carporate_Sale_No'] != 0:
            query = '''
            SELECT        dbo.NT_1qryEInvoiceCarporateSale.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoiceCarporateSale.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoiceCarporateSale.BuyerGst_No) AS BuyerGst_No, 
                         UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_Name) AS Buyer_Name, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_City) 
                         AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_State_name) AS Buyer_State_name, 
                         dbo.NT_1qryEInvoiceCarporateSale.Buyer_State_Code, dbo.NT_1qryEInvoiceCarporateSale.Buyer_Phno, dbo.NT_1qryEInvoiceCarporateSale.Buyer_Email_Id, UPPER(dbo.NT_1qryEInvoiceCarporateSale.DispatchGst_No) 
                         AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoiceCarporateSale.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoiceCarporateSale.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) 
                         AS Dispatch_Pincode, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_Name) AS ShipTo_Name, 
                         UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_Address) AS ShipTo_Address, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoiceCarporateSale.ShipTo_GSTStateCode, 
                         (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, dbo.NT_1qryEInvoiceCarporateSale.NETQNTL, dbo.NT_1qryEInvoiceCarporateSale.rate, 
                         dbo.NT_1qryEInvoiceCarporateSale.CGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.SGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.IGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoiceCarporateSale.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoiceCarporateSale.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoiceCarporateSale.IGSTRate, 0) AS IGSTRate, 
                         0 AS Distance, dbo.NT_1qryEInvoiceCarporateSale.LORRYNO, dbo.NT_1qryEInvoiceCarporateSale.System_Name_E, dbo.NT_1qryEInvoiceCarporateSale.HSN, dbo.NT_1qryEInvoiceCarporateSale.GSTRate, 
                         dbo.NT_1qryEInvoiceCarporateSale.LESS_FRT_RATE, dbo.NT_1qryEInvoiceCarporateSale.saleid AS saleId, dbo.NT_1qryEInvoiceCarporateSale.Bill_Amount AS billAmount, dbo.company.Company_Name_E, 
                         dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.PHONE, dbo.company.GST, dbo.tbluser.EmailId, dbo.eway_bill.Branch, dbo.eway_bill.Account_Details, 
                         dbo.eway_bill.Mode_of_Payment, dbo.NT_1qryEInvoiceCarporateSale.EWay_Bill_No, dbo.NT_1qryEInvoiceCarporateSale.einvoiceno, CONVERT(varchar, dbo.NT_1qryEInvoiceCarporateSale.EwayBillValidDate, 103) 
                         AS validUpTo
FROM            dbo.tbluser FULL OUTER JOIN
                         dbo.eway_bill INNER JOIN
                         dbo.NT_1qryEInvoiceCarporateSale ON dbo.eway_bill.Company_Code = dbo.NT_1qryEInvoiceCarporateSale.Company_Code FULL OUTER JOIN
                         dbo.company ON dbo.NT_1qryEInvoiceCarporateSale.Company_Code = dbo.company.Company_Code ON dbo.tbluser.Company_Code = dbo.company.Company_Code AND dbo.tbluser.EmailId = dbo.company.Created_By
            WHERE  dbo.NT_1qryEInvoiceCarporateSale.saleId = :saleId
            '''
        else:
            query = '''
         SELECT        dbo.NT_1qryEInvoice.doc_no, CONVERT(varchar, dbo.NT_1qryEInvoice.doc_date, 103) AS Doc_Date, UPPER(dbo.NT_1qryEInvoice.BuyerGst_No) AS BuyerGst_No, UPPER(dbo.NT_1qryEInvoice.Buyer_Name) AS Buyer_Name, 
                         UPPER(dbo.NT_1qryEInvoice.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoice.Buyer_City) AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) AS Buyer_Pincode, 
                         UPPER(dbo.NT_1qryEInvoice.Buyer_State_name) AS Buyer_State_name, dbo.NT_1qryEInvoice.Buyer_State_Code, dbo.NT_1qryEInvoice.Buyer_Phno, dbo.NT_1qryEInvoice.Buyer_Email_Id, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchGst_No) AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoice.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoice.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoice.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) AS Dispatch_Pincode, 
                         UPPER(dbo.NT_1qryEInvoice.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoice.ShipTo_Name) AS ShipTo_Name, UPPER(dbo.NT_1qryEInvoice.ShipTo_Address) AS ShipTo_Address, 
                         UPPER(dbo.NT_1qryEInvoice.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoice.ShipTo_GSTStateCode, (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, 
                         dbo.NT_1qryEInvoice.NETQNTL, dbo.NT_1qryEInvoice.rate, dbo.NT_1qryEInvoice.CGSTAmount, dbo.NT_1qryEInvoice.SGSTAmount, dbo.NT_1qryEInvoice.IGSTAmount, dbo.NT_1qryEInvoice.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoice.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoice.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoice.IGSTRate, 0) AS IGSTRate, dbo.NT_1qryEInvoice.Distance, 
                         dbo.NT_1qryEInvoice.LORRYNO, dbo.NT_1qryEInvoice.System_Name_E, dbo.NT_1qryEInvoice.HSN, dbo.NT_1qryEInvoice.GSTRate, dbo.NT_1qryEInvoice.LESS_FRT_RATE, 
                         dbo.nt_1_companyparameters.GSTStateCode AS fromGSTCode, dbo.company.Company_Name_E AS fromName, dbo.company.Address_E AS fromAddress, dbo.company.City_E AS fromCity, 
                         dbo.company.State_E AS fromStateName, dbo.company.PIN AS fromPinCode, dbo.company.PHONE AS fromPhone, dbo.company.GST AS fromGSTNo, dbo.eway_bill.Mode_of_Payment, dbo.eway_bill.Account_Details, 
                         dbo.tbluser.EmailId AS fromEmail, dbo.eway_bill.Branch, dbo.NT_1qryEInvoice.saleid, dbo.NT_1qryEInvoice.IsService, dbo.NT_1qryEInvoice.Bill_Amount AS billAmount, CONVERT(varchar, 
                         dbo.NT_1qryEInvoice.EwayBillValidDate, 103) AS validUpTo, dbo.NT_1qryEInvoice.einvoiceno, dbo.NT_1qryEInvoice.EWay_Bill_No
FROM            dbo.NT_1qryEInvoice LEFT OUTER JOIN
                         dbo.nt_1_companyparameters ON dbo.NT_1qryEInvoice.Company_Code = dbo.nt_1_companyparameters.Company_Code AND dbo.NT_1qryEInvoice.Year_Code = dbo.nt_1_companyparameters.Year_Code LEFT OUTER JOIN
                         dbo.company ON dbo.NT_1qryEInvoice.Company_Code = dbo.company.Company_Code LEFT OUTER JOIN
                         dbo.tbluser ON dbo.nt_1_companyparameters.Created_By = dbo.tbluser.User_Name LEFT OUTER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoice.Company_Code = dbo.eway_bill.Company_Code
            WHERE dbo.NT_1qryEInvoice.saleId = :saleId
            '''

        # Execute the chosen query
        additional_data = db.session.execute(
            text(query), 
            {"saleId": saleId}
        )

        # Process the results
        additional_data_rows = additional_data.fetchall()
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data and data['doc_date']:
                date_obj = datetime.strptime(data['doc_date'], "%d/%m/%Y")
                data['doc_date'] = date_obj.strftime("%Y-%m-%d")
            else:
                data['doc_date'] = None

        # Return the response
        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Constants for API URL and credentials
API_URL_EWAYBILL = 'https://gsp.adaequare.com/test/enriched/ei/api'
TOKEN_URL = 'https://gsp.adaequare.com/gsp/authenticate'
GSP_APP_ID = '698F1ACF8F0C4E198F7A2D39511FCD13'
GSP_APP_SECRET = '956D5A09GE9FBG4161G9ECBG9D3B2A6974FA'

# Genrate Eway bill Token genration.
@app.route(API_URL+'/get-token', methods=['POST'])
def get_token():
    try:
        headers = {
            'gspappid': GSP_APP_ID,
            'gspappsecret': GSP_APP_SECRET,
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        params = {'grant_type': 'token'}

        response = requests.post(TOKEN_URL, headers=headers, params=params)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during token generation', 'error': response.text}), 500
    except Exception as e:
        return jsonify({'message': 'Error during token generation', 'error': str(e)}), 500

# Genrate Eway bill and E-Invoice
@app.route(API_URL+'/create-invoice', methods=['POST'])
def create_invoice():
    try:
        token = request.json.get('token')
        if not token:
            return jsonify({'message': 'Token is required'}), 400
        
        # Generate a random request ID for every Invoice
        request_id = generate_request_id()

        api_url = f"{API_URL_EWAYBILL}/invoice"

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
            'user_name': 'adqgspapusr1',
            'password': 'Gsp@1234',
            'gstin': '37AMBPG7773M002',
            'requestid': request_id
        }

        body = request.json.get('invoice_data')

        if not body:
            return jsonify({'message': 'Invoice data is required'}), 400

        response = requests.post(api_url, json=body, headers=headers)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during invoice creation', 'error': response.text}), 500

    except Exception as e:
        return jsonify({'message': 'Error during invoice creation', 'error': str(e)}), 500
    
#Update Eway bill invoice data
@app.route(API_URL + '/update-salesugar', methods=['PUT'])
def update_salesugar():
    try:
        saleid = request.args.get("saleid")
        
        if not saleid:
            return jsonify({"error": "saleid is required."}), 400
     
        query = db.session.execute(text('''
            SELECT doc_no 
            FROM dbo.nt_1_sugarsale
            WHERE saleid = :saleid
        '''), {'saleid': saleid})

        result = query.fetchone()

        if not result:
            return jsonify({"error": f"No doc_no found for saleid {saleid}."}), 404

        doc_no = result[0]

        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is required."}), 400
        
        ackno = data.get('AckNo')
        invoiceno = data.get('Irn')
        QRCode = data.get('SignedQRCode')

        if ackno:
            update_ackno_query = db.session.execute(text('''
                UPDATE dbo.nt_1_sugarsale 
                SET ackno = :ackno,
                einvoiceno = :invoiceno,
                QRCode = :QRCode
                WHERE doc_no = :doc_no
            '''), {'ackno': ackno, 'invoiceno': invoiceno, 'QRCode' : QRCode,'doc_no': doc_no})

        db.session.commit()

        socketio.emit('updatesalesugar')

        return jsonify({"message": f"SugarSale updated successfully for doc_no {doc_no}."}), 200

    except Exception as e:
        # Rollback in case of error
        db.session.rollback()
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
#GEnrate Sale Bill Report
@app.route(API_URL+"/generating_saleBill_report", methods=["GET"])
def generating_saleBill_report():
    try:
        company_code = request.args.get('Company_Code')
        saleid = request.args.get('saleid')

        if not company_code  or not saleid:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.qrysalehead.doc_no, dbo.qrysalehead.PURCNO, dbo.qrysalehead.doc_date, dbo.qrysalehead.Ac_Code, dbo.qrysalehead.Unit_Code, dbo.qrysalehead.mill_code, dbo.qrysalehead.FROM_STATION, 
                         dbo.qrysalehead.TO_STATION, dbo.qrysalehead.LORRYNO, dbo.qrysalehead.BROKER, dbo.qrysalehead.wearhouse, dbo.qrysalehead.subTotal, dbo.qrysalehead.LESS_FRT_RATE, dbo.qrysalehead.freight, 
                         dbo.qrysalehead.cash_advance, dbo.qrysalehead.bank_commission, dbo.qrysalehead.OTHER_AMT, dbo.qrysalehead.Bill_Amount, dbo.qrysalehead.Due_Days, dbo.qrysalehead.NETQNTL, dbo.qrysalehead.Company_Code, 
                         dbo.qrysalehead.Year_Code, dbo.qrysalehead.Branch_Code, dbo.qrysalehead.Created_By, dbo.qrysalehead.Modified_By, dbo.qrysalehead.Tran_Type, dbo.qrysalehead.DO_No, dbo.qrysalehead.Transport_Code, 
                         dbo.qrysalehead.RateDiff, dbo.qrysalehead.ASN_No, dbo.qrysalehead.GstRateCode, dbo.qrysalehead.CGSTRate, dbo.qrysalehead.CGSTAmount, dbo.qrysalehead.SGSTRate, dbo.qrysalehead.SGSTAmount, 
                         dbo.qrysalehead.IGSTRate, dbo.qrysalehead.IGSTAmount, dbo.qrysalehead.TaxableAmount, dbo.qrysalehead.EWay_Bill_No, dbo.qrysalehead.EWayBill_Chk, dbo.qrysalehead.MillInvoiceNo, dbo.qrysalehead.RoundOff, 
                         dbo.qrysalehead.saleid, dbo.qrysalehead.ac, dbo.qrysalehead.uc, dbo.qrysalehead.mc, dbo.qrysalehead.bk, dbo.qrysalehead.billtoname, dbo.qrysalehead.billtoaddress, dbo.qrysalehead.billtogstno, 
                         dbo.qrysalehead.billtopanno, dbo.qrysalehead.billtopin, dbo.qrysalehead.billtopincode, dbo.qrysalehead.billtocitystate, dbo.qrysalehead.billtogststatecode, dbo.qrysalehead.shiptoname, dbo.qrysalehead.shiptoaddress, 
                         dbo.qrysalehead.shiptogstno, dbo.qrysalehead.shiptopanno, dbo.qrysalehead.shiptocityname, dbo.qrysalehead.shiptocitypincode, dbo.qrysalehead.shiptocitystate, dbo.qrysalehead.shiptogststatecode, 
                         dbo.qrysalehead.billtoemail, dbo.qrysalehead.shiptoemail, dbo.qrysalehead.millname, dbo.qrysalehead.brokername, dbo.qrysalehead.GST_Name, dbo.qrysalehead.gstrate, dbo.qrysaledetail.detail_id AS itemcode, 
                         dbo.qrysaledetail.item_code, dbo.qrysaledetail.narration, dbo.qrysaledetail.Quantal, dbo.qrysaledetail.packing, dbo.qrysaledetail.bags, dbo.qrysaledetail.rate AS salerate, dbo.qrysaledetail.item_Amount, dbo.qrysaledetail.ic, 
                         dbo.qrysaledetail.saledetailid, dbo.qrysaledetail.itemname, dbo.qrysaledetail.HSN, dbo.qrysalehead.doc_dateConverted, dbo.qrysalehead.tc, dbo.qrysalehead.transportname, dbo.qrysalehead.transportmobile, 
                         dbo.qrysalehead.billtomobileto, dbo.qrysalehead.GSTStateCode AS partygststatecode, dbo.qrysalehead.shiptostatecode, dbo.qrysalehead.DoNarrtion, dbo.qrysalehead.TCS_Rate, dbo.qrysalehead.TCS_Amt, 
                         dbo.qrysalehead.TCS_Net_Payable, dbo.qrysalehead.newsbno, dbo.qrysalehead.newsbdate, dbo.qrysalehead.einvoiceno, dbo.qrysalehead.ackno, dbo.qrysalehead.Delivery_type, dbo.qrysalehead.millshortname, 
                         dbo.qrysalehead.billtostatename, dbo.qrysalehead.shiptoshortname, dbo.qrysalehead.shiptomobileno, dbo.qrysalehead.shiptotinno, dbo.qrysalehead.shiptolocallicno, dbo.qrysaledetail.Brand_Code, 
                         dbo.qrysalehead.EwayBillValidDate, dbo.qrysalehead.FSSAI_BillTo, dbo.qrysalehead.FSSAI_ShipTo, dbo.qrysalehead.BillToTanNo, dbo.qrysalehead.ShipToTanNo, dbo.qrysalehead.TDS_Rate, dbo.qrysalehead.TDS_Amt, 
                         dbo.qrysalehead.IsDeleted, dbo.qrysalehead.SBNarration, dbo.qrysalehead.QRCode, dbo.qrysalehead.MillFSSAI_No, dbo.qrysaledetail.Brand_Name, '' AS FreightPerQtl, dbo.company.State_E AS companyStateName, 
                         dbo.nt_1_companyparameters.GSTStateCode AS companyGSTStateCode, dbo.qrysalehead.grade, dbo.tblvoucherheadaddress.bankdetail
FROM            dbo.qrysaledetail RIGHT OUTER JOIN
                         dbo.nt_1_companyparameters INNER JOIN
                         dbo.tblvoucherheadaddress ON dbo.nt_1_companyparameters.Company_Code = dbo.tblvoucherheadaddress.Company_Code RIGHT OUTER JOIN
                         dbo.qrysalehead ON dbo.nt_1_companyparameters.Year_Code = dbo.qrysalehead.Year_Code AND dbo.nt_1_companyparameters.Company_Code = dbo.qrysalehead.Company_Code ON 
                         dbo.qrysaledetail.saleid = dbo.qrysalehead.saleid FULL OUTER JOIN
                         dbo.company ON dbo.qrysalehead.Company_Code = dbo.company.Company_Code
                 where dbo.qrysalehead.Company_Code = :company_code  and dbo.qrysalehead.saleid = :saleid
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "saleid": saleid})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' or 'EwayBillValidDate' in data:
                data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None
                data['EwayBillValidDate'] = data['EwayBillValidDate'].strftime('%Y-%m-%d') if data['EwayBillValidDate'] else None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500




   