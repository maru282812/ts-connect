import { CasualPostsList } from "@/components/features/CasualPostsList";

interface CasualPostsPageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function CasualPostsPage({
  searchParams,
}: CasualPostsPageProps) {
  const { success } = await searchParams;
  return <CasualPostsList mode="user" successParam={success} />;
}
