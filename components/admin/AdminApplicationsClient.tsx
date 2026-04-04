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
import type { ApplicationStatus, ApplicationType } from "@/types/database";

export interface ApplicationRow {
  id: string;
  post_id: string;
  applicant_name_snapshot: string;
  applicant_email_snapshot: string;
  applicant_company_snapshot: string | null;
  post_title_snapshot: string;
  application_type: ApplicationType;
  application_status: ApplicationStatus;
  applied_at: string;
  message: string | null;
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

interface Props {
  applications: ApplicationRow[];
}

export function AdminApplicationsClient({ applications }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <Table aria-label="応募・問い合わせ一覧" removeWrapper>
        <TableHeader>
          <TableColumn>案件タイトル</TableColumn>
          <TableColumn>応募者</TableColumn>
          <TableColumn>所属</TableColumn>
          <TableColumn>種別</TableColumn>
          <TableColumn>応募日時</TableColumn>
          <TableColumn>状態</TableColumn>
        </TableHeader>
        <TableBody emptyContent="応募はまだありません">
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <span className="font-medium text-default-800 line-clamp-1 max-w-xs">
                  {app.post_title_snapshot}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium text-default-800">
                    {app.applicant_name_snapshot}
                  </p>
                  <p className="text-xs text-default-400">
                    {app.applicant_email_snapshot}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-600">
                  {app.applicant_company_snapshot ?? "—"}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
