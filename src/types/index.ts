/**
 * types/index.ts
 * TypeScript type definitions untuk seluruh aplikasi.
 */

// ── Auth ───────────────────────────────────────────────────────
export interface Role {
  id: number;
  code: 'admin' | 'candidate' | string;
  name: string;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: Role;
  created_at?: string;
}

// ── Master Data ────────────────────────────────────────────────
export interface Criteria {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface RequirementType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// ── Recruitment ────────────────────────────────────────────────
export type RecruitmentStatus = 'draft' | 'active' | 'closed';

export interface Recruitment {
  id: number;
  code: string;
  title: string;
  description?: string;
  status: RecruitmentStatus;
  assessment_weight: number;
  requirement_weight: number;
  published_at?: string;
  closed_at?: string;
  created_at: string;
  positions?: Position[];
  requirements?: RecruitmentRequirement[];
}

export interface Position {
  id: number;
  recruitment_id: number;
  title: string;
  description?: string;
  quota: number;
  status: string;
  applicant_count: number;
  position_criteria?: PositionCriteria[];
}

export interface PositionCriteria {
  id: number;
  position_id: number;
  criteria_id: number;
  criteria_code: string;
  criteria_name: string;
  weight_manual: number;
  criteria_type: 'benefit' | 'cost';
  fuzzy_low: number;
  fuzzy_mid: number;
  fuzzy_high: number;
}

export interface RecruitmentRequirement {
  id: number;
  recruitment_id: number;
  requirement_type_id: number;
  requirement_type: { id: number; name: string; code: string };
  weight: number;
  is_mandatory: boolean;
}

// ── Questions ──────────────────────────────────────────────────
export interface AssessmentOption {
  id: number;
  question_id: number;
  option_text: string;
  likert_value: number;
  display_order: number;
}

export interface AssessmentQuestion {
  question_id: number;
  question_text: string;
  display_order: number;
  options: AssessmentOption[];
}

// ── Applications ───────────────────────────────────────────────
export type ApplicationStatus =
  | 'registered'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'scored'
  | 'accepted'
  | 'rejected';

export interface Application {
  id: number;
  candidate_id: number;
  position_id: number;
  position_title?: string;
  candidate_name?: string;
  candidate_email?: string;
  status: ApplicationStatus;
  submitted_at?: string;
  answer_count?: number;
}

// ── Scoring & Ranking ──────────────────────────────────────────
export interface RankingResult {
  application_id: number;
  candidate_name: string;
  candidate_email: string;
  rank_manual: number;
  rank_ml: number;
  final_score_manual: number;
  final_score_ml: number;
  is_recommended: boolean;
  admin_choice?: 'manual' | 'ml';
  final_rank?: number;
  final_status?: 'accepted' | 'rejected' | 'pending';
}

export interface WeightComparison {
  criteria_id: number;
  criteria_code: string;
  criteria_name: string;
  weight_manual: number;
  weight_ewm: number;
  weight_ml: number;
  difference: number;
}

export interface GenerateResult {
  total_candidates: number;
  pso_converged: boolean;
  pso_iterations: number;
  spearman_correlation: number;
  ranking: RankingResult[];
  weight_comparison: WeightComparison[];
}

// ── Dashboard Summary ──────────────────────────────────────────
export interface DashboardSummary {
  total_recruitments: number;
  active_recruitments: number;
  total_applications: number;
  submitted: number;
  accepted: number;
  rejected: number;
}
