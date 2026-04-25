import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Lightbulb, Briefcase, GraduationCap, Menu, X, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const navItems = [
  { path: '/dashboard',    icon: Home,           label: 'Home' },
  { path: '/mentor',       icon: MessageCircle,  label: 'Mentor' },
  { path: '/skills',       icon: Lightbulb,      label: 'Skills & Journey' },
  { path: '/opportunities',icon: Briefcase,      label: 'Opportunities' },
];

const clgInfoItem = { path: '/colleges', icon: GraduationCap, label: 'Clg Info' };

const Navigation = () => {
  const { logout, userProfile } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const is12th = userProfile?.student_type === '12th Passout';
  const allNavItems = is12th ? [...navItems, clgInfoItem] : navItems;

  return (
    <>
      {/* ── Mobile Header Toggle (Only visible on small screens when we need a toggle) ── */}
      <div className="lg:hidden fixed top-0 right-0 z-[100] p-4 pointer-events-none">
         {/* Could add a mobile hamburger menu here if we wanted TopBar to be managed globally, 
             but we will keep the BottomNav pattern for mobile as requested. */}
      </div>

      {/* ── Sidebar (Desktop) / Bottom Nav (Mobile) ── */}
      <nav className={`
        fixed z-[100] bg-white/95 backdrop-blur-xl border-gray-100 flex
        /* Mobile layout (bottom nav) */
        bottom-0 left-0 w-full flex-row justify-around items-center px-2 py-3 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.02)]
        /* Desktop layout (sidebar) */
        lg:top-0 lg:left-0 lg:h-screen lg:w-64 lg:flex-col lg:justify-start lg:items-stretch lg:px-4 lg:py-8 lg:border-r lg:border-t-0
      `}>
        {/* Desktop Logo Area */}
        <div className="hidden lg:flex items-center gap-3 px-4 mb-10">
          <img src="/logo.jpeg" alt="Kairo" className="w-10 h-10 rounded-xl" onError={(e) => e.target.src='https://ui-avatars.com/api/?name=K&background=C8A951&color=fff'} />
          <span className="font-bold text-xl tracking-tight text-gray-900">KAIRO</span>
        </div>

        <div className="flex w-full lg:flex-col flex-row justify-around lg:justify-start gap-1 lg:gap-2">
          {allNavItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `
                flex items-center gap-1.5 lg:gap-3 transition-colors rounded-xl
                /* Mobile item */
                flex-col px-3 py-1 text-[11px] font-medium
                /* Desktop item */
                lg:flex-row lg:px-4 lg:py-3 lg:text-[15px]
                ${isActive 
                  ? 'text-[#C8A951] lg:bg-[#C8A951]/10' 
                  : 'text-gray-500 hover:text-gray-900 lg:hover:bg-gray-50'}
              `}
            >
              {( { isActive } ) => (
                <>
                  <Icon size={22} className={isActive ? 'stroke-[#C8A951]' : 'stroke-current'} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Desktop Footer Area (Logout) */}
        <div className="hidden lg:block mt-auto pt-8">
            <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
                <LogOut size={18} />
                Logout KAIRO
            </button>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
