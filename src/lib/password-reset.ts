export const ADMIN_LOGIN_EMAIL = "admin@munsel.mn";
export const ADMIN_RECOVERY_EMAIL =
  process.env.ADMIN_RECOVERY_EMAIL || "ihzaya@gmail.com";
export const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function getPasswordResetIdentifier(email: string) {
  return `password-reset:${email.trim().toLowerCase()}`;
}

export function buildPasswordResetUrl(token: string, email: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(
    email.trim().toLowerCase()
  )}`;
}