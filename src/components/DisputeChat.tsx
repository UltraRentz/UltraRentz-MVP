import React, { useEffect, useRef, useState } from "react";
import { disputeMessagesApi } from "../services/disputeMessagesApi";

interface DisputeChatProps {
  disputeId: string;
  userAddress: string;
}

const DisputeChat: React.FC<DisputeChatProps> = ({ disputeId, userAddress }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    disputeMessagesApi.getMessages(disputeId)
      .then(res => setMessages(res.messages || []))
      .finally(() => setLoading(false));
  }, [disputeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    await disputeMessagesApi.postMessage(disputeId, input);
    const res = await disputeMessagesApi.getMessages(disputeId);
    setMessages(res.messages || []);
    setInput("");
    setSending(false);
  };

  return (
    <div className="border rounded bg-gray-50 dark:bg-gray-800 p-4 mb-4 max-h-96 flex flex-col">
      <div className="font-bold mb-2 text-gray-900 dark:text-white">Dispute Chat / Mediation</div>
      <div className="flex-1 overflow-y-auto mb-2" style={{ maxHeight: 200 }}>
        {loading ? (
          <div className="text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500">No messages yet.</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`mb-2 flex ${msg.sender === userAddress ? "justify-end" : "justify-start"}`}>
              <div className={`px-3 py-2 rounded-lg ${msg.sender === userAddress ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"}`}>
                <div className="text-xs opacity-70 mb-1">{msg.sender === userAddress ? "You" : msg.sender.slice(0, 8)}</div>
                <div>{msg.message}</div>
                <div className="text-xs mt-1 opacity-60">{new Date(msg.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded font-bold"
          onClick={sendMessage}
          disabled={sending || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default DisputeChat;
