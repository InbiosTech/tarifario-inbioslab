# Backend API (Minimal CRUD)

## Local setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Install dependencies:
   - `npm run api:install`
3. Start local MySQL + phpMyAdmin:
   - `npm run db:local:up`
4. Generate seed SQL if needed:
   - `npm run db:seed:generate`
5. Initialize DB (create DB + table + seed):
   - `npm run db:local:init`
6. Run API:
   - `npm run api:dev`

## Endpoints

- `GET /health`
- `GET /api/exams`
- `GET /api/exams/:id`
- `POST /api/exams` (requiere header `x-admin-key`)
- `PUT /api/exams/:id` (requiere header `x-admin-key`)
- `DELETE /api/exams/:id` (requiere header `x-admin-key`)
- `POST /api/exams/import` (requiere header `x-admin-key`)
- `GET /api/exams/audit?limit=50` (requiere rol admin)
- `GET /api/promotions` (publico, solo activas)
- `GET /api/promotions/admin` (requiere header `x-admin-key`)
- `GET /api/promotions/:id` (requiere header `x-admin-key`)
- `POST /api/promotions` (requiere header `x-admin-key`)
- `POST /api/promotions/upload-image` (multipart `image`, requiere header `x-admin-key`)
- `PUT /api/promotions/:id` (requiere header `x-admin-key`)
- `DELETE /api/promotions/:id` (requiere header `x-admin-key`)

Nota de negocio: promociones deben enviarse con `examId`; la API sincroniza automaticamente `price` y `fundament` desde el examen asociado en `laboratory_tests`.

### Role model (API key)

- `WRITE_API_KEY`: rol `write` (crear/editar/eliminar).
- `ADMIN_API_KEY`: rol `admin` (crear/editar/eliminar/importar/ver auditoria).
- Header opcional `x-actor`: nombre del operador para traza (si no se envia, se guarda `role:<rol>`).

### GET /api/exams query params

- `includeInactive=1` incluye registros inactivos.
- `search=texto` busca por nombre, muestra o metodo.
- `page=1` pagina actual (minimo 1).
- `pageSize=20` cantidad por pagina (1..100).
- `sortBy=id|name|price1|price2|active`
- `sortOrder=asc|desc`

### GET /api/exams response

```json
{
   "items": [
      {
         "id": 1,
         "name": "A.N.C.A ANTI-NEUTROFILOS",
         "sample": "suero",
         "method": "IFI - Inmunofluorescencia Indirecta",
         "price1": 180,
         "price2": 150,
         "tube": "tapa rojo ó amarillo",
         "info": "se sugiere ayuno de 8 hras",
         "time": "6 días",
         "quantity": 1,
         "active": 1
      }
   ],
   "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 182,
      "totalPages": 10
   }
}
```

### POST /api/exams/import payload

```json
{
   "truncate": false,
   "items": [
      {
         "id": 1,
         "name": "A.N.C.A ANTI-NEUTROFILOS",
         "sample": "suero",
         "method": "IFI - Inmunofluorescencia Indirecta",
         "price1": 180,
         "price2": 150,
         "tube": "tapa rojo o amarillo",
         "info": "se sugiere ayuno de 8 hras",
         "time": "6 dias",
         "quantity": 1,
         "active": 1
      }
   ]
}
```

## Cloud Run + Cloud SQL (MySQL) quick setup

1. Deploy Cloud Run service with Cloud SQL attachment:
   - gcloud run deploy tarifario-api --source . --region us-central1 --allow-unauthenticated --add-cloudsql-instances ecstatic-cosmos-458114-h4:us-central1:inbioslab-db
2. Configure runtime env vars in Cloud Run:
   - NODE_ENV=production
   - API_PORT=8080
   - DB_SOCKET_PATH_PROD=/cloudsql/ecstatic-cosmos-458114-h4:us-central1:inbioslab-db
   - DB_NAME_PROD=tarifario_inbioslab
   - DB_USER_PROD=app_inbioslab
   - DB_PASSWORD_PROD=<app_password>
   - WRITE_API_KEY_PROD=<write_key>
   - ADMIN_API_KEY_PROD=<admin_key>

When DB_SOCKET_PATH_PROD is set, the API connects through Cloud SQL Unix socket and ignores DB_HOST/DB_PORT.
