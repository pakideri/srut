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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg">{initial?.id ? 'Edit Applicant' : 'New Applicant'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Candidate ID</label>
            <input className="input bg-gray-50" value={form.candidate_id ?? ''} readOnly />
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
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applicant Database</h2>
          <p className="text-sm text-gray-500 mt-1">{applicants.length} candidates</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setEditing({})}>
          <Plus size={16} /> New Applicant
        </button>
      </div>

      <input className="input max-w-sm" placeholder="Search by name, ID, or email…"
        value={filter} onChange={e => setFilter(e.target.value)} />

      <div className="card p-0 overflow-hidden">
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
                <td className="table-td font-mono text-xs text-gray-500">{a.candidate_id}</td>
                <td className="table-td font-medium">{a.first_name} {a.last_name}</td>
                <td className="table-td text-gray-500">{a.email ?? '—'}</td>
                <td className="table-td text-gray-500">{a.phone ?? '—'}</td>
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

      {editing !== null && (
        <ApplicantForm initial={editing} sources={sources} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
