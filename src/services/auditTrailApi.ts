import axios from "axios";

export const auditTrailApi = {
  getByDepositId: async (depositId: string) => {
    const res = await axios.get(`/api/audit-trail/${depositId}`);
    return res.data;
  },
};
