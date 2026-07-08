import { GoodsDetailClient } from "@/components/screens/GoodsDetailClient";

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function GoodsDetailPage({ params }: Props) {
  const { productId } = await params;
  return <GoodsDetailClient productId={productId} basePath="/app/goods" />;
}
