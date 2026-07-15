Base de datos local (MySQL 8.0) y migracion a Google Cloud SQL MySQL

0) Preparar variables de entorno
- Copia .env.example a .env y ajusta solo los valores locales/produccion necesarios.
- El archivo .env no se versiona; .env.example si.
- Nota de capas: credenciales de runtime del API deben vivir en backend/.env (ver backend/.env.example).

1) Levantar MySQL local + phpMyAdmin
- Ejecuta: npm run db:local:up
- Servicios:
  - MySQL: localhost:${LOCAL_DB_PORT}
  - phpMyAdmin: http://localhost:${PMA_HTTP_PORT}
- Credenciales MySQL del contenedor:
  - database: ${LOCAL_DB_NAME}
  - user: ${LOCAL_DB_USER}
  - password: ${LOCAL_DB_PASSWORD}
  - root password: ${LOCAL_DB_ROOT_PASSWORD}

2) Generar SQL seed desde src/db/data.js
- Ejecuta: npm run db:seed:generate
- Salida: database/seed.from_data.sql

3) Crear tabla y cargar datos localmente (cliente mysql)
- mysql -h 127.0.0.1 -P ${LOCAL_DB_PORT} -u ${LOCAL_DB_USER} -p${LOCAL_DB_PASSWORD} ${LOCAL_DB_NAME} < database/schema.sql
- mysql -h 127.0.0.1 -P ${LOCAL_DB_PORT} -u ${LOCAL_DB_USER} -p${LOCAL_DB_PASSWORD} ${LOCAL_DB_NAME} < database/seed.from_data.sql

4) Cargar datos con phpMyAdmin (alternativa)
- Abrir http://localhost:${PMA_HTTP_PORT}
- Seleccionar BD ${LOCAL_DB_NAME}
- Importar primero database/schema.sql
- Importar luego database/seed.from_data.sql

5) Exportar SQL para Cloud SQL MySQL
- mysqldump -h 127.0.0.1 -P ${LOCAL_DB_PORT} -u ${LOCAL_DB_USER} -p${LOCAL_DB_PASSWORD} --single-transaction --routines --triggers ${LOCAL_DB_NAME} > database/tarifario_inbioslab.sql

6) Importar en Google Cloud SQL (MySQL)
- Subir database/tarifario_inbioslab.sql a Cloud Storage
- Ejecutar:
  - gcloud sql import sql <INSTANCE_NAME> gs://<BUCKET>/tarifario_inbioslab.sql --database=tarifario_inbioslab

Notas para produccion (Cloud SQL)
- Usa variables PROD_DB_HOST, PROD_DB_PORT, PROD_DB_NAME, PROD_DB_USER, PROD_DB_PASSWORD.
- Si tu backend se conecta por Cloud SQL Connector o IP privada, configura PROD_DB_HOST segun ese flujo.
- Nunca commitees credenciales reales en .env.example.

7) Apagar entorno local
- Ejecuta: npm run db:local:down
