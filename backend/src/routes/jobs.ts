import { Router } from 'express';
import { run, all, get } from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  res.json(all('SELECT * FROM jobs ORDER BY created_at DESC'));
});

router.get('/:id', (req, res) => {
  const job = get('SELECT * FROM jobs WHERE id=?', [req.params.id]);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

router.post('/', (req, res) => {
  const { title, department, location, job_type, manager, recruiter, budget, currency, target_hire_date, status } = req.body;
  const r = run(
    `INSERT INTO jobs (title, department, location, job_type, manager, recruiter, budget, currency, target_hire_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, department ?? null, location ?? null, job_type ?? null, manager ?? null, recruiter ?? null,
     budget ?? null, currency ?? 'USD', target_hire_date ?? null, status ?? 'Open']
  );
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { title, department, location, job_type, manager, recruiter, budget, currency, target_hire_date, status } = req.body;
  run(
    `UPDATE jobs SET title=?, department=?, location=?, job_type=?, manager=?, recruiter=?, budget=?, currency=?,
     target_hire_date=?, status=? WHERE id=?`,
    [title, department ?? null, location ?? null, job_type ?? null, manager ?? null, recruiter ?? null,
     budget ?? null, currency ?? 'USD', target_hire_date ?? null, status ?? 'Open', req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM jobs WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
