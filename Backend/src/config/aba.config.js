import dotenv from 'dotenv';
dotenv.config();

const sanitize = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
};

const normalizeBaseUrl = (url) => {
    const cleanUrl = sanitize(url);
    if (!cleanUrl) return '';
    return cleanUrl.replace(/\/+$/, '');
};

const ABA_CONFIG = {
    apiKey: sanitize(process.env.ABA_API_KEY),
    merchantId: sanitize(process.env.ABA_MERCHANT_ID),
    baseUrl: normalizeBaseUrl(process.env.PAYWAY_BASE_URL),
    endpoint: {
        generateQRCode: '/api/payment-gateway/v1/payments/generate-qr',
        checkTransaction: '/api/payment-gateway/v1/payments/check-transaction-2',
        closeTransaction: '/api/payment-gateway/v1/payments/close-transaction'
    },
    defaultLifetime: 6,
    defaultTemplate: 'template3_color'
};

export default ABA_CONFIG;