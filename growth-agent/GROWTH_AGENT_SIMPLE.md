# GROWTH AGENT SIMPLE

## Objective

Build and validate a very simple planning prototype in a notebook.

The planner should:

1. not depend on ingest output,
2. discover all available website pages from a registry source,
3. remember which page was written about and when,
4. sample pages randomly with good recency-aware weights.

This document is intentionally KISS and notebook-first.

## Scope

In scope:

1. a notebook prototype for page registry + memory + weighted random sampling,
2. simple persistence artifacts under `state/simple_planner/`,
3. rough simulation and sanity checks.

Out of scope:

1. strategy node integration,
2. ingest coupling,
3. LLM planning,
4. semantic topic clustering,
5. production hardening.

## Planner Contract (Notebook Prototype)

Input:

1. Page registry (all candidate pages),
2. History memory (`page_url`, `last_written_at`, `write_count`),
3. Config:
   - `n_samples`
   - `cooldown_days`
   - `half_life_days`
   - `min_weight_floor`

Output:

1. sampled pages for current run,
2. updated history memory,
3. simple diagnostics (repeat rate, coverage, weight distribution snapshot).

## Registry: Where to get all pages

### Option A: sitemap.xml (recommended default)

Pros:

1. deterministic,
2. usually already curated public URLs,
3. easy to parse.

Cons:

1. can be stale if not updated.

### Option B: published website crawl (fallback)

Pros:

1. reflects what is actually live.

Cons:

1. requires filtering and normalization,
2. slower and more brittle.

### Option C: local build artifacts/routes export (optional fallback)

Pros:

1. fast local experiments.

Cons:

1. environment-dependent and less canonical.

### KISS decision for prototype

1. Use sitemap as primary source.
2. Normalize URLs:
   - lowercase host,
   - strip query and fragment,
   - apply one trailing slash policy.
3. Filter obvious non-content paths if needed.
4. Persist registry to `state/simple_planner/registry.json` for reproducible tests.

## Memory Model (KISS)

Use one small history artifact.

File: `state/simple_planner/history.json`

Entry fields:

1. `page_url`
2. `last_written_at` (ISO datetime)
3. `write_count` (int)

Optional later fields (not required now):

1. `first_written_at`
2. `recent_intervals_days`

## Weighting Logic

Goal: recently used pages should be unlikely, then gradually recover.

For each page:

1. If never used: `weight = 1.0`
2. Else let `t_days` = days since `last_written_at`:
   - `recovery = 1 - 2^(-t_days / half_life_days)`
   - `weight = max(min_weight_floor, recovery)`
3. Hard cooldown:
   - if `t_days < cooldown_days`, set `weight = 0`

Interpretation:

1. immediate repeats are blocked,
2. probability recovers smoothly,
3. long-unused pages return naturally.

## Sampling Algorithm (Notebook)

1. Load registry.
2. Load history (or initialize empty).
3. Build candidate table.
4. Compute `t_days`, cooldown mask, and effective weight per page.
5. Keep pages with positive weight.
6. Normalize weights.
7. Sample `n_samples` without replacement.
8. Update history for sampled pages:
   - set `last_written_at = now`
   - increment `write_count`
9. Persist outputs.

## Notebook Implementation Plan

Target notebook: `notebooks/07_simple_plan_node.ipynb`

### Cell 1: Goal and assumptions (markdown)

1. explain no-ingest mode,
2. describe artifacts and expected outputs.

### Cell 2: Imports and config (python)

1. imports (`json`, `random`, `datetime`, `xml`, `pandas`, etc.),
2. config defaults (`n_samples`, `cooldown_days`, `half_life_days`, `seed`).

### Cell 3: Registry loaders (python)

1. function: load from sitemap URL or file,
2. URL normalization,
3. optional path filtering,
4. save `registry.json`.

### Cell 4: History I/O (python)

1. load `history.json` if present,
2. initialize empty structure if absent.

### Cell 5: Weight computation (python)

1. join registry with history,
2. compute `t_days`, cooldown, `weight`,
3. display sorted view for sanity.

### Cell 6: Weighted random draw (python)

1. sample pages without replacement,
2. print selected pages.

### Cell 7: Persist run outputs (python)

1. update and save `history.json`,
2. save current run picks to `planned_pages.json`.

### Cell 8: Quick simulation (python)

1. run many synthetic planning iterations,
2. compute simple metrics:
   - short-window repeat rate,
   - registry coverage ratio,
   - selection frequency spread.

### Cell 9: Review summary (markdown)

1. what worked,
2. where behavior is too random or too restrictive,
3. parameter tuning suggestions.

## Validation Checklist for Notebook Prototype

1. First run with empty history produces broad page picks.
2. Immediate second run avoids cooldown-violating repeats.
3. After synthetic time shift beyond half-life, previously used pages re-enter.
4. Simulation shows increasing registry coverage over repeated runs.

## Artifacts to create during notebook work

1. `state/simple_planner/registry.json`
2. `state/simple_planner/history.json`
3. `state/simple_planner/planned_pages.json`

## Practical Defaults (starting point)

1. `n_samples = 3`
2. `cooldown_days = 14`
3. `half_life_days = 30`
4. `min_weight_floor = 0.01`
5. fixed random seed for reproducible notebook debugging

## Decision rationale

This approach prioritizes:

1. simple, understandable behavior,
2. reproducible experiments,
3. low implementation complexity,
4. fast iteration in notebooks before any production wiring.

## New Implementation Step: Runtime Registry Management (MVP)

Problem observed in production:

1. Planning currently returns empty when no registry file exists in S3.
2. Refill then creates 0 drafts even when pipeline has free capacity.

MVP decision:

1. No separate ensure_registry abstraction.
2. Registry prep runs directly inside the plan node before drawing items.
3. Keep diagnostics minimal.
4. **Option 2 is mandatory:** registry artifacts live in the same S3 folder level as
   `content_queue.json` and `content_plan.json`.

### Storage key convention (Option 2)

With S3 prefix `growth-agent/`, use these object keys:

1. `registry.json`
2. `registry_clean.json`
3. `registry_excluded.json`

Do not use the subfolder variant `simple_planner/...` in runtime code.

### Runtime behavior in plan node

Step A: Load queue and compute needed draft count.

1. If needed is 0: write empty plan and return.

Step B: Prepare registry in-place.

1. Rebuild registry from sitemap URL.
2. Apply excluded rules.
3. Write both artifacts back to S3:
   - `registry.json`
   - `registry_clean.json`
4. Continue planning immediately with cleaned URLs.

Step C: Draw and schedule.

1. Draw pages with half-life weighting.
2. Schedule posts as today.
3. Write `content_plan.json`.

### Excluded management (required)

Add one S3-managed config artifact:

1. `registry_excluded.json`

Structure:

1. `urls`: exact URLs to remove.
2. `prefixes`: optional path prefixes to remove.
3. `updated_at`: metadata only.

Rules:

1. Normalize URLs before matching.
2. Apply exact URL exclusions first.
3. Apply prefix exclusions second.
4. Keep deterministic output order for stable diffs.

### Minimal diagnostics extension

Only add these fields to plan diagnostics:

1. `registry_total`
2. `registry_refreshed` (true/false)
3. `excluded_count`

No extra telemetry for MVP.

### Rollout sequence

1. Implement registry prep in plan node.
2. Add excluded config load + apply logic.
3. Add one integration test:
   - missing registry -> refresh -> non-empty plan when candidates exist.
4. Backfill once in production by running one refill.

### Further changes implied by Option 2

1. Update runtime constants in `agent/nodes/plan.py`:
   - from `simple_planner/registry_clean.json` and `simple_planner/registry.json`
   - to `registry_clean.json` and `registry.json`.
2. Add excluded artifact support in runtime:
   - read `registry_excluded.json` (if missing: default empty exclusions).
3. Update tests that currently seed old keys:
   - replace `simple_planner/...` fixtures with top-level keys.
4. Add one migration fallback during rollout (temporary):
   - try top-level keys first,
   - if missing, read old `simple_planner/...` once and rewrite to top-level.
5. Update diagnostics tooling (`run_local.py --diagnose`):
   - report top-level registry presence/count.
6. Keep notebook/local prototype paths unchanged unless explicitly migrated.
   Notebook artifacts under `state/simple_planner/` are local dev helpers,
   not runtime S3 conventions.

### Non-goals in MVP

1. ETag/Last-Modified optimization.
2. Scheduler for standalone registry refresh.
3. Complex policy diagnostics.
