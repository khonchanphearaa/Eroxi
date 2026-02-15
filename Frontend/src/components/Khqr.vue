<template>
  <div class="max-w-md mx-auto text-center">
    <div class="flex items-center justify-center">
      <img v-if="store.qrData" :src="store.qrData" class="w-150 h-150 object-contain" alt="Scannable QR Code"
        style="image-rendering: pixelated; image-rendering: crisp-edges;" />

      <div v-else-if="store.isLoading"
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
    <div v-if="store.error" class="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
      <p class="text-red-400 text-sm text-center">{{ store.error }}</p>
    </div>
  </div>
</template>

<script setup>
import { useAbakhqrStore } from '@/stores/abakhqr'
import { PictureInPicture } from 'lucide-vue-next';
const store = useAbakhqrStore()

</script>

<style scoped>
/* Ensure QR code is crisp and scannable */
img[alt="Scannable QR Code"] {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>