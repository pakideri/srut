import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Assessment, HiringStage, Job, Applicant, TeamMember } from '../types';
import { Pencil, Trash2, Zap, Plus } from 'lucide-react';

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
  };
  return map[stage] ?? 'Update Stage';
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    Active: 'border-blue-200 bg-blue-50',
    Hired: 'border-emerald-200 bg-emerald-50',
    Rejected: 'border-red-200 bg-red-50',
    Withdrawn: 'border-gray-200 bg-gray-50',
  };
  return map[status] ?? 'border-gray-200 bg-gray-50';
}

interface EditFormProps {
  initial: Assessment;
  jobs: Job[];
  applicants: Applicant[];
  stages: HiringStage[];
  members: TeamMember[];
  onSave: (data: Partial<Assessment>) => void;
  onCancel: () => void;
}

function EditForm({ initial, jobs, applicants, stages, members, onSave, onCancel }: EditFormProps) {
  const [form, setForm] = useState<Partial<Assessment>>(initial);
  const set = (k: keyof Assessment, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 className="font-semibold text-lg mb-4">Edit Assessment</h3>
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
          <button className="btn-primary" onClick={() => onSave(form)}>Save</button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  assessment: Assessment;
  onEdit: (a: Assessment) => void;
  onDelete: (id: number) => void;
}

function CandidateCard({ assessment, onEdit, onDelete }: CardProps) {
  return (
    <div className={`rounded-lg border p-3 text-sm ${statusColor(assessment.status)} group`}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="font-medium text-gray-800 truncate flex-1 leading-tight">
          {assessment.first_name} {assessment.last_name}
        </p>
        <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(assessment)}
            className="p-1 text-blue-500 hover:bg-white/60 rounded transition-colors"
            aria-label="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(assessment.id)}
            className="p-1 text-red-400 hover:bg-white/60 rounded transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 truncate">{assessment.job_title ?? '—'}</p>
      {assessment.score != null && (
        <div className="flex gap-0.5 mt-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className={`w-2 h-2 rounded-full ${assessment.score! >= n ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      )}
      {/* Always-visible edit/delete on touch devices */}
      <div className="flex gap-1 mt-2 sm:hidden">
        <button onClick={() => onEdit(assessment)}
          className="flex items-center gap-1 text-xs text-blue-600 bg-white/70 px-2 py-1 rounded">
          <Pencil size={11} /> Edit
        </button>
        <button onClick={() => onDelete(assessment.id)}
          className="flex items-center gap-1 text-xs text-red-500 bg-white/70 px-2 py-1 rounded">
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  );
}

export default function HiringPipeline() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stages, setStages] = useState<HiringStage[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<Assessment | null>(null);

  const load = () => api.getAssessments().then(setAssessments);

  useEffect(() => {
    load();
    api.getDropdown('hiring_stages').then(d => setStages(d as HiringStage[]));
    api.getJobs().then(setJobs);
    api.getApplicants().then(setApplicants);
    api.getDropdown('team_members').then(d => setMembers(d as TeamMember[]));
  }, []);

  const handleSave = async (data: Partial<Assessment>) => {
    if (editing?.id) await api.updateAssessment(editing.id, data);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this candidate from the pipeline?')) return;
    await api.deleteAssessment(id);
    load();
  };

  const byStage = (stageName: string) => assessments.filter(a => a.current_stage === stageName);
  const unassigned = assessments.filter(a => !a.current_stage);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Hiring Pipeline</h2>
        <p className="text-sm text-gray-500 mt-1">
          {assessments.length} candidates · {stages.length} stages
          <span className="ml-2 text-xs text-gray-400 hidden sm:inline">Hover a card to edit or delete</span>
        </p>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
        <div className="flex gap-3 sm:gap-4 px-4 sm:px-6 lg:px-0 pb-4 min-w-max">
          {stages.map(stage => {
            const cards = byStage(stage.name);
            return (
              <div key={stage.id} className="w-44 sm:w-52 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                    {stage.name}
                  </h3>
                  <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 ml-1 flex-shrink-0">
                    {cards.length}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-xl p-2 space-y-2 min-h-[6rem]">
                  {cards.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">Empty</div>
                  )}
                  {cards.map(a => (
                    <CandidateCard
                      key={a.id}
                      assessment={a}
                      onEdit={setEditing}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div className="w-44 sm:w-52 flex-shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase">Unassigned</h3>
                <span className="text-xs bg-gray-200 text-gray-500 rounded-full px-2 py-0.5 ml-1">{unassigned.length}</span>
              </div>
              <div className="bg-gray-100 rounded-xl p-2 space-y-2 min-h-[6rem]">
                {unassigned.map(a => (
                  <CandidateCard key={a.id} assessment={a} onEdit={setEditing} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage summary grid */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Stage Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {stages.map(s => {
            const count = byStage(s.name).length;
            return (
              <div key={s.id} className="px-3 py-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500 truncate">{s.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <EditForm
          initial={editing}
          jobs={jobs}
          applicants={applicants}
          stages={stages}
          members={members}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
