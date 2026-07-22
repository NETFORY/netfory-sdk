/**
 * Global typings for the SmartNet runtime environment.
 *
 * The SmartNet client injects two frozen globals into every dApp webview
 * BEFORE any page script runs (via Tauri initialization_script):
 *
 *   window.__SMARTNET__   — synchronous runtime descriptor (cannot be forged:
 *                           defined with Object.defineProperty + Object.freeze)
 *   window.smartholdem    — the wallet provider (MetaMask-style bridge)
 *
 * In a plain browser both are `undefined` and the SDK transparently falls
 * back to HTTP / "no wallet" behaviour.
 */

export interface SmartNetRuntime {
  /** Always `true` inside the SmartNet client. THE detection flag. */
  isSmartNet: true
  /** Recommended transport for backend calls (`api://<nodeId>/<provider>/…`). */
  protocol: 'api'
  /** This dApp's own id — the `sth://<appId>/` authority it is served from. */
  appId: string
  /** SmartNet client semver, e.g. "1.63.10" — use for feature gating. */
  clientVersion: string
  network: 'mainnet'
  features: {
    /** window.smartholdem wallet bridge is available. */
    wallet: boolean
    /** fetch('api://<nodeId>/<provider>/…') works (P2P REST tunnel). */
    apiScheme: boolean
    /** fetch('f://<cid>/…') works (P2P file storage reads). */
    fileScheme: boolean
    /** window.__sthI18n page translation is available. */
    translate: boolean
    /** window.crypto.subtle is guaranteed (polyfilled when needed). */
    crypto: boolean
  }
  /** Optional: dApps may publish their provider name for the ws tunnel. */
  provider?: string
}

/** Result of a successful `getAccount()` connect handshake. */
export interface SmartNetAccount {
  address: string
}

/** Result of `signMessage()` — Core-Wallet compatible envelope. */
export interface SignedMessage {
  address: string
  publicKey: string
  hash: string
  message: string
  signature: string
}

/** Transaction payload accepted by `sendTransaction` / `signTransaction`. */
export interface TxPayload {
  /** Recipient STH address. `recipient` is accepted as an alias. */
  recipientId: string
  /** Amount in STH as a string or number, e.g. "1.5". */
  amount: string | number
  /** Optional fee in STH (default 0.25). */
  fee?: string | number
  /** Optional on-chain memo (vendorField) — usable for order/subscription ids. */
  vendorField?: string
}

/** The wallet provider bridge injected as `window.smartholdem`. */
export interface SmartHoldemProvider {
  isSmartHoldem: true
  version: string
  network: string
  /** Connect: slides the wallet connect panel out; resolves `{ address }`. */
  getAccount(): Promise<SmartNetAccount>
  /** Sign an arbitrary message (login-with-wallet). User-approved. */
  signMessage(message: string): Promise<SignedMessage>
  /** Sign a transaction without broadcasting. User-approved. */
  signTransaction(payload: TxPayload): Promise<unknown>
  /** Sign AND broadcast an STH transfer. User-approved in the wallet drawer. */
  sendTransaction(payload: TxPayload): Promise<unknown>
  /** Deep-link into the in-wallet Swap hub. */
  requestSwap(payload?: Record<string, unknown>): Promise<null>
  /** Slide the SmartNet wallet panel out (no signing, client ≥ 1.63.10). */
  openWallet?(): Promise<null>
}

declare global {
  interface Window {
    __SMARTNET__?: SmartNetRuntime
    smartholdem?: SmartHoldemProvider
  }
}

export {}
