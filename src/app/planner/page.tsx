import { getDailyPlan } from "@/lib/plannerData";
import { format } from "date-fns";
import PlannerClient from "./PlannerClient";

export const dynamic = "force-dynamic";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dateStr = params.date ?? format(new Date(), "yyyy-MM-dd");
  const plan = await getDailyPlan(dateStr);

  return <PlannerClient dateStr={dateStr} plan={plan} />;
}
