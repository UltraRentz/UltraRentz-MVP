import { ethers } from "ethers";
import { Server } from "socket.io";
import { escrowContract, provider } from "../config/blockchain";
import {
  Deposit,
  Signatory,
  Vote,
  Dispute,
  YieldHistory,
  DepositStatus,
  VoteChoice,
  DisputeStatus,
} from "../models";
import { logger } from "../middleware/errorHandler";

export class EventListenerService {
  private io: Server;
  private isListening: boolean = false;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Start listening to smart contract events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn("Event listener is already running");
      return;
    }

    try {
      // Listen to DepositReceived event
      escrowContract.on(
        "DepositReceived",
        this.handleDepositReceived.bind(this)
      );

      // Listen to SignatoryVote event
      escrowContract.on("SignatoryVote", this.handleSignatoryVote.bind(this));

      // Listen to DepositReleased event
      escrowContract.on(
        "DepositReleased",
        this.handleDepositReleased.bind(this)
      );

      // Listen to DepositReleasedToTenant event
      escrowContract.on(
        "DepositReleasedToTenant",
        this.handleDepositReleasedToTenant.bind(this)
      );

      // Listen to DepositReleasedToLandlord event
      escrowContract.on(
        "DepositReleasedToLandlord",
        this.handleDepositReleasedToLandlord.bind(this)
      );

      // Listen to DisputeTriggered event
      escrowContract.on(
        "DisputeTriggered",
        this.handleDisputeTriggered.bind(this)
      );

      // Listen to DAOResolved event
      escrowContract.on("DAOResolved", this.handleDAOResolved.bind(this));

      this.isListening = true;
      logger.info("Event listener started successfully");
    } catch (error) {
      logger.error("Failed to start event listener:", error);
      throw error;
    }
  }

  /**
   * Stop listening to events
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      escrowContract.removeAllListeners();
      this.isListening = false;
      logger.info("Event listener stopped");
    } catch (error) {
      logger.error("Error stopping event listener:", error);
    }
  }

  /**
   * Handle DepositReceived event
   */
  private async handleDepositReceived(
    id: ethers.BigNumber,
    tenant: string,
    landlord: string,
    token: string,
    amount: ethers.BigNumber,
    event: ethers.Event
  ): Promise<void> {
    try {
      logger.info(
        `DepositReceived event: ID ${id.toString()}, Tenant: ${tenant}, Landlord: ${landlord}`
      );

      // Create deposit record
      const deposit = await Deposit.create({
        chain_deposit_id: id.toNumber(),
        tenant_address: tenant.toLowerCase(),
        landlord_address: landlord.toLowerCase(),
        token_address: token.toLowerCase(),
        amount: ethers.utils.formatEther(amount),
        status: DepositStatus.PENDING,
        released: false,
        in_dispute: false,
        tx_hash: event.transactionHash,
      });

      // Get signatories from contract (assuming we have a method to get them)
      // For now, we'll create placeholder signatories
      // In a real implementation, you'd call the contract to get the actual signatories
      const signatoryAddresses = await this.getSignatoriesFromContract(
        id.toNumber()
      );

      for (let i = 0; i < signatoryAddresses.length; i++) {
        await Signatory.create({
          deposit_id: deposit.id,
          address: signatoryAddresses[i].toLowerCase(),
          signatory_index: i,
        });
      }

      // Emit WebSocket event
      this.io.emit("deposit:created", {
        depositId: id.toNumber(),
        tenant: tenant.toLowerCase(),
        landlord: landlord.toLowerCase(),
        amount: ethers.utils.formatEther(amount),
        txHash: event.transactionHash,
      });

      logger.info(`Deposit ${id.toString()} created successfully`);
    } catch (error) {
      logger.error(
        `Error handling DepositReceived event for ID ${id.toString()}:`,
        error
      );
    }
  }

  /**
   * Handle SignatoryVote event
   */
  private async handleSignatoryVote(
    id: ethers.BigNumber,
    signatory: string,
    choice: number,
    event: ethers.Event
  ): Promise<void> {
    try {
      logger.info(
        `SignatoryVote event: ID ${id.toString()}, Signatory: ${signatory}, Choice: ${choice}`
      );

      // Find the deposit
      const deposit = await Deposit.findOne({
        where: { chain_deposit_id: id.toNumber() },
      });

      if (!deposit) {
        logger.error(`Deposit ${id.toString()} not found for vote`);
        return;
      }

      // Map choice to VoteChoice enum
      let voteChoice: VoteChoice;
      switch (choice) {
        case 0:
          voteChoice = VoteChoice.REFUND_TENANT;
          break;
        case 1:
          voteChoice = VoteChoice.PAY_LANDLORD;
          break;
        default:
          voteChoice = VoteChoice.PENDING;
      }

      // Create or update vote record
      await Vote.upsert({
        deposit_id: deposit.id,
        signatory_address: signatory.toLowerCase(),
        vote_choice: voteChoice,
        tx_hash: event.transactionHash,
      });

      // Emit WebSocket event
      this.io.emit("vote:cast", {
        depositId: id.toNumber(),
        signatory: signatory.toLowerCase(),
        choice: voteChoice,
        txHash: event.transactionHash,
      });

      logger.info(`Vote recorded for deposit ${id.toString()}`);
    } catch (error) {
      logger.error(
        `Error handling SignatoryVote event for ID ${id.toString()}:`,
        error
      );
    }
  }

  /**
   * Handle DepositReleased event
   */
  private async handleDepositReleased(
    id: ethers.BigNumber,
    amount: ethers.BigNumber,
    event: ethers.Event
  ): Promise<void> {
    try {
      logger.info(
        `DepositReleased event: ID ${id.toString()}, Amount: ${ethers.utils.formatEther(
          amount
        )}`
      );

      const deposit = await Deposit.findOne({
        where: { chain_deposit_id: id.toNumber() },
      });

      if (deposit) {
        await deposit.update({
          status: DepositStatus.RELEASED,
          released: true,
        });

        // Emit WebSocket event
        this.io.emit("deposit:released", {
          depositId: id.toNumber(),
          amount: ethers.utils.formatEther(amount),
          txHash: event.transactionHash,
        });
      }

      logger.info(`Deposit ${id.toString()} released successfully`);
    } catch (error) {
      logger.error(
        `Error handling DepositReleased event for ID ${id.toString()}:`,
        error
      );
    }
  }

  /**
   * Handle DepositReleasedToTenant event
   */
  private async handleDepositReleasedToTenant(
    id: ethers.BigNumber,
    amount: ethers.BigNumber,
    event: ethers.Event
  ): Promise<void> {
    try {
      logger.info(
        `DepositReleasedToTenant event: ID ${id.toString()}, Amount: ${ethers.utils.formatEther(
          amount
        )}`
      );

      const deposit = await Deposit.findOne({
        where: { chain_deposit_id: id.toNumber() },
      });

      if (deposit) {
        // Create yield history record for tenant
        await YieldHistory.create({
          deposit_id: deposit.id,
          user_address: deposit.tenant_address,
          yield_amount: ethers.utils.formatEther(amount),
          apy: "8.50", // This should be calculated based on actual yield
          claimed: true,
          tx_hash: event.transactionHash,
          claimed_at: new Date(),
        });

        // Emit WebSocket event
        this.io.emit("yield:claimed", {
          depositId: id.toNumber(),
          user: deposit.tenant_address,
          amount: ethers.utils.formatEther(amount),
          txHash: event.transactionHash,
        });
      }

      logger.info(`Yield claimed by tenant for deposit ${id.toString()}`);
    } catch (error) {
      logger.error(
        `Error handling DepositReleasedToTenant event for ID ${id.toString()}:`,
        error
      );
    }
  }

  /**
   * Handle DepositReleasedToLandlord event
   */
  private async handleDepositReleasedToLandlord(
    id: ethers.BigNumber,
    amount: ethers.BigNumber,
    event: ethers.Event
  ): Promise<void> {
    try {
      logger.info(
        `DepositReleasedToLandlord event: ID ${id.toString()}, Amount: ${ethers.utils.formatEther(
          amount
        )}`
      );

      const deposit = await Deposit.findOne({
        where: { chain_deposit_id: id.toNumber() },
      });

      if (deposit) {
        // Create yield history record for landlord
        await YieldHistory.create({
          deposit_id: deposit.id,
          user_address: deposit.landlord_address,
          yield_amount: ethers.utils.formatEther(amount),
          apy: "8.50", // This should be calculated based on actual yield
          claimed: true,
          tx_hash: event.transactionHash,
          claimed_at: new Date(),
        });

        // Emit WebSocket event
        this.io.emit("yield:claimed", {
          depositId: id.toNumber(),
          user: deposit.landlord_address,
          amount: ethers.utils.formatEther(amount),
          txHash: event.transactionHash,
        });
      }

      logger.info(`Yield claimed by landlord for deposit ${id.toString()}`);
    } catch (error) {
      logger.error(
        `Error handling DepositReleasedToLandlord event for ID ${id.toString()}:`,
        error
      );
    }
  }

  /**
   * Handle DisputeTriggered event
   */
  private async handleDisputeTriggered(
    id: ethers.BigNumber,
    by: string,
    event: ethers.Event
  ): Promise<void> {
    try {
      logger.info(
        `DisputeTriggered event: ID ${id.toString()}, Triggered by: ${by}`
      );

      const deposit = await Deposit.findOne({
        where: { chain_deposit_id: id.toNumber() },
      });

      if (deposit) {
        // Update deposit status
        await deposit.update({
          status: DepositStatus.DISPUTED,
          in_dispute: true,
        });

        // Create dispute record
        await Dispute.create({
          deposit_id: deposit.id,
          triggered_by: by.toLowerCase(),
          status: DisputeStatus.ACTIVE,
        });

        // Emit WebSocket event
        this.io.emit("dispute:triggered", {
          depositId: id.toNumber(),
          triggeredBy: by.toLowerCase(),
          txHash: event.transactionHash,
        });
      }

      logger.info(`Dispute created for deposit ${id.toString()}`);
    } catch (error) {
      logger.error(
        `Error handling DisputeTriggered event for ID ${id.toString()}:`,
        error
      );
    }
  }

  /**
   * Handle DAOResolved event
   */
  private async handleDAOResolved(
    id: ethers.BigNumber,
    tenantAmount: ethers.BigNumber,
    landlordAmount: ethers.BigNumber,
    event: ethers.Event
  ): Promise<void> {
    try {
      logger.info(
        `DAOResolved event: ID ${id.toString()}, Tenant: ${ethers.utils.formatEther(
          tenantAmount
        )}, Landlord: ${ethers.utils.formatEther(landlordAmount)}`
      );

      const deposit = await Deposit.findOne({
        where: { chain_deposit_id: id.toNumber() },
        include: [{ association: "disputes" }],
      });

      if (deposit) {
        // Update deposit status
        await deposit.update({
          status: DepositStatus.RESOLVED,
          in_dispute: false,
        });

        // Update dispute if exists
        const existingDispute = await Dispute.findOne({
          where: { deposit_id: deposit.id, status: DisputeStatus.ACTIVE },
        });

        if (existingDispute) {
          await existingDispute.update({
            status: DisputeStatus.RESOLVED,
            resolution: `DAO resolved: Tenant gets ${ethers.utils.formatEther(
              tenantAmount
            )} URZ, Landlord gets ${ethers.utils.formatEther(
              landlordAmount
            )} URZ`,
            tenant_amount: ethers.utils.formatEther(tenantAmount),
            landlord_amount: ethers.utils.formatEther(landlordAmount),
            resolved_at: new Date(),
          });
        }

        // Emit WebSocket event
        this.io.emit("dispute:resolved", {
          depositId: id.toNumber(),
          tenantAmount: ethers.utils.formatEther(tenantAmount),
          landlordAmount: ethers.utils.formatEther(landlordAmount),
          txHash: event.transactionHash,
        });
      }

      logger.info(`Dispute resolved for deposit ${id.toString()}`);
    } catch (error) {
      logger.error(
        `Error handling DAOResolved event for ID ${id.toString()}:`,
        error
      );
    }
  }

  /**
   * Get signatories from contract (placeholder implementation)
   * In a real implementation, you'd call the contract method to get signatories
   */
  private async getSignatoriesFromContract(
    depositId: number
  ): Promise<string[]> {
    try {
      // This is a placeholder - you'd need to implement the actual contract call
      // For now, return empty array or mock data
      return [];
    } catch (error) {
      logger.error(
        `Error getting signatories for deposit ${depositId}:`,
        error
      );
      return [];
    }
  }
}

// Export function to start event listener
export const startEventListener = async (io: Server): Promise<void> => {
  const eventListener = new EventListenerService(io);
  await eventListener.startListening();
};
