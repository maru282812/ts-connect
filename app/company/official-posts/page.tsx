import { Suspense } from "react";
import { PostsPageClient } from "@/components/features/PostsPageClient";

export default function CompanyOfficialPostsPage() {
  return (
    <Suspense
      fallback={<div className="bg-white rounded-xl h-96 animate-pulse" />}
    >
      <PostsPageClient newPostHref="/company/casual-posts/new" />
    </Suspense>
  );
}
