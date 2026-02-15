<template>
  <div class="w-full max-w-md mx-auto">
    <div class="mb-6">
        <div class="rounded-xl bg-[#0f1724] px-4 py-3 text-right font-mono text-2xl text-gray-100 shadow-inner">{{ displayText }}</div>
        <div class="text-xs text-gray-400 mt-1 text-right">Input (Max 99)</div>
      </div>

      <div class="grid grid-cols-3 gap-5">
        <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" @click="press(n)"
          class="h-24 bg-[#1f2a33] rounded-lg shadow-2xl flex items-center justify-center text-white font-bold text-2xl hover:scale-[1.01] transition-transform">{{ n }}</button>

        <button @click="clearAll" class="h-24 bg-[#3b2026] rounded-lg flex items-center justify-center text-red-400 font-bold">CLR</button>
        <button @click="press(0)" class="h-24 bg-[#1f2a33] rounded-lg flex items-center justify-center text-white font-bold text-2xl">0</button>
        <button @click="enter" class="h-24 bg-[#0f3b2d] rounded-lg flex items-center justify-center text-green-300 font-bold">ENT</button>
      </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAbakhqrStore } from '@/stores/abakhqr'

const store = useAbakhqrStore()

const press = (d) => store.appendDigit(d)
const clearAll = () => store.clear()
const enter = () => store.enter()

const displayText = computed(() => store.input || '-')
</script>

<style scoped>
/* simple styling to approximate the design */
</style>
