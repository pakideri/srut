import { Router } from 'express';
import { all, get } from '../db/database';

const router = Router();

router.get('/dashboard', (_req, res) => {
  const totalJobs = (get<{ c: number }>("SELECT COUNT(*) as c FROM jobs WHERE status NOT IN ('Filled','Cancelled')") ?? { c: 0 }).c;
  const totalCandidates = (get<{ c: number }>('SELECT COUNT(*) as c FROM applicants') ?? { c: 0 }).c;
  const activeCandidates = (get<{ c: number }>("SELECT COUNT(*) as c FROM assessments WHERE status='Active'") ?? { c: 0 }).c;
  const hired = (get<{ c: number }>("SELECT COUNT(*) as c FROM assessments WHERE status='Hired'") ?? { c: 0 }).c;
  const total = (get<{ c: number }>('SELECT COUNT(*) as c FROM assessments') ?? { c: 0 }).c;
  const hiringRate = total > 0 ? Math.round((hired / total) * 100) : 0;

  const avgRow = get<{ avg_days: number | null }>(
    "SELECT AVG(julianday(updated_at) - julianday(created_at)) as avg_days FROM assessments WHERE status='Hired'"
  );
  const avgFill = avgRow?.avg_days ?? null;

  const byStage = all<{ stage: string; count: number }>(`
    SELECT current_stage as stage, COUNT(*) as count
    FROM assessments WHERE status='Active' AND current_stage IS NOT NULL
    GROUP BY current_stage ORDER BY count DESC
  `);

  const byDept = all<{ department: string; count: number }>(`
    SELECT j.department, COUNT(a.id) as count
    FROM assessments a JOIN jobs j ON j.id=a.job_id
    WHERE a.status='Active' AND j.department IS NOT NULL GROUP BY j.department
  `);

  const bySource = all<{ source: string; count: number }>(`
    SELECT ap.source, COUNT(a.id) as count
    FROM assessments a JOIN applicants ap ON ap.candidate_id=a.candidate_id
    WHERE ap.source IS NOT NULL GROUP BY ap.source ORDER BY count DESC
  `);

  const recruiterPerf = all<{ recruiter: string; total: number; hired: number }>(`
    SELECT j.recruiter, COUNT(a.id) as total,
           SUM(CASE WHEN a.status='Hired' THEN 1 ELSE 0 END) as hired
    FROM assessments a JOIN jobs j ON j.id=a.job_id
    WHERE j.recruiter IS NOT NULL
    GROUP BY j.recruiter ORDER BY total DESC
  `);

  res.json({
    totalJobs, totalCandidates, activeCandidates, hired, hiringRate,
    avgDaysToFill: avgFill ? Math.round(avgFill) : null,
    byStage, byDept, bySource, recruiterPerf,
  });
});

router.get('/job/:id', (req, res) => {
  const job = get('SELECT * FROM jobs WHERE id=?', [req.params.id]);
  if (!job) return res.status(404).json({ error: 'Not found' });

  const funnel = all<{ stage: string; count: number }>(`
    SELECT current_stage as stage, COUNT(*) as count
    FROM assessments WHERE job_id=? AND current_stage IS NOT NULL
    GROUP BY current_stage ORDER BY count DESC
  `, [req.params.id]);

  const sources = all<{ source: string; count: number }>(`
    SELECT ap.source, COUNT(*) as count
    FROM assessments a JOIN applicants ap ON ap.candidate_id=a.candidate_id
    WHERE a.job_id=? AND ap.source IS NOT NULL GROUP BY ap.source
  `, [req.params.id]);

  const outcomes = all<{ status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM assessments WHERE job_id=? GROUP BY status',
    [req.params.id]
  );

  const avgRow = get<{ avg: number | null }>(
    'SELECT AVG(score) as avg FROM assessments WHERE job_id=? AND score IS NOT NULL',
    [req.params.id]
  );

  res.json({ job, funnel, sources, outcomes, avgScore: avgRow?.avg ? Math.round(avgRow.avg * 10) / 10 : null });
});

router.get('/candidate/:candidateId', (req, res) => {
  const applicant = get('SELECT * FROM applicants WHERE candidate_id=?', [req.params.candidateId]);
  if (!applicant) return res.status(404).json({ error: 'Not found' });

  const history = all(`
    SELECT a.*, j.title as job_title, j.department, j.status as job_status
    FROM assessments a JOIN jobs j ON j.id=a.job_id
    WHERE a.candidate_id=? ORDER BY a.updated_at DESC
  `, [req.params.candidateId]);

  res.json({ applicant, history });
});

export default router;
