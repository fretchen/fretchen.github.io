"""One-off backfill: Umami CSV export -> monthly rollup objects.

Umami was replaced by the `analytics` hit counter, which starts from zero. This
module folds a Umami data export (`website_event.csv` from the cloud.umami.is
"Export data" button) into the same monthly rollup layout the readout reads:

    rollup/{site}/{YYYY-MM}.json

Nothing here touches the hourly `counts/` prefix the live counter writes.

**Why monthly, not hourly**: `listObjects` in `shared/s3-utils/src/index.ts`
issues a single un-paginated ListObjectsV2 (max 1000 keys, silently truncated),
and hourly objects accrue at 8760/year. Rollup keys are *computed* from a date
range, never listed, so the read path has no truncation limit and a month costs
one GET.

**Privacy**: the export carries `session_id`, city, region, country, device,
screen and language columns. This module projects down to (day, path) -> count
and drops every other column on the floor — the rollups it writes contain no
more information than the live counter would have recorded.
"""

import csv
import re
from collections import defaultdict
from pathlib import Path

SITE = "fretchen.eu"

# Mirrors analytics/hit.ts's sanitizePath, applied after normalisation.
SAFE_PATH = re.compile(r"^/[\w/.\-~%]*$")
MAX_PATH_LENGTH = 200

# website/locales/locales.ts
LOCALES = ("en", "de")

# Umami's event_type: 1 = pageview, 2 = custom event. Only pageviews are hits.
PAGEVIEW = "1"


def normalize_path(raw: str) -> str | None:
    """Normalise a Umami `url_path` to the site's canonical URL form.

    Canonical == what `sitemap.xml` emits, which is also exactly what the
    beacon records, so backfilled and live days are directly comparable:

    - query and fragment dropped (Vike's `urlPathname` carries neither);
    - locale prefix stripped (`website/pages/+onBeforeRoute.ts` routes on the
      locale-less path, so `/de/blog/25/` is recorded as `/blog/25/`);
    - trailing slash on every non-root path (GitHub Pages convention, forced
      by `website/locales/extractLocale.ts` and by `generateSitemap.ts`).

    Returns None for anything the live endpoint would have rejected.
    """
    path = raw.split("?")[0].split("#")[0].strip()
    if not path.startswith("/"):
        return None

    segments = path.split("/")
    if len(segments) > 1 and segments[1] in LOCALES:
        path = "/" + "/".join(segments[2:])

    if path in ("", "//"):
        path = "/"
    if path != "/" and not path.endswith("/"):
        path += "/"

    if len(path) > MAX_PATH_LENGTH or not SAFE_PATH.match(path):
        return None
    return path


# The two crawler signatures identified and validated in
# analytics/notebooks/05_traffic_bursts.ipynb against the full export. Kept as
# the only two rules here deliberately -- a more general bot detector would be
# over-engineering for a one-off cleanup of a fixed, already-characterised
# dataset.


def is_chronic_crawler(row: dict) -> bool:
    """The persistent Chrome/Windows/1280x1200 signature: 568 rows spread
    across 179 of ~214 days, every one its own one-shot session, no referrer,
    no single dominant page -- a distributed sweep disguised as the world's
    most common desktop browser configuration. Screen resolution is the tell:
    1280x1200 is not a resolution real Windows laptops actually ship with.
    """
    return (
        row["browser"] == "chrome"
        and row["os"] == "Windows 10"
        and row["device"] == "laptop"
        and row["screen"] == "1280x1200"
    )


def find_acute_crawler_session_ids(rows: list[dict]) -> set[str]:
    """The two-day Aug 8-9 spike: chrome/Linux/laptop, one-shot no-referrer
    sessions, restricted to days where that exact fingerprint spans 3+
    countries -- something no single real device can do. Needs two passes
    (session size, then per-day country count) over just this fingerprint's
    own rows, mirroring notebook 05's validated logic exactly.
    """
    linux_rows = [
        r
        for r in rows
        if r["browser"] == "chrome" and r["os"] == "Linux" and r["device"] == "laptop"
    ]

    session_sizes: dict[str, int] = defaultdict(int)
    for r in linux_rows:
        session_sizes[r["session_id"]] += 1

    one_shot_no_referrer = [
        r for r in linux_rows if session_sizes[r["session_id"]] == 1 and not r["referrer_domain"]
    ]

    countries_per_day: dict[str, set[str]] = defaultdict(set)
    for r in one_shot_no_referrer:
        countries_per_day[r["created_at"][:10]].add(r["country"])
    crawl_days = {day for day, countries in countries_per_day.items() if len(countries) >= 3}

    return {r["session_id"] for r in one_shot_no_referrer if r["created_at"][:10] in crawl_days}


def read_pageviews(
    csv_path: str | Path, hostname: str = f"www.{SITE}", exclude_crawlers: bool = False
) -> list[tuple[str, str]]:
    """Extract (day, canonical_path) pairs from a Umami `website_event.csv`.

    Drops custom events, other hostnames (localhost dev traffic), and any path
    that fails normalisation. Returns one tuple per pageview — no dedup, no
    sessionisation, matching how the beacon counts.

    `exclude_crawlers=True` (default off, so existing callers are unaffected)
    additionally drops rows matching `is_chronic_crawler` or
    `find_acute_crawler_session_ids` before paths are extracted -- the
    filtering needs the full row (browser/os/device/screen/referrer/session/
    country), which is why it happens here rather than after reduction to
    `(day, path)`.
    """
    with open(csv_path, newline="", encoding="utf-8") as handle:
        rows = [
            row
            for row in csv.DictReader(handle)
            if row["event_type"] == PAGEVIEW and row["hostname"] == hostname
        ]

    if exclude_crawlers:
        acute_session_ids = find_acute_crawler_session_ids(rows)
        rows = [
            row
            for row in rows
            if not is_chronic_crawler(row) and row["session_id"] not in acute_session_ids
        ]

    pageviews: list[tuple[str, str]] = []
    for row in rows:
        path = normalize_path(row["url_path"])
        if path is None:
            continue
        pageviews.append((row["created_at"][:10], path))
    return pageviews


def to_monthly_rollups(pageviews: list[tuple[str, str]], source: str = "umami") -> dict[str, dict]:
    """Group (day, path) pairs into `{month_key: rollup_object}`.

    Rollup shape — a per-day version of the hourly bucket, plus provenance:

        {"site": ..., "month": "2026-03", "days": {
            "2026-03-04": {"hits": 18, "pages": {"/": 9}, "source": "umami"}}}

    `source` is per *day*, not per month: the changeover month holds both
    Umami-derived and beacon-derived days, and the two are not comparable
    (Umami filtered bots and sessionised; the beacon counts every hydration).
    """
    days: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for day, path in pageviews:
        days[day][path] += 1

    rollups: dict[str, dict] = {}
    for day in sorted(days):
        month = day[:7]
        rollup = rollups.setdefault(month, {"site": SITE, "month": month, "days": {}})
        pages = dict(sorted(days[day].items(), key=lambda item: (-item[1], item[0])))
        rollup["days"][day] = {
            "hits": sum(pages.values()),
            "pages": pages,
            "source": source,
        }
    return rollups


def merge_into_existing(new: dict, existing: dict | None) -> tuple[dict, list[str]]:
    """Merge a generated rollup into whatever is already stored for that month.

    Existing days always win — a re-run is idempotent and can never clobber
    days the live counter already rolled up. Returns the merged object and the
    list of days that were skipped because they already existed.
    """
    if not existing:
        return new, []

    merged = {**existing, "days": dict(existing.get("days", {}))}
    skipped = [day for day in new["days"] if day in merged["days"]]
    for day, bucket in new["days"].items():
        merged["days"].setdefault(day, bucket)
    merged["days"] = dict(sorted(merged["days"].items()))
    return merged, skipped


def backfill(storage, csv_path: str | Path, source: str = "umami") -> dict:
    """Write the rollups to `storage`. Returns a per-month report.

    `storage` is a `LocalStorage` (dry run) or `S3Storage` (real) from
    `storage.py`.
    """
    rollups = to_monthly_rollups(read_pageviews(csv_path), source=source)

    report: dict[str, dict] = {}
    for month, rollup in sorted(rollups.items()):
        key = f"rollup/{SITE}/{month}.json"
        merged, skipped = merge_into_existing(rollup, storage.read(key))
        storage.write(key, merged)
        report[month] = {
            "key": key,
            "days_written": len(rollup["days"]) - len(skipped),
            "days_skipped": skipped,
            "hits": sum(day["hits"] for day in rollup["days"].values()),
        }
    return report
