import axios from 'axios';

const apikey = process.env.REACT_APP_API
const API_URL = `${apikey}/get-token`;

export const GSPTokenGenerator = () => {
    const generateTokenData = async() => {
        try {
       
            const response = await axios.post(API_URL);

            if (response.data && response.status === 200) {
                return response.data.access_token;
            } else {
                console.error("Token not found in response:", response);
                return null;
            }
        } catch (error) {
            console.error("Error during token generation:", error);
            return null;
        }
    }; 

    return { generateTokenData};
};

export default GSPTokenGenerator;
