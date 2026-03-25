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

    toast.error(validation || detail || err.message || fallbackMessage, {
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

