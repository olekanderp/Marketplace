type RawSearchParams = Record<string, string | string[] | undefined>;

export function toURLSearchParams(raw: RawSearchParams): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v !== "") sp.append(key, v);
    } else if (value !== "") {
      sp.set(key, value);
    }
  }
  return sp;
}

export function searchParamsToObject(
  sp: URLSearchParams,
  arrayKeys: readonly string[] = [],
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(sp.keys())) {
    if (arrayKeys.includes(key)) {
      const values = sp.getAll(key).filter((v) => v !== "");
      if (values.length) out[key] = values;
    } else {
      const value = sp.get(key);
      if (value !== null && value !== "") out[key] = value;
    }
  }
  return out;
}
