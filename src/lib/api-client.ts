export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: { error?: unknown; details?: unknown } = {};
  if (text) {
    try {
      data = JSON.parse(text) as { error?: unknown; details?: unknown };
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    throw new ApiClientError(
      res.status,
      (data && typeof data.error === "string" && data.error) || `Request failed (${res.status})`,
      data?.details,
    );
  }
  return data as T;
}

export function describeApiError(err: unknown): string {
  if (!(err instanceof ApiClientError)) {
    return err instanceof Error ? err.message : "Something went wrong";
  }
  const d = err.details as
    | { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
    | undefined;
  if (d?.fieldErrors) {
    const parts = Object.entries(d.fieldErrors)
      .filter(([, v]) => v?.length)
      .map(([k, v]) => `${k}: ${v[0]}`);
    if (parts.length) return parts.join(" · ");
  }
  if (d?.formErrors?.length) return d.formErrors.join(" · ");
  return err.message;
}
