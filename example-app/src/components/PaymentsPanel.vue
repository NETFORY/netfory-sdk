<script setup lang="ts">
// Панель монетизации: подписка, разовая покупка, on-chain верификация.
// Демонстрирует usePayments() — платежи идут напрямую на RECEIVER.
import { ref } from 'vue'
import { usePayments, useSmartNetWallet } from '../smartnet'
import type { OnChainTx } from '../smartnet'
import NeonCard from './NeonCard.vue'
import NeonButton from './NeonButton.vue'
import { RECEIVER, NODE_API, SUB_PLAN, SUB_PRICE, SUB_DAYS, ITEM_SKU, ITEM_PRICE } from '../config'

const wallet = useSmartNetWallet()
const payments = usePayments({ receiver: RECEIVER, nodeApi: NODE_API })
const { paying, lastTxId, error } = payments

const subActive = ref<boolean | null>(null)
const itemOwned = ref<boolean | null>(null)
const purchases = ref<OnChainTx[]>([])
const busy = ref('')

// Обёртка: любое действие требует подключённый кошелёк.
async function run(name: string, fn: () => Promise<void>) {
  busy.value = name
  try {
    if (!wallet.isConnected.value) await wallet.connect()
    await fn()
  } catch {
    /* ошибка уже в payments.error / wallet.error */
  } finally {
    busy.value = ''
  }
}

const buySub = () =>
  run('sub', async () => {
    await payments.subscribe(SUB_PLAN, SUB_PRICE, SUB_DAYS)
    subActive.value = true
  })

const buyItem = () =>
  run('item', async () => {
    await payments.pay(ITEM_PRICE, ITEM_SKU)
    itemOwned.value = true
  })

// On-chain проверки: публичный блокчейн — это и есть чек покупки.
const checkSub = () =>
  run('checkSub', async () => {
    subActive.value = await payments.hasActiveSubscription(SUB_PLAN)
  })
const checkItem = () =>
  run('checkItem', async () => {
    itemOwned.value = await payments.hasPurchase(ITEM_SKU)
  })
const loadHistory = () =>
  run('history', async () => {
    purchases.value = await payments.fetchPurchases()
  })

const fmt = (v: boolean | null) => (v === null ? '?' : v ? 'ACTIVE' : 'NONE')
</script>

<template>
  <NeonCard title="// Payments" accent="var(--lime)" :delay="300" data-testid="payments-panel">
    <template #badge>
      <span class="chip text-lime border-lime/40">STH</span>
    </template>

    <p class="text-[0.68rem] text-dim break-all leading-relaxed">
      receiver: <span class="text-ink/80">{{ RECEIVER }}</span>
    </p>

    <!-- Подписка -->
    <div class="flex flex-wrap items-center gap-2">
      <NeonButton
        color="var(--lime)"
        solid
        :loading="paying && busy === 'sub'"
        data-testid="subscribe-btn"
        @click="buySub"
      >
        Sub «{{ SUB_PLAN }}» · {{ SUB_PRICE }} STH / {{ SUB_DAYS }}d
      </NeonButton>
      <NeonButton color="var(--lime)" :loading="busy === 'checkSub'" data-testid="check-sub-btn" @click="checkSub">
        Verify
      </NeonButton>
      <span
        class="chip"
        :class="subActive ? 'text-lime border-lime/40' : 'text-dim border-dim/40'"
        data-testid="sub-status"
      >
        {{ fmt(subActive) }}
      </span>
    </div>

    <!-- Разовая покупка -->
    <div class="flex flex-wrap items-center gap-2">
      <NeonButton
        color="var(--amber)"
        :loading="paying && busy === 'item'"
        data-testid="buy-item-btn"
        @click="buyItem"
      >
        Buy {{ ITEM_SKU }} · {{ ITEM_PRICE }} STH
      </NeonButton>
      <NeonButton color="var(--amber)" :loading="busy === 'checkItem'" data-testid="check-item-btn" @click="checkItem">
        Verify
      </NeonButton>
      <span
        class="chip"
        :class="itemOwned ? 'text-amber border-amber/40' : 'text-dim border-dim/40'"
        data-testid="item-status"
      >
        {{ itemOwned === null ? '?' : itemOwned ? 'OWNED' : 'NONE' }}
      </span>
    </div>

    <p v-if="lastTxId" class="text-xs break-all">
      <span class="text-dim">tx:</span> <span class="text-lime" data-testid="last-tx-id">{{ lastTxId }}</span>
    </p>
    <p v-if="error" class="text-xs text-magenta" data-testid="payments-error">{{ error }}</p>

    <!-- История покупок с блокчейна -->
    <div class="border-t border-lime/10 pt-3 space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-[0.68rem] uppercase tracking-[0.18em] text-dim">On-chain receipts</p>
        <NeonButton color="var(--lime)" :loading="busy === 'history'" data-testid="load-history-btn" @click="loadHistory">
          Load
        </NeonButton>
      </div>
      <ul v-if="purchases.length" class="space-y-1 text-[0.68rem] max-h-32 overflow-y-auto" data-testid="purchases-list">
        <li v-for="t in purchases" :key="t.id" class="flex justify-between gap-2 border-b border-lime/5 pb-1">
          <span class="text-amber truncate">{{ t.vendorField || '—' }}</span>
          <span class="text-dim shrink-0">{{ (Number(t.amount) / 1e8).toFixed(2) }} STH</span>
        </li>
      </ul>
      <p v-else class="text-[0.68rem] text-dim">Пока пусто — подключи кошелёк и нажми Load.</p>
    </div>
  </NeonCard>
</template>
