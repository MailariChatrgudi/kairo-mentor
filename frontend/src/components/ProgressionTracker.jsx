import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';

const getDatesArray = (daysCount) => {
  const dates = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - daysCount + 1);
  for (let i = 0; i < daysCount; i++) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const ProgressionTracker = ({ streak = 0, activity = {} }) => {
  const daysToShow = 35; // 7x5 month view
  const dates = useMemo(() => getDatesArray(daysToShow), [daysToShow]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
        
        {/* Left Side: Streak Status */}
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="p-2 md:p-3 bg-orange-50 rounded-xl md:rounded-2xl">
            <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-500 fill-orange-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{streak}</span>
              <span className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-widest">Day Streak</span>
            </div>
            <p className="text-[10px] md:text-xs font-semibold text-orange-600/80">
              {streak >= 3 ? "You're on fire! 🔥" : "Keep going for the burn"}
            </p>
          </div>
        </div>

        {/* Right Side: Monthly Grid */}
        <div className="flex flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
          <div className="flex justify-between items-center md:justify-end gap-3 mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consistency Tracker</span>
            <div className="flex gap-1.5 items-center">
               <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-200"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1.5">
            {dates.map((date) => {
              const level = activity[date] || 0;
              let bgClass = "bg-[#F8F9FA]"; // 0
              if (level === 1) bgClass = "bg-emerald-200"; // 1
              if (level >= 2) bgClass = "bg-emerald-600"; // 2
               
              return (
                <div 
                  key={date}
                  title={`${date}: ${level} tasks`}
                  className={`w-3.5 h-3.5 rounded-[3px] ${bgClass} transition-all duration-300 hover:scale-110 cursor-pointer`}
                />
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProgressionTracker;
