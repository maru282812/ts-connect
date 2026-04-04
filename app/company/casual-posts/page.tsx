import { CasualPostsList } from "@/components/features/CasualPostsList";

interface CompanyCasualPostsPageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function CompanyCasualPostsPage({
  searchParams,
}: CompanyCasualPostsPageProps) {
  const { success } = await searchParams;
  return <CasualPostsList mode="admin" successParam={success} />;
}
