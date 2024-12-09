import React, { useEffect, useState } from "react";
import logo from "../../Assets/jklogo.png";
import Sign from "../../Assets/jklogo.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../EWayReport/PDFPreview";
import generateHeader from "../../Common/Header/Header";
import QRCode from "qrcode";

const API_URL = process.env.REACT_APP_API;
const Company_Code = process.env.REACT_APP_COMPANY_CODE;

const SaleBillReport = ({ saleId }) => {
    const [invoiceData, setInvoiceData] = useState([]);
    const [pdfPreview, setPdfPreview] = useState(null);
    const numberToWords = (num) => {
        const belowTwenty = [
            "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
        ];

        const tens = [
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        ];

        const scales = [
            "", "Thousand", "Lakh", "Crore"
        ];

        const words = (num) => {
            if (num === 0) return "";
            if (num < 20) return belowTwenty[num];
            if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + belowTwenty[num % 10] : "");
            if (num < 1000) return belowTwenty[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + words(num % 100) : "");

            if (num < 100000) {
                return words(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? ", " + words(num % 1000) : "");
            } else if (num < 10000000) {
                return words(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? ", " + words(num % 100000) : "");
            } else {
                return words(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? ", " + words(num % 10000000) : "");
            }
        };

        const convertFraction = (fraction) => {
            if (fraction === 0) return "Zero Paise";
            return words(fraction);
        };

        const integerPart = Math.floor(num);
        const fractionPart = Math.round((num - integerPart) * 100);

        let result = words(integerPart);

        if (fractionPart > 0) {
            result += " and " + convertFraction(fractionPart);
        } else {
            result += " Only";
        }

        return result;
    };

    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/generating_saleBill_report?Company_Code=${Company_Code}&saleid=${saleId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setInvoiceData(data.all_data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        if (saleId) {
            fetchData();
        }
    }, [saleId]);

    useEffect(() => {
        if (invoiceData.length > 0) {
            generatePdf(invoiceData);
        }
    }, [invoiceData]);

    const generatePdf = async (data) => {
        const pdf = new jsPDF({ orientation: "portrait" });
        const allData = data[0];

        let qrCodeData = "";
        qrCodeData = ` GSTN of Supplier: ${allData.companyGSTNo || ""}\n
        GSTIN of Buyer: ${allData.billtogstno || ""}\n
        Document No: ${allData.doc_no || ""}\n
        Document Type: Tax Invoice\n
        Date Of Creation Of Invoice: ${allData.doc_date || ""}\n
        HSN Code: ${allData.HSN || ""}\n
        IRN: ${allData.einvoiceno || ""}\n
        Receipt Number:`;

        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim(), {
            width: 300,
            height: 300,
        });

        pdf.addImage(qrCodeDataUrl, "PNG", 170, 0, 30, 30);
        generateHeader(pdf);

        const totalAmount = parseFloat(allData.TCS_Net_Payable);
        const totalAmountWords = numberToWords(totalAmount);
        const tableData = [
            ["Reverse Charge", "No"],
            ["Invoice No:", `SB${allData.doc_no}`],
            ["Invoice Date:", allData.doc_dateConverted],
            ["State:", allData.billtostatename],
            ["Buyer,"],
            [allData.billtoname],
            [allData.billtoaddress],
            [allData.billtocitystate + ' ' + allData.billtopin],
            ["Bill To,"],
            ["City:", allData.billtocitystate, "State:", allData.billtocitystate],
            ["Gst NO:", allData.billtogstno],
            ["FSSAI No:", allData.FSSAI_BillTo],
            ["TAN No:", allData.BillToTanNo],
            ["Mill Name:", allData.millname],
            ["Dispatch From:", allData.FROM_STATION],
        ];

        const buyerData = [
            ["GST No:", allData.shiptogstno],
            ["Transport Mode:", "Road"],
            ["Date Of Supply:", allData.doc_dateConverted],
            ["Place Of Supply:", allData.shiptocitystate],
            ["Consigned To,"],
            [allData.shiptoname],
            [allData.shiptoaddress],
            [allData.shiptocitystate + ' ' + allData.shiptocitypincode],
            ["Ship To,"],
            ["City:", allData.shiptocitystate, "State:", allData.shiptocitystate],
            ["Gst NO:", allData.shiptogstno],
            ["FSSAI No:", allData.FSSAI_ShipTo],
            ["TAN No:", allData.ShipToTanNo],
            ["FSSAI No:"],
            ["Lorry No:", allData.LORRYNO],
        ];

        if (tableData && tableData.length > 0) {
            pdf.autoTable({
                startY: 45,
                margin: { left: 10, right: pdf.internal.pageSize.width / 2 + 10 },
                body: tableData,
                theme: "plain",
                styles: {
                    cellPadding: 1,
                    fontSize: 8,
                },
                didDrawCell: function (data) {
                    if (data.row.index === 3) {
                        pdf.setLineWidth(0.3);
                        pdf.setDrawColor(0);
                        const startX = 10;
                        const endX = pdf.internal.pageSize.width / 2;
                        const y = data.cell.y + data.cell.height;
                        pdf.line(startX, y, endX, y);
                    }
                }
            });
        }
        pdf.setLineWidth(0.3);
        pdf.line(pdf.internal.pageSize.width / 2, 45, pdf.internal.pageSize.width / 2, 140);

        if (buyerData && buyerData.length > 0) {
            pdf.autoTable({
                startY: 45,
                margin: { left: pdf.internal.pageSize.width / 2 + 10, right: 10 },
                body: buyerData,
                theme: "plain",
                styles: {
                    cellPadding: 1,
                    fontSize: 8,
                },
                didDrawCell: function (data) {
                    if (data.row.index === 3) {
                        pdf.setLineWidth(0.3);
                        pdf.setDrawColor(0);
                        const startX = pdf.internal.pageSize.width / 2;
                        const endX = pdf.internal.pageSize.width - 10;
                        const y = data.cell.y + data.cell.height;
                        pdf.line(startX, y, endX, y);
                    }
                }
            });
        }

        pdf.setFontSize(8);
        pdf.setLineWidth(0.3);
        pdf.line(10, 140, 200, 140);
        pdf.setFontSize(12);
        const particulars = [
            ["Particulars", "Brand Name", "HSN/ACS", "Quntal", "Packing(kg)", "Bags", "Rate", "Value"],
            [allData.itemname, allData.Brand_Name, allData.HSN, allData.Quantal, allData.packing, allData.bags, allData.salerate, allData.item_Amount],
        ];

        pdf.autoTable({
            startY: pdf.lastAutoTable.finalY + 10,
            head: [particulars[0]],
            body: particulars.slice(1),
        });

        const eInvoiceData = [
            ["Sale Rate:", allData.salerate],
            ["Grade:", allData.grade],
            ["Eway Bill No:", allData.EWay_Bill_No],
            ["EwayBill ValidDate:", allData.EwayBillValidDate],
            ["eInvoiceNo:", allData.einvoiceno],
            ["Ack:", allData.ackno],
            ["bank Details:", allData.bankdetail],
        ];

        pdf.autoTable({
            startY: pdf.lastAutoTable.finalY + 5,
            margin: { left: 10, right: pdf.internal.pageSize.width / 2 },
            body: eInvoiceData,
            theme: "plain",
            styles: {
                cellPadding: 1,
                fontSize: 8,
                halign: "left",
                valign: "middle",
            },
            columnStyles: {
                1: { fontStyle: 'bold' },
            }
        });

        pdf.setLineWidth(0.3);

        const summaryData = [
            ["Freight:", allData.LESS_FRT_RATE, allData.freight],
            ["Taxable Amount:", "", allData.item_Amount],
            ["CGST:", allData.CGSTRate, allData.CGSTAmount],
            ["SGST:", allData.SGSTRate, allData.SGSTAmount],
            ["IGST:", allData.IGSTRate, allData.IGSTAmount],
            ["Rate Diff:/Qntl:", "", allData.RateDiff],
            ["Other Expense:", "", allData.OTHER_AMT],
            ["Round Off:", "", allData.RoundOff],
            ["Total Amount:", "", allData.TCS_Net_Payable],
            ["TCS:", allData.TCS_Rate, allData.TCS_Amt],
            ["TCS Net Payable:", "", allData.TCS_Net_Payable],
        ];

        pdf.autoTable({
            startY: 165,
            margin: { left: pdf.internal.pageSize.width / 2 },
            body: summaryData,
            theme: "plain",
            styles: {
                cellPadding: 1,
                fontSize: 8,
                halign: "left",
                valign: "middle",
            },
            columnStyles: {
                2: { halign: "right", fontStyle: 'bold' },
            }
        });

        pdf.setFontSize(8);
        const lineY = pdf.lastAutoTable.finalY + 10;
        pdf.setLineWidth(0.3);
        pdf.line(10, lineY - 4, 200, lineY - 4);
        pdf.setFont("helvetica", "bold");

        pdf.text(`${totalAmountWords}.`, 12, lineY);

        pdf.line(10, lineY + 3, 200, lineY + 4);

        pdf.setFontSize(8);
        pdf.text("Our Tan No: JDHJ01852E", 10, pdf.lastAutoTable.finalY + 20);
        pdf.text("FSSAI No: 11516035000705", 60, pdf.lastAutoTable.finalY + 20);
        pdf.text("PAN No: AABHJ9303C", 110, pdf.lastAutoTable.finalY + 20);

        const signImg = new Image();
        signImg.src = Sign;
        signImg.onload = () => {
            pdf.setFontSize(8);
            pdf.addImage(signImg, "PNG", 160, pdf.lastAutoTable.finalY + 25, 30, 20);
            pdf.text("For, JK Sugars And Commodities Pvt. Ltd", 145, pdf.lastAutoTable.finalY + 50);
            pdf.text("Authorised Signatory", 160, pdf.lastAutoTable.finalY + 55);
            // pdf.save("JKSaleBill.pdf")
            const pdfData = pdf.output("datauristring");
            setPdfPreview(pdfData)
        }
    };

    return (
        <div id="pdf-content" className="centered-container">
            {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData} />}
        </div>
    );
};

export default SaleBillReport;
