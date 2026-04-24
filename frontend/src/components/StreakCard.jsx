import React from 'react';
import Card from './Card';
import { Flame } from 'lucide-react';

const StreakCard = ({ streak = 0 }) => {
  return (
    <Card className="flex items-center gap-4 p-4 lg:p-6 bg-white overflow-hidden relative border-none shadow-sm h-full">
      {/* Cool background effect */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="p-3.5 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl shrink-0 shadow-sm border border-orange-500/20">
        <Flame size={28} color="#FFFFFF" strokeWidth={1.8} />
      </div>
      
      <div className="flex-1 z-10">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-0.5">
          {streak} {streak === 1 ? 'Day' : 'Days'} Streak
        </h3>
        <p className="text-[13px] text-gray-500 font-medium">
          {streak > 0 ? "You're building consistency! 🔥" : "Complete a task to start"}
        </p>
      </div>
    </Card>
  );
};

export default StreakCard;
