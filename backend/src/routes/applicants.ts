import { Router } from 'express';
import { run, all, get } from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  res.json(all('SELECT * FROM applicants ORDER BY created_at DESC'));
});

router.get('/:candidateId', (req, res) => {
  const applicant = get('SELECT * FROM applicants WHERE candidate_id=?', [req.params.candidateId]);
  if (!applicant) return res.status(404).json({ error: 'Not found' });
  res.json(applicant);
});

router.post('/', (req, res) => {
  const { candidate_id, first_name, last_name, email, phone, linkedin_url, resume_url, source, notes } = req.body;
  try {
    const r = run(
      `INSERT INTO applicants (candidate_id, first_name, last_name, email, phone, linkedin_url, resume_url, source, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [candidate_id, first_name, last_name, email ?? null, phone ?? null,
       linkedin_url ?? null, resume_url ?? null, source ?? null, notes ?? null]
    );
    res.json({ id: r.lastInsertRowid });
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.put('/:candidateId', (req, res) => {
  const { first_name, last_name, email, phone, linkedin_url, resume_url, source, notes } = req.body;
  run(
    `UPDATE applicants SET first_name=?, last_name=?, email=?, phone=?, linkedin_url=?, resume_url=?, source=?, notes=?
     WHERE candidate_id=?`,
    [first_name, last_name, email ?? null, phone ?? null,
     linkedin_url ?? null, resume_url ?? null, source ?? null, notes ?? null, req.params.candidateId]
  );
  res.json({ ok: true });
});

router.delete('/:candidateId', (req, res) => {
  run('DELETE FROM applicants WHERE candidate_id=?', [req.params.candidateId]);
  res.json({ ok: true });
});

export default router;
