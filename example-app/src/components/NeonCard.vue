<script setup lang="ts">
// Панель-карточка в cyber-neon стиле: уголки-скобки, свечение при hover,
// staggered-появление через animationDelay.
defineProps<{
  title: string
  accent?: string // css-цвет акцента (уголки + свечение)
  delay?: number // задержка входной анимации, мс
}>()
</script>

<template>
  <section
    class="neon-card p-5 sm:p-6"
    :style="{ '--accent': accent || 'var(--cyan)', animationDelay: `${delay || 0}ms` }"
  >
    <header class="mb-4 flex items-center justify-between gap-3">
      <h2
        class="text-xs sm:text-sm font-bold uppercase tracking-[0.22em]"
        :style="{ color: accent || 'var(--cyan)' }"
      >
        {{ title }}
      </h2>
      <slot name="badge" />
    </header>
    <div class="space-y-3">
      <slot />
    </div>
  </section>
</template>
