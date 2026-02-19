import abaServer from "../servers/abaServer.js";
import abaConfig from "../config/aba.config.js";
import acledaServer from "../servers/acledaServer.js";
import acledaConfig from "../config/acleda.config.js";
import { generateRequestTime, generateQRHash, generateCheckTransactionHash, generateTransactionId } from "../utils/hashGenerator.js";
import logger from "../utils/logger.js";

class PaymentController{

    /* Generate QRCode */
    async genearteQRCode(req, res){
        try {
            const {
                amount,
                currency = 'KHR',
                first_name,
                last_name,
                email,
                phone,
                purchase_type = 'purchase',
                payment_option = 'abapay_khqr',
                items,
                callback_url,
                return_deeplink,
                custom_fields,
                return_params,
                payout,
                lifetime,
                qr_image_template
            } = req.body;
            
            const req_time = generateRequestTime();
            const tran_id = generateTransactionId();
            // choose provider based on payment_option
            const provider = payment_option === 'acleda_khqr' ? { server: acledaServer, config: acledaConfig } : { server: abaServer, config: abaConfig };

            const payload = {
                req_time,
                merchant_id: provider.config.merchantId,
                tran_id,
                amount,
                items: items ?? '',
                first_name: first_name ?? '',
                last_name: last_name ?? '',
                email: email ?? '',
                phone: phone ?? '',
                purchase_type,
                payment_option,
                callback_url: callback_url ?? '',
                return_deeplink: return_deeplink ?? '',
                currency,
                custom_fields: custom_fields ?? '',
                return_params: return_params ?? '',
                payout: payout ?? '',
                lifetime: lifetime ?? provider.config.defaultLifetime,
                qr_image_template: qr_image_template ?? provider.config.defaultTemplate
            };

            // if provider apiKey missing, allow a development mock so local dev works
            let providerResponse;
            if (!provider.config.apiKey) {
                if (process.env.NODE_ENV === 'development') {
                    // create a mock successful response
                    providerResponse = {
                        status: { code: '0', message: 'mock success' },
                        qrString: `DEMO_QR_${tran_id}`,
                        qrImage: null,
                        abapay_deeplink: null,
                        app_store: null,
                        play_store: null
                    };
                    logger.info('Using development mock provider response for', payment_option);
                } else {
                    throw new Error(`Missing API key for provider (${payment_option}). Please set the provider API key in environment variables.`);
                }
            } else {
                payload.hash = generateQRHash(payload, provider.config.apiKey);
                providerResponse = await provider.server.generateQRCode(payload);
            }

            /* Check if provider response indicates success (status.code === '0') */
            if (providerResponse.status?.code === '0') {
                logger.success('QRCode generated success: ', providerResponse);
                return res.status(200).json({
                    success: true,
                    merchant_id: provider.config.merchantId,
                    tran_id,
                    amount,
                    currency,
                    payment_option,
                    qrString: providerResponse.qrString,
                    qrImage: providerResponse.qrImage,
                    abapay_deeplink: providerResponse.abapay_deeplink,
                    app_store: providerResponse.app_store,
                    play_store: providerResponse.play_store,
                    status: providerResponse.status
                });
            }

            throw new Error('Failed to generate QRCode: ' + providerResponse.status?.message);
        } catch (error) {
            logger.error('Error generating QRCode:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: error.message,
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        }
    }

    /* Check transaction status */
    async checkTransaction(req, res){
        try {
            const {tran_id} = req.body;
            const req_time = generateRequestTime();
            const provider = req.body.payment_option === 'acleda_khqr' ? { server: acledaServer, config: acledaConfig } : { server: abaServer, config: abaConfig };
            let providerResponse;
            if (!provider.config.apiKey) {
                if (process.env.NODE_ENV === 'development') {
                    providerResponse = { status: { code: '0', message: 'mock check success' }, tran_id, paid: false };
                    logger.info('Using development mock checkTransaction for', req.body.payment_option);
                } else {
                    throw new Error(`Missing API key for provider. Please set the provider API key in environment variables.`);
                }
            } else {
                const hash = generateCheckTransactionHash(req_time, provider.config.merchantId, tran_id, provider.config.apiKey)
                const payload={
                    req_time,
                    merchant_id: provider.config.merchantId,
                    tran_id,
                    hash,
                }
                providerResponse = await provider.server.checkTransaction(payload);
            }
            logger.info('Provider Check Transaction Response:', tran_id);
            return res.status(200).json({
                success: true,
                data : providerResponse
            })
        } catch (error) {
            logger.error('Error checking transaction:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: error.message,
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        }
    }

    /* Close transaction status*/
    async closeTransaction(req, res){
        try {
            const {tran_id} = req.body;
            const req_time = generateRequestTime();
            const provider = req.body.payment_option === 'acleda_khqr' ? { server: acledaServer, config: acledaConfig } : { server: abaServer, config: abaConfig };
            let providerResponse;
            if (!provider.config.apiKey) {
                if (process.env.NODE_ENV === 'development') {
                    providerResponse = { status: { code: '0', message: 'mock close success' }, tran_id, closed: true };
                    logger.info('Using development mock closeTransaction for', req.body.payment_option);
                } else {
                    throw new Error(`Missing API key for provider. Please set the provider API key in environment variables.`);
                }
            } else {
                const hash = generateCheckTransactionHash(req_time, provider.config.merchantId, tran_id, provider.config.apiKey)
                const payload={
                    req_time,
                    merchant_id: provider.config.merchantId,
                    tran_id,
                    hash,
                }
                providerResponse = await provider.server.closeTransaction(payload);
            }
            logger.success('Provider Close transaction response:', providerResponse);
            return res.status(200).json({
                success: true,
                data: providerResponse
            })
        } catch (error) {
            logger.error('Error closing transaction:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: error.message,
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        }
    }
}

export default new PaymentController();