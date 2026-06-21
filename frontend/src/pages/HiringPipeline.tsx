import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Assessment, HiringStage } from '../types';

function statusColor(status: string) {
  const map: Record<string, string> = {
    Active: 'border-blue-300 bg-blue-50',
    Hired: 'border-emerald-300 bg-emerald-50',
    Rejected: 'border-red-300 bg-red-50',
    Withdrawn: 'border-gray-300 bg-gray-50',
  };
  return map[status] ?? 'border-gray-300 bg-gray-50';
}

function CandidateCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className={`rounded-lg border p-3 text-sm ${statusColor(assessment.status)}`}>
      <p className="font-medium text-gray-800">{assessment.first_name} {assessment.last_name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{assessment.job_title ?? '—'}</p>
      {assessment.score && (
        <div className="flex gap-0.5 mt-1.5">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`w-2.5 h-2.5 rounded-full ${assessment.score! >= n ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      )}
      <span className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded bg-white/70 text-gray-600">
        {assessment.status}
      </span>
    </div>
  );
}

export default function HiringPipeline() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stages, setStages] = useState<HiringStage[]>([]);

  useEffect(() => {
    api.getAssessments().then(setAssessments);
    api.getDropdown('hiring_stages').then(d => setStages(d as HiringStage[]));
  }, []);

  const byStage = (stageName: string) =>
    assessments.filter(a => a.current_stage === stageName);

  const unassigned = assessments.filter(a => !a.current_stage);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hiring Pipeline</h2>
        <p className="text-sm text-gray-500 mt-1">Kanban view — {assessments.length} candidates across {stages.length} stages</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stages.map(stage => {
            const cards = byStage(stage.name);
            return (
              <div key={stage.id} className="w-56 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stage.name}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{cards.length}</span>
                </div>
                <div className="bg-gray-100 rounded-xl p-2 space-y-2 min-h-32">
                  {cards.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">Empty</div>
                  )}
                  {cards.map(a => <CandidateCard key={a.id} assessment={a} />)}
                </div>
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div className="w-56 flex-shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase">Unassigned</h3>
                <span className="text-xs bg-gray-200 text-gray-500 rounded-full px-2 py-0.5">{unassigned.length}</span>
              </div>
              <div className="bg-gray-100 rounded-xl p-2 space-y-2 min-h-32">
                {unassigned.map(a => <CandidateCard key={a.id} assessment={a} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Stage Summary</h3>
        <div className="grid grid-cols-4 gap-3">
          {stages.map(s => {
            const count = byStage(s.name).length;
            return (
              <div key={s.id} className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500">{s.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
