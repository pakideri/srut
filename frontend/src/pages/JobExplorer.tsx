import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Job } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface JobAnalytics {
  job: Job;
  funnel: { stage: string; count: number }[];
  sources: { source: string; count: number }[];
  outcomes: { status: string; count: number }[];
  avgScore: number | null;
}

function timeToHireIndicator(targetDate?: string) {
  if (!targetDate) return null;
  const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'bg-red-100 text-red-700' };
  if (diff <= 14) return { label: `${diff}d left`, cls: 'bg-amber-100 text-amber-700' };
  return { label: `${diff}d to go`, cls: 'bg-emerald-100 text-emerald-700' };
}

export default function JobExplorer() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [data, setData] = useState<JobAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.getJobs().then(setJobs); }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api.getJobAnalytics(selectedId)
      .then(d => setData(d as JobAnalytics))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const ind = data ? timeToHireIndicator(data.job.target_hire_date) : null;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Job Explorer</h2>
        <p className="text-sm text-gray-500 mt-1">Analyze funnel, sources, and metrics for a specific role</p>
      </div>

      <div>
        <label className="label">Select Job Opening</label>
        <select className="select max-w-sm" value={selectedId ?? ''} onChange={e => setSelectedId(parseInt(e.target.value))}>
          <option value="">— Choose a role —</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.department ?? 'N/A'}</option>)}
        </select>
      </div>

      {loading && <div className="text-gray-400 text-sm">Loading…</div>}

      {data && !loading && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{data.job.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {[data.job.department, data.job.location, data.job.job_type].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="text-right space-y-1">
                <span className="badge bg-blue-100 text-blue-700 text-sm">{data.job.status}</span>
                {ind && <div><span className={`badge ${ind.cls}`}>{ind.label}</span></div>}
                {data.avgScore !== null && (
                  <p className="text-xs text-gray-500">Avg score: <strong>{data.avgScore}/5</strong></p>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Manager</p>
                <p className="text-sm font-medium">{data.job.manager ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Recruiter</p>
                <p className="text-sm font-medium">{data.job.recruiter ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Budget</p>
                <p className="text-sm font-medium">
                  {data.job.budget ? `${data.job.currency ?? 'USD'} ${data.job.budget.toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Hiring Funnel</h3>
              {data.funnel.length === 0 ? (
                <p className="text-sm text-gray-400">No candidates in pipeline.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.funnel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Candidates by Source</h3>
              {data.sources.length === 0 ? (
                <p className="text-sm text-gray-400">No source data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.sources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70} label>
                      {data.sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Outcomes</h3>
              {data.outcomes.length === 0 ? (
                <p className="text-sm text-gray-400">No outcome data.</p>
              ) : (
                <div className="space-y-2">
                  {data.outcomes.map(o => (
                    <div key={o.status} className="flex items-center gap-3">
                      <span className="text-sm w-24 text-gray-600">{o.status}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(o.count / data.outcomes.reduce((s, x) => s + x.count, 0)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{o.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
