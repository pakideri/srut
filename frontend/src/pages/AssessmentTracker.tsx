import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Assessment, Job, Applicant, HiringStage, TeamMember } from '../types';
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';

const STATUS_OPTS = ['Active', 'Hired', 'Rejected', 'Withdrawn'];

function deriveNextAction(stage: string, status: string) {
  if (status === 'Hired') return 'Begin Onboarding';
  if (status === 'Rejected') return 'Send Rejection Notice';
  if (status === 'Withdrawn') return 'Archive Application';
  const map: Record<string, string> = {
    'Screening': 'Schedule First Interview',
    'First Interview': 'Collect Feedback & Score',
    'Second Interview': 'Send Technical Assessment',
    'Technical Assessment': 'Review Results & Reference Check',
    'Reference Check': 'Prepare Offer Letter',
    'Offer': 'Await Candidate Decision',
    'Hired': 'Begin Onboarding',
  };
  return map[stage] ?? 'Update Stage';
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

function ScoreDots({ score }: { score?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className={`w-2.5 h-2.5 rounded-full ${(score ?? 0) >= n ? 'bg-blue-500' : 'bg-gray-200'}`} />
      ))}
    </div>
  );
}

interface FormProps {
  initial?: Partial<Assessment>;
  jobs: Job[];
  applicants: Applicant[];
  stages: HiringStage[];
  members: TeamMember[];
  onSave: (data: Partial<Assessment>) => void;
  onCancel: () => void;
}

function AssessmentForm({ initial, jobs, applicants, stages, members, onSave, onCancel }: FormProps) {
  const [form, setForm] = useState<Partial<Assessment>>(initial ?? { status: 'Active' });
  const set = (k: keyof Assessment, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 className="font-semibold text-lg mb-4">{initial?.id ? 'Edit Assessment' : 'Log Assessment'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Candidate</label>
            <select className="select" value={form.candidate_id ?? ''} onChange={e => set('candidate_id', e.target.value)}>
              <option value="">— Select —</option>
              {applicants.map(a => (
                <option key={a.candidate_id} value={a.candidate_id}>
                  {a.first_name} {a.last_name} ({a.candidate_id})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Job Opening</label>
            <select className="select" value={form.job_id ?? ''} onChange={e => set('job_id', parseInt(e.target.value))}>
              <option value="">— Select —</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Current Stage</label>
            <select className="select" value={form.current_stage ?? ''} onChange={e => set('current_stage', e.target.value)}>
              <option value="">— Select —</option>
              {stages.map(s => <option key={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Stage Date</label>
            <input className="input" type="date" value={form.stage_date ?? ''} onChange={e => set('stage_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Interviewer</label>
            <select className="select" value={form.interviewer ?? ''} onChange={e => set('interviewer', e.target.value)}>
              <option value="">— Select —</option>
              {members.map(m => <option key={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Score (1–5)</label>
            <input className="input" type="number" min={1} max={5} value={form.score ?? ''}
              onChange={e => set('score', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status ?? 'Active'} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Feedback / Notes</label>
            <textarea className="input resize-none" rows={3} value={form.feedback ?? ''}
              onChange={e => set('feedback', e.target.value)} />
          </div>
        </div>
        {form.current_stage && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg text-sm text-amber-800 mt-3">
            <Zap size={14} className="flex-shrink-0" />
            <span>Next action: <strong>{deriveNextAction(form.current_stage, form.status ?? 'Active')}</strong></span>
          </div>
        )}
        <div className="flex gap-2 pt-4">
          <button className="btn-primary"
            onClick={() => form.candidate_id && form.job_id && onSave(form)}>
            Save
          </button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentTracker() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stages, setStages] = useState<HiringStage[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<Partial<Assessment> | null>(null);
  const [filter, setFilter] = useState('');

  const load = () => api.getAssessments().then(setAssessments);
  useEffect(() => {
    load();
    api.getJobs().then(setJobs);
    api.getApplicants().then(setApplicants);
    api.getDropdown('hiring_stages').then(d => setStages(d as HiringStage[]));
    api.getDropdown('team_members').then(d => setMembers(d as TeamMember[]));
  }, []);

  const handleSave = async (data: Partial<Assessment>) => {
    if (data.id) await api.updateAssessment(data.id, data);
    else await api.createAssessment(data);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this assessment?')) return;
    await api.deleteAssessment(id);
    load();
  };

  const filtered = assessments.filter(a => {
    const q = filter.toLowerCase();
    return !q ||
      `${a.first_name ?? ''} ${a.last_name ?? ''}`.toLowerCase().includes(q) ||
      (a.job_title ?? '').toLowerCase().includes(q) ||
      (a.current_stage ?? '').toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Assessment Tracker</h2>
          <p className="text-sm text-gray-500 mt-0.5">{assessments.length} assessments logged</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setEditing({})}>
          <Plus size={16} /><span className="hidden sm:inline">Log Assessment</span><span className="sm:hidden">Log</span>
        </button>
      </div>

      <input className="input w-full sm:max-w-sm" placeholder="Filter by candidate, job, stage…"
        value={filter} onChange={e => setFilter(e.target.value)} />

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No assessments found.</p>
        )}
        {filtered.map(a => (
          <div key={a.id} className="mobile-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{a.first_name} {a.last_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.job_title ?? '—'}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button className="btn-icon" onClick={() => setEditing(a)}><Pencil size={14} className="text-blue-500" /></button>
                <button className="btn-icon" onClick={() => handleDelete(a.id)}><Trash2 size={14} className="text-red-400" /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {a.current_stage && <span className="badge bg-indigo-100 text-indigo-700">{a.current_stage}</span>}
              {statusBadge(a.status)}
            </div>
            <div className="flex items-center gap-3">
              <ScoreDots score={a.score} />
              {a.stage_date && <span className="text-xs text-gray-400">{a.stage_date}</span>}
            </div>
            {a.current_stage && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg">
                <Zap size={11} className="flex-shrink-0" />
                {deriveNextAction(a.current_stage, a.status)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop/tablet table */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Candidate', 'Job', 'Stage', 'Date', 'Interviewer', 'Score', 'Status', 'Next Action', ''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">No assessments found.</td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium whitespace-nowrap">{a.first_name} {a.last_name}</td>
                  <td className="table-td text-gray-500 text-xs max-w-[140px] truncate">{a.job_title ?? '—'}</td>
                  <td className="table-td">
                    {a.current_stage
                      ? <span className="badge bg-indigo-100 text-indigo-700">{a.current_stage}</span>
                      : '—'}
                  </td>
                  <td className="table-td text-gray-500 text-xs whitespace-nowrap">{a.stage_date ?? '—'}</td>
                  <td className="table-td text-gray-500 whitespace-nowrap">{a.interviewer ?? '—'}</td>
                  <td className="table-td"><ScoreDots score={a.score} /></td>
                  <td className="table-td">{statusBadge(a.status)}</td>
                  <td className="table-td">
                    {a.current_stage && (
                      <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded whitespace-nowrap">
                        <Zap size={11} />
                        {deriveNextAction(a.current_stage, a.status)}
                      </span>
                    )}
                  </td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700" onClick={() => setEditing(a)}><Pencil size={14} /></button>
                      <button className="text-red-400 hover:text-red-600" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <AssessmentForm
          initial={editing} jobs={jobs} applicants={applicants}
          stages={stages} members={members}
          onSave={handleSave} onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
