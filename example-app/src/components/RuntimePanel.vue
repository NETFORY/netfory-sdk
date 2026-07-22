<script setup lang="ts">
// Панель окружения: показывает runtimeInfo() — детекцию SmartNet,
// версию клиента, appId, эндпоинты и фичи webview.
import { computed } from 'vue'
import { runtimeInfo, RUNTIME } from '../smartnet'
import NeonCard from './NeonCard.vue'

const info = runtimeInfo()

const rows = computed(() => [
  { k: 'isSmartNet', v: String(info.isSmartNet), on: info.isSmartNet },
  { k: 'clientVersion', v: info.clientVersion, on: info.isSmartNet },
  { k: 'appId', v: info.appId || '—', on: !!info.appId },
  { k: 'hasWallet', v: String(info.hasWallet), on: info.hasWallet },
  { k: 'restUrl', v: info.restUrl || '—', on: !!info.restUrl },
  { k: 'wsOrigin', v: info.wsOrigin || '—', on: !!info.wsOrigin },
])

const features = computed(() =>
  Object.entries(RUNTIME?.features || {}).map(([k, v]) => ({ k, on: !!v })),
)
</script>

<template>
  <NeonCard title="// Runtime" accent="var(--cyan)" :delay="100" data-testid="runtime-panel">
    <template #badge>
      <span
        class="chip"
        :class="info.isSmartNet ? 'text-lime border-lime/40' : 'text-amber border-amber/40'"
        data-testid="runtime-env-chip"
      >
        <span class="chip-dot" />
        {{ info.isSmartNet ? 'SmartNet' : 'Browser' }}
      </span>
    </template>

    <ul class="space-y-1.5 text-xs">
      <li
        v-for="r in rows"
        :key="r.k"
        class="flex items-baseline justify-between gap-3 border-b border-cyan/5 pb-1.5"
      >
        <span class="text-dim shrink-0">{{ r.k }}</span>
        <span class="truncate" :class="r.on ? 'text-lime' : 'text-ink/60'">{{ r.v }}</span>
      </li>
    </ul>

    <div v-if="features.length" class="flex flex-wrap gap-1.5 pt-1">
      <span
        v-for="f in features"
        :key="f.k"
        class="chip"
        :class="f.on ? 'text-cyan border-cyan/30' : 'text-dim border-dim/30 opacity-50'"
      >
        {{ f.k }}
      </span>
    </div>
    <p v-else class="text-[0.68rem] text-dim leading-relaxed">
      Открой это приложение внутри клиента SmartNet, чтобы увидеть фичи webview
      (wallet · api:// · f:// · translate · crypto).
    </p>
  </NeonCard>
</template>
