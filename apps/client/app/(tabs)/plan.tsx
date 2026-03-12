import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";

const platformEmoji: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵",
  snapchat: "👻", x: "𝕏", linkedin: "💼", youtube: "▶️",
};

export default function PlanScreen() {
  const [plans, setPlans] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("marketing_plans")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("month", { ascending: false });
    if (data) setPlans(data);
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const statusColors: Record<string, string> = {
    draft: "#94a3b8", pending_approval: "#3b82f6", approved: "#16a34a",
    in_progress: "#8b5cf6", completed: "#059669",
  };

  const statusLabels: Record<string, string> = {
    draft: "مسودة", pending_approval: "بانتظار الموافقة", approved: "معتمدة",
    in_progress: "قيد التنفيذ", completed: "مكتملة",
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <Text style={styles.pageTitle}>خطط التسويق</Text>

      {plans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>لا توجد خطط بعد</Text>
          <Text style={styles.emptySubtext}>سيتم إنشاء خطتك التسويقية قريباً</Text>
        </View>
      ) : (
        plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <View style={[styles.badge, { backgroundColor: (statusColors[plan.status] || "#94a3b8") + "20" }]}>
                <Text style={[styles.badgeText, { color: statusColors[plan.status] || "#94a3b8" }]}>
                  {statusLabels[plan.status] || plan.status}
                </Text>
              </View>
            </View>

            <Text style={styles.planBudget}>
              الميزانية: ${plan.total_budget?.toLocaleString()}
            </Text>

            {plan.target_platforms?.length > 0 && (
              <View style={styles.platformsRow}>
                {plan.target_platforms.map((p: string) => (
                  <View key={p} style={styles.platformBadge}>
                    <Text style={styles.platformText}>{platformEmoji[p] || "📊"} {p}</Text>
                  </View>
                ))}
              </View>
            )}

            {plan.objectives?.length > 0 && (
              <View style={styles.objectives}>
                <Text style={styles.objectivesTitle}>الأهداف:</Text>
                {plan.objectives.map((obj: string, i: number) => (
                  <Text key={i} style={styles.objectiveItem}>• {obj}</Text>
                ))}
              </View>
            )}

            {plan.kpis && Object.keys(plan.kpis).length > 0 && (
              <View style={styles.kpisSection}>
                <Text style={styles.objectivesTitle}>مؤشرات الأداء:</Text>
                <View style={styles.kpisGrid}>
                  {Object.entries(plan.kpis).slice(0, 4).map(([key, kpi]: [string, any]) => (
                    <View key={key} style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>{key.replace(/_/g, " ")}</Text>
                      <Text style={styles.kpiValue}>
                        {typeof kpi === "object" && kpi?.target
                          ? `${kpi.target.toLocaleString()} ${kpi.unit || ""}`
                          : String(kpi)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {plan.pdf_url && (
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => Linking.openURL(plan.pdf_url)}
              >
                <Text style={styles.downloadBtnText}>📄 تحميل PDF</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 16, textAlign: "right" },
  emptyCard: { backgroundColor: "#fff", borderRadius: 20, padding: 40, alignItems: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#334155" },
  emptySubtext: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  planCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  planHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start" },
  planTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", flex: 1, textAlign: "right" },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  planBudget: { fontSize: 13, color: "#64748b", marginTop: 8, textAlign: "right" },
  platformsRow: { flexDirection: "row-reverse", gap: 6, marginTop: 10, flexWrap: "wrap" },
  platformBadge: { backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  platformText: { fontSize: 11, color: "#475569" },
  objectives: { marginTop: 12, backgroundColor: "#f8fafc", borderRadius: 10, padding: 12 },
  objectivesTitle: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6, textAlign: "right" },
  objectiveItem: { fontSize: 13, color: "#334155", lineHeight: 24, textAlign: "right" },
  kpisSection: { marginTop: 12 },
  kpisGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 4 },
  kpiCard: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 10, minWidth: "45%" as any, flex: 1 },
  kpiLabel: { fontSize: 10, color: "#94a3b8", textAlign: "right" },
  kpiValue: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginTop: 2, textAlign: "right" },
  downloadBtn: { backgroundColor: "#eff6ff", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  downloadBtnText: { fontSize: 14, fontWeight: "600", color: "#2563eb" },
});
