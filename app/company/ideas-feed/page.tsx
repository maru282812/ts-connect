import { IdeasListClient } from "@/components/screens/IdeasListClient";

export default function CompanyIdeasFeedPage() {
  return (
    <IdeasListClient
      ideasBasePath="/company/ideas-feed"
      newHref="/company/ideas-feed/new"
    />
  );
}
