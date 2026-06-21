export function parseJsonBody(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
