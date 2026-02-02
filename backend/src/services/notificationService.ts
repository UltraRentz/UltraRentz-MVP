export function notifyDepositPassported(io, deposit, tenantPhone, landlordPhone, destination, amount) {
  // In-app notification
  io.to(`deposit:${deposit.chain_deposit_id}`).emit('deposit:passported', {
    depositId: deposit.chain_deposit_id,
    message: `Deposit of £${amount} passported to ${destination}.`,
    amount,
    destination,
  });
  // SMS notifications
  if (tenantPhone) {
    sendSMS(tenantPhone, `UltraRentz: Your deposit of £${amount} has been passported to ${destination}.`);
  }
  if (landlordPhone) {
    sendSMS(landlordPhone, `UltraRentz: Tenant passported deposit of £${amount} to ${destination}.`);
  }
}
export function notifyDepositReleased(io, deposit, tenantPhone, landlordPhone, amount, recipient) {
  // In-app notification
  io.to(`deposit:${deposit.chain_deposit_id}`).emit('deposit:released', {
    depositId: deposit.chain_deposit_id,
    message: `Deposit of £${amount} released to ${recipient}.`,
    amount,
    recipient,
  });
  // SMS notifications
  if (tenantPhone) {
    sendSMS(tenantPhone, `UltraRentz: Your deposit of £${amount} has been released to ${recipient}.`);
  }
  if (landlordPhone) {
    sendSMS(landlordPhone, `UltraRentz: Deposit of £${amount} released to ${recipient}.`);
  }
}
// backend/src/services/notificationService.ts
// Utility to emit in-app (Socket.io) and SMS notifications for disputes, releases, passporting
import { sendSMS } from './smsService';

export function notifyDisputeRaised(io, deposit, dispute, tenantPhone, landlordPhone) {
  // In-app notification
  io.to(`deposit:${deposit.chain_deposit_id}`).emit('dispute:raised', {
    depositId: deposit.chain_deposit_id,
    disputeId: dispute.id,
    message: 'A dispute has been raised on your deposit.',
    disputedAmount: dispute.landlord_amount,
    reason: dispute.resolution,
  });
  // SMS notifications
  if (tenantPhone) {
    sendSMS(tenantPhone, `UltraRentz: A dispute was raised on your deposit. Reason: ${dispute.resolution}`);
  }
  if (landlordPhone) {
    sendSMS(landlordPhone, `UltraRentz: You raised a dispute for £${dispute.landlord_amount}. Reason: ${dispute.resolution}`);
  }
}
