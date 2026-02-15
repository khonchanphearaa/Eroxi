import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api/api'

export const useAbakhqrStore = defineStore('abakhqr', () => {
    const QRCodeData = ref(null);
    const isLoading = ref(false);
    const error = ref(null);

    /* Generate QRCode */
    const generateQRCode = async ()
    
});
