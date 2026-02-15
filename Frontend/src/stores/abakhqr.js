import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAbakhqrStore = defineStore('abakhqr', () => {
    const input = ref('')
    const storedCodes = ref([])
    const qrData = ref(null)
    const isLoading = ref(false)
    const error = ref(null)
    const amountKHR = ref(1000)
    const merchantName = ref('eROXI Sabay Pay')

    const appendDigit = (d) => {
        // limit to 2 characters (max 99)
        if (input.value.length >= 2) return
        input.value = `${input.value}${d}`
    }

    const clear = () => {
        input.value = ''
    }

    const removeLast = () => {
        input.value = input.value.slice(0, -1)
    }

    const generateQRCode = async (code) => {
        isLoading.value = true
        try {
            // Build a simple payload for preview: merchant|amount|code
            const payload = `${merchantName.value}|${amountKHR.value}KHR|code:${code}`
            // Use a simple public QR generator endpoint for preview
            qrData.value = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`
        } catch (e) {
            error.value = e
        } finally {
            isLoading.value = false
        }
    }

    const enter = async () => {
        const code = input.value.trim()
        if (!code) return
        // normalize: ensure max 2 digits and numeric
        const normalized = code.slice(0, 2)

        // remove existing occurrence to avoid duplicates
        const existingIndex = storedCodes.value.indexOf(normalized)
        if (existingIndex !== -1) storedCodes.value.splice(existingIndex, 1)

        // store at front
        storedCodes.value.unshift(normalized)
        // keep only recent 6 entries
        if (storedCodes.value.length > 6) storedCodes.value.pop()
        await generateQRCode(normalized)
        input.value = ''
    }

    const selectCode = async (code) => {
        const normalized = String(code).slice(0,2)
        // if exists remove and move to front
        const idx = storedCodes.value.indexOf(normalized)
        if (idx !== -1) storedCodes.value.splice(idx, 1)
        storedCodes.value.unshift(normalized)
        if (storedCodes.value.length > 6) storedCodes.value.pop()
        await generateQRCode(normalized)
    }

    const removeCode = (code) => {
        const normalized = String(code).slice(0,2)
        const idx = storedCodes.value.indexOf(normalized)
        if (idx !== -1) storedCodes.value.splice(idx, 1)
        // if removed was the current displayed code, clear QR
        if (!storedCodes.value.length) {
            qrData.value = null
        }
    }

    const clearRecent = () => {
        storedCodes.value = []
        qrData.value = null
    }

    return {
        input,
        storedCodes,
        qrData,
        isLoading,
        error,
        amountKHR,
        merchantName,
        appendDigit,
        clear,
        removeLast,
        enter,
        generateQRCode,
        selectCode,
    }
})
