# Deployment

## Architecture

- GitHub + Vercel: this React frontend repository.
- Hugging Face Docker Space: FastAPI backend and Parquet dataset.

The browser requests compact JSON responses from the Hugging Face Space. The
frontend repo should stay small and should not contain `dataset/`, backend
runtime files, generated JSON bundles, screenshots, or build output.

## Vercel

Set:

```bash
VITE_API_BASE_URL=https://pzypzy-awardwatch-ph-api.hf.space
```

Use:

```text
Build command: npm run build
Output directory: dist
```

## Hugging Face Space

The backend has already been pushed to:

```text
https://huggingface.co/spaces/pzypzy/awardwatch-ph-api
```

The Space should be public for direct browser calls. If it is private, Vercel
would need a server-side authenticated proxy because the frontend must not
expose a Hugging Face token.

Smoke-test endpoint:

```text
https://pzypzy-awardwatch-ph-api.hf.space/api/health
```
