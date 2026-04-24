import React, { useMemo } from 'react';
import Card from './Card';

const getDatesArray = (daysCount) => {
  const dates = [];
  const currentDate = new Date();
  
  // Go back N days (we calculate today as last item)
  currentDate.setDate(currentDate.getDate() - daysCount + 1);
  
  for (let i = 0; i < daysCount; i++) {
    // Correct local formatting avoiding timezone drift
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const ContributionGrid = ({ activity = {} }) => {
  const daysToShow = 14; 
  const dates = useMemo(() => getDatesArray(daysToShow), [daysToShow]);

  return (
    <Card className="p-4 lg:p-6 bg-white border-none shadow-sm h-full flex flex-col justify-center">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Activity Tracker</h3>
        <p className="text-[13px] text-gray-500">Your daily contributions</p>
      </div>
      
      <div className="w-full overflow-hidden">
         <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-14 gap-2 lg:gap-2.5">
           {dates.map((date, idx) => {
             const level = activity[date] || 0;
             let colorClass = 'bg-[#F4F4F4] border-[#E8E8E8]'; // Level 0
             if (level === 1) colorClass = 'bg-[#E1CFA0] border-[#D0BD85]'; // Level 1 (Partial)
             else if (level >= 2) colorClass = 'bg-[#C8A951] border-[#B69642] shadow-[0_2px_8px_rgba(200,169,81,0.25)]'; // Level 2 (Full)
             
             // Responsive hiding (oldest items first -> hide them on smaller screens)
             // Total = 14. 
             // Mobile = 7 items (hide idx < 7)
             // SM = 10 items (hide idx < 4)
             const isHiddenMobile = idx < (14 - 7);
             const isHiddenSm = idx < (14 - 10);
            
             // Tailwind display overrides
             let displayClass = "block";
             if (isHiddenMobile) displayClass += " hidden sm:block"; 
             if (isHiddenSm) displayClass += " sm:hidden lg:block";
             if (isHiddenMobile && isHiddenSm) displayClass = "hidden lg:block"; // Ensure clean rules
             
             return (
               <div 
                 key={date}
                 title={`${date}: ${level} task(s)`}
                 className={`w-full aspect-square rounded-md border ${colorClass} ${displayClass} transition-colors duration-300`}
               />
             );
           })}
         </div>
      </div>
    </Card>
  );
};

export default ContributionGrid;
