import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api/api'

export const useAbakhqrStore = defineStore('abakhqr', () => {
    const QRCodeData = ref(null);
    const isLoading = ref(false);
    const error = ref(null);

    /* Generate QRCode */
    const generateQRCode = async (paymentData) =>{
        try {
            isLoading.value = true;
            error.value = null;
            try {
                let res = await api.post('/payment/generate-qr', {
                    
                });

            } catch (error) {
                
            }
        } catch (error) {
            
        }
    }
    
});
