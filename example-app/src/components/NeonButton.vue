<script setup lang="ts">
// Кнопка со скошенными углами, заливкой при hover и встроенным спиннером.
defineProps<{
  color?: string // css-цвет (обводка/заливка)
  solid?: boolean
  loading?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <button
    class="neon-btn"
    :class="{ 'neon-btn--solid': solid }"
    :style="{ '--btn': color || 'var(--cyan)' }"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="spinner" />
    <slot />
  </button>
</template>
