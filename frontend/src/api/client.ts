const BASE = '/api';

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Settings
  getSettings: () => req<Record<string, string>>('/settings'),
  updateSettings: (data: Record<string, string>) => req('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Dropdowns
  getDropdown: (name: string) => req<unknown[]>(`/dropdowns/${name}`),
  addDropdown: (name: string, data: object) => req(`/dropdowns/${name}`, { method: 'POST', body: JSON.stringify(data) }),
  updateDropdown: (name: string, id: number, data: object) => req(`/dropdowns/${name}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDropdown: (name: string, id: number) => req(`/dropdowns/${name}/${id}`, { method: 'DELETE' }),

  // Jobs
  getJobs: () => req<import('../types').Job[]>('/jobs'),
  getJob: (id: number) => req<import('../types').Job>(`/jobs/${id}`),
  createJob: (data: object) => req<{ id: number }>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id: number, data: object) => req(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJob: (id: number) => req(`/jobs/${id}`, { method: 'DELETE' }),

  // Applicants
  getApplicants: () => req<import('../types').Applicant[]>('/applicants'),
  getApplicant: (candidateId: string) => req<import('../types').Applicant>(`/applicants/${candidateId}`),
  createApplicant: (data: object) => req<{ id: number }>('/applicants', { method: 'POST', body: JSON.stringify(data) }),
  updateApplicant: (candidateId: string, data: object) => req(`/applicants/${candidateId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApplicant: (candidateId: string) => req(`/applicants/${candidateId}`, { method: 'DELETE' }),

  // Assessments
  getAssessments: () => req<import('../types').Assessment[]>('/assessments'),
  getAssessmentsByJob: (jobId: number) => req<import('../types').Assessment[]>(`/assessments/job/${jobId}`),
  getAssessmentsByCandidate: (candidateId: string) => req<import('../types').Assessment[]>(`/assessments/candidate/${candidateId}`),
  createAssessment: (data: object) => req<{ id: number; next_action: string }>('/assessments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssessment: (id: number, data: object) => req<{ ok: boolean; next_action: string }>(`/assessments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssessment: (id: number) => req(`/assessments/${id}`, { method: 'DELETE' }),

  // Reminders / Daily Planner
  getReminders: () => req<import('../types').Reminder[]>('/reminders'),
  createReminder: (data: object) => req<{ id: number }>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id: number, data: object) => req(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id: number) => req(`/reminders/${id}`, { method: 'DELETE' }),

  // Analytics
  getDashboard: () => req<import('../types').DashboardData>('/analytics/dashboard'),
  getJobAnalytics: (id: number) => req<unknown>(`/analytics/job/${id}`),
  getCandidateHistory: (candidateId: string) => req<unknown>(`/analytics/candidate/${candidateId}`),
};
