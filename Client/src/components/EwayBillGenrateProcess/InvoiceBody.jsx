
export const invoiceDataEwayBills = (InvoiceData) => {
    const formData = InvoiceData;

    //Format the address.
    const formatAddress = (inputString) => {
        let cleanedString = inputString.replace(/[^a-zA-Z0-9]/g, " ");
        cleanedString = cleanedString.replace(/\s+/g, " ").trim();
        if (cleanedString.length < 3) {
          return "Error: String is too short. Minimum length is 3.";
        }
        if (cleanedString.length > 100) {
          cleanedString = cleanedString.substring(0, 100).trim();
        }
      
        return cleanedString;
      };
      
    // Format the date
    const formatDate = (date) => {
        const d = new Date(date);
        const day = ("0" + d.getDate()).slice(-2);
        const month = ("0" + (d.getMonth() + 1)).slice(-2);
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const invoiceData = {
        token: "",
        invoice_data: {
            Version: "1.1",
            TranDtls: {
                SupTyp: formData.supplyType,
                TaxSch: "GST",
                RegRev: formData.reverseCharge,
                Typ: formData.docType,
                EcmGstin: null,
                IgstOnIntra: formData.IGSTOnIntra,
            },
            DocDtls: {
                Typ: formData.docType,
                No: `INV1321211462`,
                Dt: formatDate(formData.doc_date),
            },
            SellerDtls: {
                Gstin: "37AMBPG7773M002",
                LglNm: formData.Company_Name_E,
                TrdNm: formData.Company_Name_E,
                Addr1: formatAddress(formData.Address_E),
                Loc: formData.City_E,
                Pin: parseInt("515001") || 0,
                Stcd: "37",
                Em: formData.EmailId,
            },
            BuyerDtls: {
                Gstin: formData.BuyerGst_No,
                LglNm: formData.Buyer_Name,
                TrdNm: formData.Buyer_Name,
                Pos: formData.Buyer_State_Code.toString(),
                Addr1: formatAddress(formData.Buyer_Address),
                Loc: formData.Buyer_City,
                Pin: parseInt(formData.Buyer_Pincode) || 0,
                Stcd: formData.Buyer_State_Code.toString(),
              
            },
            DispDtls: {
                Nm: formData.Dispatch_Name,
                Addr1: formData.Dispatch_Address,
                Loc: formData.DispatchCity_City,
                Gstin: formData.DispatchGst_No,
                Pin: parseInt(formData.Dispatch_Pincode) || 0,
                Stcd: formData.Dispatch_GSTStateCode.toString(),
            },
            ShipDtls: {
                Gstin: formData.ShipToGst_No,
                LglNm: formData.ShipTo_Name,
                TrdNm: formData.ShipTo_Name,
                Addr1: formatAddress(formData.ShipTo_Address),
                Loc: formData.ShipTo_City,
                Pin: parseInt(formData.ShipTo_Pincode) || 0,
                Stcd: formData.ShipTo_GSTStateCode.toString(),
            },
            ValDtls: {
                AssVal: formData.TaxableAmount,
                CgstVal: formData.CGSTAmount,
                SgstVal: formData.SGSTAmount,
                IgstVal: formData.IGSTAmount,
                CesVal: formData.cessAmount,
                StCesVal: formData.stateCessValue,
                Discount: formData.discount,
                OthChrg: formData.otherAmount,
                RndOffAmt: 0,
                TotInvVal: formData.billAmount,
            },
            PayDtls: {
                Nm: formData.payeeName,
                Accdet: formData.Account_Details,
                Mode: formData.Mode_of_Payment,
                Fininsbr: formData.Branch,
            },
            ItemList: [
                {
                    SlNo: "1",
                    PrdDesc: formData.System_Name_E,
                    IsServc: formData.IsService,
                    HsnCd: formData.HSN,
                    Qty: formData.NETQNTL,
                    Unit: formData.unit,
                    UnitPrice: formData.rate,
                    TotAmt: formData.TaxableAmount,
                    Discount: formData.discount,
                    PreTaxVal: formData.TaxableAmount,
                    AssAmt: formData.TaxableAmount,
                    GstRt: parseFloat(formData.GSTRate) || 0,
                    IgstAmt: formData.IGSTAmount,
                    CgstAmt: formData.CGSTAmount,
                    SgstAmt: formData.SGSTAmount,
                    CesRt: formData.cessValue,
                    CesAmt: formData.cessAmount,
                    StateCesRt: formData.stateCessValue,
                    StateCesAmt: formData.stateCessValue,
                    OthChrg: formData.otherAmount,
                    TotItemVal: formData.billAmount

                },
            ],
            EwbDtls: {
                Transid: formData.transporterID,
                Transname: formData.transporterName,
                Distance: formData.approximateDistance,
                Vehno: formData.LORRYNO,
                Vehtype: formData.vehicleType,
                TransMode: formData.tranceMode,
            },
        }
    };

    if (formData.GST === formData.DispatchGst_No) {
        delete invoiceData.DispDtls;
    }
    if (formData.BuyerGst_No === formData.ShipToGst_No) {
        delete invoiceData.ShipDtls;
    }
    return invoiceData
};
