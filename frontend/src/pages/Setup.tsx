import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DropdownItem, TeamMember, HiringStage } from '../types';
import { Plus, Trash2, Lock, Pencil, Check, X } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function SimpleList({ endpoint, label }: { endpoint: string; label: string }) {
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const load = () => api.getDropdown(endpoint).then(d => setItems(d as DropdownItem[]));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newName.trim()) return;
    await api.addDropdown(endpoint, { name: newName.trim() });
    setNewName('');
    load();
  };

  const startEdit = (item: DropdownItem) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const saveEdit = async () => {
    if (!editValue.trim() || editingId === null) return;
    await api.updateDropdown(endpoint, editingId, { name: editValue.trim() });
    setEditingId(null);
    load();
  };

  const cancelEdit = () => setEditingId(null);

  const remove = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    await api.deleteDropdown(endpoint, id);
    load();
  };

  return (
    <Section title={label}>
      <div className="flex gap-2 mb-3">
        <input className="input flex-1" placeholder={`Add ${label.toLowerCase()}…`} value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <button className="btn-primary flex items-center gap-1" onClick={add}>
          <Plus size={15} /><span className="hidden sm:inline">Add</span>
        </button>
      </div>
      <ul className="space-y-1.5 max-h-56 overflow-y-auto">
        {items.map(item => (
          <li key={item.id}>
            {editingId === item.id ? (
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1 py-1.5 text-sm"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  autoFocus
                />
                <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check size={15} /></button>
                <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={15} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 group">
                <span className="text-sm truncate mr-2">{item.name}</span>
                {item.is_system ? (
                  <Lock size={13} className="text-gray-300 flex-shrink-0" aria-label="System value" />
                ) : (
                  <div className="flex gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(item)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(item.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function StageList() {
  const [stages, setStages] = useState<HiringStage[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const load = () => api.getDropdown('hiring_stages').then(d => setStages(d as HiringStage[]));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newName.trim()) return;
    await api.addDropdown('hiring_stages', { name: newName.trim() });
    setNewName('');
    load();
  };

  const startEdit = (s: HiringStage) => { setEditingId(s.id); setEditValue(s.name); };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editValue.trim() || editingId === null) return;
    const stage = stages.find(s => s.id === editingId);
    await api.updateDropdown('hiring_stages', editingId, { name: editValue.trim(), order_index: stage?.order_index });
    setEditingId(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this stage?')) return;
    await api.deleteDropdown('hiring_stages', id);
    load();
  };

  return (
    <Section title="Hiring Stages">
      <div className="flex gap-2 mb-3">
        <input className="input flex-1" placeholder="Add stage…" value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <button className="btn-primary flex items-center gap-1" onClick={add}>
          <Plus size={15} /><span className="hidden sm:inline">Add</span>
        </button>
      </div>
      <ul className="space-y-1.5 max-h-56 overflow-y-auto">
        {stages.map((s, i) => (
          <li key={s.id}>
            {editingId === s.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                <input
                  className="input flex-1 py-1.5 text-sm"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  autoFocus
                />
                <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check size={15} /></button>
                <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={15} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 group">
                <span className="text-xs text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                <span className="text-sm flex-1 truncate">{s.name}</span>
                {s.is_system ? (
                  <Lock size={13} className="text-gray-300 flex-shrink-0" />
                ) : (
                  <div className="flex gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(s)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(s.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function TeamMemberList() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState({ name: '', email: '', member_role: 'Recruiter' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', member_role: '' });

  const load = () => api.getDropdown('team_members').then(d => setMembers(d as TeamMember[]));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim()) return;
    await api.addDropdown('team_members', form);
    setForm({ name: '', email: '', member_role: 'Recruiter' });
    load();
  };

  const startEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setEditForm({ name: m.name, email: m.email ?? '', member_role: m.member_role ?? 'Recruiter' });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || editingId === null) return;
    await api.updateDropdown('team_members', editingId, editForm);
    setEditingId(null);
    load();
  };

  const cancelEdit = () => setEditingId(null);

  const remove = async (id: number) => {
    if (!confirm('Delete this team member?')) return;
    await api.deleteDropdown('team_members', id);
    load();
  };

  return (
    <Section title="Team Members / Stakeholders">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <input className="input" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="input" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <div className="flex gap-2">
          <select className="select flex-1" value={form.member_role} onChange={e => setForm(f => ({ ...f, member_role: e.target.value }))}>
            {['Manager', 'Recruiter', 'Interviewer', 'HR', 'Executive'].map(r => <option key={r}>{r}</option>)}
          </select>
          <button className="btn-primary flex-shrink-0" onClick={add}><Plus size={15} /></button>
        </div>
      </div>
      <ul className="space-y-1.5 max-h-64 overflow-y-auto">
        {members.map(m => (
          <li key={m.id}>
            {editingId === m.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <input className="input py-1.5 text-sm" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Escape' && cancelEdit()}
                  autoFocus />
                <input className="input py-1.5 text-sm" value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                <div className="flex gap-2">
                  <select className="select flex-1 py-1.5 text-sm" value={editForm.member_role}
                    onChange={e => setEditForm(f => ({ ...f, member_role: e.target.value }))}>
                    {['Manager', 'Recruiter', 'Interviewer', 'HR', 'Executive'].map(r => <option key={r}>{r}</option>)}
                  </select>
                  <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg flex-shrink-0"><Check size={15} /></button>
                  <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg flex-shrink-0"><X size={15} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 group">
                <span className="text-sm font-medium flex-1 truncate">{m.name}</span>
                <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[120px]">{m.email}</span>
                <span className="badge bg-blue-100 text-blue-700 flex-shrink-0">{m.member_role}</span>
                {m.is_system ? (
                  <Lock size={13} className="text-gray-300 flex-shrink-0" />
                ) : (
                  <div className="flex gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(m)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(m.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default function Setup() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.getSettings().then(setSettings); }, []);

  const save = async () => {
    setSaving(true);
    await api.updateSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Setup</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your ATS settings and dropdown menus</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Global Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'business_name', label: 'Business / Team Name', type: 'text' },
            { key: 'currency', label: 'Currency', type: 'text' },
            { key: 'language', label: 'Language', type: 'text' },
            { key: 'timezone', label: 'Time Zone', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input type={type} className="input" value={settings[key] ?? ''}
                onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">Saved!</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SimpleList endpoint="departments" label="Departments" />
        <SimpleList endpoint="locations" label="Locations" />
        <SimpleList endpoint="role_types" label="Role Types" />
        <SimpleList endpoint="applicant_sources" label="Applicant Sources" />
        <StageList />
        <TeamMemberList />
      </div>
    </div>
  );
}
