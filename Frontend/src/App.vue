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
  </div>
</template>

<script setup>
import Keypad from './components/Keypadd.vue'
import KhqrDisplay from './components/Khqr.vue'
</script>

<style scoped>
/* Remove number input arrows */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>