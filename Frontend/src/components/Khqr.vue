<template>
  <div class="max-w-md mx-auto text-center">
    <h2 class="text-2xl font-bold text-white mb-4">QRKH Storage</h2>

    <div class="p-0 rounded-2xl border border-gray-700 bg-[#0b0f1a] inline-block shadow-lg overflow-hidden">
      <!-- red top header with notch -->
      <div class="khqr-header p-4 text-center text-white font-semibold relative">KHQR
        <div class="khqr-notch" aria-hidden="true"></div>
      </div>

      <div class="p-6">
        <div class="mb-4">
          <div class="w-64 bg-white rounded-lg p-4 inline-block shadow-inner relative">
            <!-- merchant name and amount inside the white card -->
            <div class="text-left text-black">
              <div class="text-sm font-medium">{{ store.merchantName }}</div>
              <div class="text-2xl font-bold mt-1">{{ store.amountKHR }} <span class="text-sm font-medium">KHR</span></div>
            </div>

            <div class="my-3 border-t border-dashed border-gray-300"></div>

            <div class="flex items-center justify-center relative">
              <img v-if="store.qrData" :src="store.qrData" class="w-48 h-48 object-contain" />
              <div v-else class="w-48 h-48 flex items-center justify-center text-gray-400">QR</div>

              <!-- center badge over QR area -->
              <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-red-500 border-4 border-white flex items-center justify-center">
                <div class="text-white font-bold text-sm">e</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 text-sm text-gray-400 text-left">Stored Code</div>
        <div class="mt-2 inline-block bg-[#0b1720] px-4 py-2 rounded-md text-2xl font-bold text-teal-300 border border-gray-800">
          {{ latestCode || '-' }}
        </div>

        
       
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAbakhqrStore } from '@/stores/abakhqr'

const store = useAbakhqrStore()

const latestCode = computed(() => (store.storedCodes.length ? store.storedCodes[0] : null))

const select = (code) => {
  store.selectCode(code)
}

const remove = (code) => {
  store.removeCode(code)
}

const clearAll = () => {
  store.clearRecent()
}
</script>

<style scoped>
/* minimal component styles — final polish via Tailwind in App */
.khqr-header{
  background: #e11d2b; /* red */
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  padding: 12px 20px;
  font-size: 14px;
  position: relative;
}
.khqr-header .khqr-notch{
  position: absolute;
  width: 40px;
  height: 26px;
  right: -10px;
  bottom: -9px; /* pull down to overlap the white card */
  background: #e11d2b; /* same as inner card */
  transform: rotate(25deg);
  border-bottom-right-radius: 6px; /* rounded outer corner */
  box-shadow: 0 1px 0 rgba(0,0,0,0.06);
  z-index: 3;
}
.khqr-header {
  overflow: visible;
}

/* ensure white card sits under the notch visually */
.w-64.bg-white {
  position: relative;
  z-index: 1;
}
</style>
