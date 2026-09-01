/** Turn a URLSearchParams into a plain object, collecting repeated keys as arrays. */
export function searchParamsToObject(
  sp: URLSearchParams,
  arrayKeys: readonly string[] = [],
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(sp.keys())) {
    out[key] = arrayKeys.includes(key) ? sp.getAll(key) : (sp.get(key) ?? "");
  }
  return out;
}

/** Build a query string from a record, expanding arrays into repeated keys. */
export function toQueryString(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v !== "" && v != null) sp.append(key, String(v));
    } else {
      sp.set(key, String(value));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
