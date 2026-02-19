<template>
  <div class="max-w-md mx-auto text-center">
    <div class="flex items-center justify-center">
      <div v-if="activeQrData && isBakongSelected" class="w-90 rounded-3xl overflow-hidden bg-gray-100 shadow-2xl text-left">
        <div class="relative bg-red-600 h-16 flex items-center justify-center">
          <div class="text-white text-2xl font-semibold tracking-[0.2em]">KHQR</div>
          <div class="absolute -bottom-px right-0 w-0 h-0"
            style="border-left: 42px solid transparent; border-top: 42px solid rgb(243 244 246);"></div>
        </div>

        <div class="px-8 pt-6 pb-5">
          <div class="text-[20px] text-black">{{ bakongMerchantName }}</div>
          <div class="mt-3 flex items-end gap-2">
            <div class="text-[48px] leading-none font-bold text-black">{{ bakongAmount }}</div>
            <div class="text-[30px] leading-none text-black pb-1">{{ bakongCurrency }}</div>
          </div>
        </div>

        <div class="mx-0 border-t border-dashed border-gray-500/70"></div>

        <div class="px-8 py-6 flex items-center justify-center">
          <img :src="activeQrData" class="w-56 h-56 object-contain" alt="Scannable QR Code"
            style="image-rendering: pixelated; image-rendering: crisp-edges;" />
        </div>
      </div>

      <img v-else-if="activeQrData" :src="activeQrData" class="w-150 h-150 object-contain" alt="Scannable QR Code"
        style="image-rendering: pixelated; image-rendering: crisp-edges;" />

      <div v-else-if="activeIsLoading"
        class="w-56 h-56 flex flex-col items-center justify-center gap-3 text-blue-400 border-2 border-dashed border-gray-300 rounded">
        <svg class="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <div class="text-sm text-blue-400">Loading...</div>
      </div>

      <div v-else
        class="w-56 h-56 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded">
        <div class="text-center">
          <PictureInPicture :size="100" />
          <div class="text-xs text-gray-500">
            <h2 class="text-lg">Scan QR Code</h2>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="activeError" class="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
      <p class="text-red-400 text-sm text-center">{{ activeError }}</p>
    </div>

      <!-- Bank Options (under QR) -->
      <div class="mt-6 space-y-3 max-w-md mx-auto">
        <div v-for="b in banks" :key="b.id" @click="selectBank(b.id)"
          :class="['flex items-center justify-between gap-3 p-3 rounded-xl border', selectedBank === b.id ? 'border-yellow-300 bg-blue-200' : 'border-yellow-100 bg-black']"
          style="cursor: pointer;">
          <div class="flex items-center gap-3">
            <img :src="b.icon" alt="" class="w-12 h-12 rounded-md object-contain" />
            <div class="text-left">
              <div class="font-medium text-sm">{{ b.title }}</div>
              <div class="text-xs text-gray-500">Scan for payment with {{ b.title }}</div>
            </div>
          </div>

          <div class="flex items-center justify-center">
            <div :class="['w-5 h-5 rounded-full border flex items-center justify-center', selectedBank === b.id ? 'border-yellow-300' : 'border-gray-300']">
              <div v-if="selectedBank === b.id" class="w-2 h-2 rounded-full bg-yellow-400"></div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { useAbakhqrStore } from '@/stores/abakhqr'
import { useBakongkhqrStore } from '@/stores/bakongkhqr'
import { PictureInPicture } from 'lucide-vue-next';
  import { computed, ref } from 'vue'

  const wingIcon = new URL('@/assets/images/wing.png', import.meta.url).href
  const acledaIcon = new URL('@/assets/images/acleda.png', import.meta.url).href
  const bakongIcon = new URL('@/assets/images/bakong.png', import.meta.url).href
const store = useAbakhqrStore()
const bakongStore = useBakongkhqrStore()

const isBakongSelected = computed(() => store.selectedProvider === 'bakong_khqr')
const activeQrData = computed(() => isBakongSelected.value ? bakongStore.qrData : store.qrData)
const activeIsLoading = computed(() => isBakongSelected.value ? bakongStore.isLoading : store.isLoading)
const activeError = computed(() => isBakongSelected.value ? bakongStore.error : store.error)
const bakongMerchantName = computed(() => bakongStore.currentTransaction?.merchant_name || 'Bakong Merchant')
const bakongCurrency = computed(() => bakongStore.currentTransaction?.currency || 'KHR')
const bakongAmount = computed(() => {
  const amount = Number(bakongStore.currentTransaction?.amount || 0)
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)
})

  const selectedBank = ref(null)

  const banks = [
    { id: 'wing', title: 'Wing Bank', icon: wingIcon },
    { id: 'acleda', title: 'ACLEDA', icon: acledaIcon },
    { id: 'bakong', title: 'Bakong (KHQR)', icon: bakongIcon }
  ]


  const selectBank = async (id) => {
    selectedBank.value = id

    const map = {
      wing: 'wing_khqr',
      acleda: 'acleda_khqr',
      bakong: 'bakong_khqr'
    }

    const provider = map[id] || 'abapay_khqr'
    store.setProvider(provider)

    store.resetQRData()
    bakongStore.resetQRData()

    const inputValue = parseInt(store.input)
    if (inputValue > 0) {
      const amount = inputValue * 100
      if (provider === 'bakong_khqr') {
        await bakongStore.generateBakongQRCode(amount)
      } else {
        await store.generateQRCode(amount)
      }
    }
  }

</script>

<style scoped>
/* Ensure QR code is crisp and scannable */
img[alt="Scannable QR Code"] {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>