import QRCode from "qrcode";
import logger from "../utils/logger.js";


/**
 * @ABApayway
 * TTD: 2026-02-15
 */
import abaServer from "../servers/abaServer.js";
import abaConfig from "../config/aba.config.js";
import acledaServer from "../servers/acledaServer.js";
import acledaConfig from "../config/acleda.config.js";
import { generateRequestTime, generateQRHash, generateCheckTransactionHash, generateTransactionId } from "../utils/hashGenerator.js";


/**
 * @Bakong KHQR
 * TTD: 2026-02-19
 */
import bakongConfig from "../config/bakong.config.js";
import { BakongKHQR, IndividualInfo, khqrData } from "bakong-khqr";
import Transaction from "../models/bakongTransaction.js";

/* Active bakong pollers: transactionId to intervalId */
const pollers = new Map();

class PaymentController {

    /* ABA Generate QRCode */
    async genearteQRCode(req, res) {
        try {
            const {
                amount,
                currency = "KHR",
                first_name,
                last_name,
                email,
                phone,
                purchase_type = "purchase",
                payment_option = "abapay_khqr",
                items,
                callback_url,
                return_deeplink,
                custom_fields,
                return_params,
                payout,
                lifetime,
                qr_image_template,
            } = req.body;

            const req_time = generateRequestTime();
            const tran_id = generateTransactionId();

            /* Prepare request payload for ABA api */
            const payload = {
                req_time,
                merchant_id: provider.config.merchantId,
                tran_id,
                amount,
                items: items ?? "",
                first_name: first_name ?? "",
                last_name: last_name ?? "",
                email: email ?? "",
                phone: phone ?? "",
                purchase_type,
                payment_option,
                callback_url: callback_url ?? "",
                return_deeplink: return_deeplink ?? "",
                currency,
                custom_fields: custom_fields ?? "",
                return_params: return_params ?? "",
                payout: payout ?? "",
                lifetime: lifetime ?? abaConfig.defaultLifetime,
                qr_image_template: qr_image_template ?? abaConfig.defaultTemplate,
            };

            payload.hash = generateQRHash(payload);
            const abaResponse = await abaServer.generateQRCode(payload);

            /* Check if when ABA response is success 0: success */
            if (abaResponse.status?.code === "0") {
                logger.success("QRCode generated success:", abaResponse);
                return res.status(200).json({
                    success: true,
                    merchant_id: abaConfig.merchantId,
                    tran_id,
                    amount,
                    currency,
                    payment_option,
                    qrString: abaResponse.qrString,
                    qrImage: abaResponse.qrImage,
                    abapay_deeplink: abaResponse.abapay_deeplink,
                    app_store: abaResponse.app_store,
                    play_store: abaResponse.play_store,
                    status: abaResponse.status,
                });
            }
            throw new Error("Failed to generate QRCode: " + abaResponse.status?.message);

        } catch (error) {
            logger.error("Error generating QRCode:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /* ABA Check transaction status */
    async checkTransaction(req, res) {
        try {
            const { tran_id } = req.body;
            const req_time = generateRequestTime();
            const hash = generateCheckTransactionHash(req_time, abaConfig.merchantId, tran_id);

            const payload = { req_time, merchant_id: abaConfig.merchantId, tran_id, hash };
            const abaResponse = await abaServer.checkTransaction(payload);

            logger.info("ABA Check Transaction Response:", tran_id);
            return res.status(200).json({ success: true, data: abaResponse });

        } catch (error) {
            logger.error("Error checking transaction:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

   
    /* ABA Close transaction */
    async closeTransaction(req, res) {
        try {
            const { tran_id } = req.body;
            const req_time = generateRequestTime();
            const hash = generateCheckTransactionHash(req_time, abaConfig.merchantId, tran_id);

            const payload = { req_time, merchant_id: abaConfig.merchantId, tran_id, hash };
            const abaResponse = await abaServer.closeTransaction(payload);

            logger.success("ABA Close transaction response:", abaResponse);
            return res.status(200).json({ success: true, data: abaResponse });

        } catch (error) {
            logger.error("Error closing transaction:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /* Bakong Generate KHQR */
    async generateBakongQR(req, res) {
        try {
            const {
                amount,
                currency = "KHR",
                merchant_name = bakongConfig.bakong.merchantName,
                description,
            } = req.body;

            // Check .env is loaded correctly
            if (!bakongConfig.bakong.accountId) {
                return res.status(500).json({ success: false, message: "BAKONG_ACCOUNT_ID is not set in .env" });
            }

            if (!amount || isNaN(amount) || Number(amount) <= 0) {
                return res.status(400).json({ success: false, message: "Valid amount is required" });
            }

            const currency_code = currency.toUpperCase() === "USD"
                ? khqrData.currency.usd   // 840 USD
                : khqrData.currency.khr;  // 116 KHR

            /* Build IndividualInfo using the official bakong-khqr SDK */
            const individualInfo = new IndividualInfo(
                bakongConfig.bakong.accountId,     
                merchant_name,             
                bakongConfig.bakong.merchantCity, 
                {
                    currency: currency_code,
                    amount: Number(amount),
                    expirationTimestamp: Date.now() + (bakongConfig.bakong.qrExpirationSeconds * 1000),
                    purposeOfTransaction: description ?? "",
                }
            );

            /* SDK generates correct EMVCo QR — handles all tags, CRC, timestamp */
            const khqr = new BakongKHQR();
            const response = khqr.generateIndividual(individualInfo);

            if (response.status.code !== 0) {
                logger.error("Bakong SDK error:", response.status);
                return res.status(500).json({ success: false, message: response.status.message });
            }

            const qrString = response.data.qr;
            const md5Hash = response.data.md5;

            /* Render QR image as base64 PNG */
            const qrImage = await QRCode.toDataURL(qrString, {
                errorCorrectionLevel: "M",
                type: "image/png",
                width: 300,
                margin: 2,
            });

            const expiresAt = new Date(Date.now() + bakongConfig.bakong.qrExpirationSeconds * 1000);

            const transaction = await Transaction.create({
                md5Hash,
                qrString,
                amount: Number(amount),
                currency: currency.toUpperCase(),
                description: description ?? "",
                status: "PENDING",
                expiresAt,
            });

            logger.success("Bakong QR generated:", { transactionId: transaction._id, md5Hash });

            return res.status(200).json({
                success: true,
                transactionId: transaction._id,
                md5Hash,
                qrString,
                qrImage,
                expiresAt: expiresAt.toISOString(),
                currency: currency.toUpperCase(),
                amount: Number(amount),
            });

        } catch (error) {
            logger.error("Error generating Bakong QR:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /* Bakong start polling */
    async startBakongPolling(req, res) {
        try {
            const { transactionId } = req.body;
            if (!transactionId) {
                return res.status(400).json({ success: false, message: "transactionId is required" });
            }

            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({ success: false, message: "Transaction not found" });
            }
            if (transaction.status !== "PENDING") {
                return res.json({ success: true, message: "Already settled", status: transaction.status });
            }

            /* Stop any existing poller for this transaction */
            if (pollers.has(transactionId)) {
                clearInterval(pollers.get(transactionId));
            }

            const intervalId = setInterval(async () => {
                try {
                    const tx = await Transaction.findById(transactionId);
                    if (!tx || tx.status !== "PENDING") {
                        clearInterval(intervalId);
                        pollers.delete(transactionId);
                        return;
                    }

                    if (new Date() > tx.expiresAt) {
                        await Transaction.findByIdAndUpdate(transactionId, { status: "TIMEOUT" });
                        clearInterval(intervalId);
                        pollers.delete(transactionId);
                        logger.info("Bakong QR expired:", transactionId);
                        return;
                    }

                    const result = await this._checkBakongPayment(tx.md5Hash);

                    if (result.paid) {
                        await Transaction.findByIdAndUpdate(transactionId, {
                            status: "SUCCESS",
                            paymentData: result.data,
                        });
                        clearInterval(intervalId);
                        pollers.delete(transactionId);
                        logger.success("Bakong payment SUCCESS:", transactionId);
                    } else if (result.failed) {
                        await Transaction.findByIdAndUpdate(transactionId, { status: "FAILED" });
                        clearInterval(intervalId);
                        pollers.delete(transactionId);
                    }

                } catch (err) {
                    logger.error("Bakong poll tick error will retry:", err.message);
                }
            }, bakongConfig.bakong.pollIntervalMs);

            pollers.set(transactionId, intervalId);
            logger.info("Bakong polling started:", transactionId);

            return res.status(200).json({ success: true, message: "Polling started", transactionId });

        } catch (error) {
            logger.error("Error starting Bakong polling:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }


    /* Bakong Get payment status */
    async getBakongStatus(req, res) {
        try {
            const { transactionId } = req.body;
            if (!transactionId) {
                return res.status(400).json({ success: false, message: "transactionId is required" });
            }

            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({ success: false, message: "Transaction not found" });
            }

            return res.status(200).json({
                success: true,
                transactionId: transaction._id,
                status: transaction.status,  /* For status bakong: PENDING, SUCCESS, FAILED, TIMEOUT */
                amount: transaction.amount,
                currency: transaction.currency,
                paymentData: transaction.paymentData ?? null,
                expiresAt: transaction.expiresAt,
            });

        } catch (error) {
            logger.error("Error getting Bakong status:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /* Bakong Check md5 */
    async checkBakongByMD5(req, res) {
        try {
            const { md5 } = req.body;
            if (!md5) return res.status(400).json({ success: false, message: "md5 is required" });

            const result = await this._checkBakongPayment(md5);
            return res.status(200).json({ success: true, ...result });

        } catch (error) {
            logger.error("Error checking Bakong MD5:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /* qrString verify KHQR */
    async verifyBakongQR(req, res) {
        try {
            const { qrString } = req.body;
            if (!qrString) return res.status(400).json({ success: false, message: "qrString is required" });

            const result = BakongKHQR.verify(qrString);

            return res.status(200).json({
                success: true,
                isValid: result.isValid,
                message: result.isValid ? "QR is valid" : "QR is invalid",
            });

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }


    /* Check payment by md5 */
    async _checkBakongPayment(md5Hash) {
        const url = `${bakongConfig.bakong.apiUrl.replace(/\/$/, "")}/v1/check_transaction_by_md5`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${bakongConfig.bakong.token}`,
            },
            body: JSON.stringify({ md5: md5Hash }),
        });

        const data = await response.json();
        logger.info("Bakong API:", { md5Hash, responseCode: data.responseCode, message: data.responseMessage });

        /* if responseCode 0 = paid */
        if (data.responseCode === 0 && data.data) {
            return { paid: true, pending: false, failed: false, data: data.data };
        }

        const msg = (data.responseMessage || "").toLowerCase();
        if (msg.includes("not found") || response.status === 404) {
            return { paid: false, pending: true, failed: false, data: null };
        }

        return { paid: false, pending: false, failed: false, data: null };
    }

    


  // Generate QR for ACLEDA payment
  async generateAcleadaQR(req, res) {
    try {
      const { amount, order_id } = req.body;

      const response = await axios.post(
        "https://payment.acledabank.com.kh/api/v1/qr/generate",
        {
          merchant_id: process.env.ACLEDA_MERCHANT_ID,
          amount: amount,
          currency: "KHR",
          order_id: order_id
        },
        {
          headers: {
            "API-KEY": process.env.ACLEDA_API_KEY,
            "SECRET-KEY": process.env.ACLEDA_SECRET_KEY
          }
        }
      );

      res.json(response.data);

    } catch (err) {
      res.status(500).json(err.response?.data || err.message);
    }
  }

  // Polling for ACLEDA payment status (this is a simple implementation, you can enhance it with better scheduling or webhooks if ACLEDA supports)
  async startAcleadaPolling(req, res) {
    const { order_id } = req.body;

    // You can implement interval checking here
    res.json({
      message: "Polling started",
      order_id
    });
  }

  //  Check Status by Order ID
  async getAcleadaStatus(req, res) {
    try {
      const { order_id } = req.body;

      const response = await axios.post(
        "https://payment.acledabank.com.kh/api/v1/status",
        {
          merchant_id: process.env.ACLEDA_MERCHANT_ID,
          order_id: order_id
        },
        {
          headers: {
            "API-KEY": process.env.ACLEDA_API_KEY,
            "SECRET-KEY": process.env.ACLEDA_SECRET_KEY
          }
        }
      );

      res.json(response.data);

    } catch (err) {
      res.status(500).json(err.response?.data || err.message);
    }
  }

  // Check by Order ID (for ACLEDA)
  async checkAcleadaByOrder(req, res) {
    const { order_id } = req.body;

    // Query your DB or ACLEDA API
    res.json({
      order_id,
      status: "PAID"
    });
  }

  // Verify QR string (for ACLEDA, this might involve decoding the QR and checking its signature or format)
  async verifyAcleadaQR(req, res) {
    const { qr_string } = req.body;

    // Verify logic or decode KHQR
    res.json({
      valid: true,
      qr_string
    });
  }



}

export default new PaymentController();