# SmartNet App SDK (Vue 3 template)

Turn any Vue frontend into a **monetized SmartNet dApp** in minutes:
wallet connect, STH payments & subscriptions, and P2P storage — with zero
backend code required for the wallet flows.

```
netfory-sdk/
├── src/
│   ├── index.ts               — single import surface
│   ├── smartnet-env.d.ts      — global typings (window.__SMARTNET__, window.smartholdem)
│   ├── runtime.ts             — SmartNet detection + api:// / https backend switch
│   ├── bridge.ts              — low-level, promise-based wallet bridge access
│   ├── useSmartNetWallet.ts   — composable: connect / sign / open wallet panel
│   ├── usePayments.ts         — composable: one-off payments, subscriptions, verification
│   └── useStorage.ts          — composable: P2P file reads (f://) + namespaced local KV
└── example/
    └── MonetizedApp.vue       — a complete paywalled mini-app in ~100 lines
```

## Quick start

1. Copy `src/` into your Vue project (e.g. `src/smartnet/`).
2. Make sure `smartnet-env.d.ts` is picked up by `tsconfig.json` (`include` covers it).
3. Use the hooks:

```vue
<script setup lang="ts">
import { useSmartNetWallet, usePayments } from '@/smartnet'

const wallet = useSmartNetWallet()
const payments = usePayments({ receiver: 'SYourSTHAddress' })

async function unlock() {
  await wallet.connect()                       // slides the SmartNet wallet panel out
  await payments.pay('1.0', 'unlock:pro')      // user approves in the wallet drawer
}
</script>
```

4. Publish your built `dist/` through **SmartNet → My DApps → Publish** —
   your app becomes reachable at `sth://<appId>/` and every asset is seeded
   by the P2P swarm. Seeders earn Byte-Hours for distributing it; you earn
   STH from payments the SDK routes straight to your address.

## How the pieces fit

| Hook | What it wraps | UX in SmartNet |
|---|---|---|
| `useSmartNetWallet()` | `window.smartholdem` provider injected by the client | connect prompt / wallet drawer slides out |
| `usePayments()` | `sendTransaction` + on-chain REST verification | user approves a signed STH transfer |
| `useStorage()` | `f://<cid>` fetch + namespaced localStorage KV | instant P2P reads, no server |

Everything degrades gracefully in a normal browser: `isSmartNet` is `false`,
wallet calls reject with a friendly error, HTTP fallbacks are used.

Full integration guide: [`docs/10-SmartNet-App-SDK.md`](../docs/10-SmartNet-App-SDK.md)
Networking (api:// / ws tunnel) details: [`docs/08-dApp-Networking-Guide.md`](../docs/08-dApp-Networking-Guide.md)
