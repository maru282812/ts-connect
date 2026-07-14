"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchPerson, type PersonCard } from "@/lib/people";

function TagRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <span className="text-xs font-bold text-default-600">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span
            key={s}
            className="px-2.5 py-1 bg-default-100 text-default-700 rounded text-xs"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function TextBlock({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold text-default-600">{label}</span>
      <p className="text-sm text-default-700 whitespace-pre-wrap leading-relaxed">
        {text}
      </p>
    </div>
  );
}

export function PersonDetailClient() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [person, setPerson] = useState<PersonCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const p = await fetchPerson(userId);
      if (active) {
        setPerson(p);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return <div className="bg-white rounded-xl h-96 animate-pulse" />;
  }

  if (!person) {
    return (
      <div className="text-center py-16">
        <p className="text-default-500">社員が見つかりませんでした</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm text-primary font-bold hover:underline"
        >
          ← 一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 text-sm text-default-500 hover:text-primary"
      >
        ← 社員検索に戻る
      </button>

      <div className="bg-white rounded-xl border border-default-200 p-6 sm:p-8">
        {/* ヘッダー */}
        <div className="flex items-start gap-5 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-2xl font-bold shrink-0">
            {person.name.slice(0, 1)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-default-900">
              {person.name}
            </h1>
            <p className="text-sm text-default-500 mt-1">
              {[person.department, person.jobTitle].filter(Boolean).join(" / ")}
            </p>
            {person.consultable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-[11px] font-bold mt-2">
                相談OK
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6 border-t border-default-200 pt-6">
          <TextBlock label="自己紹介" text={person.bio} />
          <TagRow label="スキル" items={person.skills} />
          <TagRow label="特技" items={person.specialSkills} />
          <TagRow label="趣味" items={person.hobbies} />
          <TextBlock label="興味テーマ" text={person.interestThemes} />
          <TextBlock label="相談に乗れること" text={person.consultTopics} />
        </div>
      </div>
    </div>
  );
}
