import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import {validateGenerateQRCode, validatCheckTransaction} from '../middlewares/validator.js';

const router = express.Router();

/* POST /api/payment/generate-qr, Under the same */
router.post('/generate-qr', validateGenerateQRCode, (req, res) => paymentController.genearteQRCode(req, res));
router.post('/check-transaction', validatCheckTransaction, (req, res) => paymentController.checkTransaction(req, res));
router.post('/close-transaction', validatCheckTransaction, (req, res) => paymentController.closeTransaction(req, res));

export default router;