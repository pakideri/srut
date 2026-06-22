import { NavLink, useNavigate } from 'react-router-dom';
import {
  X, LayoutDashboard, Settings, Briefcase, Users, ClipboardList,
  Search, UserSearch, KanbanSquare, CalendarClock, LogOut,
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/setup', icon: Settings, label: 'Setup' },
  { to: '/jobs', icon: Briefcase, label: 'Job Openings' },
  { to: '/applicants', icon: Users, label: 'Applicant Database' },
  { to: '/assessments', icon: ClipboardList, label: 'Assessment Tracker' },
  { to: '/pipeline', icon: KanbanSquare, label: 'Hiring Pipeline' },
  { to: '/job-explorer', icon: Search, label: 'Job Explorer' },
  { to: '/applicant-lookup', icon: UserSearch, label: 'Applicant Lookup' },
  { to: '/planner', icon: CalendarClock, label: 'Daily Planner' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('hr_auth');
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen lg:h-screen
        w-64 lg:w-56 flex-shrink-0
        bg-blue-100 text-gray-800 flex flex-col
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-blue-200">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-blue-900">HR Tracker</h1>
          <p className="text-xs text-blue-500 mt-0.5">Hiring Intelligence</p>
        </div>
        <button
          className="lg:hidden p-1.5 rounded-lg hover:bg-blue-200 transition-colors text-blue-700"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-blue-800 hover:bg-blue-200 hover:text-blue-900'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-blue-200 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
        <p className="text-xs text-blue-400 text-center pb-1">© 2024 HR Tracker</p>
      </div>
    </aside>
  );
}
