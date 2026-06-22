import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Reminder } from '../types';
import { Plus, Pencil, Trash2, Calendar, Clock, Bell, CheckCircle2, Circle, X } from 'lucide-react';

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
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function cardStyle(r: Reminder): { border: string; badge: string; label: string } {
  const today = todayStr();
  if (r.is_done) return { border: 'border-gray-200 bg-gray-50', badge: 'bg-gray-100 text-gray-500', label: 'Done' };
  if (r.reminder_date < today) return { border: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-600', label: 'Overdue' };
  if (r.reminder_date === today) return { border: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Today' };
  const diff = Math.ceil((new Date(r.reminder_date).getTime() - Date.now()) / 86400000);
  if (diff <= 3) return { border: 'border-amber-300 bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: `In ${diff}d` };
  return { border: 'border-emerald-200 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', label: 'Upcoming' };
}

interface FormProps {
  initial?: Partial<Reminder>;
  onSave: (data: Partial<Reminder>) => void;
  onCancel: () => void;
}

function ReminderForm({ initial, onSave, onCancel }: FormProps) {
  const [form, setForm] = useState<Partial<Reminder>>(
    initial ?? { reminder_date: todayStr(), is_done: 0 }
  );
  const set = (k: keyof Reminder, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{initial?.id ? 'Edit Reminder' : 'New Reminder'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="e.g. Team standup, Review resumes…"
              value={form.title ?? ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.reminder_date ?? todayStr()}
                onChange={e => set('reminder_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Time</label>
              <input className="input" type="time" value={form.reminder_time ?? ''}
                onChange={e => set('reminder_time', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Reason / Description</label>
            <textarea className="input resize-none" rows={3}
              placeholder="What is this reminder about?"
              value={form.reason ?? ''} onChange={e => set('reason', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button className="btn-primary" onClick={() => form.title && form.reminder_date && onSave(form)}>
            Save
          </button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  reminder: Reminder;
  onEdit: (r: Reminder) => void;
  onDelete: (id: number) => void;
  onToggleDone: (r: Reminder) => void;
}

function ReminderCard({ reminder, onEdit, onDelete, onToggleDone }: CardProps) {
  const style = cardStyle(reminder);
  const time = formatTime(reminder.reminder_time);

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

type Filter = 'all' | 'today' | 'upcoming' | 'overdue' | 'done';

export default function DailyPlanner() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [editing, setEditing] = useState<Partial<Reminder> | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  const load = () => api.getReminders().then(setReminders).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async (data: Partial<Reminder>) => {
    if (data.id) await api.updateReminder(data.id, data);
    else await api.createReminder(data);
    setEditing(null);
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
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setEditing({})}>
          <Plus size={16} /><span className="hidden sm:inline">New Reminder</span><span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? f.color + ' ring-2 ring-offset-1 ring-current'
                : f.color
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
          <p className="text-gray-300 text-xs mt-1">Click "New Reminder" to add one</p>
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
