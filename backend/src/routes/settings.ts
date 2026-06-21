import { Router } from 'express';
import { run, all } from '../db/database';

const router = Router();

router.get('/', (_req, res) => {
  const rows = all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

router.put('/', (req, res) => {
  const updates = req.body as Record<string, string>;
  for (const [k, v] of Object.entries(updates)) {
    run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, v]);
  }
  res.json({ ok: true });
});

export default router;
