<script setup lang="ts">
// Корневой компонент демо-приложения SmartNet SDK.
// Слои фона (сетка + свечения + scanline) → шапка → hero → 4 панели SDK.
import { IS_SMARTNET, CLIENT_VERSION, useSmartNetWallet } from './smartnet'
import RuntimePanel from './components/RuntimePanel.vue'
import WalletPanel from './components/WalletPanel.vue'
import PaymentsPanel from './components/PaymentsPanel.vue'
import StoragePanel from './components/StoragePanel.vue'

const { isConnected, address } = useSmartNetWallet()
const short = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a)
</script>

<template>
  <div class="relative min-h-screen font-mono" data-testid="sdk-demo-app">
    <!-- фоновые слои -->
    <div class="bg-grid" />
    <div class="bg-glow bg-cyan" style="width: 560px; height: 380px; top: -160px; left: -120px" />
    <div class="bg-glow bg-magenta" style="width: 480px; height: 380px; bottom: -180px; right: -100px" />
    <div class="scanline" />

    <!-- шапка -->
    <header
      class="relative z-10 flex items-center justify-between border-b border-cyan/15 px-5 sm:px-10 py-4 backdrop-blur-md"
    >
      <div class="flex items-baseline gap-3">
        <span class="text-cyan font-bold tracking-[0.3em] text-sm glitch-title">SMARTNET</span>
        <span class="text-dim text-[0.65rem] tracking-[0.25em] uppercase">// sdk demo</span>
      </div>
      <span
        class="chip"
        :class="isConnected ? 'text-lime border-lime/40' : IS_SMARTNET ? 'text-cyan border-cyan/40' : 'text-amber border-amber/40'"
        data-testid="header-status-chip"
      >
        <span class="chip-dot" />
        {{ isConnected ? short(address) : IS_SMARTNET ? `client ${CLIENT_VERSION}` : 'web fallback' }}
      </span>
    </header>

    <!-- hero -->
    <main class="relative z-10 mx-auto max-w-6xl px-5 sm:px-10 py-10 sm:py-14">
      <div class="mb-10 sm:mb-14 max-w-2xl rise">
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-ink glitch-title">
          SDK <span class="text-cyan">/</span> Demo dApp
        </h1>
        <p class="mt-4 text-sm sm:text-base text-dim leading-relaxed">
          Живая витрина всех хуков SmartNet App SDK: детекция окружения, кошелёк,
          STH-платежи с on-chain верификацией и P2P-хранилище.
          Склонируй, подставь свои значения в
          <code class="text-amber">src/config.ts</code> — и публикуй
          <code class="text-cyan">dist/</code> через SmartNet → My DApps.
        </p>
      </div>

      <!-- панели SDK -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <RuntimePanel />
        <WalletPanel />
        <PaymentsPanel />
        <StoragePanel />
      </div>
    </main>

    <footer class="relative z-10 border-t border-cyan/10 px-5 sm:px-10 py-5 text-[0.65rem] text-dim tracking-[0.15em] uppercase">
      smartnet-sdk · example-app · sth:// ready
    </footer>
  </div>
</template>
