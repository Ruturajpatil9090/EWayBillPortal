import axios from 'axios';

const API_URL = "https://api.mastergst.com/ewaybillapi/v1.03/authenticate";
const HEADERS = {
    ip_address: "",
    client_id: process.env.REACT_APP_EWAYBILL_CLIENT_ID,
    client_secret: process.env.REACT_APP_EWAYBILL_CLIENT_SECRET,
    gstin: process.env.REACT_APP_EWAYBILL_GSTIN,
};

export const EwayBillTokenGenerator = () => {
    const generateToken = async () => {
        try {
            const params = {
                email: process.env.REACT_APP_EWAYBILL_EMAIL,
                username: process.env.REACT_APP_EWAYBILL_USERNAME,
                password: process.env.REACT_APP_EWAYBILL_PASSWORD,
            };
            const config = {
                headers: HEADERS,
                params: params,
            };

            const response = await axios.get(API_URL, config);

            if (response.data && response.status === 200) {
                return response.data;
            } else {
                console.error("Failed to fetch token:", response);
                return null;
            }
        } catch (error) {
            console.error("Error during token generation:", error);
            return null;
        }
    };

    return { generateToken };
};

export default EwayBillTokenGenerator;
