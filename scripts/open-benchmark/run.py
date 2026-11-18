#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Conduction <info@conduction.nl>
# SPDX-License-Identifier: EUPL-1.2
"""Measure every benchmark candidate with the open-track measure script.

  run.py <work dir> [--candidates candidates.json] [--pinned benchmark.json] [--jobs N] [--jscpd PATH]

Each repository is cloned shallow and blobless into <work dir>/clones, measured
with scripts/open-track/measure.py (lizard units and jscpd 5 duplication), and
the clone is deleted again. Measures land in <work dir>/measures/<slug>.json;
a repository that already has measures is skipped, so a broken run resumes.

Without --pinned the default branch is measured as it is now. With --pinned
(a benchmark.json written by derive.py) every repository is checked out at the
commit recorded there, which reproduces the published thresholds.
"""

import argparse
import concurrent.futures
import json
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
MEASURE = os.path.join(HERE, "..", "open-track", "measure.py")


def slug(name):
    return name.replace("/", "__")


def git(*args, cwd=None):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)


def clone(url, target, sha=None):
    """A shallow, blobless clone of the default branch, or of one commit."""
    if sha:
        os.makedirs(target)
        steps = [("init", "-q"), ("remote", "add", "origin", url),
                 ("fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", sha),
                 ("checkout", "-q", "FETCH_HEAD")]
        for step in steps:
            p = git(*step, cwd=target)
            if p.returncode:
                return p.stderr.strip()[-300:]
        return None
    p = git("clone", "-q", "--depth", "1", "--filter=blob:none", url, target)
    return p.stderr.strip()[-300:] if p.returncode else None


def run_one(work, candidate, sha, jscpd):
    out = os.path.join(work, "measures", slug(candidate["name"]) + ".json")
    if os.path.isfile(out):
        return candidate["name"], "cached"
    target = os.path.join(work, "clones", slug(candidate["name"]))
    shutil.rmtree(target, ignore_errors=True)
    started = time.time()
    try:
        error = clone(candidate["url"], target, sha)
        if error:
            return candidate["name"], f"clone failed: {error}"
        args = [sys.executable, MEASURE, target, "--json", out + ".part"]
        if jscpd:
            args += ["--jscpd", jscpd]
        p = subprocess.run(args, capture_output=True, text=True)
        if p.returncode not in (0, 4):
            return candidate["name"], f"measure failed ({p.returncode}): {p.stderr.strip()[-300:]}"
        with open(out + ".part") as fh:
            measures = json.load(fh)
        measures["name"] = candidate["name"]
        measures["url"] = candidate["url"]
        measures["seconds"] = round(time.time() - started, 1)
        with open(out, "w") as fh:
            json.dump(measures, fh, indent=1, sort_keys=True)
            fh.write("\n")
        os.remove(out + ".part")
        return candidate["name"], f"measured in {measures['seconds']} s"
    finally:
        shutil.rmtree(target, ignore_errors=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("work")
    parser.add_argument("--candidates", default=os.path.join(HERE, "candidates.json"))
    parser.add_argument("--pinned", help="benchmark.json: measure each repository at its recorded commit")
    parser.add_argument("--jobs", type=int, default=4)
    parser.add_argument("--jscpd", default=shutil.which("jscpd"), help="jscpd 5 executable")
    args = parser.parse_args(argv)
    if not args.jscpd:
        parser.error("jscpd 5 is needed: put it on PATH or pass --jscpd")
    os.makedirs(os.path.join(args.work, "measures"), exist_ok=True)
    os.makedirs(os.path.join(args.work, "clones"), exist_ok=True)
    if args.pinned:
        with open(args.pinned) as fh:
            pinned = json.load(fh)["repositories"]
        jobs = [({"name": r["name"], "url": r["url"]}, r["commit"]) for r in pinned]
    else:
        with open(args.candidates) as fh:
            jobs = [(c, None) for c in json.load(fh)["candidates"]]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = [pool.submit(run_one, args.work, c, sha, args.jscpd) for c, sha in jobs]
        for future in concurrent.futures.as_completed(futures):
            name, status = future.result()
            print(f"{name}: {status}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
