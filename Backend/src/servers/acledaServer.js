import acledaConfig from '../config/acleda.config.js';
import logger from '../utils/logger.js';

class ACLEDAServer{

    /* Call api from ACLEDA */
    async callApi(endpoint, payload){
        try {
            const url = `${acledaConfig.baseUrl}${endpoint}`;
            logger.request('POST', url, payload);
            const res = await fetch(url,{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            const responseText = await res.text();
            if(!res.ok){
                logger.error('ACLEDA API error response:', responseText);
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
            logger.error('Error calling ACLEDA API:', error);
            throw error;
        }
    }

    /* Genrate QRCode via ACLEDA api */
    async generateQRCode(payload){
        return await this.callApi(acledaConfig.endpoint.generateQRCode, payload);
    }

    /* Check transaction via ACLEDA api */
    async checkTransaction(payload){
        return await this.callApi(acledaConfig.endpoint.checkTransaction, payload);
    }

    /* Close transaction via ACLEDA api */
    async closeTransaction(payload){
        return await this.callApi(acledaConfig.endpoint.closeTransaction, payload);
    }
}

export default new ACLEDAServer();
