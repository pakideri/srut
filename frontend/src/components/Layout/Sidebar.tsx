import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Briefcase, Users, ClipboardList,
  Search, UserSearch, KanbanSquare,
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
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-5 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">SRUT ATS</h1>
        <p className="text-xs text-gray-400 mt-0.5">Hiring Intelligence</p>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700 text-xs text-gray-500">
        © 2024 SRUT
      </div>
    </aside>
  );
}
