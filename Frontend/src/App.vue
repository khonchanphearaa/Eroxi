<template>
  <div class="flex h-screen w-screen overflow-hidden bg-white">
    <div class="w-1/2 h-full flex flex-col justify-center px-12 lg:px-24 border-r border-gray-100">
      <div class="max-w-md w-full mx-auto">
        <div class="mb-8">
          <img src="https://www.ababank.com/typo3conf/ext/aba/Resources/Public/images/aba-logo.png" alt="ABA Logo"
            class="h-8 mb-4" />
          <h1 class="text-3xl font-bold text-gray-900">Payment Details</h1>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer Name</label>
            <input v-model="form.name" type="text"
              class="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#005a9c] focus:ring-0 outline-none transition-colors"
              placeholder="e.g. Sok Dara" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Amount (USD)</label>
            <input v-model="form.amount" type="number"
              class="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#005a9c] focus:ring-0 outline-none text-2xl font-bold text-[#005a9c]"
              placeholder="0.00" />
          </div>

          <button @click="generateQRCode"
            class="w-full bg-[#005a9c] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#004a80] active:bg-[#003a66] transition-colors shadow-lg">
            Generate QR Code
          </button>
        </div>
      </div>
    </div>

    <div class="w-1/2 h-full bg-gray-50 flex items-center justify-center">
      <div v-if="isGenerated" class="text-center">
        <div class="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 inline-block">
          <div class="mb-4">
            <span
              class="text-[10px] font-black bg-[#005a9c] text-white px-3 py-1 rounded-full uppercase tracking-tighter">ABA
              KHQR</span>
          </div>

          <div class="p-2 border-2 border-dashed border-gray-200 rounded-2xl">
            <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ABA_PAY_${form.amount}`" alt="QR"
              class="w-64 h-64" />
          </div>

          <div class="mt-6">
            <p class="text-gray-400 text-sm font-medium">Amount to pay</p>
            <p class="text-4xl font-black text-gray-900">${{ form.amount }}</p>
          </div>
        </div>

        <button @click="isGenerated = false" class="mt-8 text-[#005a9c] font-bold text-sm hover:underline">
          ← Edit Details
        </button>
      </div>

      <div v-else class="text-center opacity-40">
        <div class="w-20 h-20 border-4 border-gray-300 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <p class="font-bold text-gray-500">QR Code will appear here</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useAbakhqrStore } from "./stores/abakhqr";

const isLoading = ref(false);
const isGenerated = ref(false);
const abakhqrStore = useAbakhqrStore();

const form = reactive({
  name: "",
  amount: null,
});

const generateQRCode = async () =>{
  try {
    
  } catch (error) {
    console.error("Handle error get khqr", error);
    
  }
}
</script>

<style scoped>
/* Remove number input arrows */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>