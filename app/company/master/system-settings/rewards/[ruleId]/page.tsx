import { RewardRuleDetailClient } from "@/components/screens/RewardRuleDetailClient";

export default async function RewardRuleDetailPage({
  params,
}: {
  params: Promise<{ ruleId: string }>;
}) {
  const { ruleId } = await params;
  return <RewardRuleDetailClient ruleId={ruleId} />;
}
