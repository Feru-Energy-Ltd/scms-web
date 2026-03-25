import { API_BASE_URL } from "../config";

export type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  // Used by the backend for validation errors.
  errors?: Record<string, string>;
  [key: string]: unknown;
};

export class ApiError extends Error {
  public status?: number;
  public body?: unknown;

  constructor(message: string, opts?: { status?: number; body?: unknown }) {
    super(message);
    this.name = "ApiError";
    if (opts?.status !== undefined) this.status = opts.status;
    if (opts?.body !== undefined) this.body = opts.body;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function toUrl(path: string) {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return new URL(trimmed, API_BASE_URL);
}

async function parseJsonSafely(res: Response) {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const url = toUrl(path);

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
      // Only set JSON content-type when we actually send a body.
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body:
      options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const body = await parseJsonSafely(res);
    const problem = body as ProblemDetail | undefined;
    const message =
      problem?.detail ||
      problem?.title ||
      (typeof body === "string" ? body : undefined) ||
      `Request failed with status ${res.status}`;

    throw new ApiError(message, { status: res.status, body });
  }

  // Some endpoints may return 204/empty.
  if (res.status === 204) return undefined as unknown as T;

  const json = await res.json().catch(() => undefined);
  return json as T;
}

