

const axios = require("axios");

const ACLEDA_CONFIG = {
  merchant_id: "YOUR_MERCHANT_ID",
  api_key: "YOUR_API_KEY",
  secret_key: "YOUR_SECRET_KEY",
  endpoint: "https://payment.acledabank.com.kh/api/v1/payments"
};

// Create payment
async function createPayment() {
  try {
    const response = await axios.post(
      ACLEDA_CONFIG.endpoint,
      {
        merchant_id: ACLEDA_CONFIG.merchant_id,
        amount: 50000,
        currency: "KHR",
        description: "Order Payment",
        return_url: "https://yourwebsite.com/success",
        cancel_url: "https://yourwebsite.com/cancel"
      },
      {
        headers: {
          "API-KEY": ACLEDA_CONFIG.api_key,
          "SECRET-KEY": ACLEDA_CONFIG.secret_key,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
}

createPayment();
