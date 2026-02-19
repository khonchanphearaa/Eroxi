import dotenv from 'dotenv';
dotenv.config();

const ACLEDA_CONFIG = {
    apiKey: process.env.ACLEDA_API_KEY,
    merchantId: process.env.ACLEDA_MERCHANT_ID,
    baseUrl: process.env.ACLEDA_BASE_URL || process.env.PAYWAY_BASE_URL,
    endpoint: {
        generateQRCode: process.env.ACLEDA_ENDPOINT_GENERATE_QR || '/api/payment-gateway/v1/payments/generate-qr',
        checkTransaction: process.env.ACLEDA_ENDPOINT_CHECK_TRANSACTION || '/api/payment-gateway/v1/payments/check-transaction-2',
        closeTransaction: process.env.ACLEDA_ENDPOINT_CLOSE_TRANSACTION || '/api/payment-gateway/v1/payments/close-transaction'
    },
    defaultLifetime: parseInt(process.env.ACLEDA_DEFAULT_LIFETIME || '6'),
    defaultTemplate: process.env.ACLEDA_DEFAULT_TEMPLATE || 'template3_color'
};

export default ACLEDA_CONFIG;
