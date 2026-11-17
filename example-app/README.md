# NETFORY SDK - Example App

A complete, ready-to-publish **Vue 3 + Vite + Tailwind** dApp showcasing every
Netfory App SDK feature with a cyber-neon UI:

- **Runtime detection** - `window.__SMARTNET__`, client version, webview features
- **Wallet** - connect / disconnect / open wallet panel / sign message (login-with-wallet)
- **Payments** - STH subscriptions, one-off purchases, on-chain verification, receipt history
- **Storage** - P2P file reads (`f://<cid>`) + namespaced offline-first local KV

Fully self-contained: no external CDNs or fonts, `base: './'` - every asset
loads relative, so the built `dist/` works over `sth://` out of the box.

## Quick start

```bash
cd netfory-sdk/example-app
yarn install
yarn dev        # develop in a browser (web fallback mode)
yarn build      # -> dist/ ready for publishing
```

## Make it yours

1. Edit **`src/config.ts`** - one file holds every value to replace:
    - `RECEIVER` - your STH address (payments go here)
    - `NODE_ID` / `PROVIDER` - your P2P backend (optional, leave empty for client-only)
    - `SUB_PLAN` / prices / `ITEM_SKU` - your monetization catalog
2. `yarn build`
3. Publish `dist/` via **Netfory -> My DApps -> Publish** - your app becomes
   `sth://<appId>/`, seeded by the swarm.

## Structure

```
example-app/
├── src/
│   ├── config.ts          <- ALL replace-me values live here
│   ├── smartnet/          <- the SDK (copy of ../src, runtime reads config.ts)
│   ├── components/        <- one panel per SDK area + neon UI primitives
│   ├── App.vue            <- layout, background layers, header
│   └── style.css          <- cyber-neon design system (Tailwind + custom CSS)
├── vite.config.ts         <- base: './' (required for sth://)
└── tailwind.config.js
```

