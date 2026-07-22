/**
 * SmartNet App SDK — single import surface.
 *
 *   import {
 *     useSmartNetWallet, usePayments, useStorage,
 *     IS_SMARTNET, BACKEND_URL, SOCKET_ORIGIN, SOCKET_PATH,
 *   } from '@/smartnet'
 */
export * from './runtime'
export * from './bridge'
export { useSmartNetWallet } from './useSmartNetWallet'
export { usePayments } from './usePayments'
export type { PaymentsConfig, OnChainTx } from './usePayments'
export { useStorage } from './useStorage'
export type { StorageConfig } from './useStorage'
export type {
  SmartNetRuntime,
  SmartNetAccount,
  SignedMessage,
  TxPayload,
  SmartHoldemProvider,
} from './smartnet-env.d'
