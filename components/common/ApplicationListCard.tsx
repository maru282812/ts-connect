"use client";

import { Chip } from "@heroui/react";
import type { ApplicationStatus, ApplicationType } from "@/types/database";

export const typeColorMap: Record<ApplicationType, "primary" | "secondary"> = {
  APPLY: "primary",
  INQUIRY: "secondary",
};

export const typeLabelMap: Record<ApplicationType, string> = {
  APPLY: "応募",
  INQUIRY: "問い合わせ",
};

export const statusColorMap: Record<
  ApplicationStatus,
  "default" | "primary" | "success" | "danger" | "warning" | "secondary"
> = {
  APPLIED: "primary",
  REVIEWING: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
  CANCELED: "default",
  INQUIRY: "secondary",
};

export const statusLabelMap: Record<ApplicationStatus, string> = {
  APPLIED: "応募済",
  REVIEWING: "審査中",
  ACCEPTED: "採用",
  REJECTED: "不採用",
  CANCELED: "取り消し",
  INQUIRY: "問い合わせ済",
};

interface ApplicationListCardProps {
  postTitle: string;
  applicationType: ApplicationType;
  applicationStatus: ApplicationStatus;
  appliedAt: string;
  /** 管理者画面用 */
  applicantName?: string;
  applicantEmail?: string;
  applicantCompany?: string | null;
  /** ユーザー画面用 */
  sentTo?: string;
}

export function ApplicationListCard({
  postTitle,
  applicationType,
  applicationStatus,
  appliedAt,
  applicantName,
  applicantEmail,
  applicantCompany,
  sentTo,
}: ApplicationListCardProps) {
  const isAdmin = applicantName !== undefined;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      {/* Top: Post title + type chip */}
      <div className="flex items-start gap-2 mb-3">
        <h3 className="flex-1 font-medium text-sm text-slate-900 line-clamp-2 leading-snug">
          {postTitle}
        </h3>
        <Chip
          color={typeColorMap[applicationType]}
          size="sm"
          variant="flat"
          className="shrink-0"
        >
          {typeLabelMap[applicationType]}
        </Chip>
      </div>

      {/* Middle: Meta info */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-100">
        {isAdmin && (
          <div className="col-span-2">
            <dt className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
              応募者
            </dt>
            <dd className="text-xs font-medium text-slate-700">
              {applicantName}
            </dd>
            {applicantEmail && (
              <dd className="text-xs text-slate-400">{applicantEmail}</dd>
            )}
          </div>
        )}

        {isAdmin && (
          <div>
            <dt className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
              所属
            </dt>
            <dd className="text-xs text-slate-600">
              {applicantCompany ?? "—"}
            </dd>
          </div>
        )}

        <div className={isAdmin ? "" : "col-span-2"}>
          <dt className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
            応募日時
          </dt>
          <dd className="text-xs text-slate-600">
            {new Date(appliedAt).toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </dd>
        </div>

        {sentTo && (
          <div className="col-span-2">
            <dt className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
              送信先
            </dt>
            <dd className="text-xs text-slate-400">{sentTo}</dd>
          </div>
        )}
      </dl>

      {/* Bottom: Status */}
      <div className="flex items-center pt-3 mt-3 border-t border-slate-100">
        <Chip
          color={statusColorMap[applicationStatus]}
          size="sm"
          variant="flat"
        >
          {statusLabelMap[applicationStatus]}
        </Chip>
      </div>
    </div>
  );
}
