import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DropdownItem, TeamMember, HiringStage } from '../types';
import { Plus, Trash2, Lock } from 'lucide-react';

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

  const load = () => api.getDropdown(endpoint).then(d => setItems(d as DropdownItem[]));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newName.trim()) return;
    await api.addDropdown(endpoint, { name: newName.trim() });
    setNewName('');
    load();
  };

  const remove = async (id: number) => {
    await api.deleteDropdown(endpoint, id);
    load();
  };

  return (
    <Section title={label}>
      <div className="flex gap-2 mb-3">
        <input className="input flex-1" placeholder={`Add ${label.toLowerCase()}…`} value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <button className="btn-primary flex items-center gap-1" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
            <span className="text-sm">{item.name}</span>
            {item.is_system ? (
              <Lock size={13} className="text-gray-300" aria-label="System value" />
            ) : (
              <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
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

  const load = () => api.getDropdown('hiring_stages').then(d => setStages(d as HiringStage[]));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newName.trim()) return;
    await api.addDropdown('hiring_stages', { name: newName.trim() });
    setNewName('');
    load();
  };

  const remove = async (id: number) => {
    await api.deleteDropdown('hiring_stages', id);
    load();
  };

  return (
    <Section title="Hiring Stages">
      <div className="flex gap-2 mb-3">
        <input className="input flex-1" placeholder="Add stage…" value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <button className="btn-primary flex items-center gap-1" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <ul className="space-y-1.5">
        {stages.map((s, i) => (
          <li key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
            <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
            <span className="text-sm flex-1">{s.name}</span>
            {s.is_system ? (
              <Lock size={13} className="text-gray-300" />
            ) : (
              <button onClick={() => remove(s.id)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
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

  const load = () => api.getDropdown('team_members').then(d => setMembers(d as TeamMember[]));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim()) return;
    await api.addDropdown('team_members', form);
    setForm({ name: '', email: '', member_role: 'Recruiter' });
    load();
  };

  const remove = async (id: number) => {
    await api.deleteDropdown('team_members', id);
    load();
  };

  return (
    <Section title="Team Members / Stakeholders">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <input className="input" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="input" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <div className="flex gap-2">
          <select className="select flex-1" value={form.member_role} onChange={e => setForm(f => ({ ...f, member_role: e.target.value }))}>
            {['Manager', 'Recruiter', 'Interviewer', 'HR', 'Executive'].map(r => <option key={r}>{r}</option>)}
          </select>
          <button className="btn-primary" onClick={add}><Plus size={15} /></button>
        </div>
      </div>
      <ul className="space-y-1.5">
        {members.map(m => (
          <li key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
            <span className="text-sm font-medium flex-1">{m.name}</span>
            <span className="text-xs text-gray-400">{m.email}</span>
            <span className="badge bg-blue-100 text-blue-700">{m.member_role}</span>
            {m.is_system ? <Lock size={13} className="text-gray-300" /> : (
              <button onClick={() => remove(m.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
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
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Setup</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your ATS settings and dropdown menus</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Global Settings</h3>
        <div className="grid grid-cols-2 gap-4">
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
          {saved && <span className="text-sm text-emerald-600">Saved!</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
