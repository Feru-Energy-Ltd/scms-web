"use server";

import { registerProvider } from "@/lib/api/auth";
import { getSignupInputCandidate, parseSignupFormData, signupSchema } from "@/lib/validation/signup";
import { ApiError } from '@/lib/api/http'

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse(getSignupInputCandidate(formData));

  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload = parseSignupFormData(formData);
  let response
  try {
    response = await registerProvider(payload);
  } catch (e: unknown) {
    if (e instanceof ApiError) {
        return {
            errorMessage: e.body
        } 
    }
    return {
        ok: false as const,
        fieldErrors: { _form: ['Something went wrong']}
    }
  }

  return {
    ok: true as const,
    payload,
    response,
  };
}