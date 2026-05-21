// ============================================================
// Enum Types
// ============================================================
export type SystemRole = "ADMIN" | "USER" | "MASTER_ADMIN";
export type AccountStatus = "ACTIVE" | "PRO" | "SUSPENDED";
export type PostType = "OFFICIAL" | "CASUAL";
export type PostStatus = "DRAFT" | "OPEN" | "IN_PROGRESS" | "CLOSED";
export type ApplicationType = "APPLY" | "INQUIRY";
export type ApplicationStatus =
  | "APPLIED"
  | "REVIEWING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELED"
  | "INQUIRY";
export type MembershipRole = "ADMIN" | "USER";

// ============================================================
// Table Types
// ============================================================
export interface User {
  id: string;
  email: string;
  display_name: string;
  notification_email: string | null;
  system_role: SystemRole;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  email: string | null;
  notification_email: string | null;
  notification_enabled: boolean;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: MembershipRole;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  company_id: string;
  created_by_user_id: string;
  title: string;
  body: string;
  requirements: string | null;
  post_type: PostType;
  post_status: PostStatus;
  price_text: string | null;
  contact_person_name: string | null;
  deadline_at: string | null;
  published_at: string | null;
  closed_at: string | null;
  application_limit: number | null;
  is_application_limit_enabled: boolean;
  thumbnail_url: string | null;
  reference_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  post_id: string;
  applicant_user_id: string;
  message: string | null;
  application_type: ApplicationType;
  application_status: ApplicationStatus;
  applicant_email_snapshot: string;
  applicant_name_snapshot: string;
  applicant_company_snapshot: string | null;
  post_title_snapshot: string;
  application_sequence: number | null;
  applied_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Join Types (with related data)
// ============================================================
export interface PostWithRelations extends Post {
  companies: { id: string; name: string } | null;
  users: { id: string; display_name: string; email: string } | null;
}

export interface ApplicationWithPost extends Application {
  posts: { id: string; title: string; post_type: PostType } | null;
}

// ============================================================
// Form Types
// ============================================================
export interface PostFormData {
  title: string;
  body: string;
  requirements: string;
  post_type: PostType;
  post_status: PostStatus;
  company_id: string;
  price_text: string;
  contact_person_name: string;
  deadline_at: string;
  thumbnail_url: string;
  reference_url: string;
}

export interface ApplicationFormData {
  post_id: string;
  message: string;
  application_type: ApplicationType;
}

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
