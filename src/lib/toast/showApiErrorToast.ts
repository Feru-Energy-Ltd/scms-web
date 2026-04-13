import toast from "react-hot-toast";
import { ApiError } from "../api/http";

function joinValidationErrors(errors: Record<string, string> | undefined) {
  if (!errors) return null;
  const values = Object.values(errors).filter(Boolean);
  if (values.length === 0) return null;
  return values.join(", ");
}

export function showApiErrorToast(
  err: unknown,
  opts?: { fallbackMessage?: string; toastId?: string },
) {
  const fallbackMessage = opts?.fallbackMessage ?? "Something went wrong";

  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      toast.error("You don't have the permission to perform this action.", {
        id: opts?.toastId,
      });
      return;
    }

    type ErrorBody = {
      detail?: string;
      title?: string;
      errors?: Record<string, string>;
    };
    const body = err.body as ErrorBody | undefined;

    const validation = joinValidationErrors(body?.errors);
    const detail =
      (typeof body?.detail === "string" && body.detail) ||
      (typeof body?.title === "string" && body.title);

    const base = validation || detail || err.message || fallbackMessage;
    const statusSuffix =
      typeof err.status === "number" ? ` (HTTP ${err.status})` : "";
    const message = base.includes(`HTTP ${err.status}`) ? base : `${base}${statusSuffix}`;

    toast.error(message, {
      id: opts?.toastId,
    });
    return;
  }

  // Handle fetch failures where we can't parse JSON.
  if (err instanceof Error) {
    toast.error(err.message || fallbackMessage, { id: opts?.toastId });
    return;
  }

  toast.error(fallbackMessage, { id: opts?.toastId });
}

