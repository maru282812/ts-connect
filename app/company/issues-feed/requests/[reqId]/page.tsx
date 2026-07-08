import { IssueRequestDetailView } from "@/components/screens/IssueRequestDetailView";

interface Props {
  params: Promise<{ reqId: string }>;
}

export default async function CompanyIssueRequestDetailPage({ params }: Props) {
  const { reqId } = await params;
  return (
    <IssueRequestDetailView reqId={reqId} backHref="/company/issues-feed" />
  );
}
