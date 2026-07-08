export function normalizePageUrl(raw: string): string {
  try {
    const { origin, pathname } = new URL(raw);
    const path = pathname === "/" ? pathname : pathname.endsWith("/") ? pathname : pathname + "/";
    return origin + path;
  } catch {
    return raw;
  }
}
