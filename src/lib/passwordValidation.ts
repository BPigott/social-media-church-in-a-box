import { z } from "zod";

/**
 * Shared password validation schema
 * Requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)");

/**
 * Schema for password change forms (requires current password and confirmation)
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Schema for password reset/signup forms (requires password and confirmation)
 */
export const passwordResetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Calculate password strength (0-100)
 * Returns strength percentage, label, and color
 */
export function getPasswordStrength(password: string): { strength: number; label: string; color: string } {
  if (password.length === 0) return { strength: 0, label: "", color: "" };
  
  let strength = 0;
  
  // Length scoring
  if (password.length >= 12) strength += 20;
  if (password.length >= 16) strength += 10;
  if (password.length >= 20) strength += 10;
  
  // Character variety scoring
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;
  
  // Cap at 100
  strength = Math.min(strength, 100);

  if (strength <= 40) return { strength, label: "Weak", color: "bg-destructive" };
  if (strength <= 70) return { strength, label: "Medium", color: "bg-yellow-500" };
  return { strength, label: "Strong", color: "bg-green-500" };
}

/**
 * Validate a password against the schema
 * Returns validation result with error message if invalid
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  const result = passwordSchema.safeParse(password);
  
  if (!result.success) {
    const firstError = result.error.errors[0];
    return { valid: false, error: firstError.message };
  }
  
  return { valid: true };
}

/**
 * Get password requirements as a list for display
 */
export const passwordRequirements = [
  "At least 12 characters long",
  "Contains at least one uppercase letter (A-Z)",
  "Contains at least one lowercase letter (a-z)",
  "Contains at least one number (0-9)",
  "Contains at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)",
];

