import toast from "react-hot-toast";
import { ApiError, type ProblemDetail } from "../api/http";

const GENERIC_REQUEST_FAILED = /^Request failed with status \d+$/;

const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  400: "Invalid request. Please check your input.",
  401: "Invalid email or password. Please try again.",
  403: "You do not have permission to access this resource.",
  404: "The requested resource was not found.",
  409: "An account with this email already exists.",
  500: "Something went wrong. Please try again later.",
  502: "Bad Gateway. Please try again later.",
  503: "Service Unavailable. Please try again later.",
  504: "Gateway Timeout. Please try again later.",
};

export type ShowApiErrorToastOptions = {
  fallbackMessage?: string;
  toastId?: string;
};

function joinValidationErrors(errors: Record<string, string> | undefined) {
  if (!errors) return null;
  const values = Object.values(errors).filter(Boolean);
  if (values.length === 0) return null;
  return values.join(", ");
}

function extractProblemDetail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const problem = body as ProblemDetail;
  const validation = joinValidationErrors(problem.errors);
  if (validation) return validation;

  if (typeof problem.detail === "string" && problem.detail.trim()) {
    return problem.detail.trim();
  }
  if (typeof problem.title === "string" && problem.title.trim()) {
    return problem.title.trim();
  }
  return null;
}

function isInformativeMessage(message: string | undefined): message is string {
  return Boolean(message && !GENERIC_REQUEST_FAILED.test(message));
}

function defaultMessageForStatus(status: number | undefined): string | null {
  if (status === undefined) return null;

  const exact = STATUS_MESSAGES[status];
  if (exact) return exact;

  if (status >= 500 && status < 600) return STATUS_MESSAGES[500]!;
  if (status >= 400 && status < 500) return STATUS_MESSAGES[400]!;

  return null;
}

/** Resolves a user-facing message from an API or network error. */
export function getApiErrorMessage(
  err: unknown,
  opts?: Pick<ShowApiErrorToastOptions, "fallbackMessage">,
): string {
  const fallbackMessage = opts?.fallbackMessage ?? "Something went wrong";

  if (err instanceof ApiError) {
    const statusMessage = defaultMessageForStatus(err.status);
    if (err.status !== undefined && err.status >= 500 && statusMessage) {
      return statusMessage;
    }

    const fromBody = extractProblemDetail(err.body);
    if (fromBody) return fromBody;

    if (isInformativeMessage(err.message)) return err.message;

    if (statusMessage) return statusMessage;

    return fallbackMessage;
  }

  if (err instanceof Error) {
    return isInformativeMessage(err.message) ? err.message : fallbackMessage;
  }

  return fallbackMessage;
}

export function showApiErrorToast(
  err: unknown,
  opts?: ShowApiErrorToastOptions,
) {
  toast.error(getApiErrorMessage(err, opts), { id: opts?.toastId });
}
