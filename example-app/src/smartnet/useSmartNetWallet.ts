/**
 * useSmartNetWallet() — Vue composable for the SmartNet wallet.
 *
 * Gives your dApp a complete wallet UX with three lines of code:
 *
 *   const wallet = useSmartNetWallet()
 *   await wallet.connect()          // wallet connect panel slides out
 *   await wallet.signMessage('hi')  // login-with-wallet signature
 *
 * State is module-local (shared across all components that call the hook),
 * so a "Connect" button in the header and a paywall deep in the page always
 * agree on the current account.
 */
import { computed, reactive, readonly } from 'vue'
import type { SignedMessage, TxPayload } from './smartnet-env.d'
import { IS_SMARTNET, hasWallet, openWalletPanel, requireProvider } from './bridge'

interface WalletState {
  address: string
  connecting: boolean
  error: string
}

// Shared singleton state — every useSmartNetWallet() call sees the same data.
const state = reactive<WalletState>({ address: '', connecting: false, error: '' })

export function useSmartNetWallet() {
  /**
   * Connect handshake. First call per origin slides the wallet connect
   * panel out of the SmartNet client; once the user grants access the
   * origin is trusted and subsequent calls resolve silently.
   */
  async function connect(): Promise<string> {
    if (state.address) return state.address
    state.connecting = true
    state.error = ''
    try {
      const { address } = await requireProvider().getAccount()
      state.address = address
      return address
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      state.connecting = false
    }
  }

  /** Forget the local session (the on-host origin trust is unaffected). */
  function disconnect(): void {
    state.address = ''
    state.error = ''
  }

  /**
   * Sign an arbitrary message with the user's wallet key (login-with-wallet).
   * Resolves the Core-Wallet compatible envelope:
   * `{ address, publicKey, hash, message, signature }`.
   */
  async function signMessage(message: string): Promise<SignedMessage> {
    return requireProvider().signMessage(message)
  }

  /** Sign + broadcast a raw STH transfer (prefer usePayments() for UX). */
  async function sendTransaction(payload: TxPayload): Promise<unknown> {
    return requireProvider().sendTransaction(payload)
  }

  /**
   * Slide the SmartNet wallet panel out — perfect for a "Wallet" item in
   * your app menu. No signing, no confirmation dialog.
   */
  async function openWallet(): Promise<void> {
    return openWalletPanel()
  }

  return {
    // --- reactive state -------------------------------------------------
    /** Connected STH address ('' while disconnected). */
    address: computed(() => state.address),
    /** True while the connect prompt is open. */
    connecting: computed(() => state.connecting),
    /** Last wallet error message ('' when none). */
    error: computed(() => state.error),
    /** True once connect() resolved. */
    isConnected: computed(() => !!state.address),
    /** Environment flags (synchronous, safe in templates). */
    isSmartNet: IS_SMARTNET,
    hasWallet: hasWallet(),
    /** Raw readonly state, if you prefer a single object. */
    state: readonly(state),
    // --- actions ---------------------------------------------------------
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    openWallet,
  }
}
