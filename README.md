# Common Ground Checker

An online automatic compliance checker for [Common Ground](https://commonground.nl) — the Dutch vision and architecture for open, reusable software in municipalities.

## What it checks

| # | Criterion | Standard |
|---|-----------|----------|
| 1 | **OpenAPI / API-first** — machine-readable spec present | [API Design Rules](https://commonground.nl/cms/view/54476259/api-designrules) |
| 2 | **OSI-approved open-source license** | [opensource.org/licenses](https://opensource.org/licenses) |
| 3 | **publiccode.yml** — government metadata file | [Standard for Public Code](https://standard.publiccode.net) |
| 4 | **Docker / Container** — Dockerfile + docker-compose | [Haven](https://haven.commonground.nl) |
| 5 | **5-Layer Architecture** — correct layer categorisation | [5-lagen model](https://commonground.nl/cms/view/54476261/5-lagen-model) |
| 6 | **Haven (Kubernetes)** — Helm chart + K8s best practices | [haven.commonground.nl](https://haven.commonground.nl) |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set a GitHub token for higher rate limits
cp .env.local.example .env.local
# Edit .env.local and add your GitHub token

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste a GitHub repository URL.

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **GitHub REST API** (no external dependencies beyond js-yaml)

## Architecture

```
src/
├── app/
│   ├── api/check/route.ts     # POST /api/check — runs all checks
│   ├── page.tsx               # Main UI page
│   └── layout.tsx
├── components/
│   ├── CheckerForm.tsx        # URL input form
│   ├── ResultCard.tsx         # Expandable result row
│   ├── ScoreBadge.tsx         # Circular score dial
│   └── RepoMeta.tsx           # Repo metadata card
└── lib/
    ├── github.ts              # GitHub API client
    ├── types.ts               # Shared TypeScript types
    └── checkers/
        ├── index.ts           # Orchestrator
        ├── openapi.ts         # OpenAPI/Swagger check
        ├── license.ts         # OSI license check
        ├── publiccode.ts      # publiccode.yml check
        ├── docker.ts          # Docker/container check
        ├── fiveLayer.ts       # 5-layer architecture check
        └── haven.ts           # Haven/Kubernetes check
```

## Scoring

Each check contributes to an overall score (0–100):
- **Pass** = full point
- **Warning** = half point
- **Fail** = no point

A score ≥ 80 is considered **Compliant**, 50–79 is **Partial**, < 50 is **Non-compliant**.

> **Note:** Automated analysis is indicative only. Architecture checks rely on heuristics. For official certification, contact [commonground.nl](https://commonground.nl).
