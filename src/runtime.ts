/**
 * Runtime backend switch — the canonical SmartNet detection module.
 *
 * Import this file FIRST (before creating your Vue app) so every other module
 * can rely on the constants synchronously. The SmartNet client injects
 * `window.__SMARTNET__` before any page script runs, so detection is safe at
 * module-evaluation time — no async race, no flicker.
 *
 * Configure the two constants below for your own backend provider (or leave
 * them empty for a purely client-side dApp).
 */
import type { SmartNetRuntime } from './smartnet-env.d'

// ---------------------------------------------------------------------------
// 1. Your P2P backend location (optional — delete if your dApp has no backend)
// ---------------------------------------------------------------------------

/** SmartNet node id (64-hex iroh EndpointId) that hosts your backend provider. */
export const NODE_ID = ''

/** Provider name registered on that node (see docs/07 + docs/08). */
export const PROVIDER = ''

/** HTTPS fallback origin used in a plain browser (dev/staging/prod). */
const HTTPS_ORIGIN: string =
  (import.meta as { env?: Record<string, string> }).env?.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')

// ---------------------------------------------------------------------------
// 2. Detection (synchronous, forge-proof)
// ---------------------------------------------------------------------------

/** True when running inside the SmartNet client webview. */
export const IS_SMARTNET: boolean =
  typeof window !== 'undefined' && !!window.__SMARTNET__?.isSmartNet

/** The frozen runtime descriptor, or null in a plain browser. */
export const RUNTIME: SmartNetRuntime | null =
  (typeof window !== 'undefined' && window.__SMARTNET__) || null

/** SmartNet client version ("web" outside the client). */
export const CLIENT_VERSION: string = RUNTIME?.clientVersion ?? 'web'

/** This dApp's own sth:// app id ('' outside the client). */
export const APP_ID: string = RUNTIME?.appId ?? ''

// ---------------------------------------------------------------------------
// 3. Derived endpoints (REST + WebSocket)
// ---------------------------------------------------------------------------

/**
 * Base URL for REST calls. fetch() keeps the full path, so the provider
 * prefix survives:
 *   SmartNet → api://<NODE_ID>/<PROVIDER>/api/v1/…   (P2P tunnel)
 *   browser  → https://…/api/v1/…                    (plain HTTPS)
 */
export const BACKEND_URL: string =
  IS_SMARTNET && NODE_ID ? `api://${NODE_ID}/${PROVIDER}` : HTTPS_ORIGIN

/**
 * Socket.IO must receive origin and path SEPARATELY (the client treats a URL
 * path as a namespace). Canonical SmartNet form (Networking Guide, rule #5):
 *   io(SOCKET_ORIGIN, { path: SOCKET_PATH, transports: SOCKET_TRANSPORTS })
 */
export const SOCKET_ORIGIN: string =
  IS_SMARTNET && NODE_ID ? `ws://${NODE_ID}` : HTTPS_ORIGIN
export const SOCKET_PATH: string =
  IS_SMARTNET && NODE_ID ? `/${PROVIDER}/api/socket.io` : '/api/socket.io'
export const SOCKET_TRANSPORTS: string[] = IS_SMARTNET
  ? ['websocket'] // the SmartNet tunnel is websocket-only
  : ['websocket', 'polling']

// ---------------------------------------------------------------------------
// 4. Debug snapshot — call window.__smartnetRuntime() in DevTools
// ---------------------------------------------------------------------------

export function runtimeInfo() {
  return {
    isSmartNet: IS_SMARTNET,
    clientVersion: CLIENT_VERSION,
    appId: APP_ID,
    restUrl: BACKEND_URL,
    wsOrigin: SOCKET_ORIGIN,
    wsPath: SOCKET_PATH,
    hasWallet: !!(RUNTIME?.features?.wallet || window.smartholdem?.isSmartHoldem),
    smartnet: RUNTIME,
  }
}

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__smartnetRuntime = runtimeInfo
}
