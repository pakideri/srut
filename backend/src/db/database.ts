// Uses Node.js built-in SQLite (available since Node 22.5+, stable in Node 23.4+)
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

// In production on Render, DB_PATH env var points to the persistent disk (/data/ats.db).
// In dev, falls back to a local data/ directory.
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../data/ats.db');
const DB_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

export function initDb() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS role_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      member_role TEXT,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS hiring_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS applicant_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      job_type TEXT,
      manager TEXT,
      recruiter TEXT,
      budget REAL,
      currency TEXT DEFAULT 'USD',
      target_hire_date TEXT,
      status TEXT DEFAULT 'Open',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applicants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      linkedin_url TEXT,
      resume_url TEXT,
      source TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT NOT NULL,
      job_id INTEGER NOT NULL,
      current_stage TEXT,
      stage_date TEXT,
      interviewer TEXT,
      feedback TEXT,
      score INTEGER,
      status TEXT DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      reminder_date TEXT NOT NULL,
      reminder_time TEXT,
      reason TEXT,
      is_done INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Ensure newer reminder columns exist (safe to run on existing DB)
  try {
    const cols = db.prepare("PRAGMA table_info(reminders)").all() as { name: string }[];
    const names = cols.map(c => c.name);
    if (!names.includes('candidate_name')) db.exec("ALTER TABLE reminders ADD COLUMN candidate_name TEXT;");
    if (!names.includes('job_role')) db.exec("ALTER TABLE reminders ADD COLUMN job_role TEXT;");
    if (!names.includes('interviewer')) db.exec("ALTER TABLE reminders ADD COLUMN interviewer TEXT;");
    if (!names.includes('reminder_type')) db.exec("ALTER TABLE reminders ADD COLUMN reminder_type TEXT DEFAULT 'other';");
  } catch (err) {
    // non-fatal; older SQLite or permission issues should not block server startup
    console.warn('Could not ensure reminder columns:', err);
  }

  seedDefaults();
}

function run(sql: string, params: (string | number | null)[] = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

function get<T>(sql: string, params: (string | number | null)[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

function all<T>(sql: string, params: (string | number | null)[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

function seedDefaults() {
  const settingsCount = (get<{ c: number }>('SELECT COUNT(*) as c FROM settings') ?? { c: 0 }).c;
  if (settingsCount === 0) {
    for (const [k, v] of [
      ['business_name', 'My Company'],
      ['currency', 'USD'],
      ['language', 'en'],
      ['timezone', 'America/New_York'],
    ] as [string, string][]) {
      run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [k, v]);
    }
  }

  const deptCount = (get<{ c: number }>('SELECT COUNT(*) as c FROM departments') ?? { c: 0 }).c;
  if (deptCount === 0) {
    for (const name of ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']) {
      run('INSERT OR IGNORE INTO departments (name, is_system) VALUES (?, 1)', [name]);
    }
  }

  const locCount = (get<{ c: number }>('SELECT COUNT(*) as c FROM locations') ?? { c: 0 }).c;
  if (locCount === 0) {
    for (const name of ['Remote', 'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Chicago, IL']) {
      run('INSERT OR IGNORE INTO locations (name, is_system) VALUES (?, 1)', [name]);
    }
  }

  const roleCount = (get<{ c: number }>('SELECT COUNT(*) as c FROM role_types') ?? { c: 0 }).c;
  if (roleCount === 0) {
    for (const name of ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Freelance']) {
      run('INSERT OR IGNORE INTO role_types (name, is_system) VALUES (?, 1)', [name]);
    }
  }

  const stageCount = (get<{ c: number }>('SELECT COUNT(*) as c FROM hiring_stages') ?? { c: 0 }).c;
  if (stageCount === 0) {
    const stages = ['Screening', 'First Interview', 'Second Interview', 'Technical Assessment', 'Reference Check', 'Offer', 'Hired'];
    stages.forEach((name, i) =>
      run('INSERT INTO hiring_stages (name, order_index, is_system) VALUES (?, ?, 1)', [name, i + 1])
    );
  }

  const srcCount = (get<{ c: number }>('SELECT COUNT(*) as c FROM applicant_sources') ?? { c: 0 }).c;
  if (srcCount === 0) {
    for (const name of ['LinkedIn', 'Indeed', 'Referral', 'Company Website', 'Glassdoor', 'Job Fair', 'Other']) {
      run('INSERT OR IGNORE INTO applicant_sources (name, is_system) VALUES (?, 1)', [name]);
    }
  }
}

export { db, run, get, all };
export default { run, get, all, exec: (sql: string) => db.exec(sql) };
