<script setup lang="ts">
// Панель хранилища: P2P-чтение файлов по CID (f://) + локальный KV.
// Демонстрирует useStorage() — офлайн-first сохранения и swarm-контент.
import { ref } from 'vue'
import { useStorage, IS_SMARTNET } from '../smartnet'
import NeonCard from './NeonCard.vue'
import NeonButton from './NeonButton.vue'
import { HTTP_GATEWAY } from '../config'

const storage = useStorage({ namespace: 'sdk-demo', httpGateway: HTTP_GATEWAY || undefined })

// ── локальный KV: счётчик запусков + произвольная заметка ──────
const launches = ref<number>(storage.getItem('launches', 0) + 1)
storage.setItem('launches', launches.value)

const note = ref<string>(storage.getItem('note', ''))
const saved = ref(false)

function saveNote() {
  storage.setItem('note', note.value)
  saved.value = true
  setTimeout(() => (saved.value = false), 1500)
}
function clearNote() {
  storage.removeItem('note')
  note.value = ''
}

// ── P2P-чтение по CID ───────────────────────────────────────────
const cid = ref('')
const fetching = ref(false)
const fetchInfo = ref('')
const fetchError = ref('')

async function fetchCid() {
  fetching.value = true
  fetchError.value = ''
  fetchInfo.value = ''
  try {
    const buf = await storage.fetchFile(cid.value.trim())
    fetchInfo.value = `OK — ${buf.byteLength} bytes из ${storage.fileUrl(cid.value.trim())}`
  } catch (e) {
    fetchError.value = e instanceof Error ? e.message : String(e)
  } finally {
    fetching.value = false
  }
}
</script>

<template>
  <NeonCard title="// Storage" accent="var(--amber)" :delay="400" data-testid="storage-panel">
    <template #badge>
      <span class="chip text-amber border-amber/40">f:// + KV</span>
    </template>

    <!-- локальный KV -->
    <p class="text-xs">
      <span class="text-dim">launches (offline-first KV):</span>
      <span class="text-amber font-bold" data-testid="kv-launches"> {{ launches }}</span>
    </p>
    <div class="flex gap-2">
      <input
        v-model="note"
        class="neon-input"
        placeholder="заметка → localStorage (namespaced)"
        data-testid="kv-note-input"
      />
      <NeonButton color="var(--amber)" data-testid="kv-save-btn" @click="saveNote">
        {{ saved ? 'Saved ✓' : 'Save' }}
      </NeonButton>
      <NeonButton color="var(--dim)" data-testid="kv-clear-btn" @click="clearNote">Clear</NeonButton>
    </div>

    <!-- P2P чтение -->
    <div class="border-t border-amber/10 pt-3 space-y-2">
      <p class="text-[0.68rem] uppercase tracking-[0.18em] text-dim">P2P file read (f://cid)</p>
      <div class="flex gap-2">
        <input
          v-model="cid"
          class="neon-input"
          placeholder="вставь CID из SmartNet → My Files"
          data-testid="cid-input"
        />
        <NeonButton
          color="var(--amber)"
          :loading="fetching"
          :disabled="!cid.trim()"
          data-testid="cid-fetch-btn"
          @click="fetchCid"
        >
          Fetch
        </NeonButton>
      </div>
      <p v-if="fetchInfo" class="text-xs text-lime break-all" data-testid="cid-result">{{ fetchInfo }}</p>
      <p v-if="fetchError" class="text-xs text-magenta break-all" data-testid="cid-error">{{ fetchError }}</p>
      <p v-if="!IS_SMARTNET && !HTTP_GATEWAY" class="text-[0.68rem] text-dim leading-relaxed">
        В обычном браузере f:// недоступен — задай HTTP_GATEWAY в config.ts или открой в SmartNet.
      </p>
    </div>
  </NeonCard>
</template>
