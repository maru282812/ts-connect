"use client";

import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { ApplicationListCard } from "@/components/common/ApplicationListCard";
import type {
  ApplicationStatus,
  ApplicationType,
  ApplicationWithPost,
} from "@/types/database";

interface ApplicationTableProps {
  applications: ApplicationWithPost[];
}

const typeColorMap: Record<ApplicationType, "primary" | "secondary"> = {
  APPLY: "primary",
  INQUIRY: "secondary",
};

const typeLabelMap: Record<ApplicationType, string> = {
  APPLY: "応募",
  INQUIRY: "問い合わせ",
};

const statusColorMap: Record<
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

const statusLabelMap: Record<ApplicationStatus, string> = {
  APPLIED: "応募済",
  REVIEWING: "審査中",
  ACCEPTED: "採用",
  REJECTED: "不採用",
  CANCELED: "取り消し",
  INQUIRY: "問い合わせ済",
};

export function ApplicationTable({ applications }: ApplicationTableProps) {
  return (
    <>
      {/* ── PC テーブル (lg 以上) ── */}
      <div className="hidden lg:block">
        <Table aria-label="応募・問い合わせ一覧" removeWrapper>
          <TableHeader>
            <TableColumn>案件タイトル</TableColumn>
            <TableColumn>応募形式</TableColumn>
            <TableColumn>応募日時</TableColumn>
            <TableColumn>状態</TableColumn>
            <TableColumn>送信先</TableColumn>
          </TableHeader>
          <TableBody emptyContent="応募・問い合わせ履歴がありません">
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <span className="font-medium text-default-800">
                    {app.post_title_snapshot}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    color={typeColorMap[app.application_type]}
                    size="sm"
                    variant="flat"
                  >
                    {typeLabelMap[app.application_type]}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-default-500">
                    {new Date(app.applied_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    color={statusColorMap[app.application_status]}
                    size="sm"
                    variant="flat"
                  >
                    {statusLabelMap[app.application_status]}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-default-400">
                    {app.applicant_email_snapshot}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── モバイル / タブレット カード (lg 未満) ── */}
      <div className="lg:hidden p-3">
        {applications.length === 0 ? (
          <p className="text-center py-8 text-sm text-default-400">
            応募・問い合わせ履歴がありません
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {applications.map((app) => (
              <ApplicationListCard
                key={app.id}
                postTitle={app.post_title_snapshot}
                applicationType={app.application_type}
                applicationStatus={app.application_status}
                appliedAt={app.applied_at}
                sentTo={app.applicant_email_snapshot}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
