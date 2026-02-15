import abaConfig from '../config/aba.config.js';
import logger from '../utils/logger.js';

class ABAServer{

    /* Call api from ABA */
    async callApi(endpoint, payload){
        try {
            const url = `${abaConfig.baseUrl}${endpoint}`;
            console.log(url);

            /* Log when request api */
            logger.request('POST', url, payload);
            const res = await fetch(url,{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'Accept': 'application/json', // Testing when header in Postman is working
                },
                body: JSON.stringify(payload)
            });
            const responseText = await res.text();
            if(!res.ok){
                logger.error('ABA API error response:', responseText);
                throw new Error(`HTTP error! status: ${res.status}${responseText ? ` - ${responseText}` : ''}`);
            }
            let data = {};
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                data = { raw: responseText };
            }
            logger.response(res.status, data);
            return data;
        } catch (error) {
            logger.error('Error calling ABA API:', error);
            throw error;
        }
    }

    /* Genrate QRCode via ABA api */
    async generateQRCode(payload){
        return await this.callApi(abaConfig.endpoint.generateQRCode, payload);
    }

    /* Check transaction via ABA api */
    async checkTransaction(payload){
        return await this.callApi(abaConfig.endpoint.checkTransaction, payload);
    }

    /* Close transaction via ABA api */
    async closeTransaction(payload){
        return await this.callApi(abaConfig.endpoint.closeTransaction, payload);
    }
}

/* Export a single instance (Singleton pattern) */
export default new ABAServer();