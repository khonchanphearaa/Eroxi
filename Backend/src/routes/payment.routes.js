import express from "express";
import PaymentController from "../controllers/payment.controller.js";

const router = express.Router();

/**
 * @ABApayway
 * This routes for handle payment qrString generation
 */
router.post("/generateQRCode",    PaymentController.genearteQRCode.bind(PaymentController));
router.post("/checkTransaction",  PaymentController.checkTransaction.bind(PaymentController));
router.post("/closeTransaction",  PaymentController.closeTransaction.bind(PaymentController));

/**
 * @BAKONG
 * These routes for handle Bakong QR generation and status checking
 * Note: Some routes are for debugging and may not be needed in production
 */
router.post("/generateBakongQR",       PaymentController.generateBakongQR.bind(PaymentController));
router.post("/bakong-polling",         PaymentController.startBakongPolling.bind(PaymentController));
router.post("/bakong-status",          PaymentController.getBakongStatus.bind(PaymentController));
router.post("/bakong-check-by-md5",    PaymentController.checkBakongByMD5.bind(PaymentController));
router.post("/bakong-verify-qr",       PaymentController.verifyBakongQR.bind(PaymentController));

/**
 * @ACLEDA
 * Routes for handling ACLEDA payment, QR generation, and status checking
 */

router.post(
  "/generateAcleadaQR",
  PaymentController.generateAcleadaQR.bind(PaymentController)
);

router.post(
  "/acleda-polling",
  PaymentController.startAcleadaPolling.bind(PaymentController)
);

router.post(
  "/acleda-status",
  PaymentController.getAcleadaStatus.bind(PaymentController)
);

router.post(
  "/acleda-check-by-order",
  PaymentController.checkAcleadaByOrder.bind(PaymentController)
);

router.post(
  "/acleda-verify-qr",
  PaymentController.verifyAcleadaQR.bind(PaymentController)
);



export default router;