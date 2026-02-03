import React from "react";

interface DisputeInsightsProps {
  dispute: any;
  evidence: any[];
  votes: any[];
}

const DisputeInsights: React.FC<DisputeInsightsProps> = ({ dispute, evidence, votes }) => {
  // Placeholder: Replace with real AI/NLP call
  // For now, just summarize key points
  const summary = [
    `Dispute reason: ${dispute.reason}`,
    `Claimed by landlord: £${dispute.landlord_amount}`,
    `Evidence uploaded: ${evidence.length} file(s)`,
    `Votes cast: ${votes.length}`,
    dispute.status === "resolved"
      ? `Resolved: £${dispute.landlord_amount} to landlord, £${dispute.tenant_amount} to tenant.`
      : "Awaiting resolution."
  ];
  // Suggest likely outcome (placeholder logic)
  let likelyOutcome = "Insufficient data.";
  if (votes.length > 0) {
    const landlordVotes = votes.filter(v => v.vote_choice === 1).length;
    const tenantVotes = votes.filter(v => v.vote_choice === 2).length;
    if (landlordVotes > tenantVotes) likelyOutcome = "Favors landlord.";
    else if (tenantVotes > landlordVotes) likelyOutcome = "Favors tenant.";
    else likelyOutcome = "Split or undecided.";
  }
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 my-4 rounded">
      <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">AI-Powered Dispute Insights</h4>
      <ul className="list-disc pl-5 text-yellow-900 dark:text-yellow-100">
        {summary.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
      <div className="mt-2 font-semibold text-yellow-700 dark:text-yellow-100">Likely outcome: {likelyOutcome}</div>
    </div>
  );
};

export default DisputeInsights;
