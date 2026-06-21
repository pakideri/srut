import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Applicant, DropdownItem } from '../types';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';

function genCandidateId() {
  return 'CND-' + Date.now().toString(36).toUpperCase();
}

interface FormProps {
  initial?: Partial<Applicant>;
  sources: DropdownItem[];
  onSave: (data: Partial<Applicant>) => void;
  onCancel: () => void;
}

function ApplicantForm({ initial, sources, onSave, onCancel }: FormProps) {
  const [form, setForm] = useState<Partial<Applicant>>(
    initial ?? { candidate_id: genCandidateId() }
  );
  const set = (k: keyof Applicant, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 className="font-semibold text-lg mb-4">{initial?.id ? 'Edit Applicant' : 'New Applicant'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Candidate ID</label>
            <input className="input bg-gray-50 text-sm" value={form.candidate_id ?? ''} readOnly />
          </div>
          <div>
            <label className="label">Source</label>
            <select className="select" value={form.source ?? ''} onChange={e => set('source', e.target.value)}>
              <option value="">— Select —</option>
              {sources.map(s => <option key={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">First Name *</label>
            <input className="input" value={form.first_name ?? ''} onChange={e => set('first_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" value={form.last_name ?? ''} onChange={e => set('last_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <input className="input" value={form.linkedin_url ?? ''} onChange={e => set('linkedin_url', e.target.value)} />
          </div>
          <div>
            <label className="label">Resume URL</label>
            <input className="input" value={form.resume_url ?? ''} onChange={e => set('resume_url', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button className="btn-primary"
            onClick={() => form.first_name && form.last_name && onSave(form)}>
            Save
          </button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantDatabase() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [sources, setSources] = useState<DropdownItem[]>([]);
  const [editing, setEditing] = useState<Partial<Applicant> | null>(null);
  const [filter, setFilter] = useState('');

  const load = () => api.getApplicants().then(setApplicants);
  useEffect(() => {
    load();
    api.getDropdown('applicant_sources').then(d => setSources(d as DropdownItem[]));
  }, []);

  const handleSave = async (data: Partial<Applicant>) => {
    if (data.id) await api.updateApplicant(data.candidate_id!, data);
    else await api.createApplicant(data);
    setEditing(null);
    load();
  };

  const handleDelete = async (candidateId: string) => {
    if (!confirm('Delete this applicant?')) return;
    await api.deleteApplicant(candidateId);
    load();
  };

  const filtered = applicants.filter(a => {
    const q = filter.toLowerCase();
    return !q || `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.candidate_id.toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Applicant Database</h2>
          <p className="text-sm text-gray-500 mt-0.5">{applicants.length} candidates</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setEditing({})}>
          <Plus size={16} /><span className="hidden sm:inline">New Applicant</span><span className="sm:hidden">New</span>
        </button>
      </div>

      <input className="input w-full sm:max-w-sm" placeholder="Search by name, ID, or email…"
        value={filter} onChange={e => setFilter(e.target.value)} />

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No applicants found.</p>
        )}
        {filtered.map(a => (
          <div key={a.id} className="mobile-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{a.first_name} {a.last_name}</p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{a.candidate_id}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button className="btn-icon" onClick={() => setEditing(a)}><Pencil size={14} className="text-blue-500" /></button>
                <button className="btn-icon" onClick={() => handleDelete(a.candidate_id)}><Trash2 size={14} className="text-red-400" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {a.email && <span>{a.email}</span>}
              {a.phone && <span>{a.phone}</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {a.source && <span className="badge bg-blue-100 text-blue-700">{a.source}</span>}
              {a.linkedin_url && (
                <a href={a.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-500 flex items-center gap-0.5">
                  <ExternalLink size={11} /> LinkedIn
                </a>
              )}
              {a.resume_url && (
                <a href={a.resume_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-500 flex items-center gap-0.5">
                  <ExternalLink size={11} /> Resume
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet table */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Name', 'Email', 'Phone', 'Source', 'LinkedIn', 'Resume', ''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No applicants found.</td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-xs text-gray-500 whitespace-nowrap">{a.candidate_id}</td>
                  <td className="table-td font-medium whitespace-nowrap">{a.first_name} {a.last_name}</td>
                  <td className="table-td text-gray-500">{a.email ?? '—'}</td>
                  <td className="table-td text-gray-500 whitespace-nowrap">{a.phone ?? '—'}</td>
                  <td className="table-td">
                    {a.source ? <span className="badge bg-blue-100 text-blue-700">{a.source}</span> : '—'}
                  </td>
                  <td className="table-td">
                    {a.linkedin_url
                      ? <a href={a.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1"><ExternalLink size={13} /> Profile</a>
                      : '—'}
                  </td>
                  <td className="table-td">
                    {a.resume_url
                      ? <a href={a.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1"><ExternalLink size={13} /> Resume</a>
                      : '—'}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-500 hover:text-blue-700" onClick={() => setEditing(a)}><Pencil size={14} /></button>
                      <button className="text-red-400 hover:text-red-600" onClick={() => handleDelete(a.candidate_id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <ApplicantForm initial={editing} sources={sources} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
