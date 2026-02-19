
const config = {
    bakong: {
        apiUrl: process.env.BAKONG_API_URL,
        token: process.env.BAKONG_TOKEN,
        accountId: process.env.BAKONG_ACCOUNT_ID,
        merchantName: process.env.MERCHANT_NAME,
        merchantCity: process.env.MERCHANT_CITY || 'Phnom Penh',    /* Default City Phnom Penh */
        qrExpirationSeconds: Number(process.env.QR_EXPIRATION_SECONDS) || 600,
        pollIntervalMs: Number(process.env.POLL_INTERVAL_MS) || 5000,
    },
};

/* Check debugs if not found bakong .env */
if (!config.bakong.accountId) {
    console.error('Bakong accountId not found in .env');
}
if (!config.bakong.token) {
    console.error('Bakong token not found in .env');
}

export default config;