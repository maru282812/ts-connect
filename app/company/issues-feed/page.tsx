import { IssuesListClient } from "@/components/screens/IssuesListClient";

export default function CompanyIssuesFeedPage() {
  return (
    <IssuesListClient
      issuesBasePath="/company/issues-feed"
      ideaNewHref="/company/ideas-feed/new"
      consultHref="/company/issues-feed/consult"
    />
  );
}
