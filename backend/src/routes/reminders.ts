import { Router } from 'express';
import { run, all, get } from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  res.json(all('SELECT * FROM reminders ORDER BY reminder_date ASC, reminder_time ASC'));
});

router.post('/', (req, res) => {
  const { title, reminder_date, reminder_time, reason } = req.body;
  const r = run(
    'INSERT INTO reminders (title, reminder_date, reminder_time, reason) VALUES (?, ?, ?, ?)',
    [title, reminder_date, reminder_time ?? null, reason ?? null]
  );
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { title, reminder_date, reminder_time, reason, is_done } = req.body;
  run(
    'UPDATE reminders SET title=?, reminder_date=?, reminder_time=?, reason=?, is_done=? WHERE id=?',
    [title, reminder_date, reminder_time ?? null, reason ?? null, is_done ?? 0, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM reminders WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
