/**
 * useStorage() — P2P content reads + namespaced local key-value store.
 *
 * SmartNet gives dApps two storage primitives:
 *
 *   1. **P2P file reads (`f://<cid>`)** — any file published through the
 *      SmartNet File Exchange (or a DevHub release) is addressable by CID
 *      and fetchable from the seeder swarm with a plain `fetch()`. Perfect
 *      for game assets, level packs, media, ML models: publish once, the
 *      swarm distributes, seeders earn Byte-Hours.
 *
 *   2. **Local KV** — a namespaced localStorage wrapper for user settings /
 *      save-games. Data lives inside the user's own client (self-custody,
 *      offline-first). Prefix it with the connected address to keep multiple
 *      accounts separate.
 *
 * Publishing NEW files is a user-gated host feature (My Files → Add file →
 * share the CID); a dApp only ever READS by CID — it cannot silently write
 * to the swarm on the user's behalf.
 */
import { IS_SMARTNET } from './runtime'

export interface StorageConfig {
  /** Namespace for the local KV keys (defaults to the dApp id or 'dapp'). */
  namespace?: string
  /** HTTPS gateway used to resolve CIDs in a plain browser (optional). */
  httpGateway?: string
}

export function useStorage(config: StorageConfig = {}) {
  const ns =
    config.namespace ||
    (typeof window !== 'undefined' && window.__SMARTNET__?.appId) ||
    'dapp'

  // -------------------------------------------------------------------
  //  P2P file reads
  // -------------------------------------------------------------------

  /**
   * URL for a P2P-stored file. Inside SmartNet this is the `f://` scheme
   * (streamed from seeders, usable in <img>/<video>/fetch). In a browser it
   * falls back to your HTTPS gateway when configured.
   */
  function fileUrl(cid: string): string {
    if (IS_SMARTNET) return `f://${cid}/`
    if (config.httpGateway) return `${config.httpGateway.replace(/\/$/, '')}/${cid}`
    throw new Error('P2P storage is only reachable inside SmartNet (no httpGateway set).')
  }

  /** Fetch a P2P file as raw bytes. */
  async function fetchFile(cid: string): Promise<ArrayBuffer> {
    const r = await fetch(fileUrl(cid))
    if (!r.ok) throw new Error(`f://${cid} → HTTP ${r.status}`)
    return r.arrayBuffer()
  }

  /** Fetch and JSON-parse a P2P file (e.g. a published manifest/level pack). */
  async function fetchJson<T = unknown>(cid: string): Promise<T> {
    const r = await fetch(fileUrl(cid))
    if (!r.ok) throw new Error(`f://${cid} → HTTP ${r.status}`)
    return r.json() as Promise<T>
  }

  // -------------------------------------------------------------------
  //  Namespaced local KV (settings / save-games)
  // -------------------------------------------------------------------

  const key = (k: string) => `sdk:${ns}:${k}`

  function getItem<T = unknown>(k: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key(k))
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  }

  function setItem(k: string, value: unknown): void {
    try {
      localStorage.setItem(key(k), JSON.stringify(value))
    } catch {
      /* storage full / private mode — non-fatal by design */
    }
  }

  function removeItem(k: string): void {
    try {
      localStorage.removeItem(key(k))
    } catch {
      /* ignore */
    }
  }

  return { fileUrl, fetchFile, fetchJson, getItem, setItem, removeItem }
}
