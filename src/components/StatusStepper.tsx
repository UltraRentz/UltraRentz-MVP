import { } from "react";

export type EscrowStep = 
  | "Deposit Submitted" 
  | "Funds Yielding" 
  | "Tenancy End/Review" 
  | "Funds Released";

interface StatusStepperProps {
  currentStep: EscrowStep;
  status: "Active" | "Disputed" | "Released";
}

const steps: EscrowStep[] = [
  "Deposit Submitted",
  "Funds Yielding",
  "Tenancy End/Review",
  "Funds Released"
];

export default function StatusStepper({ currentStep, status }: StatusStepperProps) {
  const currentIndex = steps.indexOf(currentStep);
  const isDisputed = status === "Disputed";

  return (
    <div className="w-full py-6 overflow-x-auto">
      <div className="flex items-center justify-between relative min-w-max px-4">
        {/* Connecting Lines */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>
        <div
          className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 z-0 transition-all duration-500 ${isDisputed ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {/* Step Circles */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div key={step} className="flex flex-col items-center relative z-10 min-w-[72px]">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isCompleted
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : isActive
                      ? isDisputed
                        ? "bg-white dark:bg-gray-800 border-red-500 text-red-500 scale-110 shadow-lg"
                        : "bg-white dark:bg-gray-800 border-indigo-500 text-indigo-500 scale-110 shadow-lg"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>

              <div className="mt-3 text-center">
                <span
                  className={`text-xs leading-tight font-bold uppercase tracking-wider max-w-[90px] break-words ${
                    isActive
                      ? isDisputed ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500"
                  }`}
                  aria-hidden={false}
                >
                  {step}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
