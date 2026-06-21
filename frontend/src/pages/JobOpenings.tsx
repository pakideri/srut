import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Job, DropdownItem, TeamMember } from '../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const STATUS_OPTS = ['Open', 'In Progress', 'On Hold', 'Filled', 'Cancelled'];

function timeToHireBadge(targetDate?: string) {
  if (!targetDate) return null;
  const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return <span className="badge bg-red-100 text-red-700">Overdue</span>;
  if (diff <= 14) return <span className="badge bg-amber-100 text-amber-700">At Risk</span>;
  return <span className="badge bg-emerald-100 text-emerald-700">On Track</span>;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    'Open': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-indigo-100 text-indigo-700',
    'On Hold': 'bg-gray-100 text-gray-600',
    'Filled': 'bg-emerald-100 text-emerald-700',
    'Cancelled': 'bg-red-100 text-red-600',
  };
  return <span className={`badge ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

interface JobFormProps {
  initial?: Partial<Job>;
  depts: DropdownItem[];
  locs: DropdownItem[];
  roles: DropdownItem[];
  members: TeamMember[];
  onSave: (data: Partial<Job>) => void;
  onCancel: () => void;
}

function JobForm({ initial, depts, locs, roles, members, onSave, onCancel }: JobFormProps) {
  const [form, setForm] = useState<Partial<Job>>(initial ?? { status: 'Open', currency: 'USD' });
  const set = (k: keyof Job, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 className="font-semibold text-lg mb-4">{initial?.id ? 'Edit Job' : 'New Job Opening'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Job Title *</label>
            <input className="input" value={form.title ?? ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label">Department</label>
            <select className="select" value={form.department ?? ''} onChange={e => set('department', e.target.value)}>
              <option value="">— Select —</option>
              {depts.map(d => <option key={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select className="select" value={form.location ?? ''} onChange={e => set('location', e.target.value)}>
              <option value="">— Select —</option>
              {locs.map(l => <option key={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Job Type</label>
            <select className="select" value={form.job_type ?? ''} onChange={e => set('job_type', e.target.value)}>
              <option value="">— Select —</option>
              {roles.map(r => <option key={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status ?? 'Open'} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Manager</label>
            <select className="select" value={form.manager ?? ''} onChange={e => set('manager', e.target.value)}>
              <option value="">— Select —</option>
              {members.map(m => <option key={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Recruiter</label>
            <select className="select" value={form.recruiter ?? ''} onChange={e => set('recruiter', e.target.value)}>
              <option value="">— Select —</option>
              {members.map(m => <option key={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Budget</label>
            <input className="input" type="number" value={form.budget ?? ''} onChange={e => set('budget', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="label">Target Hire Date</label>
            <input className="input" type="date" value={form.target_hire_date ?? ''} onChange={e => set('target_hire_date', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button className="btn-primary" onClick={() => onSave(form)}>Save</button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function JobOpenings() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [depts, setDepts] = useState<DropdownItem[]>([]);
  const [locs, setLocs] = useState<DropdownItem[]>([]);
  const [roles, setRoles] = useState<DropdownItem[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<Partial<Job> | null>(null);
  const [filter, setFilter] = useState('');

  const load = () => api.getJobs().then(setJobs);

  useEffect(() => {
    load();
    api.getDropdown('departments').then(d => setDepts(d as DropdownItem[]));
    api.getDropdown('locations').then(d => setLocs(d as DropdownItem[]));
    api.getDropdown('role_types').then(d => setRoles(d as DropdownItem[]));
    api.getDropdown('team_members').then(d => setMembers(d as TeamMember[]));
  }, []);

  const handleSave = async (data: Partial<Job>) => {
    if (!data.title) return;
    if (data.id) await api.updateJob(data.id, data);
    else await api.createJob(data);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this job?')) return;
    await api.deleteJob(id);
    load();
  };

  const filtered = jobs.filter(j =>
    !filter || j.title.toLowerCase().includes(filter.toLowerCase()) ||
    (j.department ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    j.status.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Job Openings</h2>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} total roles</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setEditing({})}>
          <Plus size={16} /><span className="hidden sm:inline">New Job</span><span className="sm:hidden">New</span>
        </button>
      </div>

      <input className="input w-full sm:max-w-sm" placeholder="Filter by title, department, status…"
        value={filter} onChange={e => setFilter(e.target.value)} />

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No jobs found.</p>
        )}
        {filtered.map(job => (
          <div key={job.id} className="mobile-card">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-gray-900 leading-tight">{job.title}</p>
              <div className="flex gap-1.5 flex-shrink-0">
                <button className="btn-icon" onClick={() => setEditing(job)}><Pencil size={14} className="text-blue-500" /></button>
                <button className="btn-icon" onClick={() => handleDelete(job.id)}><Trash2 size={14} className="text-red-400" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {job.department && <span>{job.department}</span>}
              {job.location && <span>{job.location}</span>}
              {job.job_type && <span>{job.job_type}</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {statusBadge(job.status)}
              {timeToHireBadge(job.target_hire_date)}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
              {job.recruiter && <span>Recruiter: {job.recruiter}</span>}
              {job.target_hire_date && <span>Target: {job.target_hire_date}</span>}
              {job.budget && <span>Budget: {job.currency ?? 'USD'} {job.budget.toLocaleString()}</span>}
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
                {['Title', 'Department', 'Location', 'Type', 'Recruiter', 'Budget', 'Target Date', 'Status', 'Time to Hire', ''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="table-td text-center text-gray-400 py-8">No jobs found.</td></tr>
              )}
              {filtered.map(job => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium whitespace-nowrap">{job.title}</td>
                  <td className="table-td text-gray-500">{job.department ?? '—'}</td>
                  <td className="table-td text-gray-500">{job.location ?? '—'}</td>
                  <td className="table-td text-gray-500">{job.job_type ?? '—'}</td>
                  <td className="table-td">{job.recruiter ?? '—'}</td>
                  <td className="table-td whitespace-nowrap">
                    {job.budget ? `${job.currency ?? 'USD'} ${job.budget.toLocaleString()}` : '—'}
                  </td>
                  <td className="table-td whitespace-nowrap">{job.target_hire_date ?? '—'}</td>
                  <td className="table-td">{statusBadge(job.status)}</td>
                  <td className="table-td">{timeToHireBadge(job.target_hire_date)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-500 hover:text-blue-700" onClick={() => setEditing(job)}><Pencil size={14} /></button>
                      <button className="text-red-400 hover:text-red-600" onClick={() => handleDelete(job.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <JobForm
          initial={editing} depts={depts} locs={locs} roles={roles} members={members}
          onSave={handleSave} onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
