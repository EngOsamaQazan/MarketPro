import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { supabase } from "@/lib/supabase";

export default function ReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) return;
      const { data } = await supabase
        .from("monthly_reports")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("month", { ascending: false });
      if (data) setReports(data);
    }
    load();
  }, []);

  function getMonthName(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>التقارير الشهرية</Text>

      {reports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>لا توجد تقارير بعد</Text>
        </View>
      ) : (
        reports.map((report) => {
          const data = report.report_data as any;
          const score = data?.overall_score || 0;
          const scoreColor = score >= 8 ? "#16a34a" : score >= 6 ? "#d97706" : "#dc2626";

          return (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View>
                  <Text style={styles.reportMonth}>{getMonthName(report.month)}</Text>
                  <Text style={styles.reportStatus}>
                    {report.status === "sent" ? "✓ مُرسل" : report.status === "ready" ? "جاهز" : "جاري الإنشاء"}
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

              {report.pdf_url && (
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => Linking.openURL(report.pdf_url)}
                >
                  <Text style={styles.downloadBtnText}>📄 تحميل التقرير PDF</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
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
  reportCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  reportHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  reportMonth: { fontSize: 16, fontWeight: "700", color: "#0f172a", textAlign: "right" },
  reportStatus: { fontSize: 12, color: "#64748b", marginTop: 2, textAlign: "right" },
  scoreCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  scoreText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  summary: { fontSize: 13, color: "#334155", lineHeight: 22, marginTop: 12, textAlign: "right" },
  achievements: { marginTop: 12, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12 },
  achievementItem: { fontSize: 13, color: "#166534", lineHeight: 24, textAlign: "right" },
  downloadBtn: { backgroundColor: "#eff6ff", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  downloadBtnText: { fontSize: 14, fontWeight: "600", color: "#2563eb" },
});
