/**
 * usePayments() — STH payments, in-app purchases and subscriptions.
 *
 * The model is simple and fully decentralized:
 *
 *   1. Your dApp asks the wallet to send STH to YOUR address with a
 *      machine-readable memo (vendorField), e.g. "sub:pro:30d" or
 *      "item:sword-of-truth". The user approves in the wallet drawer.
 *   2. Anyone (your dApp, your backend, a seeder node) can later VERIFY the
 *      purchase on-chain: transactions are public, the memo + recipient +
 *      sender triplet is the receipt. No payment processor, no chargebacks.
 *
 * Memo convention used by this SDK (free to change):
 *   "<kind>:<sku>[:<period>]"  →  sub:pro:30d · item:skin-42 · tip:article-7
 */
import { computed, reactive } from 'vue'
import { requireProvider } from './bridge'
import { useSmartNetWallet } from './useSmartNetWallet'

export interface PaymentsConfig {
  /** YOUR receiving STH address — where every payment goes. */
  receiver: string
  /**
   * Blockchain REST endpoint used for on-chain verification. Any SmartHoldem
   * (ARK-core v3 API) node works; api://<nodeId>/<provider> P2P endpoints
   * work too when your provider proxies the node API.
   */
  nodeApi?: string
}

export interface OnChainTx {
  id: string
  senderId: string
  recipientId: string
  amount: string
  vendorField?: string
  timestamp?: { unix?: number }
}

interface PaymentsState {
  paying: boolean
  lastTxId: string
  error: string
}

const DEFAULT_NODE_API = 'https://node0.smartholdem.io/api'

export function usePayments(config: PaymentsConfig) {
  const wallet = useSmartNetWallet()
  const state = reactive<PaymentsState>({ paying: false, lastTxId: '', error: '' })
  const nodeApi = (config.nodeApi || DEFAULT_NODE_API).replace(/\/$/, '')

  /**
   * One-off payment (in-app purchase, tip, unlock). Opens the wallet
   * approval drawer; resolves with the broadcast result after the user
   * confirms. `memo` is written on-chain — treat it as the receipt id.
   */
  async function pay(amountSth: string | number, memo: string): Promise<unknown> {
    state.paying = true
    state.error = ''
    try {
      const res = (await requireProvider().sendTransaction({
        recipientId: config.receiver,
        amount: String(amountSth),
        vendorField: memo,
      })) as { id?: string; transactionId?: string } | undefined
      state.lastTxId = res?.id || res?.transactionId || ''
      return res
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      state.paying = false
    }
  }

  /**
   * Start (or renew) a subscription: a normal payment whose memo encodes
   * the plan and period — "sub:<plan>:<days>d". Verification then checks
   * whether a matching payment exists inside the period window.
   */
  async function subscribe(
    plan: string,
    amountSth: string | number,
    periodDays = 30,
  ): Promise<unknown> {
    return pay(amountSth, `sub:${plan}:${periodDays}d`)
  }

  /**
   * Fetch this buyer's payments to `receiver` filtered by memo prefix,
   * straight from the public chain (newest first). Works in browser AND
   * SmartNet. Requires the buyer address (connect the wallet first).
   */
  async function fetchPurchases(memoPrefix = ''): Promise<OnChainTx[]> {
    const sender = wallet.address.value
    if (!sender) throw new Error('Connect the wallet before verifying purchases.')
    const url =
      `${nodeApi}/transactions?type=0&senderId=${encodeURIComponent(sender)}` +
      `&recipientId=${encodeURIComponent(config.receiver)}&limit=100`
    const r = await fetch(url)
    if (!r.ok) throw new Error(`node API ${r.status}`)
    const { data } = (await r.json()) as { data: OnChainTx[] }
    return (data || []).filter(
      (t) => !memoPrefix || (t.vendorField || '').startsWith(memoPrefix),
    )
  }

  /**
   * True when the connected user has an ACTIVE subscription for `plan`:
   * a "sub:<plan>:<N>d" payment younger than N days exists on-chain.
   */
  async function hasActiveSubscription(plan: string): Promise<boolean> {
    const txs = await fetchPurchases(`sub:${plan}:`)
    const now = Math.floor(Date.now() / 1000)
    return txs.some((t) => {
      const m = /^sub:[^:]+:(\d+)d$/.exec(t.vendorField || '')
      const days = m ? parseInt(m[1], 10) : 0
      const paidAt = t.timestamp?.unix || 0
      return days > 0 && paidAt > 0 && now - paidAt < days * 86400
    })
  }

  /** True when the user ever bought the exact item memo (e.g. "item:skin-42"). */
  async function hasPurchase(memo: string): Promise<boolean> {
    const txs = await fetchPurchases(memo)
    return txs.some((t) => t.vendorField === memo)
  }

  return {
    /** True while a payment is awaiting user approval. */
    paying: computed(() => state.paying),
    /** Transaction id of the last successful payment. */
    lastTxId: computed(() => state.lastTxId),
    /** Last payment error ('' when none). */
    error: computed(() => state.error),
    pay,
    subscribe,
    fetchPurchases,
    hasActiveSubscription,
    hasPurchase,
  }
}
