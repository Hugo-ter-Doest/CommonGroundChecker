#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Conduction <info@conduction.nl>
# SPDX-License-Identifier: EUPL-1.2
"""Derive the open-track thresholds from the benchmark measures.

  derive.py <work dir> --date YYYY-MM-DD [--candidates candidates.json] [--out-dir DIR] [--thresholds-dir DIR]

Reads <work dir>/measures/*.json (written by run.py) and writes:
  * <thresholds-dir>/thresholds-<date>.json, the thresholds the checker rates with;
  * <out-dir>/benchmark.json and benchmark.csv, the repositories they come from.

Method:
  1. Benchmark: a measured repository counts when it has at least MIN_CODE_LOC
     code lines in scope. At most MAX_PER_OWNER repositories of one owner count,
     the ones with the most GitHub stars first, then the largest.
  2. Risk thresholds (Alves, Ypma and Visser 2010): per unit metric, every unit
     weighs its LOC as a share of its repository's unit LOC, and every
     repository weighs the same. The thresholds are the metric values at 70, 80
     and 90 percent of that weighted distribution. A unit above the first is
     moderate risk, above the second high, above the third very high.
  3. Star limits (after Alves, Correia and Visser 2011): the benchmark is spread
     over 5 to 1 stars as 5/30/30/30/5 percent. For each star level the limits
     on the three cumulative risk shares are the per-share quantiles at one
     common level q, the lowest q at which the target share of repositories
     meets all three limits. Duplication has one share and takes its quantile.
All languages of a repository are pooled.
"""

import argparse
import csv
import glob
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MIN_CODE_LOC = 2000
MAX_PER_OWNER = 12
RISK_QUANTILES = (0.70, 0.80, 0.90)
# Share of the benchmark rated at this level or better: 5/30/30/30/5 percent per level.
CUMULATIVE = {5: 0.05, 4: 0.35, 3: 0.65, 2: 0.95}
RISK_PROPERTIES = {
    "unit_size": "unit size in lines of code (lizard NLOC)",
    "unit_complexity": "McCabe cyclomatic complexity per unit (lizard CCN)",
    "unit_interfacing": "parameters per unit (lizard)",
}
Q_STEP = 0.0005


def owner(name):
    return name.split("/")[0]


def pooled(measures):
    """One repository's languages added up: {code_loc, unit_loc, histograms, duplication}."""
    out = {"code_loc": 0, "unit_loc": 0, "lines": 0, "duplicated_lines": 0, "languages": {}}
    hist = {prop: {} for prop in RISK_PROPERTIES}
    measured_dup = False
    for lang, entry in measures["languages"].items():
        out["code_loc"] += entry["code_loc"]
        out["unit_loc"] += entry["unit_loc"]
        out["languages"][lang] = entry["code_loc"]
        for prop in RISK_PROPERTIES:
            for value, loc in entry[prop].items():
                hist[prop][int(value)] = hist[prop].get(int(value), 0) + loc
        if entry.get("duplication"):
            measured_dup = True
            out["lines"] += entry["duplication"]["lines"]
            out["duplicated_lines"] += entry["duplication"]["duplicated_lines"]
    out["histograms"] = hist
    out["duplication"] = out["duplicated_lines"] / out["lines"] if measured_dup and out["lines"] else None
    return out


def select(repos, candidates):
    """The benchmark: big enough, and at most MAX_PER_OWNER per owner."""
    stars = {c["name"]: c.get("stars", 0) for c in candidates}
    big = [r for r in repos if r["pooled"]["code_loc"] >= MIN_CODE_LOC and r["pooled"]["unit_loc"] > 0]
    big.sort(key=lambda r: (owner(r["name"]).lower(), -stars.get(r["name"], 0), -r["pooled"]["code_loc"], r["name"]))
    kept, per_owner, capped = [], {}, []
    for r in big:
        n = per_owner.get(owner(r["name"]), 0)
        if n >= MAX_PER_OWNER:
            capped.append(r["name"])
            continue
        per_owner[owner(r["name"])] = n + 1
        kept.append(r)
    small = sorted(r["name"] for r in repos if r not in big)
    return sorted(kept, key=lambda r: r["name"].lower()), small, capped


def risk_thresholds(repos, prop):
    """Metric values at the 70/80/90 percent points of the LOC-weighted
    distribution in which every repository weighs the same; each bound at least
    one above the previous one."""
    weights = {}
    for r in repos:
        total = r["pooled"]["unit_loc"]
        for value, loc in r["pooled"]["histograms"][prop].items():
            weights[value] = weights.get(value, 0.0) + loc / total / len(repos)
    bounds, cumulative, values = [], 0.0, sorted(weights)
    targets = list(RISK_QUANTILES)
    for value in values:
        cumulative += weights[value]
        while targets and cumulative >= targets[0] - 1e-12:
            bounds.append(value)
            targets.pop(0)
    while targets:
        bounds.append(values[-1])
        targets.pop(0)
    for i in range(1, len(bounds)):
        bounds[i] = max(bounds[i], bounds[i - 1] + 1)
    return bounds


def profile(pooled_repo, prop, bounds):
    """Share of unit LOC strictly above each bound."""
    hist = pooled_repo["histograms"][prop]
    total = pooled_repo["unit_loc"]
    return [sum(loc for value, loc in hist.items() if value > bound) / total for bound in bounds]


def nearest_rank(sorted_values, q):
    index = min(len(sorted_values) - 1, max(0, math.ceil(q * len(sorted_values)) - 1))
    return sorted_values[index]


def ceil4(x):
    return math.ceil(x * 10000 - 1e-9) / 10000


def risk_star_limits(profiles):
    """{level: [limit per bound]}: the per-bound quantiles at the lowest common
    q at which the target share of repositories meets every limit."""
    columns = [sorted(p[i] for p in profiles) for i in range(3)]
    limits = {}
    for level, target in CUMULATIVE.items():
        q = target
        while True:
            caps = [ceil4(nearest_rank(col, q)) for col in columns]
            meets = sum(all(p[i] <= caps[i] for i in range(3)) for p in profiles) / len(profiles)
            if meets >= target - 1e-12 or q >= 1:
                break
            q = min(1.0, q + Q_STEP)
        limits[level] = caps
    return limits


def share_star_limits(shares):
    values = sorted(shares)
    return {level: ceil4(nearest_rank(values, target)) for level, target in CUMULATIVE.items()}


def stars_risk(shares, limits):
    return next((lvl for lvl in (5, 4, 3, 2) if all(s <= c for s, c in zip(shares, limits[lvl]))), 1)


def stars_share(share, limits):
    return next((lvl for lvl in (5, 4, 3, 2) if share <= limits[lvl]), 1)


def spread(stars):
    return {str(lvl): round(sum(1 for s in stars if s == lvl) / len(stars), 3) for lvl in (5, 4, 3, 2, 1)}


def reason(r, candidate):
    langs = ", ".join(f"{lang} {loc}" for lang, loc in sorted(r["pooled"]["languages"].items(), key=lambda kv: -kv[1]))
    return (f"{'; '.join(candidate.get('sources', []))}; licence {candidate.get('licence') or 'unknown'}; "
            f"{r['pooled']['code_loc']} code lines in scope ({langs})")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Derive the open-track thresholds from the benchmark measures.")
    parser.add_argument("work")
    parser.add_argument("--date", required=True)
    parser.add_argument("--candidates", default=os.path.join(HERE, "candidates.json"))
    parser.add_argument("--out-dir", default=HERE)
    parser.add_argument("--thresholds-dir", default=os.path.join(HERE, "..", "..", "src", "lib", "openModel"))
    args = parser.parse_args(argv)

    with open(args.candidates) as fh:
        candidates = json.load(fh)["candidates"]
    by_name = {c["name"]: c for c in candidates}
    repos = []
    for path in sorted(glob.glob(os.path.join(args.work, "measures", "*.json"))):
        with open(path) as fh:
            m = json.load(fh)
        repos.append({"name": m["name"], "url": m["url"], "commit": m["head"], "tools": m["tools"], "pooled": pooled(m)})
    bench, small, capped = select(repos, candidates)
    if len(bench) < 10:
        print(f"only {len(bench)} repositories qualify; need at least 10", file=sys.stderr)
        return 2
    tools = sorted({json.dumps(r["tools"], sort_keys=True) for r in bench})
    if len(tools) != 1:
        print(f"the benchmark was measured with different tool versions: {tools}", file=sys.stderr)
        return 2

    properties, measured = {}, {r["name"]: {} for r in bench}
    for prop, metric in RISK_PROPERTIES.items():
        bounds = risk_thresholds(bench, prop)
        profiles = [profile(r["pooled"], prop, bounds) for r in bench]
        limits = risk_star_limits(profiles)
        stars = [stars_risk(p, limits) for p in profiles]
        for r, p, s in zip(bench, profiles, stars):
            measured[r["name"]][prop] = {"shares": [round(x, 4) for x in p], "stars": s}
        properties[prop] = {
            "kind": "risk-profile",
            "metric": metric,
            "bounds": bounds,
            "stars": {str(level): caps for level, caps in limits.items()},
            "benchmark_spread": spread(stars),
        }
    dup = [r for r in bench if r["pooled"]["duplication"] is not None]
    if len(dup) >= 10:
        limits = share_star_limits([r["pooled"]["duplication"] for r in dup])
        stars = [stars_share(r["pooled"]["duplication"], limits) for r in dup]
        for r, s in zip(dup, stars):
            measured[r["name"]]["duplication"] = {"share": round(r["pooled"]["duplication"], 4), "stars": s}
        properties["duplication"] = {
            "kind": "share",
            "metric": "duplicated lines as a share of all lines, jscpd 5 (6 lines, 30 tokens, weak mode), one run per language",
            "stars": {str(level): cap for level, cap in limits.items()},
            "benchmark_spread": spread(stars),
            "repositories": len(dup),
        }

    thresholds = {
        "version": args.date,
        "track": "open",
        "description": "Open-track maintainability thresholds, derived from a public benchmark of Common Ground and "
                       "Developer Overheid repositories with the benchmark method of Alves et al. Not a SIG rating.",
        "method": {
            "risk_thresholds": "Alves, Ypma and Visser 2010: metric values at 70/80/90% of the LOC-weighted unit "
                               "distribution, every repository weighing the same",
            "star_limits": "after Alves, Correia and Visser 2011: 5/30/30/30/5% of the benchmark per star level; the "
                           "limits of a level are the per-share quantiles at the lowest common level that rates the "
                           "target share of repositories at that level or better",
            "pooling": "all languages of a repository are pooled",
            "rounding": "star limits are rounded up to 4 decimals",
            "regenerate": "scripts/open-benchmark/README.md",
        },
        "distribution": {"5": 0.05, "4": 0.30, "3": 0.30, "2": 0.30, "1": 0.05},
        "tools": json.loads(tools[0]),
        "benchmark": {"repositories": len(bench), "list": "scripts/open-benchmark/benchmark.json",
                      "min_code_loc": MIN_CODE_LOC, "max_per_owner": MAX_PER_OWNER},
        "properties": properties,
        "not_calibrated": {
            "module_coupling": "no benchmark measures yet, because the coupling tools are not in the checker image",
            "component_independence": "no benchmark measures yet, because the coupling tools are not in the checker image",
            "component_entanglement": "no benchmark measures yet, because the coupling tools are not in the checker image",
        },
    }
    os.makedirs(args.thresholds_dir, exist_ok=True)
    with open(os.path.join(args.thresholds_dir, f"thresholds-{args.date}.json"), "w") as fh:
        json.dump(thresholds, fh, indent=2)
        fh.write("\n")

    rows = []
    for r in bench:
        c = by_name.get(r["name"], {})
        rows.append({
            "name": r["name"], "url": r["url"], "commit": r["commit"],
            "languages": r["pooled"]["languages"], "code_loc": r["pooled"]["code_loc"],
            "unit_loc": r["pooled"]["unit_loc"], "licence": c.get("licence"),
            "reason": reason(r, c), "measured": measured[r["name"]],
        })
    benchmark = {"version": args.date, "repositories": rows,
                 "left_out": {"below_min_code_loc": small, "over_owner_cap": capped}}
    with open(os.path.join(args.out_dir, "benchmark.json"), "w") as fh:
        json.dump(benchmark, fh, indent=1)
        fh.write("\n")
    with open(os.path.join(args.out_dir, "benchmark.csv"), "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["name", "url", "commit", "languages", "code_loc", "licence", "reason"])
        for row in rows:
            langs = " ".join(f"{k}:{v}" for k, v in sorted(row["languages"].items()))
            w.writerow([row["name"], row["url"], row["commit"], langs, row["code_loc"], row["licence"], row["reason"]])
    print(json.dumps({"repositories": len(bench), "properties": {
        k: {"bounds": v.get("bounds"), "stars": v["stars"], "spread": v["benchmark_spread"]} for k, v in properties.items()}},
        indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
