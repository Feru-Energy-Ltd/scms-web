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
    throw e;

      return {
        ok: false as const,
          e
      };
    }
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