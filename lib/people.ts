// ============================================================
// 社員検索（People）データアクセス層
// client-side Supabase。他人の氏名/アバターは users の RLS で直接読めないため、
// SECURITY DEFINER RPC public.people_directory() 経由で取得する。
// 対応 migration: 028_user_profiles_phase2（**未適用時は空配列で返しUIを壊さない**）
// ============================================================
import { createClient } from "@/lib/supabase/client";
import type { Availability } from "@/types/database";

export interface PersonCard {
  userId: string;
  name: string;
  department: string;
  jobTitle: string;
  bio: string;
  skills: string[];
  specialSkills: string[];
  hobbies: string[];
  interestThemes: string;
  consultTopics: string;
  availability: Availability | null;
  /** availability === 'AVAILABLE' を「相談OK」とみなす */
  consultable: boolean;
}

interface DirectoryRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  department_name: string | null;
  job_title: string | null;
  bio: string | null;
  skills: string[] | null;
  special_skills: string[] | null;
  hobbies: string[] | null;
  interest_themes: string | null;
  consult_topics: string | null;
  availability: Availability | null;
}

function mapRow(r: DirectoryRow): PersonCard {
  return {
    userId: r.user_id,
    name: r.display_name ?? "名称未設定",
    department: r.department_name ?? "",
    jobTitle: r.job_title ?? "",
    bio: r.bio ?? "",
    skills: r.skills ?? [],
    specialSkills: r.special_skills ?? [],
    hobbies: r.hobbies ?? [],
    interestThemes: r.interest_themes ?? "",
    consultTopics: r.consult_topics ?? "",
    availability: r.availability ?? null,
    consultable: r.availability === "AVAILABLE",
  };
}

/** 自社の在籍メンバー一覧を取得する。RPC 未適用/失敗時は空配列。 */
export async function fetchPeople(): Promise<PersonCard[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("people_directory", {
      target: null,
    });
    if (error || !data) return [];
    return (data as DirectoryRow[]).map(mapRow);
  } catch {
    return [];
  }
}

/** 社員1名の詳細を取得する。該当なし/失敗時は null。 */
export async function fetchPerson(userId: string): Promise<PersonCard | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("people_directory", {
      target: userId,
    });
    if (error || !data || (data as DirectoryRow[]).length === 0) return null;
    return mapRow((data as DirectoryRow[])[0]);
  } catch {
    return null;
  }
}
