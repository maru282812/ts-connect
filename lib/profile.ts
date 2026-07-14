// ============================================================
// ユーザープロフィール（マイページ拡張 / 社員検索）データアクセス層
// client-side Supabase + RLS（lib/community.ts と同パターン）。
// 対応 migration: 028_user_profiles_phase2（**未適用の場合もUIを壊さない**）
// ============================================================
import { createClient } from "@/lib/supabase/client";
import type { Availability, UserProfileRow } from "@/types/database";

// マイページのフォームが編集する項目（保存対象）
export interface ProfileInput {
  bio: string;
  skills: string[];
  specialSkills: string[];
  hobbies: string[];
  interestThemes: string;
  consultTopics: string;
  availability: Availability;
}

const PROFILE_COLUMNS =
  "id, user_id, bio, skills, special_skills, hobbies, interest_themes, consult_topics, availability, created_at, updated_at";

/**
 * 自分の user_profiles を取得する。行が無ければ null。
 * migration 028 未適用（新カラム欠落）や取得失敗時は null を返し、画面は空フォームで表示する。
 */
export async function fetchMyProfile(): Promise<UserProfileRow | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_profiles")
      .select(PROFILE_COLUMNS)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return null;
    return (data as UserProfileRow) ?? null;
  } catch {
    return null;
  }
}

/**
 * 自分の user_profiles を upsert する（user_id で衝突解決）。
 * 成功/失敗を { ok, error } で返し、呼び出し側で throw させない。
 */
export async function saveMyProfile(
  input: ProfileInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です" };

    const payload = {
      user_id: user.id,
      bio: input.bio.trim() || null,
      skills: input.skills,
      special_skills: input.specialSkills,
      hobbies: input.hobbies,
      interest_themes: input.interestThemes.trim() || null,
      consult_topics: input.consultTopics.trim() || null,
      availability: input.availability,
    };

    const { error } = await supabase
      .from("user_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "保存に失敗しました",
    };
  }
}
