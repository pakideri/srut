import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import type { Reminder, TeamMember } from '../types';
import { Plus, Pencil, Trash2, Calendar, Clock, Bell, CheckCircle2, Circle, X, User } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTime(t?: string) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ─── continuous audio ────────────────────────────────────────────────────────

/**
 * Starts a looping beep pattern. Returns a stop() function.
 * Interview → three ascending beeps every 3 s.
 * Other     → single soft beep every 3 s.
 */
function startContinuousAlert(kind?: string): () => void {
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  let ctx: any = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  const playOnce = () => {
    if (stopped) return;
    try {
      if (!ctx || ctx.state === 'closed') ctx = new AudioCtx();

      if (kind === 'interview') {
        [0, 0.32, 0.64].forEach((delay, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 660 + i * 110;
          o.connect(g);
          g.connect(ctx.destination);
          const t = ctx.currentTime + delay;
          o.start(t);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.55, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          o.stop(t + 0.32);
        });
      } else {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 440;
        o.connect(g);
        g.connect(ctx.destination);
        const now = ctx.currentTime;
        o.start(now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.45, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
        o.stop(now + 1);
      }
    } catch {
      // Audio unavailable — fail silently
    }
  };

  playOnce();
  intervalId = setInterval(playOnce, 3000);

  return () => {
    stopped = true;
    if (intervalId !== null) clearInterval(intervalId);
    try { ctx?.close(); } catch {}
  };
}

// ─── alert popup ─────────────────────────────────────────────────────────────

interface AlertPopupProps {
  reminder: Reminder;
  queueLength: number;   // total pending including this one
  onDismiss: () => void;
}

function AlertPopup({ reminder, queueLength, onDismiss }: AlertPopupProps) {
  const isInterview = reminder.reminder_type === 'interview';
  const time = formatTime(reminder.reminder_time);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`rounded-2xl shadow-2xl max-w-sm w-full border-2 overflow-hidden ${
          isInterview ? 'bg-indigo-50 border-indigo-400' : 'bg-amber-50 border-amber-400'
        }`}
      >
        {/* pulsing colour bar at the top */}
        <div className={`h-1.5 animate-pulse ${isInterview ? 'bg-indigo-500' : 'bg-amber-500'}`} />

        <div className="p-6">
          {/* icon + label */}
          <div className="text-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce ${
              isInterview ? 'bg-indigo-100' : 'bg-amber-100'
            }`}>
              {isInterview
                ? <User size={30} className="text-indigo-600" />
                : <Bell size={30} className="text-amber-600" />}
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${
              isInterview ? 'text-indigo-500' : 'text-amber-500'
            }`}>
              {isInterview ? '🎙 Interview in 5 minutes' : '⏰ Reminder in 5 minutes'}
            </p>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">{reminder.title}</h2>
          </div>

          {/* interview details */}
          {isInterview && (reminder.candidate_name || reminder.job_role || reminder.interviewer) && (
            <div className="bg-white rounded-xl px-4 py-3 mb-4 border border-indigo-100 space-y-2">
              {reminder.candidate_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Candidate</span>
                  <span className="font-semibold text-gray-800">{reminder.candidate_name}</span>
                </div>
              )}
              {reminder.job_role && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Role</span>
                  <span className="font-medium text-gray-800">{reminder.job_role}</span>
                </div>
              )}
              {reminder.interviewer && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Interviewer</span>
                  <span className="font-medium text-gray-800">{reminder.interviewer}</span>
                </div>
              )}
            </div>
          )}

          {/* date / time */}
          <div className="flex justify-center gap-4 text-xs text-gray-500 mb-5">
            <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(reminder.reminder_date)}</span>
            {time && <span className="flex items-center gap-1"><Clock size={12} />{time}</span>}
          </div>

          {/* dismiss */}
          <button
            onClick={onDismiss}
            className={`w-full py-3 rounded-xl font-semibold text-white text-sm transition-all active:scale-95 ${
              isInterview
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            Dismiss{queueLength > 1 ? ` (${queueLength - 1} more)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── card style ───────────────────────────────────────────────────────────────

function cardStyle(r: Reminder): { border: string; badge: string; label: string } {
  const today = todayStr();
  if (r.is_done) return { border: 'border-gray-200 bg-gray-50', badge: 'bg-gray-100 text-gray-500', label: 'Done' };
  if (r.reminder_date < today) return { border: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-600', label: 'Overdue' };
  if (r.reminder_date === today) return { border: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Today' };
  const diff = Math.ceil((new Date(r.reminder_date).getTime() - Date.now()) / 86400000);
  if (diff <= 3) return { border: 'border-amber-300 bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: `In ${diff}d` };
  return { border: 'border-emerald-200 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', label: 'Upcoming' };
}

// ─── reminder form ────────────────────────────────────────────────────────────

interface FormProps {
  initial?: Partial<Reminder>;
  onSave: (data: Partial<Reminder>) => void;
  onCancel: () => void;
}

function ReminderForm({ initial, onSave, onCancel }: FormProps) {
  const [form, setForm] = useState<Partial<Reminder>>(
    { reminder_date: todayStr(), is_done: 0, reminder_type: 'other', ...initial }
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const set = (k: keyof Reminder, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.getDropdown('team_members').then(d => setTeamMembers(d as TeamMember[])).catch(() => {});
  }, []);

  const isInterview = form.reminder_type === 'interview';

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{initial?.id ? 'Edit Reminder' : 'New Reminder'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.reminder_type ?? 'other'} onChange={e => set('reminder_type', e.target.value)}>
              <option value="other">General</option>
              <option value="interview">Interview</option>
            </select>
          </div>

          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              placeholder={isInterview ? 'e.g. Interview with John Doe' : 'e.g. Team standup, Review resumes…'}
              value={form.title ?? ''}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {isInterview && (
            <>
              <div>
                <label className="label">Candidate Name *</label>
                <input
                  className="input"
                  placeholder="Full name of the candidate"
                  value={form.candidate_name ?? ''}
                  onChange={e => set('candidate_name', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Job Role *</label>
                  <input
                    className="input"
                    placeholder="e.g. Frontend Engineer"
                    value={form.job_role ?? ''}
                    onChange={e => set('job_role', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Interviewer</label>
                  {teamMembers.length > 0 ? (
                    <select className="input" value={form.interviewer ?? ''} onChange={e => set('interviewer', e.target.value)}>
                      <option value="">— Select interviewer —</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>
                          {m.name}{m.member_role ? ` (${m.member_role})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      placeholder="Interviewer name"
                      value={form.interviewer ?? ''}
                      onChange={e => set('interviewer', e.target.value)}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.reminder_date ?? todayStr()}
                onChange={e => set('reminder_date', e.target.value)} />
            </div>
            <div>
              <label className="label">
                Time
                {isInterview && <span className="text-blue-500 text-xs ml-1">(alert 5 min before)</span>}
              </label>
              <input className="input" type="time" value={form.reminder_time ?? ''}
                onChange={e => set('reminder_time', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Notes / Description</label>
            <textarea
              className="input resize-none" rows={3}
              placeholder={isInterview ? 'Interview details, round, topics to cover…' : 'What is this reminder about?'}
              value={form.reason ?? ''}
              onChange={e => set('reason', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            className="btn-primary"
            onClick={() => {
              const valid = form.title && form.reminder_date &&
                (!isInterview || (form.candidate_name && form.job_role));
              if (valid) onSave(form);
            }}
          >
            Save
          </button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── reminder card ────────────────────────────────────────────────────────────

interface CardProps {
  reminder: Reminder;
  onEdit: (r: Reminder) => void;
  onDelete: (id: number) => void;
  onToggleDone: (r: Reminder) => void;
}

function ReminderCard({ reminder, onEdit, onDelete, onToggleDone }: CardProps) {
  const style = cardStyle(reminder);
  const time = formatTime(reminder.reminder_time);
  const isInterview = reminder.reminder_type === 'interview';

  return (
    <div className={`rounded-xl border-2 ${style.border} p-4 sm:p-5 transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => onToggleDone(reminder)}
            className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
            aria-label={reminder.is_done ? 'Mark undone' : 'Mark done'}
          >
            {reminder.is_done
              ? <CheckCircle2 size={22} className="text-gray-400" />
              : <Circle size={22} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isInterview && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                  <User size={10} /> Interview
                </span>
              )}
              <h3 className={`font-semibold text-base leading-tight ${reminder.is_done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {reminder.title}
              </h3>
              <span className={`badge ${style.badge} text-xs`}>{style.label}</span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="flex-shrink-0" />
                {formatDate(reminder.reminder_date)}
              </span>
              {time && (
                <span className="flex items-center gap-1">
                  <Clock size={12} className="flex-shrink-0" />
                  {time}
                </span>
              )}
            </div>

            {isInterview && (reminder.candidate_name || reminder.job_role || reminder.interviewer) && (
              <div className="text-sm text-gray-700 mb-2 bg-indigo-50 rounded-lg px-3 py-2 space-y-0.5">
                {reminder.candidate_name && (
                  <div>
                    <span className="text-gray-400 text-xs">Candidate</span>
                    <br /><strong>{reminder.candidate_name}</strong>
                  </div>
                )}
                {reminder.job_role && (
                  <div>
                    <span className="text-gray-400 text-xs">Role</span>
                    <br />{reminder.job_role}
                  </div>
                )}
                {reminder.interviewer && (
                  <div>
                    <span className="text-gray-400 text-xs">Interviewer</span>
                    <br />{reminder.interviewer}
                  </div>
                )}
              </div>
            )}

            {reminder.reason && (
              <div className="flex items-start gap-1.5 mt-2">
                <Bell size={12} className="flex-shrink-0 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600 leading-relaxed">{reminder.reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(reminder)}
            className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" aria-label="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(reminder.id)}
            className="p-1.5 text-red-400 hover:bg-red-100 rounded-lg transition-colors" aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'today' | 'upcoming' | 'overdue' | 'done';

export default function DailyPlanner() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [editing, setEditing] = useState<Partial<Reminder> | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  // Alert queue: each fired reminder is pushed here; dismissed one-by-one
  const [alertQueue, setAlertQueue] = useState<Reminder[]>([]);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firedRef = useRef<Set<number>>(new Set());

  const load = () => api.getReminders().then(setReminders).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  // When the alert queue changes, manage audio
  useEffect(() => {
    if (alertQueue.length > 0) {
      // Stop previous audio then start fresh for the new front item
      stopAudioRef.current?.();
      stopAudioRef.current = startContinuousAlert(alertQueue[0].reminder_type);
    } else {
      stopAudioRef.current?.();
      stopAudioRef.current = null;
    }
    return () => { stopAudioRef.current?.(); };
  }, [alertQueue]);

  // Schedule 5-minute-before alerts for reminders when logged in
  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (localStorage.getItem('hr_auth') !== 'true') return;

    reminders.forEach(r => {
      if (r.is_done || !r.reminder_time) return;
      const dt = new Date(`${r.reminder_date}T${r.reminder_time}`);
      const notifyAt = dt.getTime() - 5 * 60 * 1000;
      const now = Date.now();

      const fire = () => {
        if (firedRef.current.has(r.id)) return;
        firedRef.current.add(r.id);
        setAlertQueue(q => [...q, r]);
      };

      if (notifyAt <= now && dt.getTime() > now) {
        setTimeout(fire, 100);
      } else if (notifyAt > now) {
        timersRef.current.push(setTimeout(fire, notifyAt - now));
      }
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [reminders]);

  const dismissAlert = () => {
    setAlertQueue(q => q.slice(1));
  };

  const handleSave = async (data: Partial<Reminder>) => {
    if (data.id) await api.updateReminder(data.id, data);
    else await api.createReminder(data);
    setEditing(null);
    firedRef.current.clear();
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this reminder?')) return;
    await api.deleteReminder(id);
    load();
  };

  const handleToggleDone = async (r: Reminder) => {
    await api.updateReminder(r.id, { ...r, is_done: r.is_done ? 0 : 1 });
    load();
  };

  const today = todayStr();
  const filtered = reminders.filter(r => {
    if (filter === 'today') return r.reminder_date === today && !r.is_done;
    if (filter === 'upcoming') return r.reminder_date > today && !r.is_done;
    if (filter === 'overdue') return r.reminder_date < today && !r.is_done;
    if (filter === 'done') return !!r.is_done;
    return true;
  });

  const counts = {
    all: reminders.length,
    today: reminders.filter(r => r.reminder_date === today && !r.is_done).length,
    upcoming: reminders.filter(r => r.reminder_date > today && !r.is_done).length,
    overdue: reminders.filter(r => r.reminder_date < today && !r.is_done).length,
    done: reminders.filter(r => !!r.is_done).length,
  };

  const FILTERS: { key: Filter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { key: 'today', label: 'Today', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { key: 'upcoming', label: 'Upcoming', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { key: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { key: 'done', label: 'Done', color: 'bg-gray-100 text-gray-500 hover:bg-gray-200' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Alert popup — rendered above everything */}
      {alertQueue.length > 0 && (
        <AlertPopup
          reminder={alertQueue[0]}
          queueLength={alertQueue.length}
          onDismiss={dismissAlert}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Daily Planner</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.today > 0
              ? `${counts.today} reminder${counts.today > 1 ? 's' : ''} for today`
              : 'Plan your day and set reminders'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex items-center gap-1.5" onClick={() => setEditing({ reminder_type: 'interview' })}>
            <User size={15} /><span className="hidden sm:inline">Interview</span>
          </button>
          <button className="btn-secondary flex items-center gap-1.5" onClick={() => setEditing({ reminder_type: 'other' })}>
            <Plus size={16} /><span className="hidden sm:inline">Reminder</span><span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key ? f.color + ' ring-2 ring-offset-1 ring-current' : f.color
            }`}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span className="ml-1.5 bg-white/60 px-1.5 py-0.5 rounded-full">{counts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Loading reminders…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No reminders here</p>
          <p className="text-gray-300 text-xs mt-1">Click "Interview" or "Reminder" to add one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(r => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onEdit={setEditing}
              onDelete={handleDelete}
              onToggleDone={handleToggleDone}
            />
          ))}
        </div>
      )}

      {/* Edit / create form */}
      {editing !== null && (
        <ReminderForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
