import { notFound } from "next/navigation";

import { GoodsFormClient } from "@/components/screens/GoodsFormClient";
import { getGoodsById } from "@/lib/mock/goods";

export default async function CompanyGoodsEditPage({
  params,
}: {
  params: Promise<{ goodsId: string }>;
}) {
  const { goodsId } = await params;
  const goods = getGoodsById(goodsId);

  if (!goods) {
    notFound();
  }

  return (
    <GoodsFormClient
      mode="edit"
      initial={{
        name: goods.name,
        variant: goods.variant,
        category: goods.category,
        points: goods.pointsValue,
        description: goods.description,
        status: goods.status,
      }}
    />
  );
}
