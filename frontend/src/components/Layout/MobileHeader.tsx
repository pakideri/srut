import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/setup': 'Setup',
  '/jobs': 'Job Openings',
  '/applicants': 'Applicant Database',
  '/assessments': 'Assessment Tracker',
  '/pipeline': 'Hiring Pipeline',
  '/job-explorer': 'Job Explorer',
  '/applicant-lookup': 'Applicant Lookup',
};

export default function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation();
  return (
    <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-blue-100 text-blue-900 border-b border-blue-200 sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-lg hover:bg-blue-200 transition-colors text-blue-700"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div>
        <p className="font-bold text-sm leading-tight text-blue-900">HR Tracker</p>
        <p className="text-xs text-blue-500 leading-tight">{TITLES[pathname] ?? 'Hiring Intelligence'}</p>
      </div>
    </header>
  );
}
