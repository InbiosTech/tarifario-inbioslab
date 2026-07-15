#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   PROJECT_ID=your-project-id \
#   REGION=us-central1 \
#   SERVICE=tarifario-backend \
#   INSTANCE=project:region:instance \
#   BUCKET=tarifario-inbioslab-assets \
#   DB_NAME=tarifario_inbioslab \
#   DB_USER=app_inbioslab \
#   DB_PASSWORD='***' \
#   WRITE_API_KEY='***' \
#   ADMIN_API_KEY='***' \
#   ADMIN_PORTAL_PASSWORD='***' \
#   CORS_ORIGIN='https://inbiostech.github.io' \
#   ./scripts/cloudshell/deploy-backend-cloudrun.sh

: "${PROJECT_ID:?PROJECT_ID required}"
: "${REGION:?REGION required}"
: "${SERVICE:?SERVICE required}"
: "${INSTANCE:?INSTANCE required}"
: "${BUCKET:?BUCKET required}"
: "${DB_NAME:?DB_NAME required}"
: "${DB_USER:?DB_USER required}"
: "${DB_PASSWORD:?DB_PASSWORD required}"
: "${WRITE_API_KEY:?WRITE_API_KEY required}"
: "${ADMIN_API_KEY:?ADMIN_API_KEY required}"
: "${ADMIN_PORTAL_PASSWORD:?ADMIN_PORTAL_PASSWORD required}"
: "${CORS_ORIGIN:?CORS_ORIGIN required}"

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

gcloud config set project "$PROJECT_ID"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Create bucket if missing
if ! gcloud storage buckets describe "gs://$BUCKET" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET" --project "$PROJECT_ID" --location "$REGION" --uniform-bucket-level-access
fi

# Public read for objects (for direct image URLs)
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="allUsers" \
  --role="roles/storage.objectViewer" \
  --project "$PROJECT_ID"

# Allow Cloud Run runtime SA to write objects
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$RUNTIME_SA" \
  --role="roles/storage.objectAdmin" \
  --project "$PROJECT_ID"

cd "$BACKEND_DIR"

gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$INSTANCE" \
  --set-env-vars "NODE_ENV=production,CORS_ORIGIN=$CORS_ORIGIN,DB_SOCKET_PATH_PROD=/cloudsql/$INSTANCE,DB_NAME_PROD=$DB_NAME,DB_USER_PROD=$DB_USER,DB_PASSWORD_PROD=$DB_PASSWORD,WRITE_API_KEY_PROD=$WRITE_API_KEY,ADMIN_API_KEY_PROD=$ADMIN_API_KEY,ADMIN_PORTAL_PASSWORD_PROD=$ADMIN_PORTAL_PASSWORD,PROMOTIONS_ASSETS_BUCKET_PROD=$BUCKET,PROMOTIONS_ASSETS_PUBLIC_BASE_URL_PROD=https://storage.googleapis.com/$BUCKET"

SERVICE_URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"

echo "Health check: $SERVICE_URL/health"
curl -fsS "$SERVICE_URL/health"
echo

echo "Done. Now re-upload promotion images from Admin so DB URLs point to persistent bucket files."
