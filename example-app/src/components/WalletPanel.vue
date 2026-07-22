<script setup lang="ts">
// Панель кошелька: connect / disconnect / openWallet / signMessage.
// Демонстрирует useSmartNetWallet() — состояние общее для всех компонентов.
import { ref } from 'vue'
import { useSmartNetWallet } from '../smartnet'
import type { SignedMessage } from '../smartnet'
import NeonCard from './NeonCard.vue'
import NeonButton from './NeonButton.vue'

const wallet = useSmartNetWallet()
const { address, connecting, error, isConnected } = wallet

const msg = ref('login:demo-app:' + Date.now())
const signed = ref<SignedMessage | null>(null)
const signing = ref(false)
const signError = ref('')

// Подпись произвольного сообщения — паттерн «вход через кошелёк».
async function sign() {
  signing.value = true
  signError.value = ''
  signed.value = null
  try {
    signed.value = await wallet.signMessage(msg.value)
  } catch (e) {
    signError.value = e instanceof Error ? e.message : String(e)
  } finally {
    signing.value = false
  }
}
</script>

<template>
  <NeonCard title="// Wallet" accent="var(--magenta)" :delay="200" data-testid="wallet-panel">
    <template #badge>
      <span
        class="chip"
        :class="isConnected ? 'text-lime border-lime/40' : 'text-dim border-dim/40'"
        data-testid="wallet-status-chip"
      >
        <span class="chip-dot" />
        {{ isConnected ? 'Connected' : 'Offline' }}
      </span>
    </template>

    <div class="flex flex-wrap gap-2">
      <NeonButton
        v-if="!isConnected"
        color="var(--magenta)"
        solid
        :loading="connecting"
        data-testid="wallet-connect-btn"
        @click="wallet.connect()"
      >
        {{ connecting ? 'Connecting…' : 'Connect wallet' }}
      </NeonButton>
      <template v-else>
        <NeonButton color="var(--magenta)" data-testid="wallet-open-btn" @click="wallet.openWallet()">
          Open wallet
        </NeonButton>
        <NeonButton color="var(--dim)" data-testid="wallet-disconnect-btn" @click="wallet.disconnect()">
          Disconnect
        </NeonButton>
      </template>
    </div>

    <p v-if="isConnected" class="text-xs break-all">
      <span class="text-dim">address:</span>
      <span class="text-lime" data-testid="wallet-address">{{ address }}</span>
    </p>
    <p v-if="error" class="text-xs text-magenta" data-testid="wallet-error">{{ error }}</p>

    <!-- Подпись сообщения (login-with-wallet) -->
    <div class="space-y-2 border-t border-magenta/10 pt-3">
      <p class="text-[0.68rem] uppercase tracking-[0.18em] text-dim">Sign message</p>
      <div class="flex gap-2">
        <input v-model="msg" class="neon-input" data-testid="sign-message-input" />
        <NeonButton
          color="var(--magenta)"
          :loading="signing"
          :disabled="!msg"
          data-testid="sign-message-btn"
          @click="sign"
        >
          Sign
        </NeonButton>
      </div>
      <p v-if="signError" class="text-xs text-magenta" data-testid="sign-error">{{ signError }}</p>
      <pre v-if="signed" class="neon-code" data-testid="sign-result">{{ JSON.stringify(signed, null, 2) }}</pre>
    </div>
  </NeonCard>
</template>
