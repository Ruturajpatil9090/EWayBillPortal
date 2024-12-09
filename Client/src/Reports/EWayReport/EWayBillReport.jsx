import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import PdfPreview from "../EWayReport/PDFPreview";

const API_URL = process.env.REACT_APP_API;
const apikey = process.env.REACT_APP_API_URL;

const EWayBillReport = ({ saleId }) => {
    const [apiData, setApiData] = useState(null);
    const [pdfPreview, setPdfPreview] = useState(null);

    const fetchData = async () => {
        try {
            const response = await fetch(
                `${API_URL}/get_eWayBill_print?saleId=${saleId}`
            );
            const data = await response.json();
            setApiData(data.all_data);
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
        if (apiData) {
            generatePdf(apiData);
        }
    }, [apiData]);

    const generatePdf = async (apiData) => {
        if (!apiData || apiData.length === 0) return;
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: "a4",
        });

        // Generate the QR code dynamically
        let qrCodeData = '';
        if (apiData && apiData.length > 0) {
            qrCodeData = `${apiData[0].EWay_Bill_No}/${apiData[0].fromGSTNo}/${apiData[0].Doc_Date}`;
        } else {
            alert('No data available to generate QR code!');
        }

        if (!qrCodeData || qrCodeData.trim() === '') {
            alert('QR code data is missing!');
            return;
        }

        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
            width: 100,
            height: 100,
        });

        pdf.addImage(qrCodeDataUrl, "PNG", 500, 0, 80, 80);

        const canvas = document.createElement("canvas");
        const ewayBillNo = apiData[0]?.EWay_Bill_No;
        JsBarcode(canvas, ewayBillNo, { format: "CODE128" });
        const barcodeDataUrl = canvas.toDataURL("image/png");

        pdf.addImage(barcodeDataUrl, "PNG", 200, 500, 150, 50);

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("e-WAY BILL", 40, 60);

        pdf.setLineWidth(0.2);
        pdf.line(40, 72, 555, 72);

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("E-WAY BILL Details", 40, 84);
        pdf.line(40, 90, 555, 90);

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");

        const leftMargin = 40;
        const gapBetweenTexts = 140;

        const details = [
            { label: "E-Way Bill No:", value: `${apiData[0].EWay_Bill_No}` },
            { label: "Generated Date:", value: `${apiData[0].Doc_Date}` },
            { label: "Generated By:", value: `${apiData[0].fromGSTNo}` },
            { label: "Valid Upto:", value: `${apiData[0].validUpTo}` },
        ];

        details.forEach((detail, index) => {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.text(detail.label, leftMargin + index * gapBetweenTexts, 102);

            pdf.setFont("helvetica", "bold");
            pdf.text(
                detail.value,
                leftMargin +
                index * gapBetweenTexts +
                pdf.getTextWidth(detail.label) +
                2,
                102
            );
        });

        pdf.setLineWidth(0.2);
        pdf.line(40, 112, 555, 112);

        const infoDetails = [
            { label: "Mode:", value: "Road", x: 40, y: 124 },
            { label: "Type:", value: "Outward - Supply", x: 40, y: 144 },
            {
                label: "Approx Distance:",
                value: `${apiData[0].Distance}KM`,
                x: 200,
                y: 124,
            },
            {
                label: "Document Details:",
                value: `Tax Invoice - SB${apiData[0].doc_no}`,
                x: 200,
                y: 144,
            },
            {
                label: "Transaction Type:",
                value: `${apiData[0].Mode_of_Payment}`,
                x: 400,
                y: 148,
            },
        ];

        pdf.line(40, 132, 555, 132);

        infoDetails.forEach((detail) => {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.text(detail.label, detail.x, detail.y);

            pdf.setFont("helvetica", "bold");
            pdf.text(
                detail.value,
                detail.x + pdf.getTextWidth(detail.label) + 2,
                detail.y
            );
        });

        pdf.line(40, 152, 555, 152);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text("RN:", 40, 161);

        pdf.setFont("helvetica", "bold");
        pdf.text(`${apiData[0].einvoiceno}`, 40 + pdf.getTextWidth("RN:") + 2, 161);

        pdf.line(40, 167, 555, 167);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("Address Details", 40, 176);
        pdf.line(40, 182, 555, 182);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");

        pdf.text("From:", 40, 195);
        pdf.rect(40, 200, 220, 80);

        pdf.setFontSize(6);
        pdf.setFont("helvetica", "normal");

        const fromDetails = [
            `GSTIN:${apiData[0].fromGSTNo}`,
            `${apiData[0].fromName}`,
            `${apiData[0].fromAddress}`,
            `${apiData[0].fromStateName}-${apiData[0].fromPinCode}`,
            "::Dispatch From::",
            `${apiData[0].Dispatch_Address}`,
            `${apiData[0].DispatchCity_City}-${apiData[0].Dispatch_Pincode}`,
        ];

        const fromDetailsLinebrk = fromDetails.join("\n");
        const fromDetailsWrapped = pdf.splitTextToSize(fromDetailsLinebrk, 210);
        let fromYPosition = 207;
        fromDetailsWrapped.forEach((line) => {
            if (fromYPosition <= 280) {
                pdf.text(line, 43, fromYPosition);
                fromYPosition += 9;
            }
        });

        const scrollbarXStartFrom = 40 + 220 - 6;
        const scrollbarXEndFrom = scrollbarXStartFrom + 6;
        const scrollbarYStartFrom = 200;
        const scrollbarYEndFrom = 280;
        pdf.setLineWidth(1);
        pdf.setDrawColor(150, 150, 150);
        pdf.line(
            scrollbarXStartFrom,
            scrollbarYStartFrom,
            scrollbarXStartFrom,
            scrollbarYEndFrom
        ); // Left edge of scrollbar
        pdf.line(
            scrollbarXEndFrom,
            scrollbarYStartFrom,
            scrollbarXEndFrom,
            scrollbarYEndFrom
        );

        pdf.setFillColor(0, 0, 0);

        pdf.triangle(
            (scrollbarXStartFrom + scrollbarXEndFrom) / 2,
            scrollbarYStartFrom + 3,
            scrollbarXStartFrom,
            scrollbarYStartFrom + 8,
            scrollbarXEndFrom,
            scrollbarYStartFrom + 8,
            "FD"
        );

        pdf.triangle(
            (scrollbarXStartFrom + scrollbarXEndFrom) / 2,
            scrollbarYEndFrom - 3,
            scrollbarXStartFrom,
            scrollbarYEndFrom - 8,
            scrollbarXEndFrom,
            scrollbarYEndFrom - 8,
            "FD"
        );

        pdf.text("To:", 300, 195);
        pdf.rect(300, 200, 220, 80);

        const toDetails = [
            `GSTIN: ${apiData[0].BuyerGst_No}`,
            `${apiData[0].Buyer_Name}`,
            `${apiData[0].Buyer_Address}, ${apiData[0].Buyer_City}`,
            `${apiData[0].Buyer_State_name}, ${apiData[0].Buyer_Pincode}`,
            "::Ship To::",
            `${apiData[0].ShipTo_Address}`,
            `${apiData[0].ShipTo_City}-${apiData[0].ShipTo_Pincode}`,
        ];

        const toDetailsWithLineBreaks = toDetails.join("\n");
        const toDetailsWrapped = pdf.splitTextToSize(toDetailsWithLineBreaks, 210);
        let toYPosition = 210;
        toDetailsWrapped.forEach((line) => {
            if (toYPosition <= 280) {
                pdf.text(line, 302, toYPosition);
                toYPosition += 9;
            }
        });

        const scrollbarXStart = 300 + 220 - 8;
        const scrollbarXEnd = scrollbarXStart + 6;
        const scrollbarYStart = 200;
        const scrollbarYEnd = 280;

        pdf.setLineWidth(1);
        pdf.setDrawColor(150, 150, 150);
        pdf.line(scrollbarXStart, scrollbarYStart, scrollbarXStart, scrollbarYEnd);
        pdf.line(scrollbarXEnd, scrollbarYStart, scrollbarXEnd, scrollbarYEnd);

        pdf.setFillColor(0, 0, 0);

        pdf.triangle(
            (scrollbarXStart + scrollbarXEnd) / 2,
            scrollbarYStart + 3,
            scrollbarXStart,
            scrollbarYStart + 8,
            scrollbarXEnd,
            scrollbarYStart + 8,
            "FD"
        );

        pdf.triangle(
            (scrollbarXStart + scrollbarXEnd) / 2,
            scrollbarYEnd - 3,
            scrollbarXStart,
            scrollbarYEnd - 8,
            scrollbarXEnd,
            scrollbarYEnd - 8,
            "FD"
        );

        pdf.setLineWidth(0.2);
        pdf.line(40, 290, 555, 290);

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("Goods Details", 40, 300);

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.line(40, 305, 555, 305);
        pdf.text("Please Refer IRN Print to view Goods Details..", 40, 315);
        pdf.line(40, 320, 555, 320);

        const goodsTableData = [
            [
                "Total Taxable Amt",
                "CGST Amt",
                "SGST Amt",
                "IGST Amt",
                "CESS Amt",
                "Total Inv Amt",
            ],
            [
                `${apiData[0].TaxableAmount}`,
                `${apiData[0].CGSTAmount}`,
                `${apiData[0].SGSTAmount}`,
                `${apiData[0].IGSTAmount}`,
                "0.00",
                `${apiData[0].billAmount}`,
            ],
        ];

        //Grid Style
        pdf.autoTable({
            startY: 330,
            head: [goodsTableData[0]],
            body: [goodsTableData[1]],
            theme: "grid",
            styles: {
                fontSize: 9,
                halign: "center",
                valign: "middle",
                font: "helvetica",
            },
            margin: { left: 40 },
            headStyles: {
                fontStyle: "bold",
                font: "helvetica",
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
            },
            bodyStyles: {
                fontStyle: "normal",
                font: "helvetica",
            },
            tableLineColor: [0, 0, 0],
            tableLineWidth: 0.2,
        });

        // Vehicle Details Section
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.line(40, 380, 555, 380);
        pdf.text("Vehicle Details", 40, pdf.lastAutoTable.finalY + 18);

        pdf.line(40, 395, 555, 395);
        pdf.setFontSize(9);
        pdf.text("Transpoter ID & Name", 40, 407);
        pdf.text("Transpoter Doc No & Date", 380, 407);
        pdf.line(40, 415, 555, 415);

        // Vehicle table details
        const vehicleTableData = [
            ["Mode", "Vehicle No", "From", "Entered Date", "Entered By"],
            [
                "Road",
                `${apiData[0].LORRYNO}`,
                `${apiData[0].fromCity}`,
                `${apiData[0].Doc_Date}`,
                `${apiData[0].fromGSTNo}`,
            ],
        ];

        pdf.autoTable({
            startY: pdf.lastAutoTable.finalY + 50,
            head: [vehicleTableData[0]],
            body: [vehicleTableData[1]],
            theme: "grid",
            styles: {
                fontSize: 9,
                halign: "center",
                valign: "middle",
                font: "helvetica",
            },
            margin: { left: 40 },
            headStyles: {
                fontStyle: "bold",
                font: "helvetica",
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
            },
            bodyStyles: {
                fontStyle: "normal",
                font: "helvetica",
            },
            tableLineColor: [0, 0, 0],
            tableLineWidth: 0.2,
        });
        pdf.text(
            "Note: If any discrepancy in information please try after sometime",
            40,
            700
        );

        const pdfData = pdf.output("datauristring");
        setPdfPreview(pdfData)
        
    };


    return (
        <div className="centered-container">
            {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={apiData[0]} />}
        </div>
    );
};

export default EWayBillReport;
