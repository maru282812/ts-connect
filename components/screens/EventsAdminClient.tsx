"use client";

import Link from "next/link";
import { useState } from "react";

type AdminView = "MONTH" | "WEEK" | "DAY" | "LIST";
type EventSource = "POST" | "OPS";
type EventStatus = "UPCOMING" | "TODAY" | "DONE";
type JoinType = "OPTIONAL" | "REQUIRED";

interface AdminEvent {
  id: string;
  day: number;
  time: string;
  endTime: string;
  title: string;
  category: string;
  source: EventSource;
  status: EventStatus;
  place: string;
  organizer: string;
  scope: string;
  joinType: JoinType;
  attendees: number;
  capacity?: number;
  published: boolean;
  tone: string;
}

const VIEW_TABS: { key: AdminView; label: string }[] = [
  { key: "MONTH", label: "月" },
  { key: "WEEK", label: "週" },
  { key: "DAY", label: "日" },
  { key: "LIST", label: "リスト" },
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// May 2024 starts on Wednesday (index 3), 31 days
const LEADING_BLANKS = 3;
const DAYS_IN_MONTH = 31;

const SOURCE_META: Record<EventSource, { label: string; badge: string }> = {
  POST: { label: "投稿由来", badge: "bg-amber-100 text-amber-700" },
  OPS: { label: "運営", badge: "bg-indigo-100 text-indigo-700" },
};

const STATUS_META: Record<EventStatus, { label: string; badge: string }> = {
  UPCOMING: { label: "開催予定", badge: "bg-blue-100 text-blue-700" },
  TODAY: { label: "本日開催", badge: "bg-red-100 text-red-700" },
  DONE: { label: "開催終了", badge: "bg-slate-100 text-slate-500" },
};

const EVENTS: AdminEvent[] = [
  {
    id: "ev-1",
    day: 1,
    time: "10:00",
    endTime: "10:30",
    title: "全体朝礼",
    category: "全社行事",
    source: "OPS",
    status: "DONE",
    place: "本社 大会議室",
    organizer: "総務部",
    scope: "全社に公開",
    joinType: "REQUIRED",
    attendees: 120,
    published: true,
    tone: "bg-orange-100 border-orange-500",
  },
  {
    id: "ev-2",
    day: 7,
    time: "14:00",
    endTime: "16:00",
    title: "エンジニア勉強会",
    category: "勉強会",
    source: "POST",
    status: "UPCOMING",
    place: "会議室A & オンライン",
    organizer: "DX推進部",
    scope: "全社に公開",
    joinType: "OPTIONAL",
    attendees: 15,
    capacity: 30,
    published: true,
    tone: "bg-blue-100 border-blue-500",
  },
  {
    id: "ev-3",
    day: 7,
    time: "18:00",
    endTime: "20:00",
    title: "新卒歓迎会",
    category: "交流会",
    source: "POST",
    status: "UPCOMING",
    place: "本社 ラウンジ",
    organizer: "人事部",
    scope: "全社に公開",
    joinType: "OPTIONAL",
    attendees: 42,
    capacity: 60,
    published: true,
    tone: "bg-green-100 border-green-500",
  },
  {
    id: "ev-4",
    day: 8,
    time: "09:00",
    endTime: "13:00",
    title: "定期健診",
    category: "健康・健診",
    source: "OPS",
    status: "UPCOMING",
    place: "会議室A",
    organizer: "総務部",
    scope: "全社に公開",
    joinType: "REQUIRED",
    attendees: 98,
    published: true,
    tone: "bg-red-100 border-red-500",
  },
  {
    id: "ev-5",
    day: 8,
    time: "13:00",
    endTime: "15:00",
    title: "UXワークショップ",
    category: "勉強会",
    source: "POST",
    status: "UPCOMING",
    place: "会議室A",
    organizer: "デザイン戦略部",
    scope: "指定部署のみ",
    joinType: "OPTIONAL",
    attendees: 8,
    capacity: 20,
    published: false,
    tone: "bg-purple-100 border-purple-500",
  },
  {
    id: "ev-6",
    day: 10,
    time: "15:00",
    endTime: "16:00",
    title: "デザインレビュー",
    category: "勉強会",
    source: "POST",
    status: "UPCOMING",
    place: "オンライン",
    organizer: "デザイン戦略部",
    scope: "指定部署のみ",
    joinType: "OPTIONAL",
    attendees: 12,
    capacity: 20,
    published: true,
    tone: "bg-blue-100 border-blue-500",
  },
];

// 整合性チェック：会議室バッティング・日程重複（静的サンプル）
interface ConflictWarning {
  id: string;
  message: string;
}

const CONFLICTS: ConflictWarning[] = [
  {
    id: "cf-1",
    message:
      "5月8日 会議室A：「定期健診（09:00-13:00）」と「UXワークショップ（13:00-15:00）」の利用時間が接しています。",
  },
];

function MonthGrid({ onSelect }: { onSelect: (e: AdminEvent) => void }) {
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
    <div className="grid grid-cols-7 border-l border-t border-default-200">
      {WEEKDAYS.map((w) => (
        <div
          key={w}
          className="bg-default-50 py-2 text-center text-xs font-bold text-default-500 border-r border-b border-default-200"
        >
          {w}
        </div>
      ))}
      {cells.map(({ key, day: d }) => {
        const dayEvents = d ? EVENTS.filter((e) => e.day === d) : [];
        return (
          <div
            key={key}
            className={`min-h-[110px] p-2 border-r border-b border-default-200 ${
              d === null ? "bg-default-50/50 opacity-50" : ""
            }`}
          >
            {d !== null && (
              <>
                <span className="text-xs font-bold text-default-700">{d}</span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onSelect(e)}
                      className={`w-full text-left border-l-4 p-1 rounded-r text-[11px] leading-tight cursor-pointer ${e.tone} ${
                        e.published ? "" : "opacity-60"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            e.source === "OPS" ? "bg-indigo-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="font-bold">{e.time}</span>
                        <span className="truncate">{e.title}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ListView({ onSelect }: { onSelect: (e: AdminEvent) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-default-50 text-default-500 text-xs">
            <th className="text-left font-medium px-4 py-3">日時</th>
            <th className="text-left font-medium px-4 py-3">イベント</th>
            <th className="text-left font-medium px-4 py-3">区分</th>
            <th className="text-left font-medium px-4 py-3">状態</th>
            <th className="text-left font-medium px-4 py-3">主催</th>
            <th className="text-left font-medium px-4 py-3">参加</th>
            <th className="text-left font-medium px-4 py-3">公開</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-default-100">
          {EVENTS.map((e) => (
            <tr key={e.id} className="hover:bg-default-50/60">
              <td className="px-4 py-3 whitespace-nowrap text-default-600">
                5/{e.day}{" "}
                <span className="text-default-400">
                  {e.time}-{e.endTime}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-default-900">
                {e.title}
                <span className="block text-xs text-default-400">
                  {e.category}・{e.place}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_META[e.source].badge}`}
                >
                  {SOURCE_META[e.source].label}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[e.status].badge}`}
                >
                  {STATUS_META[e.status].label}
                </span>
              </td>
              <td className="px-4 py-3 text-default-600 whitespace-nowrap">
                {e.organizer}
              </td>
              <td className="px-4 py-3 text-default-600 whitespace-nowrap">
                {e.joinType === "REQUIRED" ? (
                  <span className="text-red-600 font-medium">必須</span>
                ) : (
                  <>
                    {e.attendees}
                    {e.capacity ? `/${e.capacity}` : ""}名
                  </>
                )}
              </td>
              <td className="px-4 py-3">
                {e.published ? (
                  <span className="text-green-600 text-xs font-medium">
                    公開中
                  </span>
                ) : (
                  <span className="text-default-400 text-xs font-medium">
                    非公開
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSelect(e)}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  詳細
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventDrawer({
  event,
  onClose,
}: {
  event: AdminEvent;
  onClose: () => void;
}) {
  return (
    <>
      {/* overlay */}
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />
      {/* panel */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        {/* header */}
        <div className="px-6 py-5 border-b border-default-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_META[event.source].badge}`}
              >
                {SOURCE_META[event.source].label}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[event.status].badge}`}
              >
                {STATUS_META[event.status].label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-default-900">
              {event.title}
            </h2>
            <p className="text-sm text-default-500 mt-0.5">
              5月{event.day}日 {event.time} - {event.endTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-default-400 hover:text-default-700 text-xl leading-none"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {event.source === "POST" && (
            <p className="text-xs bg-amber-50 text-amber-700 rounded-lg p-3">
              このイベントは投稿から作成されています。本文・募集内容の編集は元の投稿画面で行います。
            </p>
          )}

          {/* 基本情報 */}
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-default-400">場所</dt>
              <dd className="text-default-800 text-right">{event.place}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-default-400">主催</dt>
              <dd className="text-default-800 text-right">{event.organizer}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-default-400">参加方式</dt>
              <dd className="text-default-800 text-right">
                {event.joinType === "REQUIRED" ? "全員必須" : "任意参加"}
              </dd>
            </div>
          </dl>

          {/* 参加・出欠 */}
          <section>
            <h3 className="text-sm font-bold text-default-900 mb-3">
              参加・出欠
            </h3>
            {event.joinType === "REQUIRED" ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-lg py-3">
                  <p className="text-lg font-bold text-green-600">
                    {event.attendees}
                  </p>
                  <p className="text-[11px] text-default-500">出席予定</p>
                </div>
                <div className="bg-amber-50 rounded-lg py-3">
                  <p className="text-lg font-bold text-amber-600">6</p>
                  <p className="text-[11px] text-default-500">未回答</p>
                </div>
                <div className="bg-red-50 rounded-lg py-3">
                  <p className="text-lg font-bold text-red-500">2</p>
                  <p className="text-[11px] text-default-500">欠席</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-default-50 rounded-lg px-4 py-3">
                <span className="text-sm text-default-600">参加表明</span>
                <span className="text-sm font-bold text-default-900">
                  {event.attendees}
                  {event.capacity ? ` / ${event.capacity}` : ""} 名
                </span>
              </div>
            )}
            <button
              type="button"
              className="mt-2 text-primary text-sm font-medium hover:underline"
            >
              参加者一覧を見る
            </button>
          </section>

          {/* モデレーション */}
          <section className="border-t border-default-100 pt-5">
            <h3 className="text-sm font-bold text-default-900 mb-3">
              モデレーション
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-default-600">カレンダーに公開</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.published
                      ? "bg-green-100 text-green-700"
                      : "bg-default-100 text-default-500"
                  }`}
                >
                  {event.published ? "公開中" : "非公開"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-default-400">カテゴリ</span>
                <span className="text-default-800">{event.category}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-default-400">公開範囲</span>
                <span className="text-default-800">{event.scope}</span>
              </div>
            </div>
          </section>
        </div>

        {/* footer actions：ライフサイクル管理 */}
        <div className="px-6 py-4 border-t border-default-200 bg-default-50 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 px-4 py-2 rounded-lg border border-default-300 bg-white text-sm font-medium text-default-700 hover:bg-default-100"
            >
              編集
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-2 rounded-lg border border-default-300 bg-white text-sm font-medium text-default-700 hover:bg-default-100"
            >
              延期
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-2 rounded-lg border border-default-300 bg-white text-sm font-medium text-default-700 hover:bg-default-100"
            >
              {event.published ? "非公開化" : "公開する"}
            </button>
          </div>
          <button
            type="button"
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
          >
            イベントを中止
          </button>
        </div>
      </aside>
    </>
  );
}

export function EventsAdminClient() {
  const [view, setView] = useState<AdminView>("MONTH");
  const [selected, setSelected] = useState<AdminEvent | null>(null);

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      {/* Title */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            社内イベントカレンダー管理
          </h1>
          <p className="text-default-500 text-sm mt-1">
            投稿由来・運営イベントを横断して確認し、出欠・公開・整合性を管理します
          </p>
        </div>
        <Link
          href="/company/events-admin/new"
          className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90"
        >
          イベント作成
        </Link>
      </div>

      {/* 整合性チェック：重複警告 */}
      {CONFLICTS.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600">⚠️</span>
            <h2 className="text-sm font-bold text-amber-800">
              整合性チェック（{CONFLICTS.length}件）
            </h2>
          </div>
          <ul className="space-y-1 pl-7 list-disc text-sm text-amber-800">
            {CONFLICTS.map((c) => (
              <li key={c.id}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters + view tabs */}
      <div className="bg-white p-5 rounded-xl border border-default-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <input
            className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="イベント名・投稿者・部署で検索"
            type="text"
          />
        </div>
        <select className="border border-default-200 rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-primary outline-none min-w-[140px]">
          <option>全イベント</option>
          <option>投稿由来のみ</option>
          <option>運営イベントのみ</option>
        </select>
        <select className="border border-default-200 rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-primary outline-none min-w-[140px]">
          <option>全ステータス</option>
          <option>開催予定</option>
          <option>本日開催</option>
          <option>開催終了</option>
        </select>
        <select className="border border-default-200 rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-primary outline-none min-w-[140px]">
          <option>全カテゴリ</option>
          <option>交流会</option>
          <option>勉強会</option>
          <option>研修</option>
        </select>
        <div className="flex bg-default-100 rounded-lg p-1 ml-auto">
          {VIEW_TABS.map((t) => {
            const active = view === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setView(t.key)}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-white shadow-sm text-primary font-bold"
                    : "text-default-500 hover:text-primary"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-default-200 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-default-900">2024年 5月</h3>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
            >
              今日
            </button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-default-500">
            {/* 横断一覧の凡例：A/B */}
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1" />
              投稿由来
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1" />
              運営
            </span>
            <span className="text-default-300">|</span>
            <span>
              <b className="text-default-900 mr-1">{EVENTS.length}</b> 件
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1" />
              <b className="text-default-900 mr-1">2</b> 本日開催
            </span>
          </div>
        </div>
        {view === "MONTH" ? (
          <MonthGrid onSelect={setSelected} />
        ) : view === "LIST" ? (
          <ListView onSelect={setSelected} />
        ) : (
          <div className="p-12 text-center text-default-400 text-sm">
            {VIEW_TABS.find((t) => t.key === view)?.label}表示は準備中です
          </div>
        )}
      </div>

      {selected && (
        <EventDrawer event={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
