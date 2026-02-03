// utils/emailVerification.ts
export interface EmailVerificationStatus {
  verified: boolean;
}

export async function sendVerificationEmail(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

export async function verifyEmail(): Promise<boolean> {
  return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
}
