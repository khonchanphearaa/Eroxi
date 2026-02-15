import dotenv from 'dotenv';
dotenv.config();


const ABA_CONFIG = {
    apiKey: process.env.ABA_API_KEY,
    merchantId: process.env.ABA_MERCHANT_ID,
    baseUrl: process.env.PAYWAY_BASE_URL,
    endpoint: {
        generateQRCode: '/api/payment-gateway/v1/payments/generate-qr',
        checkTransaction: '/api/payment-gateway/v1/payments/check-transaction-2',
        closeTransaction: '/api/payment-gateway/v1/payments/close-transaction'
    },
    defaultLifetime: 6,
    defaultTemplate: 'template3_color'
};

export default ABA_CONFIG;