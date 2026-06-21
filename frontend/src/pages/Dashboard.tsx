import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '../api/client';
import type { DashboardData } from '../types';
import { Briefcase, Users, TrendingUp, Clock, UserCheck } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="card flex items-start gap-3">
      <div className={`p-2.5 sm:p-3 rounded-xl ${color} flex-shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading dashboard…</div>;
  if (!data) return <div className="p-6 text-red-500">Failed to load dashboard.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Hiring command center</p>
      </div>

      {/* KPI grid: 2 cols on mobile, 3 on sm, 5 on xl */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard icon={Briefcase} label="Open Jobs" value={data.totalJobs} color="bg-blue-500" />
        <KpiCard icon={Users} label="Candidates" value={data.totalCandidates} sub={`${data.activeCandidates} active`} color="bg-indigo-500" />
        <KpiCard icon={UserCheck} label="Hired" value={data.hired} color="bg-emerald-500" />
        <KpiCard icon={TrendingUp} label="Hire Rate" value={`${data.hiringRate}%`} color="bg-violet-500" />
        <KpiCard
          icon={Clock}
          label="Avg. Fill Time"
          value={data.avgDaysToFill !== null ? `${data.avgDaysToFill}d` : 'N/A'}
          color="bg-amber-500"
        />
      </div>

      {/* Charts grid: 1 col on mobile, 2 on xl */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">Candidates by Stage</h3>
          {data.byStage.length === 0 ? (
            <p className="text-sm text-gray-400">No active assessments yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byStage} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">Candidates by Source</h3>
          {data.bySource.length === 0 ? (
            <p className="text-sm text-gray-400">No source data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.bySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70}>
                  {data.bySource.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">Candidates by Department</h3>
          {data.byDept.length === 0 ? (
            <p className="text-sm text-gray-400">No department data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byDept} layout="vertical" margin={{ top: 0, right: 0, left: 60, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">Recruiter Performance</h3>
          {data.recruiterPerf.length === 0 ? (
            <p className="text-sm text-gray-400">No recruiter data yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-th pl-4 sm:pl-0">Recruiter</th>
                    <th className="table-th">Total</th>
                    <th className="table-th">Hired</th>
                    <th className="table-th pr-4 sm:pr-0">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recruiterPerf.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="table-td pl-4 sm:pl-0 font-medium">{r.recruiter}</td>
                      <td className="table-td">{r.total}</td>
                      <td className="table-td">{r.hired}</td>
                      <td className="table-td pr-4 sm:pr-0">{r.total > 0 ? `${Math.round((r.hired / r.total) * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
