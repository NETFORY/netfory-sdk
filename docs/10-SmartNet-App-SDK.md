# 10 - SmartNet App SDK: integrating a web dApp

> How to make any web frontend (Vue/React/vanilla) a first-class SmartNet
> dApp: detect the client, talk to your backend over P2P, slide the wallet
> panel out from your own menu, accept STH payments and read P2P storage.
>
> Ready-made Vue hooks live in [`/smartnet-sdk`](../README.md).
> Networking deep-dive: [08-dApp-Networking-Guide.md](./08-dApp-Networking-Guide.md).
> Live playground: [dapp-bridge-test.html](./dapp-bridge-test.html).

---

## 1. What SmartNet injects into your page

Every dApp webview (`sth://<appId>/…`) receives two frozen globals **before
your first script runs** (Tauri `initialization_script`), so detection is
synchronous and race-free:

```ts
window.__SMARTNET__ = Object.freeze({
  isSmartNet: true,        // THE detection flag
  protocol: 'api',         // recommended backend transport
  appId: '<your sth id>',  // the authority your app is served from
  clientVersion: '1.63.10',
  network: 'mainnet',
  features: Object.freeze({
    wallet: true,          // window.smartholdem is present
    apiScheme: true,       // fetch('api://<node>/<provider>/…') works
    fileScheme: true,      // fetch('f://<cid>/') works
    translate: true,       // window.__sthI18n page translation
    crypto: true,          // window.crypto.subtle guaranteed
  }),
})

window.smartholdem = {
  isSmartHoldem: true,
  version: '1.0.0',
  network: 'mainnet',
  getAccount(),            // → { address }            (connect prompt)
  signMessage(message),    // → { address, publicKey, hash, message, signature }
  signTransaction(payload),// sign only (user-approved)
  sendTransaction(payload),// sign + broadcast (user-approved)
  requestSwap(payload),    // deep-link into the in-wallet Swap hub
  openWallet(),            // slide the wallet panel out (client ≥ 1.63.10)
}
```

`__SMARTNET__` is defined with `Object.defineProperty + Object.freeze` - a
page cannot forge or mutate it. In a plain browser both globals are simply
`undefined`.

## 2. Detecting SmartNet from a Vue app

Create a `runtime.ts` that every other module imports **first** (full
version: [`src/runtime.ts`](../src/runtime.ts)):

```ts
export const IS_SMARTNET = !!window.__SMARTNET__?.isSmartNet
export const CLIENT_VERSION = window.__SMARTNET__?.clientVersion ?? 'web'

// Backend switch: P2P inside SmartNet, HTTPS everywhere else.
const NODE_ID = '<64-hex node id hosting your provider>'
const PROVIDER = 'myprovider'
export const BACKEND_URL = IS_SMARTNET
  ? `api://${NODE_ID}/${PROVIDER}`
  : import.meta.env.VITE_BACKEND_URL
```

Because the flag exists before module evaluation, `IS_SMARTNET` is safe in
`data()`, `setup()`, router guards and top-level `await` alike - no flicker,
no async detection dance.

**Dynamic decentralized addresses.** The same pattern swaps ANY standard
endpoint for its decentralized twin: REST (`api://`), WebSocket
(`ws://<nodeId>` + provider path - see rule #5 of the Networking Guide),
media/assets (`f://<cid>/`). Keep the constants in one module and the rest of
the app stays transport-agnostic.

## 3. Opening the wallet panel from your app menu

Two ways, both promise-based:

```ts
// a) Explicit "Wallet" menu item - no signing, the panel just slides out:
await window.smartholdem.openWallet()          // client ≥ 1.63.10

// b) Connect handshake - first call per origin shows the connect prompt
//    (which also surfaces the wallet); trusted origins resolve silently:
const { address } = await window.smartholdem.getAccount()
```

With the SDK:

```vue
<script setup>
import { useSmartNetWallet } from '@/smartnet'
const wallet = useSmartNetWallet()
</script>

<template>
  <button v-if="wallet.hasWallet" @click="wallet.openWallet()">Wallet</button>
  <button @click="wallet.connect()">Connect · {{ wallet.address.value }}</button>
</template>
```

`openWallet()` in the SDK automatically falls back to `getAccount()` on
older clients.

## 4. Payments & subscriptions (`usePayments`)

A payment is a signed STH transfer to **your** address with a
machine-readable memo (`vendorField`). The chain itself is the receipt
database - verification is a public REST query, no payment processor:

```ts
const payments = usePayments({ receiver: 'SYourAddress' })

await payments.pay('2.5', 'item:skin-42')        // in-app purchase
await payments.subscribe('pro', '5', 30)         // memo: sub:pro:30d
await payments.hasActiveSubscription('pro')      // on-chain check, 1 fetch
await payments.hasPurchase('item:skin-42')       // one-time unlock check
```

Flow: `sendTransaction` → the SmartNet wallet drawer slides out with
recipient/amount/memo → the user approves → the promise resolves with the
broadcast result (or rejects on "User rejected"). `hasActiveSubscription`
scans `/api/transactions?senderId=…&recipientId=…` and checks the
`sub:<plan>:<N>d` memo against its age.

> Server-side gating: your backend can run the exact same REST query before
> serving premium content - the client-side check is UX, the chain is truth.

## 5. P2P storage (`useStorage`)

```ts
const storage = useStorage({ namespace: 'my-game' })

// P2P reads - file published via SmartNet File Exchange / DevHub release:
const url   = storage.fileUrl('bafy…cid')        // f://<cid>/ inside SmartNet
const pack  = await storage.fetchJson('bafy…')   // manifests, level packs
const bytes = await storage.fetchFile('bafy…')   // raw assets

// Local, self-custody KV (settings / save-games):
storage.setItem('progress', { level: 7 })
const p = storage.getItem('progress', { level: 1 })
```

Publishing new files is a **user-gated host feature** (My Files → Add file →
copy CID). A dApp only reads by CID - it can never silently push data into
the swarm on the user's behalf. Seeders replicating your assets earn
Byte-Hours; you ship a static frontend and the network handles distribution.

## 6. Deep links

`sth://<appId>/<inner/route>` opens your app **directly at the inner SPA
route** (client ≥ 1.63.9), e.g.:

```
sth://SYEm1LbVvSCfDvW84Jf9kRWzcJEHidCFGW/trading/XBTSX.STH_XBTSX.USDT
```

Missing paths without a real static-asset extension fall back to your
`index.html`, so vue-router (history mode) resolves the route. Share links
to any screen of your dApp.

## 6.1 Linking - open other dApps / host pages from your app

Since client **1.63.11** any SmartNet custom-scheme link inside your dApp
opens as a **new native tab (or page) in the host shell** - it never
navigates your webview away. No SDK call is required; plain HTML works:

```html
<!-- another dApp, straight to an inner route -->
<a href="sth://Sfu4R7bhRcth9iPZoVQ6jw3hYm1o69QDjT/trading/XBTSX.STH_XBTSX.USDT">
  Trade STH/USDT
</a>

<!-- a user profile (S-address or registered username) -->
<a href="u://SYEm1LbVvSCfDvW84Jf9kRWzcJEHidCFGW">Author profile</a>
<a href="u://technolog">@technolog</a>

<!-- host system pages -->
<a href="sn://music">Music</a>
<a href="sn://file/bafybe...cid">File page (download / purchase)</a>

<!-- file page by CID, DevHub repo, Netfory node view -->
<a href="f://bafybe...cid">Attached file</a>
<a href="dev://technolog/smartnet-sdk">Source on DevHub</a>
<a href="api://Sfu4.../provider/status">Node status</a>
```

Programmatic navigation is intercepted too - all three paths below are
equivalent to clicking the link:

```js
window.open('sth://<appId>/settings')
window.location.href = 'sth://<appId>/settings'
// or just render an <a href="sth://..."> and let the user click
```

Supported schemes: `sth://` `u://` `sn://` `api://` `f://` `dev://`.

Notes:
- `sth://` links to **your own appId** are NOT intercepted - they navigate
  inside your webview as normal SPA routing. Use relative router links for
  in-app navigation; absolute `sth://` only for cross-app links.
- `http(s)://` links keep the clearnet flow (trusted-host allowlist or the
  warning modal) - see the ClearNet egress section.
- On clients < 1.63.11 such links navigate the webview itself; gate on
  `window.__SMARTNET__.clientVersion` if you need to support older hosts.

## 7. Publish & earn (one-click monetized publish)

1. `vite build` → static `dist/`.
2. SmartNet → **My DApps → Publish**: pick the folder, sign, done. Your app
   gets an `sth://<appId>` address, is announced to the DHT and seeded P2P.
3. Payments from `usePayments` land in your wallet immediately; seeders earn
   Byte-Hours for distributing your assets; updates are re-published the
   same way and auto-detected by installed clients.

## 8. Checklist

- [ ] `runtime.ts` imported first; all endpoints derived from `IS_SMARTNET`.
- [ ] Socket.IO uses `SOCKET_ORIGIN` + `SOCKET_PATH` (never a URL with path).
- [ ] Wallet calls wrapped in try/catch - the user can always reject.
- [ ] HTTPS/no-wallet fallbacks for plain-browser mode.
- [ ] Memos follow one convention (`sub:…` / `item:…`) - they are your receipts.
- [ ] Test in the playground: `docs/dapp-bridge-test.html`.
