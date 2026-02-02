import React, { useState, useEffect } from "react";
import { websocketService } from '../services/websocket';
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import { disputesApi } from "../services/api";
import VoteProgressBar from "../components/VoteProgressBar";
import { votesApi } from "../services/votesApi";
import DisputeTimeline from "../components/DisputeTimeline";
import { auditTrailApi } from "../services/auditTrailApi";
import EvidenceGallery from "../components/EvidenceGallery";
import DisputeInsights from "../components/DisputeInsights";
import DisputeChat from "../components/DisputeChat";
import { evidenceApi } from "../services/evidenceApi";

interface DisputeStats {
  activeDisputes: number;
  resolvedDisputes: number;
  averageResolutionTimeHours: number;
}

interface Dispute {
  id: string;
  deposit_id: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  tenant_amount?: string;
  landlord_amount?: string;
  resolution?: string;
  feedback?: string;
}

const DisputesPage: React.FC = () => {
  // Add all hooks and state here
  const [disputeStats, setDisputeStats] = useState<DisputeStats | null>(null);
  const [disputes, setDisputes] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsNotification, setWsNotification] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ depositId: '', disputedAmount: '', reason: '' });
  const [userDeposits, setUserDeposits] = useState<any[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { authState } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [votesByDispute, setVotesByDispute] = useState<Record<string, any[]>>({});
  const [timelineModal, setTimelineModal] = useState<{ open: boolean; events: any[]; loading: boolean; error: string | null; disputeId?: string }>({ open: false, events: [], loading: false, error: null });
  const [timelineDispute, setTimelineDispute] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  // Show timeline modal for a dispute
  const openTimeline = async (depositId: string, disputeId?: string) => {
    setTimelineModal({ open: true, events: [], loading: true, error: null, disputeId });
    setEvidence([]);
    setEvidenceLoading(true);
    setTimelineDispute(null);
    try {
      const res = await auditTrailApi.getByDepositId(depositId);
      setTimelineModal({ open: true, events: res.history || [], loading: false, error: null, disputeId });
    } catch (err) {
      setTimelineModal({ open: true, events: [], loading: false, error: "Failed to load timeline.", disputeId });
    }
    if (disputeId && disputes?.data) {
      const d = disputes.data.find((d: any) => d.id === disputeId);
      setTimelineDispute(d || null);
      try {
        const evRes = await evidenceApi.getByDispute(disputeId);
        setEvidence(evRes.evidence || []);
      } catch {
        setEvidence([]);
      }
    }
    setEvidenceLoading(false);
  };

  useEffect(() => {
    // Fetch stats and disputes
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const statsRes = await fetch('/api/disputes/stats');
        const statsData = await statsRes.json();
        setDisputeStats(statsData);
        const disputesRes = await fetch('/api/disputes');
        const disputesData = await disputesRes.json();
        setDisputes(disputesData);
        // Fetch votes for each dispute
        if (disputesData?.data) {
          const votesObj: Record<string, any[]> = {};
          await Promise.all(
            disputesData.data.map(async (dispute: any) => {
              try {
                const voteRes = await votesApi.getByDepositId(dispute.deposit_id);
                votesObj[dispute.deposit_id] = voteRes.votes || [];
              } catch {
                votesObj[dispute.deposit_id] = [];
              }
            })
          );
          setVotesByDispute(votesObj);
        }
      } catch (err) {
        setError('Failed to load disputes.');
      }
      setIsLoading(false);
    };
    fetchData();
    // WebSocket notification
    websocketService.on('dispute:raised', (msg: string) => {
      setWsNotification(msg);
      setTimeout(() => setWsNotification(null), 5000);
    });

    // Real-time vote updates
    const handleVoteCast = async (data: { depositId: string }) => {
      // Refetch votes for this depositId
      try {
        const voteRes = await votesApi.getByDepositId(data.depositId);
        setVotesByDispute(prev => ({ ...prev, [data.depositId]: voteRes.votes || [] }));
      } catch {}
    };
    websocketService.on('vote:cast', handleVoteCast);

    return () => {
      websocketService.off('dispute:raised');
      websocketService.off('vote:cast', handleVoteCast);
    };
  }, []);

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 style={{ color: "var(--text-color)" }} className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Dispute Resolution
          </h1>
          <p style={{ color: "var(--text-color)" }} className="text-lg text-gray-600 dark:text-gray-400">
            Fair and transparent dispute resolution through DAO governance
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Active Disputes"
            value={isLoading ? "..." : (disputeStats?.activeDisputes || 0).toString()}
            subtitle="Requiring resolution"
            color="red"
            icon="⚠️"
          />
          <StatCard
            title="Resolved Disputes"
            value={isLoading ? "..." : (disputeStats?.resolvedDisputes || 0).toString()}
            subtitle="Successfully resolved"
            color="green"
            icon="✅"
          />
          <StatCard
            title="Avg. Resolution Time"
            value={isLoading ? "..." : `${disputeStats?.averageResolutionTimeHours || 0}h`}
            subtitle="Fast resolution"
            color="blue"
            icon="⏱️"
          />
        </div>
        <div className="mt-12">
          {/* Real-time Notification Banner */}
          {wsNotification && (
            <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-800 dark:text-blue-200 rounded-lg text-center animate-pulse">
              {wsNotification} (DAO notified, dispute in progress)
            </div>
          )}
          {/* Raise Dispute Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowModal(false)}>&times;</button>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Raise a Dispute</h2>
                {/* Fetch user deposits on modal open */}
                {depositsLoading ? (
                  <div className="text-center py-4">Loading your properties...</div>
                ) : userDeposits.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No properties found for your account.</div>
                ) : (
                  <form onSubmit={async e => {
                    e.preventDefault();
                    setSubmitting(true);
                    setSubmitError(null);
                    try {
                      const res = await disputesApi.getByDepositId(form.depositId);
                      if (res.data && res.data.dispute) {
                        setSubmitError('A dispute already exists for this property.');
                        setSubmitting(false);
                        return;
                      }
                    } catch {}
                    try {
                      const resp = await fetch(`/api/disputes/${form.depositId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                        body: JSON.stringify({ disputedAmount: form.disputedAmount, reason: form.reason }),
                      });
                      const data = await resp.json();
                      if (resp.ok) {
                        setShowModal(false);
                        setForm({ depositId: '', disputedAmount: '', reason: '' });
                        setTimeout(() => window.location.reload(), 500); // Refresh to show new dispute
                      } else {
                        setSubmitError(data.error || 'Failed to raise dispute');
                      }
                    } catch (err) {
                      setSubmitError('Error raising dispute.');
                    }
                    setSubmitting(false);
                  }}>
                    <label className="block mb-2 font-semibold">Select Property</label>
                    <select
                      className="border rounded px-2 py-1 mb-4 w-full"
                      value={form.depositId}
                      onChange={e => setForm(f => ({ ...f, depositId: e.target.value }))}
                      required
                    >
                      <option value="" disabled>Select a property...</option>
                      {userDeposits.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                          {dep.property_address || dep.id.slice(0, 8)}
                          {dep.tenant_name ? ` | Tenant: ${dep.tenant_name}` : ''}
                          {dep.amount ? ` | £${dep.amount}` : ''}
                        </option>
                      ))}
                    </select>
                    <input type="number" min="0" className="border rounded px-2 py-1 mb-2 w-full" placeholder="Disputed Amount (£)" value={form.disputedAmount} onChange={e => setForm(f => ({ ...f, disputedAmount: e.target.value }))} required />
                    <input type="text" className="border rounded px-2 py-1 mb-2 w-full" placeholder="Reason (e.g. broken chair)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
                    <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded font-bold w-full" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Dispute'}</button>
                    {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
                  </form>
                )}
              </div>
            </div>
          )}
          <h2 style={{ color: "var(--text-color)" }} className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Disputes
          </h2>
          <div>
            {disputes?.data && disputes.data.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="px-3 py-2 text-left">Dispute ID</th>
                        <th className="px-3 py-2 text-left">Deposit ID</th>
                        <th className="px-3 py-2 text-left">Reason</th>
                        <th className="px-3 py-2 text-left">Claimed (£)</th>
                        <th className="px-3 py-2 text-left">Resolved (£)</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Feedback</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Timeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputes.data.slice(0, 10).map((dispute: Dispute) => {
                        // Estimate: 3 days to resolve (customize as needed)
                        const created = new Date(dispute.created_at);
                        const expectedResolution = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
                        const votes = votesByDispute[dispute.deposit_id] || [];
                        // Placeholder: totalSignatories should come from backend or contract
                        const totalSignatories = 5;
                        // Fetch user deposits when modal opens
                        useEffect(() => {
                          if (showModal && authState?.user?.walletAddress) {
                            setDepositsLoading(true);
                            depositsApi.getByUser(authState.user.walletAddress)
                              .then(res => setUserDeposits(res.data.data || []))
                              .catch(() => setUserDeposits([]))
                              .finally(() => setDepositsLoading(false));
                          }
                        }, [showModal, authState?.user?.walletAddress]);

                        return (
                          <React.Fragment key={dispute.id}>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <td className="px-3 py-2 font-mono">{dispute.id.slice(0, 8)}...</td>
                              <td className="px-3 py-2 font-mono">{dispute.deposit_id.slice(0, 8)}...</td>
                              <td className="px-3 py-2">{dispute.reason}</td>
                              <td className="px-3 py-2">{dispute.landlord_amount || '-'}</td>
                              <td className="px-3 py-2">{dispute.status === 'resolved' ? dispute.landlord_amount || '-' : '-'}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  dispute.status === "active"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    : dispute.status === "resolved"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                                }`}>
                                  {dispute.status}
                                </span>
                                {dispute.status === 'active' && (
                                  <div className="text-xs text-blue-500 mt-1">Expected resolution: {expectedResolution.toLocaleDateString()} (3 days)</div>
                                )}
                              </td>
                              <td className="px-3 py-2">{dispute.feedback || '-'}</td>
                              <td className="px-3 py-2 text-xs">{new Date(dispute.created_at).toLocaleDateString()}</td>
                              <td className="px-3 py-2">
                                <button className="text-blue-600 underline" onClick={() => openTimeline(dispute.deposit_id, dispute.id)}>
                                  View Timeline
                                </button>
                              </td>
                                        {/* Dispute Timeline Modal */}
                                        {timelineModal.open && (
                                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
                                              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setTimelineModal({ open: false, events: [], loading: false, error: null })}>&times;</button>
                                              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Dispute Timeline & Audit Trail</h2>
                                              {timelineModal.loading ? (
                                                <div className="text-center py-8">Loading timeline...</div>
                                              ) : timelineModal.error ? (
                                                <div className="text-center text-red-600 py-8">{timelineModal.error}</div>
                                              ) : timelineModal.events.length === 0 ? (
                                                <div className="text-center text-gray-500 py-8">No events found for this dispute.</div>
                                              ) : (
                                                <DisputeTimeline events={timelineModal.events.map(ev => ({
                                                  event: ev.event,
                                                  timestamp: ev.timestamp || Date.now(),
                                                  details: JSON.stringify(ev.args),
                                                  txHash: ev.transactionHash,
                                                }))} />
                                              )}
                                              {timelineDispute && (
                                                <>
                                                  <DisputeChat
                                                    disputeId={timelineDispute.id}
                                                    userAddress={authState?.user?.walletAddress || ""}
                                                  />
                                                  <DisputeInsights
                                                    dispute={timelineDispute}
                                                    evidence={evidence}
                                                    votes={votesByDispute[timelineDispute.deposit_id] || []}
                                                  />
                                                </>
                                              )}
                                              <h3 className="text-lg font-bold mt-8 mb-2 text-gray-900 dark:text-white">Evidence Gallery</h3>
                                              <EvidenceGallery
                                                evidence={evidence}
                                                onUpload={timelineModal.disputeId ? async (file) => {
                                                  setEvidenceUploading(true);
                                                  try {
                                                    await evidenceApi.upload(timelineModal.disputeId!, file);
                                                    const evRes = await evidenceApi.getByDispute(timelineModal.disputeId!);
                                                    setEvidence(evRes.evidence || []);
                                                  } finally {
                                                    setEvidenceUploading(false);
                                                  }
                                                } : undefined}
                                                uploading={evidenceUploading}
                                              />
                                              {evidenceLoading && <div className="text-center text-gray-500 py-2">Loading evidence...</div>}
                                            </div>
                                          </div>
                                        )}
                            </tr>
                            <tr>
                              <td colSpan={8}>
                                <VoteProgressBar votes={votes} totalSignatories={totalSignatories} />
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No disputes yet. The system is working smoothly!
              </p>
            )}
            {/* Raise Dispute Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowModal(true)}
                className="bg-red-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-red-700 transition"
              >
                Raise Dispute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputesPage;

