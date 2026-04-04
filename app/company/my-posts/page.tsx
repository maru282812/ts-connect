import { MyPostsContent } from "@/components/features/MyPostsContent";

export default function CompanyMyPostsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-default-900">投稿一覧</h1>
        <p className="text-sm text-default-500 mt-1">
          自分が投稿したコンテンツの一覧・管理
        </p>
      </div>
      <MyPostsContent editBasePath="/company/posts" />
    </div>
  );
}
