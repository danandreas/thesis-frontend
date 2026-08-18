/**
 * types/index.ts
 * TypeScript type definitions untuk seluruh aplikasi Psychoposition.
 *
 * Bug #13 fix: semua interface dipusatkan di sini agar tidak ada duplikasi
 * atau inkonsistensi antar halaman. Setiap halaman yang butuh type harus
 * import dari sini, bukan mendefinisikan ulang sendiri.
 */

// ── Generic API Response ────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/** Bug #17: Generic pagination wrapper untuk semua endpoint list */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

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
  created_at?: string;
}

export interface RequirementType {
  id: number;
  code: string;
  name: string;
  description?: string;
  value_type: 'numeric' | 'scale' | 'count' | 'boolean';
  min_value: number;
  max_value: number;
  unit?: string | null;
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
  applicant_count?: number;
  /** Hanya ada di response kandidat (GET /content/recruitments) */
  my_application_status?: ApplicationStatus | null;
  my_application_id?: number | null;
  criteria_setup?: PositionCriteria[];
}

export interface PositionCriteria {
  /** position_criteria_id — BUKAN criteria_id. Gunakan id ini untuk endpoint questions */
  id: number;
  position_id: number;
  criteria_id: number;
  criteria?: Criteria;
  weight_manual: number;
  criteria_type: 'benefit' | 'cost';
  fuzzy_low: number;
  fuzzy_mid: number;
  fuzzy_high: number;
  display_order: number;
  question_count?: number;
}

export interface RecruitmentRequirement {
  id: number;
  recruitment_id: number;
  requirement_type_id: number;
  requirement_type: RequirementType;
  weight: number;
  minimum_value?: number | null;
  is_mandatory: boolean;
  display_order?: number;
}

// ── Questions & Options ─────────────────────────────────────────
/**
 * AssessmentOption: field dari backend adalah option_value (bukan likert_value).
 * Bug #6 fix: hapus likert_value, gunakan option_value.
 */
export interface AssessmentOption {
  id: number;
  question_id: number;
  option_text: string;
  option_value: number; // ← BENAR: option_value, bukan likert_value
  display_order: number;
}

/** Versi option yang dikirim ke kandidat (option_value TIDAK ada) */
export interface CandidateOption {
  id: number;
  option_text: string;
  display_order: number;
}

export interface AssessmentQuestion {
  id: number;
  position_criteria_id: number;
  question_text: string;
  display_order: number;
  is_active: boolean;
  options: AssessmentOption[];
}

/** Format pertanyaan yang diterima kandidat (ID berbeda: question_id bukan id) */
export interface CandidateQuestion {
  question_id: number;
  question_text: string;
  options: CandidateOption[];
}

// ── Assessment Data (halaman asesmen kandidat) ─────────────────
export interface RequirementInfo {
  recruitment_requirement_id: number;
  name: string;
  value_type: 'numeric' | 'scale' | 'count' | 'boolean';
  min_value: number;
  max_value: number;
  unit: string | null;
  is_mandatory: boolean;
}

export interface AssessmentData {
  application_id: number;
  position_title: string;
  total_questions: number;
  questions: CandidateQuestion[];
  requirements: RequirementInfo[];
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
  user_id?: number;
  position_id: number;
  position_title?: string;
  candidate_name?: string;
  candidate_email?: string;
  status: ApplicationStatus;
  submitted_at?: string;
  answer_count?: number;
}

// ── Candidate Profile & Education ──────────────────────────────
export interface CandidateEducation {
  id: number;
  user_id: number;
  degree: string;
  institution: string;
  major?: string | null;
  gpa?: number | null;
  gpa_scale: number;
  /** Backend field: graduation_year (bukan end_year) */
  graduation_year?: number | null;
  /** Backend field: is_latest (bukan is_current) */
  is_latest: boolean;
}

export interface CandidateProfile {
  id: number;
  user_id: number;
  birth_date?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  linkedin_url?: string | null;
  resume_url?: string | null;
  user?: Pick<UserData, 'id' | 'name' | 'email' | 'phone'>;
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

// ── Pagination helpers ─────────────────────────────────────────
/** Bug #17: Param object untuk request list dengan pagination */
export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
