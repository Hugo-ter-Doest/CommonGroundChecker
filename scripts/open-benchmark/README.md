# Open-track benchmark

The open track rates maintainability against thresholds that anyone can check and regenerate. They come from a public benchmark of Common Ground and Developer Overheid repositories, with the benchmark method of Alves et al. The open track is not a SIG rating and does not predict one. The checker shows it next to the estimate, for information only (weight 0).

| file | what it is |
|---|---|
| `candidates.json` | the repositories considered, with where each was found, and the ones left out by kind |
| `measures/` | the raw measures of every candidate, written by `run.py` |
| `benchmark.json`, `benchmark.csv` | the repositories the thresholds come from: URL, commit, languages, code lines and why each is in |
| `../../src/lib/openModel/thresholds-<date>.json` | the thresholds the checker rates with |
| `run.py` | clones and measures the candidates |
| `derive.py` | selects the benchmark and derives the thresholds |

## Version 2026-11-18

60 repositories, 2.4 million code lines in scope (PHP 1.15M, Vue 368k, TypeScript 349k, Python 346k, JavaScript 186k). Measured with lizard 1.24.3 and jscpd 5.4.2.

| property | moderate / high / very high risk | 5 stars | 4 stars | 3 stars | 2 stars |
|---|---|---|---|---|---|
| unit size | more than 29 / 42 / 71 lines | 4.9 / 3.3 / 0.0% | 26.1 / 14.3 / 5.3% | 37.0 / 24.3 / 11.1% | 60.2 / 46.7 / 33.4% |
| unit complexity | McCabe above 5 / 7 / 10 | 8.2 / 1.9 / 0.4% | 24.9 / 14.6 / 6.2% | 34.4 / 23.9 / 13.1% | 45.1 / 38.1 / 32.2% |
| unit interfacing | more than 2 / 3 / 4 parameters (80/90/95%) | 0.7 / 0.0 / 0.0% | 13.2 / 3.9 / 1.9% | 21.6 / 10.4 / 6.6% | 31.4 / 19.2 / 12.2% |
| duplication | duplicated lines (jscpd) | 1.1% | 4.2% | 8.6% | 34.8% |

The benchmark rates exactly 3 / 18 / 18 / 18 / 3 repositories at 5 to 1 stars on every property. A star level allows at most the listed share of unit code above each bound; below the 2-star limits is 1 star. Module coupling and the component properties are not calibrated yet: the coupling tools are not in the checker image, so there are no benchmark measures for them.

## Sources of the candidates

- **developer.overheid.nl Open Source Register.** Its API (`api.developer.overheid.nl/oss-register/v1`) needs an API key, so the 98 repositories of its public listing (`oss.developer.overheid.nl/repositories`) were read instead on 2026-11-18.
- **Common Ground component catalogue.** `componentencatalogus.commonground.nl` did not resolve on 2026-11-18, so its data could not be used. The GitHub organisations that build the Common Ground components stand in for it: maykinmedia, VNG-Realisatie, ConductionNL, OpenWebconcept, open-zaak and open-formulieren.
- ConductionNL/opencatalogi is in, although GitHub marks it a fork: its upstream OpenCatalogi/opencatalogi was last pushed in June 2025.

## Selection

1. GitHub's primary language is PHP, Python, JavaScript, TypeScript or Vue (the languages the checker measures); a licence is detected; not a fork, not archived, pushed since 2023-11-18; repository size at least 300 KB.
2. Left out by kind, listed with a reason under `excluded` in `candidates.json`: libraries and SDKs, design systems, websites and documentation, templates and proofs of concept, wrappers that package another project, skill packs and data repositories, internal tools.
3. At least 2,000 code lines in the checker's production scope (`derive.py`, `MIN_CODE_LOC`).
4. At most 12 repositories per owner, the ones with the most GitHub stars first, then the largest (`MAX_PER_OWNER`). Without it ConductionNL alone would be 20 of 68 repositories.

`benchmark.json` lists what was left out at steps 3 and 4.

## Method

**Measurement** (`scripts/open-track/measure.py`, which the checker runs too): the production scope and lizard reader of the maintainability estimate, so tests, generated and third-party code stay out. Per language the script writes a histogram of unit LOC per metric value. Duplication is one jscpd 5 run per language over that language's files, with 6 lines, 30 tokens and weak mode, using jscpd's own duplicated and total line counts. All languages of a repository are pooled.

**Risk thresholds** (Alves, Ypma and Visser 2010, [doi:10.1109/ICSM.2010.5609747](https://doi.org/10.1109/ICSM.2010.5609747)): section IV, steps 1 to 6 (Fig. 2). Every unit weighs its LOC as a share of its repository's unit LOC (step 2), the weights are summed per metric value (step 3), every repository weighs the same (step 4), and the thresholds are the metric values at 70, 80 and 90% of that weighted distribution (steps 5 and 6). Unit interfacing takes 80, 90 and 95%, as in section VIII and Table IV, because its values hardly vary below 80%. Two choices are ours: the weight is divided by the repository's unit LOC (the paper's worked example divides by the system's total LOC, while step 2 requires the ratios to sum to 100%), and each bound is at least one above the previous one, which the paper does not need.

**Star limits** (Alves, Correia and Visser 2011, [doi:10.1109/IWSM-MENSURA.2011.15](https://doi.org/10.1109/IWSM-MENSURA.2011.15)), `calibrate()` in `derive.py`:
- Profiles are cumulative: the share of code above each risk bound (section II-A2).
- Limits come from Algorithm 1 (section III-A), for each star level, best first:
  - Step through the sorted shares with one common index until enough repositories rate at that level or better (lines 7 to 12).
  - Then lower each share's limit as far as that still holds (lines 13 to 26).
- The partition is 5/30/30/30/5%, which section IV-B names as an option after Baggen et al. The paper's own example is uniform, 20/20/20/20/20.
- A repository's stars follow section III-B1: per share the strictest level whose limit it stays within, and the lowest of those. The continuous interpolation of section III-B2 is not used.
- Duplication is calibrated the same way, with one share.

The paper does not define the `distribution()` function of Algorithm 1. We read it as the number of repositories rated at that level or better, compared with the cumulative partition count, so that the per-level counts come out as the partition. Neither the paper nor the thesis (Alves 2012, section 3.3.1) mentions a tolerance, and none is used. Limits are taken from the observed shares rounded up to 4 decimals.

Sources read: the 2010 paper (author copy), the 2011 paper (`mensura11-alves.pdf` on Tiago Alves's University of Minho page, read through the Internet Archive) and the thesis "Benchmark-based Software Product Quality Evaluation" (2012, same page).

The previous derivation of this version used the common index alone, without the optimisation of lines 13 to 26, and 70/80/90% for unit interfacing. It spread the benchmark as 6.7/28.3/31.7/28.3/5% on unit size and 5/30/31.7/31.7/1.7% on complexity. The bounds and the duplication limits did not change, and neither did the stars of OpenRegister and Open Zaak.

## Regenerate

The tools must be exactly lizard 1.24.3 (`pip install lizard==1.24.3`) and jscpd 5.4.2 (`npm install jscpd@5.4.2`); `derive.py` refuses a benchmark measured with mixed versions.

Reproduce the published version from the pinned commits:

```bash
python3 scripts/open-benchmark/run.py /tmp/open-benchmark --pinned scripts/open-benchmark/benchmark.json --jscpd <path to jscpd>
python3 scripts/open-benchmark/derive.py /tmp/open-benchmark --date 2026-11-18 --out-dir /tmp/open-benchmark --thresholds-dir /tmp/open-benchmark
```

Measuring at the pinned commits gives the same measures; this was checked for three repositories (open-zaak, open-klant, plugin-pdc-base). Re-deriving from the committed measures needs no clones: `python3 scripts/open-benchmark/derive.py scripts/open-benchmark --date 2026-11-18`.

A new version measures the default branches as they are now:

```bash
python3 scripts/open-benchmark/run.py <work dir> --jscpd <path to jscpd>
python3 scripts/open-benchmark/derive.py <work dir> --date <today>
```

Then point `src/lib/openModel/score.ts` at the new thresholds file. Every clone is shallow and blobless and is deleted after measuring.
