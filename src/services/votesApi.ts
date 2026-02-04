import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

export type VoteChoice = "refund_tenant" | "pay_landlord" | "split";

export interface Vote {
  id: number;
  address: string;
  choice: VoteChoice;
  voted_at: string;
}

export interface VoteCount {
  refund_tenant: number;
  pay_landlord: number;
  split: number;
  total: number;
}

export interface CastVoteResponse {
  success: boolean;
  vote: Vote;
  voteCount: VoteCount;
  resolutionReached: boolean;
  winningChoice: VoteChoice | null;
}

export interface CanVoteResponse {
  canVote: boolean;
  reason?: string;
  existingChoice?: VoteChoice;
}

export const votesApi = {
  // Get votes for a dispute by depositId
  getByDepositId: async (depositId: string): Promise<{ votes: Vote[] }> => {
    const res = await axios.get(`${API_BASE_URL}/votes/${depositId}`);
    return res.data;
  },

  // Cast a vote on a dispute
  castVote: async (
    depositId: string,
    voterAddress: string,
    choice: VoteChoice,
    signature?: string
  ): Promise<CastVoteResponse> => {
    const res = await axios.post(`${API_BASE_URL}/votes/${depositId}`, {
      voterAddress,
      choice,
      signature,
    });
    return res.data;
  },

  // Check if a user can vote on a dispute
  canVote: async (depositId: string, address: string): Promise<CanVoteResponse> => {
    const res = await axios.get(`${API_BASE_URL}/votes/${depositId}/can-vote/${address}`);
    return res.data;
  },
};
