export function normalizePageUrl(raw: string): string {
  try {
    const { origin, pathname } = new URL(raw);
    const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
    return origin + path;
  } catch {
    return raw;
  }
}
