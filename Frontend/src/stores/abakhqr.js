import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api/api'

export const useAbakhqrStore = defineStore('abakhqr', () => {
    const abakhqr = ref({
        "merchant_id": "string",
        "tran_id": "string",
        "amount": 0,
        "currency": "string",
        "qr_code": "string",
        "status": "string"
    });

    const getAbakhqr = async () => {
        try {
            let res = await api.get('payment-gateway/v1/payments/generate-qr')
            abakhqr.value = res.data
        } catch (error) {
            console.error("Get ABA khqr error:", error);   
        }
    }

    return { abakhqr, getAbakhqr }
});
