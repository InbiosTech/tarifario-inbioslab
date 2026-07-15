# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Environment separation by layer

This project now keeps environment variables separated by application layer:

- Frontend (Vite): `.env.frontend.example`
- Backend/API: `backend/.env.example`
- Local database tooling (Docker + phpMyAdmin): `.env.example`

### Local development flow

1. Frontend: copy `.env.frontend.example` to `.env.local` and adjust `VITE_*` values.
2. Backend/API: copy `backend/.env.example` to `backend/.env` and set DB credentials.
3. DB containers: copy `.env.example` to `.env` for local MySQL/phpMyAdmin values.

### Production flow (Cloud Run)

1. Do not deploy any `.env` file with secrets.
2. Inject backend variables directly in Cloud Run environment settings (or Secret Manager).
3. Build frontend with production API URL (`VITE_API_BASE_URL_PROD`) from CI/CD environment variables.

## Full local bootstrap (DB + API + Frontend)

1. Install frontend dependencies:
	- `npm install`
2. Install backend dependencies:
	- `npm run api:install`
3. Generate seed from current catalog:
	- `npm run db:seed:generate`
4. Start local MySQL (Docker) when available:
	- `npm run db:local:up`
5. Initialize local DB (create DB, schema, seed):
	- `npm run db:local:init`
6. Start backend API:
	- `npm run api:dev`
7. Start frontend Vite app:
	- `npm run dev`

Notes:
- If Docker is not installed, `db:local:init` can still work against a running local MySQL service (for example Laragon) using values from `.env`.
- Frontend uses API when `VITE_USE_API=true` in `.env.local`; otherwise it falls back to `src/db/data.js`.
