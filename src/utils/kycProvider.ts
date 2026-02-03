// utils/kycProvider.ts
export interface KYCStatus {
  verified: boolean;
}

export async function startKYC(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

export async function checkKYCStatus(): Promise<boolean> {
  return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
}
