import { Router } from 'express';
import { run, all, get } from '../db/database';

const router = Router();

function crudFor(table: string, orderBy = 'name') {
  router.get(`/${table}`, (_req, res) => {
    res.json(all(`SELECT * FROM ${table} ORDER BY ${orderBy}`));
  });

  router.post(`/${table}`, (req, res) => {
    const { name, email, member_role, order_index } = req.body;
    try {
      if (table === 'team_members') {
        const r = run('INSERT INTO team_members (name, email, member_role) VALUES (?, ?, ?)',
          [name, email ?? null, member_role ?? null]);
        res.json({ id: r.lastInsertRowid, name, email, member_role });
      } else if (table === 'hiring_stages') {
        const maxRow = get<{ m: number | null }>('SELECT MAX(order_index) as m FROM hiring_stages');
        const max = maxRow?.m ?? 0;
        const idx = order_index ?? max + 1;
        const r = run('INSERT INTO hiring_stages (name, order_index) VALUES (?, ?)', [name, idx]);
        res.json({ id: r.lastInsertRowid, name, order_index: idx });
      } else {
        const r = run(`INSERT INTO ${table} (name) VALUES (?)`, [name]);
        res.json({ id: r.lastInsertRowid, name });
      }
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.put(`/${table}/:id`, (req, res) => {
    const { name, email, member_role, order_index } = req.body;
    const { id } = req.params;
    try {
      if (table === 'team_members') {
        run('UPDATE team_members SET name=?, email=?, member_role=? WHERE id=? AND is_system=0',
          [name, email ?? null, member_role ?? null, id]);
      } else if (table === 'hiring_stages') {
        run('UPDATE hiring_stages SET name=?, order_index=? WHERE id=? AND is_system=0',
          [name, order_index, id]);
      } else {
        run(`UPDATE ${table} SET name=? WHERE id=? AND is_system=0`, [name, id]);
      }
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.delete(`/${table}/:id`, (req, res) => {
    run(`DELETE FROM ${table} WHERE id=? AND is_system=0`, [req.params.id]);
    res.json({ ok: true });
  });
}

crudFor('departments');
crudFor('locations');
crudFor('role_types');
crudFor('team_members', 'name');
crudFor('hiring_stages', 'order_index');
crudFor('applicant_sources');

export default router;
