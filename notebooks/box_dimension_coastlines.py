#!/usr/bin/env python3
"""
Prepares the coastline data for the box-dimension blog widgets.

Downloads GSHHG (public domain), clips it to two bounding boxes (Bretagne and
a Normandy stretch), lightly simplifies each outline, projects it into the
small local coordinate system the browser widgets use, and writes the result
as JSON.

Run:
    uv run python box_dimension_coastlines.py

Re-running is safe and idempotent — the GSHHG download is cached under
`.data/gshhg/` (gitignored) and skipped if already present. The two bounding
boxes and the simplification tolerance are the reproducible inputs: change a
constant below and re-run to regenerate the output.

The JSON this writes (`output/box_dimension_coasts.json`) is *not* consumed
directly by the website — `website/utils/coastsToTs.ts` turns it into the
committed `coasts.ts` module. Keeping the split this way means all the actual
geo-processing stays in Python (shapely has far more mature tooling for this
than anything in the Node ecosystem), while the artifact that actually ships
to the browser is a small, versioned, machine-generated TypeScript file.
"""

import io
import json
import math
import zipfile
from dataclasses import dataclass
from pathlib import Path

import requests
import shapefile  # pyshp
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

GSHHG_VERSION = "2.3.7"
GSHHG_URL = f"https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-{GSHHG_VERSION}.zip"

DATA_DIR = Path(__file__).parent / ".data" / "gshhg"
OUTPUT_PATH = Path(__file__).parent / "output" / "box_dimension_coasts.json"

# GSHHS Level 1 = coastline (mainland + islands), highest ("f"ull) resolution —
# needed so the small-scale jaggedness the widgets measure survives at all.
LEVEL1_SHAPEFILE = "GSHHS_shp/f/GSHHS_f_L1.shp"

WORLD_SIZE = 100  # must match website/components/blog/box-dimension/shapes.ts WORLD_SIZE
TARGET_POINT_BUDGET = 2500  # per region — keeps combined coasts.ts comfortably under 100KB


@dataclass
class BBox:
    lon_min: float
    lon_max: float
    lat_min: float
    lat_max: float

    def to_shapely(self) -> "box":
        return box(self.lon_min, self.lat_min, self.lon_max, self.lat_max)


# Bounding boxes as pinned by the approved blog post plan (kuesten_dimension.plan.md).
REGIONS: dict[str, BBox] = {
    "bretagne": BBox(lon_min=-5.2, lon_max=-1.0, lat_min=47.2, lat_max=48.9),
    # Ouistreham to Le Tréport, deliberately excluding the Cotentin peninsula
    # (Cap de la Hague) — that stretch is itself jagged and would muddy the
    # "smooth contrast coast" comparison the post makes against Bretagne.
    "normandie": BBox(lon_min=-0.3, lon_max=1.4, lat_min=49.2, lat_max=50.1),
}

# Douglas-Peucker tolerance in degrees. Must stay well below the real-world
# size of the widget's smallest grid cell for either region, or the widget
# would measure the simplification artifact instead of the actual coastline.
# 0.0025 deg is ~200-280m at these latitudes, vs. a ~4km smallest cell (see
# the printed "Shared scale" line below) — a ~14-20x margin. Chosen mainly to
# hit the <100KB combined output budget; see step 7 (Validierung) of the blog
# plan for the check that this doesn't erase the jaggedness being measured.
SIMPLIFY_TOLERANCE_DEG = 0.0025


def download_gshhg() -> Path:
    shapefile_path = DATA_DIR / LEVEL1_SHAPEFILE
    if shapefile_path.exists():
        print(f"Using cached GSHHG data at {DATA_DIR}")
        return shapefile_path

    print(f"Downloading GSHHG {GSHHG_VERSION} from {GSHHG_URL} (~150MB)...")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    response = requests.get(GSHHG_URL, timeout=300)
    response.raise_for_status()

    print("Extracting...")
    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        zf.extractall(DATA_DIR)

    if not shapefile_path.exists():
        raise FileNotFoundError(
            f"Expected {shapefile_path} after extraction — GSHHG layout may have changed."
        )

    return shapefile_path


def load_level1_polygons(shapefile_path: Path, bbox: BBox) -> list[Polygon]:
    """Reads GSHHS Level 1 records whose bounding box overlaps the target bbox."""
    sf = shapefile.Reader(str(shapefile_path))
    target = bbox.to_shapely()
    polygons: list[Polygon] = []

    for shape_rec in sf.iterShapeRecords():
        shp = shape_rec.shape
        rec_lon_min, rec_lat_min, rec_lon_max, rec_lat_max = shp.bbox
        if rec_lon_max < bbox.lon_min or rec_lon_min > bbox.lon_max:
            continue
        if rec_lat_max < bbox.lat_min or rec_lat_min > bbox.lat_max:
            continue

        points = shp.points
        parts = list(shp.parts) + [len(points)]
        for i in range(len(parts) - 1):
            ring = points[parts[i] : parts[i + 1]]
            if len(ring) < 4:
                continue
            poly = Polygon(ring)
            if not poly.is_valid:
                poly = poly.buffer(0)
            if poly.intersects(target):
                polygons.append(poly)

    return polygons


def extract_coastline(polygons: list[Polygon], bbox: BBox) -> LineString:
    target = bbox.to_shapely()
    merged = unary_union(polygons)
    clipped = merged.intersection(target)

    boundary = clipped.boundary
    candidates = list(boundary.geoms) if hasattr(boundary, "geoms") else [boundary]

    real_coastline_parts: list[LineString] = []
    for geom in candidates:
        if not isinstance(geom, LineString):
            continue
        coords = list(geom.coords)
        # Drop sub-segments that run entirely along the bbox frame (clip artifacts).
        # A ring can still mix real coastline with a frame-hugging closing edge,
        # so also drop maximal runs of frame-only points within a ring.
        filtered = _drop_frame_runs(coords, bbox)
        real_coastline_parts.extend(filtered)

    if not real_coastline_parts:
        raise ValueError(f"No real coastline found for bbox {bbox} — check the bbox against a map.")

    # Keep the longest remaining stretch (excludes offshore islands/fragments).
    longest = max(real_coastline_parts, key=lambda ls: ls.length)
    return longest


def _drop_frame_runs(
    coords: list[tuple[float, float]], bbox: BBox, eps: float = 1e-7
) -> list[LineString]:
    """Splits a ring's coordinates into runs, dropping runs glued to the bbox frame."""

    def on_frame(pt: tuple[float, float]) -> bool:
        x, y = pt
        return (
            abs(x - bbox.lon_min) < eps
            or abs(x - bbox.lon_max) < eps
            or abs(y - bbox.lat_min) < eps
            or abs(y - bbox.lat_max) < eps
        )

    runs: list[LineString] = []
    current: list[tuple[float, float]] = []
    for pt in coords:
        if on_frame(pt):
            if len(current) >= 2:
                runs.append(LineString(current))
            current = []
        else:
            current.append(pt)
    if len(current) >= 2:
        runs.append(LineString(current))
    return runs


KM_PER_DEG = 111.32  # rough, fine at these latitudes


def project_to_km(line: LineString) -> tuple[list[tuple[float, float]], dict]:
    """Equirectangular projection into real kilometres (not yet fit to WORLD_SIZE).

    Longitude is scaled by cos(mean latitude) so x/y are both in true km — a
    single shared scale (computed later, across all regions) then converts km
    into world units. Deferring that scale is what keeps the comparison fair:
    if each region picked its own scale to fill the world box edge-to-edge, the
    same slider cellSize would silently mean a different real-world distance
    for each region.
    """
    coords = list(line.coords)
    lats = [c[1] for c in coords]
    lons = [c[0] for c in coords]
    lat_mean = sum(lats) / len(lats)
    cos_lat = math.cos(math.radians(lat_mean))

    lon0, lat0 = lons[0], lats[0]
    km_coords = [
        ((lon - lon0) * cos_lat * KM_PER_DEG, -(lat - lat0) * KM_PER_DEG)
        for lon, lat in zip(lons, lats)
    ]

    bbox_meta = {
        "lonMin": min(lons),
        "lonMax": max(lons),
        "latMin": min(lats),
        "latMax": max(lats),
    }
    return km_coords, bbox_meta


def normalize_with_shared_scale(
    km_coords: list[tuple[float, float]], scale: float
) -> list[list[float]]:
    xs = [p[0] for p in km_coords]
    ys = [p[1] for p in km_coords]
    x_min, y_min = min(xs), min(ys)
    return [[round((x - x_min) * scale, 3), round((y - y_min) * scale, 3)] for x, y in km_coords]


def _haversine_length_km(coords: list[tuple[float, float]]) -> float:
    r_earth = 6371.0
    total = 0.0
    for (lon1, lat1), (lon2, lat2) in zip(coords, coords[1:]):
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        total += 2 * r_earth * math.asin(math.sqrt(a))
    return total


def process_region(name: str, bbox: BBox, shapefile_path: Path) -> dict:
    print(f"\n--- {name} ---")
    polygons = load_level1_polygons(shapefile_path, bbox)
    print(f"  {len(polygons)} candidate polygon(s) overlap the bounding box")

    coastline = extract_coastline(polygons, bbox)
    raw_km = _haversine_length_km(list(coastline.coords))
    print(f"  raw coastline: {len(coastline.coords)} points, {raw_km:.1f} km")

    simplified = coastline.simplify(SIMPLIFY_TOLERANCE_DEG, preserve_topology=True)
    simplified_km = _haversine_length_km(list(simplified.coords))
    print(
        f"  simplified: {len(simplified.coords)} points, {simplified_km:.1f} km "
        f"(tolerance={SIMPLIFY_TOLERANCE_DEG} deg)"
    )

    if len(simplified.coords) > TARGET_POINT_BUDGET:
        print(
            f"  WARNING: {len(simplified.coords)} points exceeds the "
            f"{TARGET_POINT_BUDGET} budget — consider a coarser SIMPLIFY_TOLERANCE_DEG."
        )

    km_coords, bbox_meta = project_to_km(simplified)
    x_range = max(x for x, _ in km_coords) - min(x for x, _ in km_coords)
    y_range = max(y for _, y in km_coords) - min(y for _, y in km_coords)

    return {
        "name": name,
        "km_coords": km_coords,
        "sourceLengthKm": simplified_km,
        "boundingBox": bbox_meta,
        "spanKm": max(x_range, y_range),
    }


def main():
    shapefile_path = download_gshhg()

    regions_raw = {
        name: process_region(name, bbox, shapefile_path) for name, bbox in REGIONS.items()
    }

    # One shared scale (world-units per km) for all regions — the region with the
    # largest physical span fills the WORLD_SIZE box; every other region uses the
    # exact same km-to-world-unit ratio, so a given slider cellSize always means
    # the same real-world distance no matter which region is showing.
    reference_span_km = max(r["spanKm"] for r in regions_raw.values())
    shared_scale = WORLD_SIZE / reference_span_km
    min_cell_size_world = 1.5625  # smallest step in KaestchenSpiel/KuestenSpiel's CELL_SIZE_STEPS
    min_cell_size_real_km = min_cell_size_world / shared_scale

    print(
        f"\nShared scale: {shared_scale:.4f} world-units/km "
        f"(reference span {reference_span_km:.1f} km)"
    )
    print(
        f"Smallest slider cell size ({min_cell_size_world} world-units) = "
        f"{min_cell_size_real_km:.2f} km real"
    )

    regions_out = {}
    for name, raw in regions_raw.items():
        points = normalize_with_shared_scale(raw["km_coords"], shared_scale)
        meta = {
            "sourceLengthKm": raw["sourceLengthKm"],
            "simplificationToleranceDeg": SIMPLIFY_TOLERANCE_DEG,
            "minCellSizeWorld": min_cell_size_world,
            "minCellSizeRealKm": min_cell_size_real_km,
            "boundingBox": raw["boundingBox"],
        }
        approx_bytes = len(json.dumps(points))
        print(
            f"  {name}: {len(points)} points, ~{approx_bytes / 1024:.1f} KB, span used "
            f"{raw['spanKm'] * shared_scale:.1f}/{WORLD_SIZE} world-units"
        )
        regions_out[name] = {"name": name, "points": points, "worldSize": WORLD_SIZE, "meta": meta}

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(regions_out, f, indent=2)

    total_bytes = OUTPUT_PATH.stat().st_size
    print(f"\nWrote {OUTPUT_PATH} ({total_bytes / 1024:.1f} KB total)")
    if total_bytes > 100_000:
        print("WARNING: exceeds the ~100KB combined budget from the blog plan.")


if __name__ == "__main__":
    main()
