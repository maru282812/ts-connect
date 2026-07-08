import { GoodsDetailClient } from "@/components/screens/GoodsDetailClient";

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function CompanyGoodsDetailPage({ params }: Props) {
  const { productId } = await params;
  return (
    <GoodsDetailClient
      productId={productId}
      basePath="/company/goods-catalog"
    />
  );
}
