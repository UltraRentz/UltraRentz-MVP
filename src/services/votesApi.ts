import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

export const votesApi = {
  // Get votes for a dispute by depositId
  getByDepositId: async (depositId: string) => {
    const res = await axios.get(`${API_BASE_URL}/votes/${depositId}`);
    return res.data;
  },
};
