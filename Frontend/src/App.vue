<template>
  <div class="flex h-screen w-screen bg-[#0b1020] text-white">
    <div class="w-1/2 p-12 border-r border-gray-800 flex items-center justify-center">
      <div class="w-full max-w-lg">
        <div class="mb-8">
          <h1 class="text-3xl font-bold tracking-wider">Enter code on keypad to store</h1>
        </div>

        <Keypad />
      </div>
    </div>

    <div class="w-1/2 p-12 flex items-center justify-center">
      <KhqrDisplay />
    </div>
  </div>
</template>

<script setup>
import Keypad from './components/keypad.vue'
import KhqrDisplay from './components/Khqr.vue'
</script>

<style scoped>
/* remove number input arrows if any other inputs added later */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>