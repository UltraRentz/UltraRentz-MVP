import { Request, Response } from "express";
import { Deposit } from "../models";
import { callPassportDeposit } from "../services/passportService";
import { notifyDepositPassported } from "../services/notificationService";
import { ethers } from 'ethers';

export class PassportController {
  /**
   * Passport a deposit to a new scheme/platform
   */
  static async passportDeposit(req: Request, res: Response): Promise<void> {
    try {
      const { depositId } = req.params;
      const { destinationType, destination, bankDetails, amount } = req.body;
      // Validate deposit and user
      const deposit = await Deposit.findOne({ where: { chain_deposit_id: depositId } });
      if (!deposit) {
        res.status(404).json({ error: "Deposit not found" });
        return;
      }
      // Validate user is tenant (assume req.user.address is set by auth middleware)
      const userAddress = req.user?.address?.toLowerCase();
      if (!userAddress || userAddress !== deposit.tenant_address) {
        res.status(403).json({ error: "Only the tenant can passport the deposit" });
        return;
      }
      // Validate amount
      if (ethers.BigNumber.from(amount).gt(ethers.BigNumber.from(deposit.amount))) {
        res.status(400).json({ error: "Amount exceeds deposit balance" });
        return;
      }
      // Get signer (this is a placeholder; in production, use a secure wallet or meta-tx)
      // For demo, assume backend has a tenant's private key (NOT for production)
      const signer = new ethers.Wallet(process.env.TENANT_PRIVATE_KEY!, /* provider */);
      // Call smart contract
      const txHash = await callPassportDeposit({
        depositId: Number(depositId),
        destinationType,
        destination,
        bankDetails,
        amount,
        signer,
      });
      // Update DB (optional: add destination info)
      // deposit.status = 'passported';
      // await deposit.save();
      // In-app and SMS notification
      const tenantPhone = deposit.tenant_phone || null; // TODO: Replace with real phone lookup
      const landlordPhone = deposit.landlord_phone || null;
      notifyDepositPassported(req.app.get('io'), deposit, tenantPhone, landlordPhone, destination, amount);
      res.json({ message: "Passporting successful", txHash });
    } catch (error) {
      res.status(500).json({ error: "Failed to passport deposit" });
    }
  }
}
