// utils/emailNotification.ts
// Simulated email notification utility for MVP

export async function sendDepositNotification(renterEmail: string, landlordEmail: string, escrowId: string, amount: string) {
  // In production, trigger backend to send real emails
  // Here, just simulate a delay and log
  console.log(`Simulated email: Notifying renter (${renterEmail}) and landlord (${landlordEmail}) of deposit #${escrowId} for amount ${amount}`);
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
