/**
 * Low-level access to the SmartNet wallet bridge (`window.smartholdem`).
 *
 * The bridge is injected by the SmartNet client before page load, so it is
 * available synchronously. All methods are promise-based; approval-gated
 * calls (sign / send) resolve only after the user confirms in the host
 * wallet drawer, or reject with "User rejected …".
 *
 * The composables (`useSmartNetWallet`, `usePayments`) build on these
 * helpers — use them directly only when you need raw control.
 */
import type { SmartHoldemProvider } from './smartnet-env.d'
import { IS_SMARTNET } from './runtime'

/** The wallet provider, or null when unavailable (plain browser). */
export function getProvider(): SmartHoldemProvider | null {
  return (typeof window !== 'undefined' && window.smartholdem) || null
}

/** True when a SmartHoldem-compatible wallet is reachable. */
export function hasWallet(): boolean {
  return !!getProvider()?.isSmartHoldem
}

/** Re-export of the detection flag for convenience. */
export { IS_SMARTNET }

/** Throw a uniform, user-friendly error when the wallet is unavailable. */
export function requireProvider(): SmartHoldemProvider {
  const p = getProvider()
  if (!p) {
    throw new Error(
      'SmartNet wallet is unavailable — open this app inside the SmartNet client.',
    )
  }
  return p
}

/**
 * Slide the SmartNet wallet panel out (e.g. from your app's "Wallet" menu
 * item). Uses the dedicated `openWallet` bridge method on client ≥ 1.63.10
 * and falls back to a connect handshake on older clients (which also
 * surfaces the wallet UI).
 */
export async function openWalletPanel(): Promise<void> {
  const p = requireProvider()
  if (typeof p.openWallet === 'function') {
    await p.openWallet()
  } else {
    await p.getAccount() // legacy fallback: connect prompt surfaces the wallet
  }
}
