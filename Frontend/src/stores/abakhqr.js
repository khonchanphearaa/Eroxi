import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import QRCode from 'qrcode'
import api from '@/api/api'

export const useAbakhqrStore = defineStore('abakhqr', () => {
    const input = ref('')
    const qrData = ref(null)
    const currentTransaction = ref(null)
    const storedCodes = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    const token = ref(null)
    const selectedProvider = ref('abapay_khqr')

    const merchantName = computed(() => {
        return currentTransaction.value?.merchant_id
    })

    const amountKHR = computed(() => {
        return currentTransaction.value?.amount || '0.00'
    })

    // Calculate actual amount (input × 100)
    const actualAmount = computed(() => {
        return input.value ? parseInt(input.value) * 100 : 0
    })

    
    // Function for appending digits (0-9) is Keypad
    const appendDigit = (digit) => {
        const newValue = input.value + digit.toString()
        const numValue = parseInt(newValue)
        /* The number is enter 99 */
        if (numValue <= 99) {
            input.value = newValue
            error.value = null
        }
    }

    // Function for clears
    const clear = () => {
        input.value = ''
        error.value = null
    }

    // Enter function to generate QR code
    const enter = async () => {
        if (!input.value || parseInt(input.value) <= 0) {
            error.value = 'Please enter a valid amount'
            return
        }
        const inputValue = parseInt(input.value)
        const amount = inputValue * 100 
        console.log(` Input: ${inputValue} → Amount: ${amount} KHR`)

        try {
            await generateQRCode(amount)
            if (!storedCodes.value.includes(input.value)) {
                storedCodes.value.unshift(input.value)
                if (storedCodes.value.length > 3) {
                    storedCodes.value.pop()
                }
            }

            console.log('✅ QR Generated for amount:', amount, 'KHR')

        } catch (err) {
            console.error('❌ Failed to generate QR:', err)
        }
    }


    // Generate QR code by calling the API and handling the response
    const generateQRCode = async (amount) => {
        isLoading.value = true
        error.value = null
        try {
            console.log('Generating QR for amount:', amount, 'KHR')

            const response = await api.post('/payment/generate-qr', {
                amount: amount,
                currency: 'KHR',
                first_name: 'new',
                last_name: 'guest',
                phone: '0123456789',
                email: 'example@example.com',
                payment_option: selectedProvider.value
            })

            console.log('API Response:', response.data)

            const payload = response.data || {}
            const qrString = payload.qrString || payload.qr_string || null
            const qrImage = payload.qrImage || payload.qr_image || null
            if (payload.success === false) {
                throw new Error(payload.error || 'Failed to generate QR code')
            }

            if (!qrString && !qrImage) {
                throw new Error('Missing QR data from server')
            }

            // Prefer server QR image; otherwise generate from qrString
            if (qrImage) {
                qrData.value = qrImage
            } else {
                qrData.value = await QRCode.toDataURL(qrString, {
                    width: 256,
                    margin: 1
                })
            }

            // Store full transaction data INCLUDING qr_string
            currentTransaction.value = {
                merchant_id: payload.merchant_id,
                tran_id: payload.tran_id,
                amount: payload.amount,
                currency: payload.currency,
                qr_string: qrString,
                qr_image: qrImage || qrData.value,
                abapay_deeplink: payload.abapay_deeplink,
                app_store: payload.app_store,
                play_store: payload.play_store,
                status: payload.status
            }

            /* Check bugs when log in browser console */
            console.log('QR Generated:', currentTransaction.value.tran_id)
            console.log('QR String:', currentTransaction.value.qr_string)
            return payload
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to generate QR code'
            error.value = errorMessage
            console.error('Generate QR Error:', errorMessage)
            throw err
        } finally {
            isLoading.value = false
        }
    }


    // Check transaction status by calling the API with the transaction ID
    const checkTransactionStatus = async (tran_id) => {
        try {
            console.log('🔍 Checking transaction:', tran_id)
            const response = await api.post('/payment/check-transaction', {
                tran_id,
                payment_option: selectedProvider.value
            })
            console.log('Transaction Status:', response.data)
            return response.data
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to check transaction'
            console.error('Check Transaction Error:', errorMessage)
            throw err
        }
    }

    // Close transaction by calling the API with the transaction ID
    const closeTransaction = async (tran_id) => {
        try {
            console.log('Closing transaction:', tran_id)

            const response = await api.post('/payment/close-transaction', {
                tran_id,
                payment_option: selectedProvider.value
            })
            console.log('Transaction Closed:', response.data)
            return response.data
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to close transaction'
            console.error('Close Transaction Error:', errorMessage)
            throw err
        }
    }

    const setProvider = (provider) => {
        selectedProvider.value = provider
    }

    /*  When a user clicks on a recent code, it populates the input 
    field with that code and clears any existing error messages. */
    const selectCode = (code) => {
        input.value = code
        error.value = null
    }

    // Remove a specific code from the recent codes list
    const removeCode = (code) => {
        storedCodes.value = storedCodes.value.filter(c => c !== code)
    }

    // Clear all recent codes from the list
    const clearRecent = () => {
        storedCodes.value = []
    }

    // Reset QR data and current transaction but keep recent codes
    const resetQRData = () => {
        input.value = ''
        qrData.value = null
        currentTransaction.value = null
        error.value = null
    }

    // Reset everything including input, QR data, current transaction, recent codes, and errors
    const resetAll = () => {
        input.value = ''
        qrData.value = null
        currentTransaction.value = null
        storedCodes.value = []
        error.value = null
    }

    return {
        // State
        input,
        qrData,
        currentTransaction,
        storedCodes,
        isLoading,
        error,
        token,

        // Computed
        merchantName,
        amountKHR,
        actualAmount,

        // Keypad Actions
        appendDigit,
        clear,
        enter,

        // API Actions
        generateQRCode,
        checkTransactionStatus,
        closeTransaction,
        setProvider,
        selectedProvider,

        // Recent Codes Actions
        selectCode,
        removeCode,
        clearRecent,
        resetQRData,
        resetAll
    }
})