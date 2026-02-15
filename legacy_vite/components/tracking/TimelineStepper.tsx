import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const TimelineStepper: React.FC<{ progress: number; status: string }> = ({ progress, status }) => {
    const steps = [
      { label: 'Booked', pct: 0 },
      { label: 'Export', pct: 25 },
      { label: 'Departed', pct: 50 },
      { label: 'Arrival', pct: 75 },
      { label: 'Delivered', pct: 100 },
    ];
  
    let activeIndex = 0;
    if (status === 'Delivered') activeIndex = 4;
    else if (progress >= 80) activeIndex = 3;
    else if (progress >= 50) activeIndex = 2;
    else if (progress >= 20) activeIndex = 1;
  
    return (
      <div className="w-full py-4 px-2">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-3 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
          <div 
              className="absolute left-0 top-3 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          ></div>
  
          {steps.map((step, index) => {
            const isCompleted = index <= activeIndex;
            const isCurrent = index === activeIndex;
  
            return (
              <div key={index} className="flex flex-col items-center relative">
                <div 
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-white
                  ${isCompleted ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}
                  ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                  `}
                >
                   {isCompleted && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className={`mt-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition-colors duration-300 ${isCompleted ? 'text-blue-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
};
