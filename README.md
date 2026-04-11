# Common Ground Checker

![Common Ground](./public/icons/Common_gound_logo_rgb.svg)
![Coverage](./badges/coverage.svg)

An online automatic compliance checker for [Common Ground](https://commonground.nl) — the Dutch vision and architecture for open, reusable software in municipalities.

## What it checks

Criteria are grouped into four categories. Each criterion has a requirement level (mandatory / recommended) and a configurable weight that influences the overall score.

### Governance

| # | Criterion | Level | Standard |
|---|-----------|-------|----------|
| 1 | **Actual source code** — repository contains real source files, not just docs or config | Mandatory | [commonground.nl](https://commonground.nl) |
| 2 | **OSI-approved open-source license** — LICENSE file with an OSI-approved identifier | Mandatory | [opensource.org/licenses](https://opensource.org/licenses) |
| 3 | **publiccode.yml** — government metadata file in the repository root | Mandatory | [Standard for Public Code](https://standard.publiccode.net) |

### Architecture

| # | Criterion | Level | Standard |
|---|-----------|-------|----------|
| 4 | **API-first / OpenAPI spec** — machine-readable OpenAPI or Swagger spec present *(required only when "Component is a register" is checked)* | Mandatory | [API Design Rules](https://commonground.nl/cms/view/54476259/api-designrules) |
| 5 | **5-Layer Architecture** — component belongs to a recognised Common Ground layer | Recommended | [5-lagen model](https://commonground.nl/cms/view/54476261/5-lagen-model) |

### Deployment & Operations

| # | Criterion | Level | Standard |
|---|-----------|-------|----------|
| 6 | **Docker support** — Dockerfile (and optionally docker-compose) present | Mandatory | [Haven](https://haven.commonground.nl) |
| 7 | **Available Docker image** — published registry image URL provided | Mandatory | [Haven](https://haven.commonground.nl) |
| 8 | **Helm chart (Kubernetes)** — Chart.yaml or K8s manifests present | Mandatory | [Haven](https://haven.commonground.nl) |

### Software Quality

| # | Criterion | Level | Standard |
|---|-----------|-------|----------|
| 9 | **Documentation** — README, docs folder, or external docs URL | Mandatory | [irealisatie.nl](https://www.irealisatie.nl/kennis/common-ground) |
| 10 | **Test suite** — automated tests or test configuration present | Recommended | [GitHub Actions](https://docs.github.com/en/actions/automating-builds-and-tests) |
| 11 | **Cyclomatic complexity (Lizard)** — average complexity (AvgCCN) is measured and compared against an admin-configurable threshold | Recommended | [lizard](https://github.com/terryyin/lizard) |
| 12 | **Contributing guide** — CONTRIBUTING file explaining how to contribute | Recommended | [GitHub docs](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors) |
| 13 | **Code of Conduct** — CODE_OF_CONDUCT file present | Recommended | [opensource.guide](https://opensource.guide/code-of-conduct/) |
| 14 | **Security policy** — SECURITY file with responsible disclosure info | Recommended | [GitHub docs](https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository) |
| 15 | **Semantic versioning** — releases or tags following MAJOR.MINOR.PATCH | Recommended | [semver.org](https://semver.org/) |
| 16 | **SBOM** — Software Bill of Materials (SPDX or CycloneDX) published | Recommended | [CISA SBOM](https://www.cisa.gov/sbom) |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Set up the database (PostgreSQL required)
cp .env.local.example .env
# Edit .env and configure DATABASE_URL and optionally GITHUB_TOKEN

# 3. Push the Prisma schema and generate the client
npm run db:push
npm run db:generate

# 3b. Install Lizard (required for cyclomatic complexity criterion)
py -m pip install lizard

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste a GitHub repository URL.

A **GitHub personal access token** in `.env` is optional but strongly recommended — the unauthenticated GitHub API rate limit is 60 requests/hour, which is quickly exhausted for newer repos.

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL + Prisma** — persistent analysis history and versioned scoring configs
- **GitHub REST API**

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── check/route.ts          # POST /api/check — runs all checks & persists result
│   │   ├── admin/scoring/route.ts  # GET/POST scoring weights
│   │   └── repo-history/route.ts   # GET analysis history
│   ├── admin/page.tsx              # Admin — configure criterion weights
│   ├── history/                    # History overview + per-repo + per-run detail
│   ├── about/page.tsx              # About page
│   ├── page.tsx                    # Main checker UI
│   └── layout.tsx
├── components/
│   ├── CheckerForm.tsx             # URL input, options, and register checkbox
│   ├── ResultCard.tsx              # Expandable result row
│   ├── ScoreBadge.tsx              # Circular score dial
│   ├── RepoMeta.tsx                # Repo metadata + version evidence
│   └── AdminWeightsForm.tsx        # Admin weight sliders
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── github.ts                   # GitHub API client + version detection
│   ├── types.ts                    # Shared TypeScript types
│   └── checkers/
│       ├── index.ts                # Orchestrator — runs all checks, computes score
│       ├── config.ts               # Scoring config — defaults, DB persistence
│       ├── sourcecode.ts
│       ├── openapi.ts
│       ├── license.ts
│       ├── publiccode.ts
│       ├── docker.ts
│       ├── dockerImage.ts
│       ├── helmchart.ts
│       ├── documentation.ts
│       ├── tests.ts
│       ├── complexity.ts
│       ├── contributing.ts
│       ├── codeofconduct.ts
│       ├── security.ts
│       ├── semver.ts
│       ├── sbom.ts
│       └── fiveLayer.ts
└── generated/prisma/               # Auto-generated Prisma client (git-ignored)
```

## Scoring

Each check has a configurable **weight** (0–1) set via the Admin page. Weights are stored in the database as versioned snapshots; each analysis run is linked to the exact scoring config used.

For the Lizard complexity criterion, the Admin page also stores a configurable
**average cyclomatic complexity threshold** (AvgCCN). The check passes when a
repository’s measured AvgCCN is at or below this threshold.

Score formula:
```
baseScore = round((Σ statusScore × weight) / (Σ weight) × 100)
score     = min(100, baseScore + euplBonus)
```

Status scores: **Pass** = 1.0 · **Warn / Info** = 0.5 · **Fail** = 0.

A **+10 bonus** is added when an EUPL license is detected (European Union Public Licence).

| Score | Label |
|-------|-------|
| ≥ 80 | ✅ Compliant |
| 50–79 | ⚠️ Partial |
| < 50 | ❌ Non-compliant |

> **Note:** Automated analysis is indicative only. Architecture checks rely on heuristics. For official certification, contact [commonground.nl](https://commonground.nl).

## License

Copyright © 2026 VNG Realisatie

This project is licensed under the **European Union Public Licence v. 1.2 (EUPL-1.2)**. See [LICENSE](LICENSE) for the full text.
