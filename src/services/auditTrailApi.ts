import api from "./api";

export const auditTrailApi = {
  getByDepositId: async (depositId: string) => {
    const res = await api.get(`/audit-trail/${depositId}`);
    return res.data;
  },
};
