import { NotificationsListClient } from "@/components/features/NotificationsListClient";

export default function NotificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-default-900">通知</h1>
        <p className="mt-1 text-sm text-default-500">
          自分に関連する更新の一覧
        </p>
      </div>
      <NotificationsListClient />
    </div>
  );
}
