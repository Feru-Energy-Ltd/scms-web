import { z } from "zod";

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Name is required"),
  ownerEmail: z.email("Enter a valid email address"),
  ownerPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
  businessName: z.string().trim().min(2, "Business name is invalid"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
});

export type SignupInput = z.infer<typeof signupSchema>;

function formDataValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function getSignupInputCandidate(formData: FormData) {
  return {
    displayName: formDataValue(formData, "displayName"),
    ownerEmail: formDataValue(formData, "ownerEmail"),
    ownerPassword: formDataValue(formData, "ownerPassword"),
    businessName: formDataValue(formData, "businessName"),
    phone: formDataValue(formData, "phone"),
  };
}

export function parseSignupFormData(formData: FormData): SignupInput {
  return signupSchema.parse(getSignupInputCandidate(formData));
}
