import { defineStore } from "pinia";
import api from "@/api/api";
import QRCode from "qrcode";
import { ref } from "vue";

export const useBakongkhqrStore = defineStore("bakongkhqr", () => {
	const qrData = ref(null);
	const currentTransaction = ref(null);
	const isLoading = ref(false);
	const error = ref(null);

	const generateBakongQRCode = async (amount) => {
		isLoading.value = true;
		error.value = null;
		qrData.value = null;
		currentTransaction.value = null;

		try {
			const response = await api.post("/payment/generateBakongQR", {
				amount,
				currency: "KHR",
				description: "Bakong KHQR payment",
			});

			const payload = response.data || {};
			const qrString = payload.qrString || payload.qr_string || null;
			const qrImage = payload.qrImage || payload.qr_image || null;

			if (payload.success === false) {
				throw new Error(payload.message || payload.error || "Failed to generate Bakong QR code");
			}

			if (!qrString && !qrImage) {
				throw new Error("Missing Bakong QR data from server");
			}

			if (qrImage) {
				qrData.value = qrImage;
			} else {
				qrData.value = await QRCode.toDataURL(qrString, {
					width: 256,
					margin: 1,
				});
			}

			currentTransaction.value = {
				transaction_id: payload.transactionId,
				md5_hash: payload.md5Hash,
				merchant_name: payload.merchant_name || "Bakong Merchant",
				amount: payload.amount,
				currency: payload.currency,
				qr_string: qrString,
				qr_image: qrImage || qrData.value,
				status: "PENDING",
				expires_at: payload.expiresAt,
			};

			return payload;
		} catch (err) {
			error.value = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to generate Bakong QR code";
			throw err;
		} finally {
			isLoading.value = false;
		}
	};

	const resetQRData = () => {
		qrData.value = null;
		currentTransaction.value = null;
		error.value = null;
	};

	return {
		qrData,
		currentTransaction,
		isLoading,
		error,
		generateBakongQRCode,
		resetQRData,
	};
});