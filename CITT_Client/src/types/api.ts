// CITT API Types
// Shared type definitions for frontend-backend communication

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  university?: string;
  campus?: string;
  college?: string;
  year_of_study?: string;
  profile_complete: boolean;
  profile_photo_url?: string;
  firestore_id?: string;
  account_status: AccountStatus;
  created_at: string;
  updated_at?: string;
}

export type UserRole =
  | 'superAdmin'
  | 'admin'
  | 'transferTechnologyOfficer'
  | 'diiDirector'
  | 'debmDirector'
  | 'rtpDirector'
  | 'ipManager'
  | 'mentor'
  | 'technicalCommittee'
  | 'coordinator'
  | 'innovator';

export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Project {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  institution?: string;
  funding_needed?: number;
  problem_statement?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  project_status: 'submitted' | 'on_progress' | 'completed';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  approved_by_name?: string;
}

export interface Milestone {
  id: number;
  project_id: number;
  stage_name: string;
  stage_order: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  description?: string;
  submitted_at?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface Funding {
  id: number;
  user_id: number;
  project_id?: number;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  grant_type: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  amount_approved?: number;
  funding_status: 'applied' | 'approved' | 'rejected' | 'disbursed' | 'completed';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  approved_by_name?: string;
  project_title?: string;
}

export interface IPRecord {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  ip_type: 'patent' | 'trademark' | 'copyright' | 'trade_secret' | 'industrial_design' | 'other';
  inventors: string;
  filing_date?: string;
  status: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  image_url?: string;
  category?: string;
  type?: 'hackathon' | 'workshop' | 'challenge' | 'exhibition' | 'seminar' | 'conference';
  published: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'account_approved' | 'account_rejected';
  link?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
  details?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalFunding: number;
  totalEvents: number;
  totalIP: number;
  pendingApprovals: number;
  activeProjects: number;
  approvedFunding: number;
}
