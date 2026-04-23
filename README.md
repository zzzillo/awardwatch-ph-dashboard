# AwardWatch PH Dashboard

AwardWatch PH is a React dashboard for exploring PhilGEPS contract award data.
It shows awarded value, contract counts, awardee rankings, delivery areas,
business categories, agencies, yearly trends, monthly trends, amount
distribution, and inspectable contract records.

Dataset source: [BetterGov Open Data Portal](https://data.bettergov.ph/datasets/5)

This repository is the **frontend only**. The Parquet dataset and FastAPI backend
live in the Hugging Face Docker Space:

```text
https://huggingface.co/spaces/pzypzy/awardwatch-ph-api
```

The deployed API base URL is:

```text
https://pzypzy-awardwatch-ph-api.hf.space
```

## Run Locally

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Run the frontend:

```bash
npm run dev -- --port 5173
```

Then open:

```text
http://localhost:5173
```

## Deploy To Vercel

Set this environment variable in Vercel:

```bash
VITE_API_BASE_URL=https://pzypzy-awardwatch-ph-api.hf.space
```

Use the default Vite settings:

```text
Build command: npm run build
Output directory: dist
```

Do not upload the Parquet dataset to GitHub or Vercel. The dataset belongs in
the Hugging Face Space backend repo and is tracked there with Git LFS.

## Notes

The dashboard treats high-value awards, concentration, and missing fields as
data signals for review, not findings of wrongdoing. The available dataset is
award-focused and does not include all procurement lifecycle fields such as
bidder counts, approved budgets, posting windows, or procurement modes.
