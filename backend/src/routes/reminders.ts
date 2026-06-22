import { Router } from 'express';
import { run, all, get } from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  res.json(all('SELECT * FROM reminders ORDER BY reminder_date ASC, reminder_time ASC'));
});

router.post('/', (req, res) => {
  const { title, reminder_date, reminder_time, reason, candidate_name, job_role, interviewer, reminder_type } = req.body;
  const r = run(
    'INSERT INTO reminders (title, reminder_date, reminder_time, reason, candidate_name, job_role, interviewer, reminder_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, reminder_date, reminder_time ?? null, reason ?? null, candidate_name ?? null, job_role ?? null, interviewer ?? null, reminder_type ?? 'other']
  );
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { title, reminder_date, reminder_time, reason, is_done, candidate_name, job_role, interviewer, reminder_type } = req.body;
  run(
    'UPDATE reminders SET title=?, reminder_date=?, reminder_time=?, reason=?, is_done=?, candidate_name=?, job_role=?, interviewer=?, reminder_type=? WHERE id=?',
    [title, reminder_date, reminder_time ?? null, reason ?? null, is_done ?? 0, candidate_name ?? null, job_role ?? null, interviewer ?? null, reminder_type ?? 'other', req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM reminders WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
