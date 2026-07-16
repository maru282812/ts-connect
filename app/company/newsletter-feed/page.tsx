import { NewsletterListClient } from "@/components/screens/NewsletterListClient";

// 社内報の閲覧（admin 面）。管理・編集は /company/newsletter（社内報管理）と別導線。
export default function CompanyNewsletterFeedPage() {
  return <NewsletterListClient basePath="/company/newsletter-feed" />;
}
