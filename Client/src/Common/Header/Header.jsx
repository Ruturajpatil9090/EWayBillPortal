import jsPDF from "jspdf";
import logo from "../../Assets/jklogo.png";

const generateHeader = (pdf) => {
    const logoImg = new Image();
    logoImg.src = logo;
    
    logoImg.onload = () => {
        // Add logo image
        pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);

        // Set font size and text for the company details
        pdf.setFontSize(14);
        pdf.text("JK Sugars And Commodities Pvt. Ltd.", 40, 10);
        pdf.setFontSize(8);
        pdf.text("(Formerly known as JK eBuySugar Pvt. Ltd.)", 40, 15);
        pdf.text("DABHOLKAR CORNER, 4TH FLOOR, AMATYA TOWER, NEW SHAHUPURI, 329, E-WARD,", 40, 20);
        pdf.text("Kolhapur-416002 (Maharashtra)", 40, 25);
        pdf.text("Tel: (0231) 6688888 / 6688889 / 6688890", 40, 30);
        pdf.text("Email: lnfo@ebuysugars.com .GST NO 27AAECJ8332R1ZV / PAN .AAECJ8332R", 40, 35);

        // Add a horizontal line below the header
        pdf.setFontSize(12);
        pdf.setLineWidth(0.3);
        pdf.line(10, 38, 200, 38);

        // Add Tax Invoice title
        pdf.setFontSize(12);
        pdf.text("TAX INVOICE", 90, 43);

        // Add another horizontal line after the title
        pdf.setFontSize(12);
        pdf.setLineWidth(0.3);
        pdf.line(10, 45, 200, 45);
    };
};

export default generateHeader;
