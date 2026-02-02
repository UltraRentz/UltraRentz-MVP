import axios from "axios";

export const disputeMessagesApi = {
  getMessages: async (disputeId: string) => {
    const res = await axios.get(`/api/dispute-messages/${disputeId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });
    return res.data;
  },
  postMessage: async (disputeId: string, message: string) => {
    const res = await axios.post(
      `/api/dispute-messages/${disputeId}`,
      { message },
      { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
    );
    return res.data;
  },
};
