import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import MobileHeader from './components/Layout/MobileHeader';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import JobOpenings from './pages/JobOpenings';
import ApplicantDatabase from './pages/ApplicantDatabase';
import AssessmentTracker from './pages/AssessmentTracker';
import HiringPipeline from './pages/HiringPipeline';
import JobExplorer from './pages/JobExplorer';
import ApplicantLookup from './pages/ApplicantLookup';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/jobs" element={<JobOpenings />} />
              <Route path="/applicants" element={<ApplicantDatabase />} />
              <Route path="/assessments" element={<AssessmentTracker />} />
              <Route path="/pipeline" element={<HiringPipeline />} />
              <Route path="/job-explorer" element={<JobExplorer />} />
              <Route path="/applicant-lookup" element={<ApplicantLookup />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
