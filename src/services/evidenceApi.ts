import axios from "axios";

export const evidenceApi = {
  upload: async (disputeId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`/api/evidence/${disputeId}`, formData, {
      headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });
    return res.data;
  },
  getByDispute: async (disputeId: string) => {
    const res = await axios.get(`/api/evidence/${disputeId}`);
    return res.data;
  },
};
