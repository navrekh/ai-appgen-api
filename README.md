# AI AppGen API (React Native MVP)

**What it does**: Accepts a prompt, generates a React Native (Expo) project with Gemini, uploads source.zip to Cloud Storage, triggers Cloud Build to produce an APK, and returns links via `/apps/:id`.

## Endpoints
- `GET /health`
- `POST /generate` -> `{ prompt }`
- `GET /apps/:id`

## Deploy to Cloud Run
```
PROJECT_ID=<your project>
REGION=asia-south1
gcloud config set project $PROJECT_ID

gcloud run deploy ai-appgen-api   --source .   --region $REGION   --allow-unauthenticated   --set-env-vars FIREBASE_PROJECT_ID=$PROJECT_ID,FIREBASE_STORAGE_BUCKET=$PROJECT_ID.appspot.com,APP_BUCKET=$PROJECT_ID-ai-apps,GEMINI_API_KEY=YOUR_KEY
```

Grant IAM if needed:
```
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/storage.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/cloudbuild.builds.editor"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/run.invoker"
```
Create bucket:
```
gsutil mb -l asia-south1 gs://$PROJECT_ID-ai-apps || true
```
