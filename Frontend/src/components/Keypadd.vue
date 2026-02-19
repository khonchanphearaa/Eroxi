<template>
  <div class="w-full max-w-md mx-auto">
    <div class="mb-6">
      <div class="rounded-xl bg-[#0f1724] px-4 py-3 font-mono text-gray-100 shadow-inner">
        <!-- Main Input Display -->
        <div class="text-right text-3xl font-bold">
          {{ displayText }}
        </div>

        <!-- Actual Amount Display -->
        <div class="text-right text-sm text-teal-400 mt-2">
          {{ displayValue ? `= ${formatAmount(displayValue * 100)} KHR` : '' }}
        </div>
      </div>

      <div class="text-xs text-gray-400 mt-1 text-right">
        Input (Max 99) × 100 = Max 9,900 KHR
      </div>
    </div>

    <div class="grid grid-cols-3 gap-5">
      <!-- Numbers 1-9 -->
      <button v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="n" @click="press(n)" :disabled="isLoading"
        class="h-24 bg-[#1f2a33] rounded-lg shadow-2xl flex items-center justify-center text-white font-bold text-2xl hover:scale-[1.01] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
        {{ n }}
      </button>

      <!-- Bottom Row -->
      <button @click="clearAll" :disabled="isLoading"
        class="h-24 bg-[#3b2026] rounded-lg flex items-center justify-center text-red-400 font-bold hover:bg-[#4a2830] active:bg-[#5a3038] transition-colors disabled:opacity-50">
        Clear
      </button>

      <button @click="press(0)" :disabled="isLoading"
        class="h-24 bg-[#1f2a33] rounded-lg flex items-center justify-center text-white font-bold text-2xl hover:scale-[1.01] active:scale-[0.98] transition-transform disabled:opacity-50">
        0
      </button>

      <button @click="enter" :disabled="isLoading || !store.input"
        class="h-24 bg-[#0f3b2d] rounded-lg flex items-center justify-center text-green-300 font-bold hover:bg-[#1a4d3a] active:bg-[#255547] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {{ isLoading ? '...' : 'Enter' }}
      </button>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="mt-4 flex items-center justify-center gap-2 text-blue-400">
      <span class="text-sm">Generating QR Code...</span>
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAbakhqrStore } from '@/stores/abakhqr'
import { useBakongkhqrStore } from '@/stores/bakongkhqr'

const store = useAbakhqrStore()
const bakongStore = useBakongkhqrStore()
const isLoading = computed(() => store.selectedProvider === 'bakong_khqr' ? bakongStore.isLoading : store.isLoading)

const press = (d) => store.appendDigit(d)
const clearAll = () => store.clear()
const enter = () => store.enter()

const displayText = computed(() => store.input || '-')
const displayValue = computed(() => parseInt(store.input) || 0)

// Format number with comma separators
const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-US').format(amount)
}
</script>

<style scoped>
/* Keypad button animations */
button {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
</style>