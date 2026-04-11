/** Normalize Spring-style or generic envelope responses to an array. */
export function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.content)) return o.content as T[];
    if (Array.isArray(o.data)) return o.data as T[];
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.results)) return o.results as T[];
  }
  return [];
}

/** Unwrap `{ data: T }` envelopes used by some legacy endpoints. */
export function unwrapData<T>(res: unknown): T | null {
  if (res == null || typeof res !== "object") return null;
  const o = res as Record<string, unknown>;
  if ("data" in o && o.data != null && typeof o.data === "object") {
    return o.data as T;
  }
  return res as T;
}
