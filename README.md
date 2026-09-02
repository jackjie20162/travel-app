# travel-app

Global Dubai Travel mobile-first client. One Vue 3 + Vite codebase serves H5 and the Tauri 2 application shell; Android/iOS projects can be generated from the same Tauri project when mobile build environments are available.

## Architecture

`travel-app/H5 -> HTTPS -> travel-api -> gRPC -> travel-rpc -> Ent/MySQL`

No direct RPC/database or merchant-service dependency is allowed in the client.

## Local test

1. Install Node.js 20+ and Rust/Tauri prerequisites.
2. Set `VITE_TRAVEL_API_BASE_URL` when Travel API is not `http://localhost:9200`.
3. `npm install`
4. `npm run dev` for H5/browser testing.
5. `npm run tauri dev` for the Tauri shell.
6. `npm run build` for production H5 build verification.

## Status

- Mobile-first Vue/H5 UI: implemented baseline.
- Tauri 2 shell: implemented baseline.
- Android/iOS packaging: planned after API and checkout flows stabilize.
- AI Planner, product detail, traveler, cart, payment, voucher and order flows: next development stages.
