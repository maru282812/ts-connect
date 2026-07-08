"use client";

import { useState } from "react";

type ViewMode = "MONTH" | "WEEK" | "DAY";

interface CalEvent {
  day: number;
  time: string;
  title: string;
  tone: string;
}

const EVENTS: CalEvent[] = [
  {
    day: 5,
    time: "14:00",
    title: "フットサル部",
    tone: "bg-indigo-100 text-indigo-700",
  },
  {
    day: 8,
    time: "18:30",
    title: "UX読書会",
    tone: "bg-primary-50 text-primary",
  },
  {
    day: 10,
    time: "12:00",
    title: "ランチMTG",
    tone: "bg-teal-100 text-teal-700",
  },
  {
    day: 11,
    time: "19:00",
    title: "新人歓迎会",
    tone: "bg-green-100 text-green-700",
  },
  {
    day: 16,
    time: "17:00",
    title: "AI基礎講座",
    tone: "bg-primary-50 text-primary",
  },
  {
    day: 19,
    time: "11:00",
    title: "秋のBBQ",
    tone: "bg-amber-100 text-amber-700",
  },
];

const RECOMMENDED = [
  {
    id: "ev-bbq",
    tag: "交流会",
    title: "秋の全社BBQ交流会",
    when: "10月19日 (土) 11:00〜",
    owner: "総務部企画",
    joined: 42,
  },
  {
    id: "ev-ai",
    tag: "勉強会",
    title: "エンジニア向けAI活用勉強会",
    when: "10月16日 (水) 17:00〜",
    owner: "DX推進部",
    joined: 15,
  },
];

const INTEREST_TAGS = [
  "#AI",
  "#デザイン",
  "#エンジニアリング",
  "#キャリア",
  "#社内文化",
  "#部活動",
];

const RANKING = [
  { rank: 1, title: "新人歓迎会・秋の陣", meta: "10/11 開催 | 82名参加" },
  { rank: 2, title: "秋の全社BBQ交流会", meta: "10/19 開催 | 42名参加" },
  { rank: 3, title: "フットサル部 定期練習", meta: "10/05 開催 | 28名参加" },
  { rank: 4, title: "UX読書会: デザイン倫理", meta: "10/08 開催 | 22名参加" },
  { rank: 5, title: "AI基礎講座", meta: "10/16 開催 | 18名参加" },
];

const VIEW_TABS: { key: ViewMode; label: string }[] = [
  { key: "MONTH", label: "月表示" },
  { key: "WEEK", label: "週表示" },
  { key: "DAY", label: "日表示" },
];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// October 2024 starts on Tuesday (index 2); 31 days
const LEADING_BLANKS = 2;
const DAYS_IN_MONTH = 31;
const TODAY = 10;

// ---- Week view (U_14_2) ----
const WEEK_RANGE_LABEL = "10月21日 - 10月27日";
const WEEK_DAYS = [
  { date: 21, label: "月" },
  { date: 22, label: "火" },
  { date: 23, label: "水", today: true },
  { date: 24, label: "木" },
  { date: 25, label: "金" },
  { date: 26, label: "土", tone: "text-blue-500" },
  { date: 27, label: "日", tone: "text-red-500" },
];

const WEEK_START_HOUR = 9;
const WEEK_END_HOUR = 21;
const HOUR_HEIGHT = 56; // px per hour

interface WeekEvent {
  dayIndex: number; // 0 = Mon ... 6 = Sun
  start: number; // hour (24h)
  end: number;
  title: string;
  owner?: string;
  people: string;
  tone: string; // border + bg + text classes
}

const WEEK_EVENTS: WeekEvent[] = [
  {
    dayIndex: 0,
    start: 9,
    end: 11,
    title: "テック朝食会",
    owner: "技術開発部",
    people: "12名参加",
    tone: "border-primary/30 bg-primary-50 text-primary",
  },
  {
    dayIndex: 1,
    start: 13,
    end: 15,
    title: "UXワークショップ",
    owner: "デザイン戦略部",
    people: "8名参加",
    tone: "border-amber-300 bg-amber-50 text-amber-700",
  },
  {
    dayIndex: 2,
    start: 10,
    end: 11,
    title: "ヨガ・サークル",
    people: "32名",
    tone: "border-green-300 bg-green-50 text-green-700",
  },
  {
    dayIndex: 2,
    start: 18,
    end: 20,
    title: "シャッフル飲み会",
    owner: "福利厚生委員会",
    people: "45名参加予定",
    tone: "border-amber-300 bg-amber-50 text-amber-700",
  },
  {
    dayIndex: 4,
    start: 14,
    end: 18,
    title: "全社ナレッジ共有会",
    owner: "CTO室",
    people: "120名以上が参加",
    tone: "border-primary/30 bg-primary-50 text-primary",
  },
];

// ---- Day view (U_14_1) ----
interface DayEvent {
  featured?: boolean;
  category: string;
  categoryTone: string;
  title: string;
  time: string;
  people: string;
  place?: string;
  rating: number;
  description: string;
}

const DAY_LABEL = "10月24日 (木)";

const DAY_EVENTS: DayEvent[] = [
  {
    featured: true,
    category: "DX推進部 主催",
    categoryTone: "text-primary",
    title: "生成AI活用勉強会：現場で使えるプロンプト術",
    time: "18:30 - 20:00",
    people: "42名参加予定",
    place: "会議室A & オンライン",
    rating: 4.8,
    description:
      "ChatGPTやClaudeを日々の業務にどう組み込むか？実際に業務効率を30%向上させたマーケティング部の成功事例を中心に、明日からすぐ使える具体的なプロンプトエンジニアリングのテクニックを共有します。初心者の方も大歓迎です！",
  },
  {
    category: "カジュアル交流",
    categoryTone: "text-amber-600",
    title: "部署横断シャッフルランチ：新メンバー歓迎会",
    time: "12:00 - 13:00",
    people: "12名参加",
    rating: 4.0,
    description:
      "今月入社した5名の新メンバーを囲んでのカジュアルなランチ会です。部署の垣根を超えてフランクに話しましょう！お弁当の補助が出ます。",
  },
];

const DAY_RECOMMENDED = [
  {
    when: "11/02 17:00〜",
    title: "ChatGPT Plus 活用事例共有会",
    desc: "エンジニアチームが実践している、開発効率を爆上げするGPTsの使い方...",
  },
  {
    when: "11/05 18:00〜",
    title: "Python自動化スクリプト入門",
    desc: "非エンジニアでもできる！Excel作業を自動化して定時退社を目指すワークショップ。",
  },
  {
    when: "11/10 19:00〜",
    title: "デザイン思考ワークショップ",
    desc: "ユーザー視点でのプロダクト改善を学ぶ実践型セッション。全職種対象。",
  },
];

function MonthView() {
  const cells: { key: string; day: number | null }[] = [
    ...Array.from({ length: LEADING_BLANKS }, (_, i) => ({
      key: `pre-${i}`,
      day: null,
    })),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => ({
      key: `day-${i + 1}`,
      day: i + 1,
    })),
  ];
  while (cells.length % 7 !== 0)
    cells.push({ key: `post-${cells.length}`, day: null });

  return (
    <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-default-200 bg-default-50">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-3 text-center text-sm font-medium ${
              i === 0
                ? "text-red-500"
                : i === 6
                  ? "text-primary"
                  : "text-default-700"
            }`}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map(({ key, day: d }) => {
          const dayEvents = d ? EVENTS.filter((e) => e.day === d) : [];
          const isToday = d === TODAY;
          return (
            <div
              key={key}
              className={`min-h-[96px] p-2 border-b border-r border-default-100 ${
                d === null ? "bg-default-50/50" : ""
              }`}
            >
              {d !== null && (
                <>
                  <span
                    className={`text-sm ${
                      isToday ? "font-bold text-primary" : "text-default-700"
                    }`}
                  >
                    {d}
                  </span>
                  {isToday && (
                    <span className="ml-1 text-[10px] bg-primary text-white px-1 rounded">
                      今日
                    </span>
                  )}
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((e) => (
                      <div
                        key={e.title}
                        className={`text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer ${e.tone}`}
                      >
                        {e.time} {e.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView() {
  const hours = Array.from(
    { length: WEEK_END_HOUR - WEEK_START_HOUR + 1 },
    (_, i) => WEEK_START_HOUR + i,
  );
  const bodyHeight = (WEEK_END_HOUR - WEEK_START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-default-200 bg-default-50">
        <div className="border-r border-default-200" />
        {WEEK_DAYS.map((d) => (
          <div
            key={d.date}
            className={`h-12 flex flex-col items-center justify-center border-r border-default-100 last:border-r-0 ${
              d.today ? "bg-primary-50/40" : ""
            }`}
          >
            <span
              className={`text-xs ${
                d.today
                  ? "text-primary font-bold"
                  : (d.tone ?? "text-default-500")
              }`}
            >
              {d.date} ({d.label})
            </span>
            {d.today && (
              <span className="w-1 h-1 bg-primary rounded-full mt-1" />
            )}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
        {/* Time axis */}
        <div className="border-r border-default-200">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT }}
              className="relative border-t border-default-100 first:border-t-0"
            >
              <span className="absolute -top-2 right-2 text-[11px] text-default-400">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {WEEK_DAYS.map((d, dayIndex) => (
          <div
            key={d.date}
            className={`relative border-r border-default-100 last:border-r-0 ${
              d.today ? "bg-primary-50/10" : ""
            }`}
            style={{ height: bodyHeight }}
          >
            {/* hour grid lines */}
            {hours.slice(1).map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="border-t border-default-100"
              />
            ))}

            {/* events */}
            {WEEK_EVENTS.filter((e) => e.dayIndex === dayIndex).map((e) => (
              <div
                key={e.title}
                style={{
                  top: (e.start - WEEK_START_HOUR) * HOUR_HEIGHT,
                  height: (e.end - e.start) * HOUR_HEIGHT,
                }}
                className={`absolute left-1 right-1 rounded-lg border p-2 overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md ${e.tone}`}
              >
                <h4 className="text-[11px] font-bold truncate">{e.title}</h4>
                {e.owner && (
                  <p className="text-[10px] text-default-500 truncate">
                    {e.owner}
                  </p>
                )}
                <p className="text-[10px] text-default-500 mt-1 truncate">
                  👥 {e.people}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {["s1", "s2", "s3", "s4", "s5"].map((id, i) => {
        const filled = i + 1 <= Math.round(value);
        return (
          <span key={id} className={filled ? "" : "text-default-300"}>
            ★
          </span>
        );
      })}
      <span className="text-default-600 font-bold text-xs ml-1">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function DayView() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {DAY_EVENTS.map((e) => (
        <article
          key={e.title}
          className={`bg-white rounded-2xl overflow-hidden border transition-transform hover:-translate-y-0.5 ${
            e.featured
              ? "border-primary/30 shadow-md"
              : "border-default-200 shadow-sm"
          }`}
        >
          <div className="md:flex">
            <div className="md:w-2/5 bg-default-100 flex items-center justify-center min-h-[180px] relative">
              <span className="text-default-300 text-sm">画像</span>
              {e.featured && (
                <div className="absolute top-3 left-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                  ⚡ 注目のイベント
                </div>
              )}
            </div>
            <div className="md:w-3/5 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-2 gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${e.categoryTone}`}
                >
                  {e.category}
                </span>
                <StarRating value={e.rating} />
              </div>
              <h2
                className={`font-bold mb-3 ${
                  e.featured ? "text-xl" : "text-lg"
                } text-default-900`}
              >
                {e.title}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4 text-xs text-default-600">
                <span className="flex items-center gap-1 bg-default-100 px-3 py-1 rounded-lg">
                  🕒 {e.time}
                </span>
                <span className="flex items-center gap-1 bg-default-100 px-3 py-1 rounded-lg">
                  👥 {e.people}
                </span>
                {e.place && (
                  <span className="flex items-center gap-1 bg-default-100 px-3 py-1 rounded-lg">
                    📍 {e.place}
                  </span>
                )}
              </div>
              <p className="text-sm text-default-600 leading-relaxed mb-6">
                {e.description}
              </p>
              <div className="mt-auto flex gap-3 pt-4 border-t border-default-100">
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary-50 transition-all"
                >
                  詳細を見る
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all"
                >
                  参加する
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}

      {/* Recommendations */}
      <section className="border-t border-default-200 pt-8">
        <h3 className="text-lg font-bold text-default-900 mb-4">
          ✨ おすすめの関連イベント
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DAY_RECOMMENDED.map((r) => (
            <div
              key={r.title}
              className="bg-default-50 rounded-2xl p-4 hover:bg-default-100 transition-all cursor-pointer group"
            >
              <div className="aspect-video w-full rounded-xl bg-default-100 flex items-center justify-center mb-3">
                <span className="text-default-300 text-xs">画像</span>
              </div>
              <span className="text-xs font-bold text-primary mb-1 block">
                {r.when}
              </span>
              <h4 className="font-bold text-sm text-default-900 group-hover:text-primary transition-colors">
                {r.title}
              </h4>
              <p className="text-xs text-default-500 mt-1 line-clamp-2">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function EventsCalendarClient() {
  const [view, setView] = useState<ViewMode>("MONTH");

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-default-900">
            社内イベントカレンダー
          </h1>
          <div className="flex bg-default-100 p-1 rounded-lg">
            {VIEW_TABS.map((t) => {
              const active = view === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setView(t.key)}
                  className={`px-4 py-1.5 rounded-md text-sm transition-all ${
                    active
                      ? "bg-white shadow-sm text-primary font-bold"
                      : "text-default-500 font-medium hover:bg-white/50"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 hover:bg-default-100 rounded-full"
            aria-label="前の月"
          >
            ‹
          </button>
          <span className="text-lg font-bold px-2">
            {view === "MONTH"
              ? "2024年 10月"
              : view === "WEEK"
                ? WEEK_RANGE_LABEL
                : DAY_LABEL}
          </span>
          <button
            type="button"
            className="p-2 hover:bg-default-100 rounded-full"
            aria-label="次の月"
          >
            ›
          </button>
          <button
            type="button"
            className="ml-4 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90"
          >
            イベントを作成
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-[3] min-w-0">
          {view === "MONTH" && <MonthView />}
          {view === "WEEK" && <WeekView />}
          {view === "DAY" && <DayView />}
        </div>

        {/* Right rail */}
        <div className="flex-1 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-default-900">
                ✨ あなたへのおすすめ
              </h2>
              <button
                type="button"
                className="text-primary text-sm hover:underline"
              >
                すべて見る
              </button>
            </div>
            <div className="space-y-4">
              {RECOMMENDED.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-default-200 overflow-hidden"
                >
                  <div className="h-20 bg-default-100 flex items-center justify-center relative">
                    <span className="text-default-300 text-xs">画像</span>
                    <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold text-primary">
                      {r.tag}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-default-900 mb-1">
                      {r.title}
                    </h3>
                    <p className="text-xs text-default-500 mb-2">{r.when}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-default-500">
                          {r.owner}
                        </span>
                        <span className="text-xs font-bold text-green-600">
                          {r.joined}名参加中
                        </span>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90"
                      >
                        参加
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-default-900 mb-4">
              興味関心に近いタグ
            </h2>
            <div className="flex flex-wrap gap-2">
              {INTEREST_TAGS.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 bg-default-100 hover:bg-primary hover:text-white cursor-pointer rounded-full text-sm text-default-600 transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-default-900 mb-4">
              🏅 今月人気ランキング
            </h2>
            <div className="bg-white rounded-xl border border-default-200 divide-y divide-default-100">
              {RANKING.map((r) => (
                <div
                  key={r.rank}
                  className="p-3 flex items-center gap-3 hover:bg-default-50 transition-colors cursor-pointer"
                >
                  <span
                    className={`w-6 text-center font-bold italic ${
                      r.rank <= 3
                        ? "text-amber-500 text-lg"
                        : "text-default-400"
                    }`}
                  >
                    {r.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-default-800 truncate">
                      {r.title}
                    </p>
                    <p className="text-[11px] text-default-400">{r.meta}</p>
                  </div>
                  <span className="text-default-400 text-sm">›</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
