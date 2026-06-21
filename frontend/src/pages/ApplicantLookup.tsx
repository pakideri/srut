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
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<CandidateHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.getApplicants().then(setApplicants); }, []);

  const filtered = applicants.filter(a => {
    const q = query.toLowerCase();
    return !q || `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.candidate_id.toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q);
  });

  const lookup = async (candidateId: string) => {
    if (!candidateId) return;
    setSelectedId(candidateId);
    setLoading(true);
    api.getCandidateHistory(candidateId)
      .then(d => setData(d as CandidateHistory))
      .finally(() => setLoading(false));
  };

  const hired = data?.history.filter(h => h.status === 'Hired').length ?? 0;
  const avgScore = data?.history.filter(h => h.score).reduce((sum, h, _, arr) =>
    sum + (h.score ?? 0) / arr.length, 0) ?? 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Applicant Lookup</h2>
        <p className="text-sm text-gray-500 mt-1">360-degree view of a candidate's application history</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, ID, or email…"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {query && (
        <div className="card p-0 max-w-sm">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No candidates found.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.slice(0, 8).map(a => (
                <li key={a.candidate_id}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                    onClick={() => { lookup(a.candidate_id); setQuery(''); }}
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

      {loading && <div className="text-gray-400 text-sm">Loading…</div>}

      {data && !loading && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {data.applicant.first_name} {data.applicant.last_name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{data.applicant.candidate_id}</p>
              </div>
              <div className="flex gap-2">
                {data.applicant.linkedin_url && (
                  <a href={data.applicant.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1 text-xs">
                    <ExternalLink size={12} /> LinkedIn
                  </a>
                )}
                {data.applicant.resume_url && (
                  <a href={data.applicant.resume_url} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1 text-xs">
                    <ExternalLink size={12} /> Resume
                  </a>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm">{data.applicant.email ?? '—'}</p>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{data.history.length}</p>
              <p className="text-sm text-gray-500 mt-1">Total Applications</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-emerald-600">{hired}</p>
              <p className="text-sm text-gray-500 mt-1">Offers Accepted</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {data.history.some(h => h.score) ? avgScore.toFixed(1) : '—'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Avg Score</p>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Application History</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Job Title', 'Department', 'Stage', 'Date', 'Interviewer', 'Score', 'Status', 'Feedback'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.history.length === 0 && (
                  <tr><td colSpan={8} className="table-td text-center text-gray-400 py-6">No application history.</td></tr>
                )}
                {data.history.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{h.job_title ?? '—'}</td>
                    <td className="table-td text-gray-500 text-xs">{h.department ?? '—'}</td>
                    <td className="table-td">
                      {h.current_stage
                        ? <span className="badge bg-indigo-100 text-indigo-700">{h.current_stage}</span>
                        : '—'}
                    </td>
                    <td className="table-td text-gray-500 text-xs">{h.stage_date ?? '—'}</td>
                    <td className="table-td text-gray-500">{h.interviewer ?? '—'}</td>
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
      )}
    </div>
  );
}
