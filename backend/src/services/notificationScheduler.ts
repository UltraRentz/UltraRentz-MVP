// backend/src/services/notificationScheduler.ts
// Scheduled job to send tenancy end notifications to tenants and landlords

import cron from 'node-cron';
import { Deposit } from '../models/Deposit';
import { sendEmail } from '../../../server/sendgrid.cjs';

// Helper to get days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Main notification job
export function startNotificationScheduler() {
  // Run every day at 9am
  cron.schedule('0 9 * * *', async () => {
    const today = new Date();
    // Find deposits ending in 7 or 1 days
    const soonEnding = await Deposit.findAll({
      where: {
        status: 'active',
        // Assume you have a tenancy_end field (add if missing)
      },
    });
    for (const deposit of soonEnding) {
      // tenancy_end must be a Date field on Deposit
      const daysToEnd = daysBetween(today, deposit.tenancy_end);
      if (daysToEnd === 7 || daysToEnd === 1) {
        // Send notification to tenant and landlord
        const emails = [deposit.tenant_email, deposit.landlord_email].filter(Boolean);
        if (emails.length) {
          await sendEmail({
            to: emails,
            subject: `Tenancy ending in ${daysToEnd} day(s)` ,
            text: `Your tenancy is ending in ${daysToEnd} day(s). If you have a dispute, please raise it before the deadline. Otherwise, the deposit will be released automatically.`,
            html: `<p>Your tenancy is ending in <b>${daysToEnd} day(s)</b>.<br>If you have a dispute, please raise it before the deadline.<br>Otherwise, the deposit will be released automatically.</p>`
          });
        }
      }
    }
  });
  console.log('🔔 Notification scheduler started (runs daily at 9am)');
}
