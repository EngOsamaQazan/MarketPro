import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "./auth";

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
}

const METRIC_TO_LIMIT_KEY: Record<string, string> = {
  clients: "max_clients",
  posts: "max_posts_month",
  campaigns: "max_campaigns",
  ai_credits: "ai_credits_month",
  team_members: "max_team_members",
};

const CUMULATIVE_METRICS = new Set(["clients", "team_members"]);

export async function checkUsageLimit(
  auth: AuthContext,
  metric: string
): Promise<LimitCheckResult> {
  const limitKey = METRIC_TO_LIMIT_KEY[metric] || metric;

  const { data: org } = await auth.supabase
    .from("organizations")
    .select("limits")
    .eq("id", auth.orgId)
    .single();

  const limits = (org?.limits as Record<string, number>) || {};
  const limit = limits[limitKey];

  if (limit === undefined || limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  let current: number;

  if (CUMULATIVE_METRICS.has(metric)) {
    const table = metric === "clients" ? "companies" : "organization_members";
    const { count } = await auth.supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", auth.orgId);
    current = count || 0;
  } else {
    const period = new Date().toISOString().slice(0, 7);
    const { data: logs } = await auth.supabase
      .from("usage_logs")
      .select("count")
      .eq("organization_id", auth.orgId)
      .eq("metric", metric)
      .eq("period", period);

    current = (logs || []).reduce((sum, l) => sum + (l.count || 0), 0);
  }

  return { allowed: current < limit, current, limit };
}

export async function logUsage(
  supabase: SupabaseClient,
  orgId: string,
  metric: string,
  count: number = 1
): Promise<void> {
  const period = new Date().toISOString().slice(0, 7);
  await supabase.from("usage_logs").insert({
    organization_id: orgId,
    metric,
    count,
    period,
  });
}
