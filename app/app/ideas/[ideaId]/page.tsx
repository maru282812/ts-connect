import { IdeaDetailView } from "@/components/screens/IdeaDetailView";

interface Props {
  params: Promise<{ ideaId: string }>;
}

export default async function IdeaDetailPage({ params }: Props) {
  const { ideaId } = await params;
  return <IdeaDetailView ideaId={ideaId} />;
}
