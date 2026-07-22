/**
 * ═══════════════════════════════════════════════════════════════════
 *  КОНФИГ ПРИМЕРА — подставь свои значения и приложение готово.
 * ═══════════════════════════════════════════════════════════════════
 */

/** ← ТВОЙ STH-адрес: сюда приходят все платежи и подписки. */
export const RECEIVER = 'SReplaceWithYourSTHAddress'

/**
 * ← Node ID твоего P2P-бэкенда (64-hex iroh EndpointId) — ОПЦИОНАЛЬНО.
 * Оставь пустым, если dApp полностью клиентский (без своего сервера).
 */
export const NODE_ID = ''

/** ← Имя провайдера, зарегистрированное на этом узле (см. docs/07, docs/08). */
export const PROVIDER = ''

/** REST-эндпоинт блокчейна для верификации платежей (любой ARK-core v3 узел). */
export const NODE_API = 'https://node0.smartholdem.io/api'

/** HTTPS-шлюз для f://<cid> в обычном браузере — ОПЦИОНАЛЬНО (пусто = только SmartNet). */
export const HTTP_GATEWAY = ''

/** ── Витрина монетизации (поменяй под свой продукт) ───────────── */
export const SUB_PLAN = 'pro'          // имя тарифа
export const SUB_PRICE = '5'           // цена подписки, STH
export const SUB_DAYS = 30             // период подписки, дней
export const ITEM_SKU = 'item:neon-skin-01' // memo разовой покупки
export const ITEM_PRICE = '1'          // цена покупки, STH
