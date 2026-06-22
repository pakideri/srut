export interface Settings {
  business_name?: string;
  currency?: string;
  language?: string;
  timezone?: string;
}

export interface DropdownItem {
  id: number;
  name: string;
  is_system?: number;
}

export interface TeamMember extends DropdownItem {
  email?: string;
  member_role?: string;
}

export interface HiringStage extends DropdownItem {
  order_index: number;
}

export interface Job {
  id: number;
  title: string;
  department?: string;
  location?: string;
  job_type?: string;
  manager?: string;
  recruiter?: string;
  budget?: number;
  currency?: string;
  target_hire_date?: string;
  status: string;
  created_at: string;
}

export interface Applicant {
  id: number;
  candidate_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  resume_url?: string;
  source?: string;
  notes?: string;
  created_at: string;
}

export interface Assessment {
  id: number;
  candidate_id: string;
  job_id: number;
  current_stage?: string;
  stage_date?: string;
  interviewer?: string;
  feedback?: string;
  score?: number;
  status: string;
  created_at: string;
  updated_at: string;
  // joined fields
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  department?: string;
  job_status?: string;
}

export interface Reminder {
  id: number;
  title: string;
  reminder_date: string;
  reminder_time?: string;
  reason?: string;
  is_done: number;
  created_at: string;
}

export interface DashboardData {
  totalJobs: number;
  totalCandidates: number;
  activeCandidates: number;
  hired: number;
  hiringRate: number;
  avgDaysToFill: number | null;
  byStage: { stage: string; count: number }[];
  byDept: { department: string; count: number }[];
  bySource: { source: string; count: number }[];
  recruiterPerf: { recruiter: string; total: number; hired: number }[];
}
