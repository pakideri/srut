import { Router } from 'express';
import { run, all, get } from '../db/database';

const router = Router();

function deriveNextAction(stage: string, status: string): string {
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

router.get('/', (_req, res) => {
  const rows = all(`
    SELECT a.*, ap.first_name, ap.last_name, ap.email, j.title as job_title
    FROM assessments a
    LEFT JOIN applicants ap ON ap.candidate_id = a.candidate_id
    LEFT JOIN jobs j ON j.id = a.job_id
    ORDER BY a.updated_at DESC
  `);
  res.json(rows);
});

router.get('/job/:jobId', (req, res) => {
  const rows = all(`
    SELECT a.*, ap.first_name, ap.last_name, ap.email
    FROM assessments a
    LEFT JOIN applicants ap ON ap.candidate_id = a.candidate_id
    WHERE a.job_id=?
    ORDER BY a.updated_at DESC
  `, [req.params.jobId]);
  res.json(rows);
});

router.get('/candidate/:candidateId', (req, res) => {
  const rows = all(`
    SELECT a.*, j.title as job_title, j.department, j.status as job_status
    FROM assessments a
    LEFT JOIN jobs j ON j.id = a.job_id
    WHERE a.candidate_id=?
    ORDER BY a.updated_at DESC
  `, [req.params.candidateId]);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { candidate_id, job_id, current_stage, stage_date, interviewer, feedback, score, status } = req.body;
  const next_action = deriveNextAction(current_stage ?? '', status ?? 'Active');
  const r = run(
    `INSERT INTO assessments (candidate_id, job_id, current_stage, stage_date, interviewer, feedback, score, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [candidate_id, job_id, current_stage ?? null, stage_date ?? null,
     interviewer ?? null, feedback ?? null, score ?? null, status ?? 'Active']
  );
  res.json({ id: r.lastInsertRowid, next_action });
});

router.put('/:id', (req, res) => {
  const { current_stage, stage_date, interviewer, feedback, score, status } = req.body;
  const next_action = deriveNextAction(current_stage ?? '', status ?? 'Active');
  run(
    `UPDATE assessments SET current_stage=?, stage_date=?, interviewer=?, feedback=?, score=?, status=?,
     updated_at=datetime('now') WHERE id=?`,
    [current_stage ?? null, stage_date ?? null, interviewer ?? null,
     feedback ?? null, score ?? null, status ?? 'Active', req.params.id]
  );
  res.json({ ok: true, next_action });
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM assessments WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
