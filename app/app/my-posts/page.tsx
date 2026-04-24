import { MyPostsContent } from "@/components/features/MyPostsContent";

interface Props {
  searchParams: Promise<{ success?: string }>;
}

export default async function MyPostsPage({ searchParams }: Props) {
  const { success } = await searchParams;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-default-900">投稿一覧</h1>
        <p className="text-sm text-default-500 mt-1">
          自分が投稿したコンテンツの一覧・管理
        </p>
      </div>
      <MyPostsContent editBasePath="/app/posts" successParam={success} />
    </div>
  );
}
