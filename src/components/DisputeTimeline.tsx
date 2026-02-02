import React from "react";

interface TimelineEvent {
  event: string;
  timestamp: string;
  details?: string;
  txHash?: string;
}

interface DisputeTimelineProps {
  events: TimelineEvent[];
}

const eventColors: Record<string, string> = {
  "DepositReceived": "bg-blue-500",
  "DisputeTriggered": "bg-red-500",
  "SignatoryVote": "bg-yellow-500",
  "DAOResolved": "bg-green-500",
  "DepositReleased": "bg-purple-500",
};

const DisputeTimeline: React.FC<DisputeTimelineProps> = ({ events }) => {
  return (
    <div className="relative pl-8 border-l-2 border-gray-300 dark:border-gray-700">
      {events.map((ev, idx) => (
        <div key={idx} className="mb-8 flex items-start group">
          <span className={`absolute -left-4 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${eventColors[ev.event] || 'bg-gray-400'}`}>{ev.event[0]}</span>
          <div className="ml-4">
            <div className="font-semibold text-gray-900 dark:text-white">{ev.event.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(ev.timestamp).toLocaleString()}</div>
            {ev.details && <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">{ev.details}</div>}
            {ev.txHash && (
              <a href={`https://moonscan.io/tx/${ev.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline mt-1 inline-block">View on Explorer</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DisputeTimeline;
