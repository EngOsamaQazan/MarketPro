import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { supabase } from "@/lib/supabase";

export default function PlanScreen() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
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
    load();
  }, []);

  const statusColors: Record<string, string> = {
    draft: "#94a3b8", pending_approval: "#3b82f6", approved: "#16a34a",
    in_progress: "#8b5cf6", completed: "#059669",
  };

  const statusLabels: Record<string, string> = {
    draft: "مسودة", pending_approval: "بانتظار الموافقة", approved: "معتمدة",
    in_progress: "قيد التنفيذ", completed: "مكتملة",
  };

  return (
    <ScrollView style={styles.container}>
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
              <View style={[styles.badge, { backgroundColor: statusColors[plan.status] + "20" }]}>
                <Text style={[styles.badgeText, { color: statusColors[plan.status] }]}>
                  {statusLabels[plan.status] || plan.status}
                </Text>
              </View>
            </View>

            <Text style={styles.planBudget}>
              الميزانية: ${plan.total_budget?.toLocaleString()}
            </Text>

            {plan.objectives?.length > 0 && (
              <View style={styles.objectives}>
                {plan.objectives.map((obj: string, i: number) => (
                  <Text key={i} style={styles.objectiveItem}>• {obj}</Text>
                ))}
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
  objectives: { marginTop: 12, backgroundColor: "#f8fafc", borderRadius: 10, padding: 12 },
  objectiveItem: { fontSize: 13, color: "#334155", lineHeight: 24, textAlign: "right" },
  downloadBtn: { backgroundColor: "#eff6ff", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  downloadBtnText: { fontSize: 14, fontWeight: "600", color: "#2563eb" },
});
