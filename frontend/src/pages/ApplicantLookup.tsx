import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Applicant, Assessment } from '../types';
import { Search, ExternalLink } from 'lucide-react';

interface CandidateHistory {
  applicant: Applicant;
  history: Assessment[];
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Active: 'bg-blue-100 text-blue-700',
    Hired: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-600',
    Withdrawn: 'bg-gray-100 text-gray-500',
  };
  return <span className={`badge ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export default function ApplicantLookup() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<CandidateHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.getApplicants().then(setApplicants); }, []);

  const filtered = applicants.filter(a => {
    const q = query.toLowerCase();
    return q.length > 0 && (
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.candidate_id.toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q)
    );
  });

  const lookup = async (candidateId: string) => {
    setQuery('');
    setLoading(true);
    api.getCandidateHistory(candidateId)
      .then(d => setData(d as CandidateHistory))
      .finally(() => setLoading(false));
  };

  const hired = data?.history.filter(h => h.status === 'Hired').length ?? 0;
  const scores = data?.history.filter(h => h.score != null).map(h => h.score!) ?? [];
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Applicant Lookup</h2>
        <p className="text-sm text-gray-500 mt-1">360° view of a candidate's application history</p>
      </div>

      {/* Search box */}
      <div className="relative w-full sm:max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name, ID, or email…"
          value={query} onChange={e => setQuery(e.target.value)} />
        {/* Dropdown results */}
        {query.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">No candidates found.</p>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                {filtered.slice(0, 8).map(a => (
                  <li key={a.candidate_id}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                      onClick={() => lookup(a.candidate_id)}
                    >
                      <p className="text-sm font-medium">{a.first_name} {a.last_name}</p>
                      <p className="text-xs text-gray-400">{a.candidate_id} · {a.email ?? 'no email'}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {loading && <div className="text-gray-400 text-sm">Loading…</div>}

      {data && !loading && (
        <div className="space-y-5">
          {/* Candidate profile card */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {data.applicant.first_name} {data.applicant.last_name}
                </h3>
                <p className="text-sm font-mono text-gray-400 mt-0.5">{data.applicant.candidate_id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.applicant.linkedin_url && (
                  <a href={data.applicant.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1 text-xs py-1.5">
                    <ExternalLink size={12} /> LinkedIn
                  </a>
                )}
                {data.applicant.resume_url && (
                  <a href={data.applicant.resume_url} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1 text-xs py-1.5">
                    <ExternalLink size={12} /> Resume
                  </a>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm truncate">{data.applicant.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm">{data.applicant.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Source</p>
                <p className="text-sm">{data.applicant.source ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Applications</p>
                <p className="text-sm font-bold">{data.history.length}</p>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="card text-center p-4 sm:p-6">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{data.history.length}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Applications</p>
            </div>
            <div className="card text-center p-4 sm:p-6">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{hired}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Offers Accepted</p>
            </div>
            <div className="card text-center p-4 sm:p-6">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600">
                {avgScore !== null ? avgScore.toFixed(1) : '—'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Avg Score</p>
            </div>
          </div>

          {/* History — mobile cards */}
          <div className="md:hidden space-y-3">
            <h3 className="font-semibold text-gray-800">Application History</h3>
            {data.history.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No application history.</p>
            )}
            {data.history.map(h => (
              <div key={h.id} className="mobile-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{h.job_title ?? '—'}</p>
                  {statusBadge(h.status)}
                </div>
                {h.department && <p className="text-xs text-gray-500">{h.department}</p>}
                <div className="flex items-center gap-3">
                  {h.current_stage && <span className="badge bg-indigo-100 text-indigo-700">{h.current_stage}</span>}
                  {h.stage_date && <span className="text-xs text-gray-400">{h.stage_date}</span>}
                </div>
                {h.score != null && (
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-2.5 h-2.5 rounded-full ${h.score! >= n ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                )}
                {h.feedback && <p className="text-xs text-gray-500 line-clamp-2">{h.feedback}</p>}
              </div>
            ))}
          </div>

          {/* History — desktop table */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Application History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Job Title', 'Department', 'Stage', 'Date', 'Score', 'Status', 'Feedback'].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.history.length === 0 && (
                    <tr><td colSpan={7} className="table-td text-center text-gray-400 py-6">No application history.</td></tr>
                  )}
                  {data.history.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="table-td font-medium whitespace-nowrap">{h.job_title ?? '—'}</td>
                      <td className="table-td text-gray-500 text-xs">{h.department ?? '—'}</td>
                      <td className="table-td">
                        {h.current_stage
                          ? <span className="badge bg-indigo-100 text-indigo-700">{h.current_stage}</span>
                          : '—'}
                      </td>
                      <td className="table-td text-gray-500 text-xs whitespace-nowrap">{h.stage_date ?? '—'}</td>
                      <td className="table-td">
                        {h.score != null ? (
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <div key={n} className={`w-2.5 h-2.5 rounded-full ${h.score! >= n ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="table-td">{statusBadge(h.status)}</td>
                      <td className="table-td max-w-xs text-xs text-gray-500 truncate">{h.feedback ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
