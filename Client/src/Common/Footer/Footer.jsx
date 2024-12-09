import Sign from "../../Assets/jklogo.png"; 

const generateFooter = (pdf, lastAutoTableFinalY) => {

    // Set font size and add text for footer details
    pdf.setFontSize(10);
    pdf.text("Our Tan No: JDHJ01852E", 10, lastAutoTableFinalY + 20);
    pdf.text("FSSAI No: 11516035000705", 60, lastAutoTableFinalY + 20);
    pdf.text("PAN No: AABHJ9303C", 110, lastAutoTableFinalY + 20);

    // Add signature image and text for authorized signatory
    const signImg = new Image();
    signImg.src = Sign;
    signImg.onload = () => {
        pdf.addImage(signImg, "PNG", 160, lastAutoTableFinalY + 25, 30, 20);
        pdf.text("For, JK Sugars And Commodities Pvt. Ltd", 140, lastAutoTableFinalY + 50);
        pdf.text("Authorised Signatory", 160, lastAutoTableFinalY + 55);
    };
};

export default generateFooter;
