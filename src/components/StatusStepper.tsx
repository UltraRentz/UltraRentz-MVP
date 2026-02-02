import { } from "react";

export type EscrowStep = 
  | "Deposit Submitted" 
  | "Funds Yielding" 
  | "Tenancy End/Review" 
  | "Funds Released";

interface StatusStepperProps {
  currentStep: EscrowStep;
}

const steps: EscrowStep[] = [
  "Deposit Submitted",
  "Funds Yielding",
  "Tenancy End/Review",
  "Funds Released"
];

export default function StatusStepper({ currentStep }: StatusStepperProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Connecting Lines */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {/* Step Circles */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          
          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isCompleted 
                    ? "bg-indigo-500 border-indigo-500 text-white" 
                    : isActive 
                      ? "bg-white dark:bg-gray-800 border-indigo-500 text-indigo-500 scale-110 shadow-lg" 
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
              <span 
                className={`absolute top-12 whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
