import { IdeaDetailView } from "@/components/screens/IdeaDetailView";

interface Props {
  params: Promise<{ ideaId: string }>;
}

export default async function CompanyIdeaDetailPage({ params }: Props) {
  const { ideaId } = await params;
  return (
    <IdeaDetailView
      ideaId={ideaId}
      ideasBasePath="/company/ideas-feed"
      issuesBasePath="/company/issues-feed"
    />
  );
}
