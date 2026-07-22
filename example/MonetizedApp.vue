<script setup lang="ts">
/**
 * MonetizedApp.vue — a complete paywalled SmartNet dApp in one file.
 *
 * Demonstrates the whole SDK loop:
 *   detect → connect → check subscription → pay → unlock → save progress.
 *
 * Replace RECEIVER with your own STH address and publish the built dist/
 * through SmartNet → My DApps. That's the entire monetization stack.
 */
import { onMounted, ref } from 'vue'
import { useSmartNetWallet } from '../src/useSmartNetWallet'
import { usePayments } from '../src/usePayments'
import { useStorage } from '../src/useStorage'
import { IS_SMARTNET, CLIENT_VERSION } from '../src/runtime'

const RECEIVER = 'SReplaceWithYourSTHAddress'

const wallet = useSmartNetWallet()
const payments = usePayments({ receiver: RECEIVER })
const storage = useStorage({ namespace: 'demo-app' })

const unlocked = ref(false)
const checking = ref(false)
const launches = ref(storage.getItem('launches', 0))

onMounted(() => {
  launches.value += 1
  storage.setItem('launches', launches.value) // offline-first save-game
})

/** Connect, then verify the "pro" subscription on-chain. */
async function checkAccess() {
  checking.value = true
  try {
    await wallet.connect() // wallet connect panel slides out on first call
    unlocked.value = await payments.hasActiveSubscription('pro')
  } finally {
    checking.value = false
  }
}

/** Buy 30 days of "pro" for 5 STH — the user approves in the wallet drawer. */
async function buyPro() {
  await payments.subscribe('pro', '5', 30)
  unlocked.value = true
}
</script>

<template>
  <main class="demo">
    <header class="demo-head">
      <h1>Demo dApp</h1>
      <!-- "Wallet" menu item: slides the SmartNet wallet panel out -->
      <button v-if="wallet.hasWallet" @click="wallet.openWallet()">Wallet</button>
    </header>

    <p v-if="!IS_SMARTNET" class="warn">
      Running in a plain browser — open inside SmartNet for wallet features.
    </p>
    <p v-else class="ok">SmartNet client {{ CLIENT_VERSION }} · launches: {{ launches }}</p>

    <section v-if="!wallet.isConnected.value">
      <button :disabled="wallet.connecting.value" @click="checkAccess">
        {{ wallet.connecting.value ? 'Connecting…' : 'Connect wallet' }}
      </button>
    </section>

    <section v-else-if="!unlocked">
      <p>Connected: <code>{{ wallet.address.value }}</code></p>
      <button :disabled="payments.paying.value || checking" @click="buyPro">
        {{ payments.paying.value ? 'Waiting for approval…' : 'Unlock PRO — 5 STH / 30 days' }}
      </button>
      <p v-if="payments.error.value" class="warn">{{ payments.error.value }}</p>
    </section>

    <section v-else class="ok">
      🎉 PRO unlocked — premium content goes here.
    </section>
  </main>
</template>

<style scoped>
.demo { max-width: 480px; margin: 40px auto; font-family: ui-monospace, monospace; }
.demo-head { display: flex; justify-content: space-between; align-items: center; }
.warn { color: #fb7185; }
.ok { color: #34d399; }
button { padding: 10px 16px; cursor: pointer; }
</style>
