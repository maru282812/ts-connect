import { IssueDetailView } from "@/components/screens/IssueDetailView";

interface Props {
  params: Promise<{ issueId: string }>;
}

export default async function IssueDetailPage({ params }: Props) {
  const { issueId } = await params;
  return <IssueDetailView issueId={issueId} />;
}
