<template>
  <div class="flex h-screen w-screen bg-[#0b1020] text-white overflow-hidden">
    <!-- Left Side - Keypad -->
    <div class="w-1/2 p-8 border-r border-gray-800 flex items-center justify-center">
      <div class="w-full max-w-lg">
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold tracking-wider text-white">Enter Amount</h1>
          <p class="text-gray-400 text-sm mt-2">Use keypad to enter payment amount</p>
        </div>

        <Keypad />
      </div>
    </div>

    <!-- Right Side - QR Display -->
    <div class="w-1/2 p-8 flex items-center justify-center overflow-y-auto">
      <KhqrDisplay />
    </div>

    <BaseModal :isOpen="isThankYouModalOpen" @close="closeThankYouModal">
      <div class="text-center pt-3 pb-1">
        <img
          :src="thankYouImage"
          alt="Thank you"
          class="mx-auto mb-4 h-28 w-auto object-contain"
        />
        <h2 class="text-2xl font-semibold text-gray-900">Thank you</h2>
        <p class="mt-2 text-gray-600">Payment successful.</p>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import Keypad from './components/Keypadd.vue'
import KhqrDisplay from './components/Khqr.vue'
import BaseModal from './components/ui/BaseModal.vue'
import { useAbakhqrStore } from './stores/abakhqr'
import { useBakongkhqrStore } from './stores/bakongkhqr'
import thankYouImage from './assets/thankyou.png'

const store = useAbakhqrStore()
const bakongStore = useBakongkhqrStore()
const isThankYouModalOpen = ref(false)
let pollTimer = null
let isChecking = false
let modalAutoCloseTimer = null

const clearModalAutoCloseTimer = () => {
  if (modalAutoCloseTimer) {
    clearTimeout(modalAutoCloseTimer)
    modalAutoCloseTimer = null
  }
}

const startModalAutoCloseTimer = () => {
  clearModalAutoCloseTimer()
  modalAutoCloseTimer = setTimeout(() => {
    isThankYouModalOpen.value = false
    modalAutoCloseTimer = null
  }, 7000)
}

const closeThankYouModal = () => {
  clearModalAutoCloseTimer()
  isThankYouModalOpen.value = false
}

const clearPoller = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  isChecking = false
}

const isPaidTransaction = (response) => {
  const payload = response?.data ?? response
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const paidWords = ['paid', 'approved', 'completed', 'successful']
  const pendingWords = ['pending', 'processing', 'created', 'initiated', 'waiting']

  const traverse = (value, key = '', depth = 0) => {
    if (depth > 5 || value == null) {
      return false
    }

    if (typeof value === 'boolean') {
      return (key.includes('paid') || key.includes('success')) && value === true
    }

    if (typeof value === 'string') {
      const normalized = value.toLowerCase()
      const isPending = pendingWords.some((word) => normalized.includes(word))
      const isPaid = paidWords.some((word) => normalized.includes(word))
      return key.includes('status') && isPaid && !isPending
    }

    if (Array.isArray(value)) {
      return value.some((item) => traverse(item, key, depth + 1))
    }

    if (typeof value === 'object') {
      return Object.entries(value).some(([childKey, childValue]) => {
        const normalizedKey = childKey.toLowerCase()
        return traverse(childValue, normalizedKey, depth + 1)
      })
    }

    return false
  }

  return traverse(payload)
}

const handleAbaPaymentSuccess = async (tranId) => {
  clearPoller()

  try {
    await store.closeTransaction(tranId)
  } catch (error) {
    console.warn('Unable to close ABA transaction after success:', error)
  }

  store.clear()
  store.resetQRData()
  isThankYouModalOpen.value = true
  startModalAutoCloseTimer()
}

const handleBakongPaymentSuccess = () => {
  clearPoller()
  store.clear()
  store.resetQRData()
  bakongStore.resetQRData()
  isThankYouModalOpen.value = true
  startModalAutoCloseTimer()
}

const startAbaPolling = (tranId) => {
  clearPoller()

  pollTimer = setInterval(async () => {
    if (isChecking) {
      return
    }

    isChecking = true
    try {
      const statusResponse = await store.checkTransactionStatus(tranId)
      if (isPaidTransaction(statusResponse)) {
        await handleAbaPaymentSuccess(tranId)
      }
    } catch (error) {
      console.error('ABA status polling error:', error)
    } finally {
      isChecking = false
    }
  }, 3000)
}

const startBakongPolling = (md5Hash) => {
  clearPoller()

  pollTimer = setInterval(async () => {
    if (isChecking) {
      return
    }

    isChecking = true
    try {
      const statusPayload = await bakongStore.checkBakongByMd5(md5Hash)
      const isSuccess = statusPayload?.success === true && statusPayload?.paid === true
      const isPending = statusPayload?.success === true && statusPayload?.pending === true

      if (isSuccess) {
        handleBakongPaymentSuccess()
      } else if (!isPending) {
        clearPoller()
      }
    } catch (error) {
      console.error('Bakong status polling error:', error)
    } finally {
      isChecking = false
    }
  }, 3000)
}

watch(
  () => ({
    provider: store.selectedProvider,
    abaTranId: store.currentTransaction?.tran_id,
    bakongMd5Hash: bakongStore.currentTransaction?.md5_hash
  }),
  ({ provider, abaTranId, bakongMd5Hash }) => {
    if (provider === 'abapay_khqr' && abaTranId) {
      startAbaPolling(abaTranId)
      return
    }

    if (provider === 'bakong_khqr' && bakongMd5Hash) {
      startBakongPolling(bakongMd5Hash)
      return
    }

    clearPoller()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  clearPoller()
  clearModalAutoCloseTimer()
})
</script>

<style scoped>
/* Remove number input arrows */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>