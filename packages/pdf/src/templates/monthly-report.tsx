import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Cairo",
  fonts: [
    { src: "https://fonts.gstatic.com/s/cairo/v28/SLXGc1nY6HkvamImRJqExst1.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/cairo/v28/SLXGc1nY6HkvamImRJqExst1.ttf", fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Cairo", direction: "rtl" },
  cover: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: 700, color: "#1e3a8a", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#64748b", marginTop: 12, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#1e3a8a", marginBottom: 12, borderBottomWidth: 2, borderBottomColor: "#3b82f6", paddingBottom: 6 },
  text: { fontSize: 11, color: "#334155", lineHeight: 1.8, textAlign: "right" },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  scoreText: { fontSize: 28, fontWeight: 700, color: "#ffffff" },
  scoreLabel: { fontSize: 10, color: "#ffffff" },
  statsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginTop: 10 },
  statCard: { width: "30%", backgroundColor: "#f1f5f9", borderRadius: 8, padding: 12 },
  statValue: { fontSize: 16, fontWeight: 700, color: "#1e40af", textAlign: "center" },
  statLabel: { fontSize: 9, color: "#64748b", textAlign: "center", marginTop: 4 },
  kpiRow: { flexDirection: "row-reverse", padding: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", alignItems: "center" },
  kpiName: { fontSize: 11, color: "#334155", flex: 2, textAlign: "right" },
  kpiTarget: { fontSize: 11, color: "#64748b", flex: 1, textAlign: "center" },
  kpiActual: { fontSize: 11, fontWeight: 700, flex: 1, textAlign: "center" },
  kpiStatus: { width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  progressBar: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, marginTop: 4, width: "100%" },
  progressFill: { height: 6, borderRadius: 3 },
  achievementItem: { flexDirection: "row-reverse", marginBottom: 8, padding: 10, backgroundColor: "#f0fdf4", borderRadius: 6 },
  achievementBullet: { fontSize: 12, color: "#16a34a", marginLeft: 8 },
  achievementText: { fontSize: 11, color: "#334155", flex: 1, textAlign: "right" },
  recommendationItem: { flexDirection: "row-reverse", marginBottom: 8, padding: 10, backgroundColor: "#eff6ff", borderRadius: 6 },
  recommendationBullet: { fontSize: 12, color: "#2563eb", marginLeft: 8 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row-reverse", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#94a3b8" },
});

interface ReportPDFProps {
  companyName: string;
  month: string;
  overallScore: number;
  executiveSummary: string;
  achievements: string[];
  kpiResults: Array<{ name: string; target: number; actual: number; unit: string }>;
  platformStats: Array<{ platform: string; followers: number; reach: number; engagement_rate: number }>;
  campaignResults: Array<{ name: string; platform: string; spend: number; results: number; roas: number }>;
  budgetPlanned: number;
  budgetSpent: number;
  aiRecommendations: string[];
  agencyName?: string;
}

export function MonthlyReportPDF({
  companyName,
  month,
  overallScore,
  executiveSummary,
  achievements,
  kpiResults,
  platformStats,
  campaignResults,
  budgetPlanned,
  budgetSpent,
  aiRecommendations,
  agencyName = "MarketPro",
}: ReportPDFProps) {
  const scoreColor = overallScore >= 8 ? "#16a34a" : overallScore >= 6 ? "#d97706" : "#dc2626";

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <View style={{ ...s.scoreCircle, backgroundColor: scoreColor }}>
            <Text style={s.scoreText}>{overallScore}</Text>
            <Text style={s.scoreLabel}>/ 10</Text>
          </View>
          <Text style={s.title}>تقرير الإنجازات الشهري</Text>
          <Text style={{ ...s.subtitle, fontSize: 20, fontWeight: 700, color: "#1e40af", marginTop: 16 }}>
            {companyName}
          </Text>
          <Text style={s.subtitle}>{month}</Text>
          <Text style={{ ...s.subtitle, fontSize: 12, marginTop: 24, color: "#94a3b8" }}>
            إعداد: {agencyName}
          </Text>
        </View>
      </Page>

      {/* Summary + Achievements */}
      <Page size="A4" style={s.page}>
        <View style={{ marginBottom: 20 }}>
          <Text style={s.sectionTitle}>الملخص التنفيذي</Text>
          <Text style={s.text}>{executiveSummary}</Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={s.sectionTitle}>إنجازات الشهر</Text>
          {achievements.map((item, i) => (
            <View key={i} style={s.achievementItem}>
              <Text style={s.achievementBullet}>✓</Text>
              <Text style={s.achievementText}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>{agencyName}</Text>
          <Text style={s.footerText}>2</Text>
        </View>
      </Page>

      {/* KPIs */}
      <Page size="A4" style={s.page}>
        <View style={{ marginBottom: 20 }}>
          <Text style={s.sectionTitle}>مؤشرات الأداء</Text>
          {kpiResults.map((kpi, i) => {
            const progress = Math.min((kpi.actual / kpi.target) * 100, 100);
            const color = progress >= 100 ? "#16a34a" : progress >= 80 ? "#d97706" : "#dc2626";
            return (
              <View key={i} style={{ marginBottom: 12, padding: 10, backgroundColor: "#f8fafc", borderRadius: 6 }}>
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, fontWeight: 700, color: "#334155", textAlign: "right" }}>{kpi.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: 700, color }}>
                    {kpi.actual} / {kpi.target} {kpi.unit}
                  </Text>
                </View>
                <View style={s.progressBar}>
                  <View style={{ ...s.progressFill, width: `${progress}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={s.sectionTitle}>أداء المنصات</Text>
          <View style={s.statsGrid}>
            {platformStats.map((p, i) => (
              <View key={i} style={s.statCard}>
                <Text style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", textAlign: "center" }}>{p.platform}</Text>
                <Text style={{ fontSize: 9, color: "#64748b", textAlign: "center", marginTop: 4 }}>
                  {p.followers.toLocaleString()} متابع
                </Text>
                <Text style={{ fontSize: 9, color: "#64748b", textAlign: "center" }}>
                  وصول: {p.reach.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 9, color: "#16a34a", textAlign: "center", fontWeight: 700 }}>
                  تفاعل: {p.engagement_rate}%
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>{agencyName}</Text>
          <Text style={s.footerText}>3</Text>
        </View>
      </Page>

      {/* Budget + Recommendations */}
      <Page size="A4" style={s.page}>
        <View style={{ marginBottom: 20 }}>
          <Text style={s.sectionTitle}>تحليل الميزانية</Text>
          <View style={{ flexDirection: "row-reverse", gap: 20, marginTop: 10 }}>
            <View style={{ ...s.statCard, width: "45%" }}>
              <Text style={s.statLabel}>المخطط</Text>
              <Text style={s.statValue}>${budgetPlanned.toLocaleString()}</Text>
            </View>
            <View style={{ ...s.statCard, width: "45%" }}>
              <Text style={s.statLabel}>المنفق</Text>
              <Text style={s.statValue}>${budgetSpent.toLocaleString()}</Text>
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 10, color: "#64748b", textAlign: "right" }}>
              نسبة الاستخدام: {Math.round((budgetSpent / budgetPlanned) * 100)}%
            </Text>
            <View style={s.progressBar}>
              <View style={{ ...s.progressFill, width: `${Math.min((budgetSpent / budgetPlanned) * 100, 100)}%`, backgroundColor: "#3b82f6" }} />
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={s.sectionTitle}>توصيات الذكاء الاصطناعي للشهر القادم</Text>
          {aiRecommendations.map((rec, i) => (
            <View key={i} style={s.recommendationItem}>
              <Text style={s.recommendationBullet}>💡</Text>
              <Text style={{ ...s.achievementText }}>{rec}</Text>
            </View>
          ))}
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>{agencyName}</Text>
          <Text style={s.footerText}>4</Text>
        </View>
      </Page>
    </Document>
  );
}
