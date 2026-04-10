"use server";

import { registerProvider } from "@/lib/api/auth";
import { getSignupInputCandidate, parseSignupFormData, signupSchema } from "@/lib/validation/signup";
import { ApiError } from '@/lib/api/http'

export async function signup(formData: FormData) {
  const signupPayLoadResult = sanitizeForm(formData);

  if (!signupPayLoadResult.ok) return signupPayLoadResult

  let response
  try {
    response = await registerProvider(signupPayLoadResult.payload);
 } catch (e: unknown) {
    if (e instanceof ApiError) {
      const errorMessage = e.message
      const body = e.body as
        | { errors?: Record<string, string>; detail?: string; title?: string }
        | string
        | undefined;

      if (body && typeof body === "object" && body.errors) {
        return {
          ok: false as const,
          fieldErrors: Object.fromEntries(
            Object.entries(body.errors).map(([key, value]) => [key, [value]]),
          ),
        };
      }

      return {
        ok: false as const,
        fieldErrors: {
          _form: [
               errorMessage
          ],
        },
      };
    }
    throw e;
  }
  return {
    ok: true as const,
    response,
  };
}

const sanitizeForm = (formData: FormData) => {
  const parsed = signupSchema.safeParse(getSignupInputCandidate(formData));

    if (!parsed.success) {
      return {
        ok: false as const,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload = parseSignupFormData(formData);

    return {
      ok: true as const,
      payload,
    };
}