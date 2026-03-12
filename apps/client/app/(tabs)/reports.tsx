import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";

export default function ReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("company_id", profile.company_id)
      .in("status", ["ready", "sent"])
      .order("month", { ascending: false });
    if (data) setReports(data);
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function markViewed(id: string) {
    await supabase
      .from("monthly_reports")
      .update({ viewed_by_client: true })
      .eq("id", id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, viewed_by_client: true } : r));
  }

  function getMonthName(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <Text style={styles.pageTitle}>التقارير الشهرية</Text>

      {reports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>لا توجد تقارير بعد</Text>
          <Text style={styles.emptySubtext}>ستظهر تقارير الأداء هنا عند إعدادها</Text>
        </View>
      ) : (
        reports.map((report) => {
          const data = report.report_data as any;
          const score = data?.overall_score || 0;
          const scoreColor = score >= 8 ? "#16a34a" : score >= 6 ? "#d97706" : score > 0 ? "#dc2626" : "#94a3b8";

          return (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => { if (!report.viewed_by_client) markViewed(report.id); }}
              activeOpacity={0.8}
            >
              <View style={styles.reportHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportMonth}>{getMonthName(report.month)}</Text>
                  <Text style={styles.reportStatus}>
                    {report.status === "sent" ? "✓ مُرسل" : "جاهز"}
                  </Text>
                </View>
                {score > 0 && (
                  <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}>
                    <Text style={styles.scoreText}>{score}</Text>
                  </View>
                )}
              </View>

              {data?.summary && (
                <Text style={styles.summary}>{data.summary}</Text>
              )}

              {data?.achievements?.length > 0 && (
                <View style={styles.achievements}>
                  {data.achievements.slice(0, 3).map((a: string, i: number) => (
                    <Text key={i} style={styles.achievementItem}>✓ {a}</Text>
                  ))}
                </View>
              )}

              {data?.ai_insights?.length > 0 && (
                <View style={styles.insights}>
                  <Text style={styles.insightsTitle}>رؤى الذكاء الاصطناعي:</Text>
                  {data.ai_insights.slice(0, 3).map((insight: string, i: number) => (
                    <Text key={i} style={styles.insightItem}>• {insight}</Text>
                  ))}
                </View>
              )}

              {data?.next_month_recommendations?.length > 0 && (
                <View style={styles.recommendations}>
                  <Text style={styles.insightsTitle}>توصيات الشهر القادم:</Text>
                  {data.next_month_recommendations.slice(0, 3).map((rec: string, i: number) => (
                    <Text key={i} style={styles.recItem}>→ {rec}</Text>
                  ))}
                </View>
              )}

              {report.pdf_url && (
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => Linking.openURL(report.pdf_url)}
                >
                  <Text style={styles.downloadBtnText}>📄 تحميل التقرير PDF</Text>
                </TouchableOpacity>
              )}

              {report.viewed_by_client && (
                <Text style={styles.viewedText}>✓ تمت المشاهدة</Text>
              )}
            </TouchableOpacity>
          );
        })
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
  reportCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  reportHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  reportMonth: { fontSize: 16, fontWeight: "700", color: "#0f172a", textAlign: "right" },
  reportStatus: { fontSize: 12, color: "#64748b", marginTop: 2, textAlign: "right" },
  scoreCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  scoreText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  summary: { fontSize: 13, color: "#334155", lineHeight: 22, marginTop: 12, textAlign: "right" },
  achievements: { marginTop: 12, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12 },
  achievementItem: { fontSize: 13, color: "#166534", lineHeight: 24, textAlign: "right" },
  insights: { marginTop: 12, backgroundColor: "#f5f3ff", borderRadius: 10, padding: 12 },
  insightsTitle: { fontSize: 12, fontWeight: "700", color: "#6d28d9", marginBottom: 6, textAlign: "right" },
  insightItem: { fontSize: 12, color: "#5b21b6", lineHeight: 22, textAlign: "right" },
  recommendations: { marginTop: 12, backgroundColor: "#eff6ff", borderRadius: 10, padding: 12 },
  recItem: { fontSize: 12, color: "#1e40af", lineHeight: 22, textAlign: "right" },
  downloadBtn: { backgroundColor: "#eff6ff", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  downloadBtnText: { fontSize: 14, fontWeight: "600", color: "#2563eb" },
  viewedText: { fontSize: 11, color: "#16a34a", marginTop: 8, textAlign: "right" },
});
