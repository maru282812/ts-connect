"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPeople, type PersonCard } from "@/lib/people";

const FILTER_TABS = ["すべての社員", "相談可能"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export function PeopleSearchClient() {
  const [people, setPeople] = useState<PersonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("すべての社員");
  const [keyword, setKeyword] = useState("");
  const [department, setDepartment] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [consultOnly, setConsultOnly] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await fetchPeople();
      if (active) {
        setPeople(rows);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 部署の選択肢はデータから動的に生成
  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const p of people) if (p.department) set.add(p.department);
    return Array.from(set).sort();
  }, [people]);

  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const sk = skillQuery.trim().toLowerCase();
    const wantConsult = consultOnly || filter === "相談可能";
    return people.filter((p) => {
      if (wantConsult && !p.consultable) return false;
      if (department && p.department !== department) return false;
      if (sk) {
        const tags = [...p.skills, ...p.specialSkills].map((s) =>
          s.toLowerCase(),
        );
        if (!tags.some((t) => t.includes(sk))) return false;
      }
      if (kw) {
        const hay = [
          p.name,
          p.department,
          p.jobTitle,
          p.bio,
          ...p.skills,
          ...p.specialSkills,
          ...p.hobbies,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [people, keyword, department, skillQuery, consultOnly, filter]);

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-default-900 mb-1">社員検索</h1>
          <p className="text-sm text-default-500">
            社内のエキスパートや共通の趣味を持つ仲間を見つけましょう
          </p>
        </div>
        <Link
          href="/company/my-page"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90"
        >
          スキルを登録する
        </Link>
      </div>

      {/* Search & filter */}
      <section className="bg-white rounded-xl border border-default-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-default-600 ml-1">
              氏名・キーワード
            </span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="名前・趣味などで検索"
              type="text"
            />
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-bold text-default-600 ml-1">
              部署
            </span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">すべての部署</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-bold text-default-600 ml-1">
              スキルタグ
            </span>
            <input
              value={skillQuery}
              onChange={(e) => setSkillQuery(e.target.value)}
              className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="Python, デザイン..."
              type="text"
            />
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-bold text-default-600 ml-1">
              ステータス
            </span>
            <select
              value={consultOnly ? "consult" : ""}
              onChange={(e) => setConsultOnly(e.target.value === "consult")}
              className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">指定なし</option>
              <option value="consult">相談OK</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-200 pt-4">
          <div className="flex flex-wrap gap-1">
            {FILTER_TABS.map((t) => {
              const active = filter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    active
                      ? "bg-primary-50 text-primary font-bold"
                      : "text-default-500 hover:bg-default-100"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-default-500">
            検索結果:{" "}
            <span className="font-bold text-default-800">{visible.length}</span>{" "}
            名
          </p>
        </div>
      </section>

      {/* Employee grid */}
      {loading ? (
        <p className="text-sm text-default-500 py-12 text-center">
          読み込み中...
        </p>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-default-200 p-12 text-center">
          <p className="text-sm text-default-500">
            {people.length === 0
              ? "社員プロフィールの公開準備中です。マイページからスキルを登録すると、ここに表示されます。"
              : "条件に合う社員が見つかりませんでした。"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((p) => (
            <div
              key={p.userId}
              className="bg-white rounded-xl border border-default-200 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-xl font-bold">
                  {p.name.slice(0, 1)}
                </div>
              </div>
              <div className="mb-3">
                <h3 className="text-lg font-bold text-default-900 group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                <p className="text-sm text-default-500">
                  {[p.department, p.jobTitle].filter(Boolean).join(" / ")}
                </p>
              </div>
              <div className="mb-4">
                {p.consultable && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-[11px] font-bold mb-2">
                    相談OK
                  </span>
                )}
                {p.bio && (
                  <p className="text-sm text-default-600 line-clamp-2">
                    {p.bio}
                  </p>
                )}
              </div>
              {p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {p.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 bg-default-100 text-default-600 rounded text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/app/people/${p.userId}`}
                className="block text-center w-full py-2.5 bg-primary-50 text-primary font-bold rounded-lg text-sm hover:bg-primary hover:text-white transition-all"
              >
                プロフィールを見る
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
