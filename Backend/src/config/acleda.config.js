import dotenv from 'dotenv';

dotenv.config();

const ACLEDA_CONFIG = {
    merchantId: process.env.ACLEDA_MERCHANT_ID,
    apiKey: process.env.ACLEDA_API_KEY,
    secretKey: process.env.ACLEDA_SECRET_KEY,
    baseUrl: process.env.ACLEDA_BASE_URL || 'https://payment.acledabank.com.kh',
    endpoint: {
        generateQRCode: '/api/v1/qr/generate',
        checkTransaction: '/api/v1/status',
        closeTransaction: '/api/v1/close',
    },
};

export default ACLEDA_CONFIG;
