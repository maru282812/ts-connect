import { IssueDetailView } from "@/components/screens/IssueDetailView";

interface Props {
  params: Promise<{ issueId: string }>;
}

export default async function CompanyIssueDetailPage({ params }: Props) {
  const { issueId } = await params;
  return (
    <IssueDetailView
      issueId={issueId}
      issuesBasePath="/company/issues-feed"
      ideaNewHref="/company/ideas-feed"
      ideasBasePath="/company/ideas-feed"
    />
  );
}
