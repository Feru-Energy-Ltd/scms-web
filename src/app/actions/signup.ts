"use server";

import { registerProvider } from "@/lib/api/auth";
import { getSignupInputCandidate, parseSignupFormData, signupSchema } from "@/lib/validation/signup";

export async function signup(formData: FormData) {
  const signupPayLoadResult = sanitizeForm(formData);

  if (!signupPayLoadResult.ok) return signupPayLoadResult;

  try {
    const response = await registerProvider(signupPayLoadResult.payload);
    return { ok: true as const, response };
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Sign up failed. Please try again.";
    return { ok: false as const, error: message };
  }
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
