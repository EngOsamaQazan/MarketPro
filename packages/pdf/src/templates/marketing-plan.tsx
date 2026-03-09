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
  coverTitle: { fontSize: 28, fontWeight: 700, color: "#1e3a8a", textAlign: "center" },
  coverSubtitle: { fontSize: 16, color: "#64748b", marginTop: 12, textAlign: "center" },
  coverDate: { fontSize: 12, color: "#94a3b8", marginTop: 24 },
  coverCompany: { fontSize: 20, color: "#1e40af", marginTop: 8, fontWeight: 700 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#1e3a8a", marginBottom: 12, borderBottomWidth: 2, borderBottomColor: "#3b82f6", paddingBottom: 6 },
  text: { fontSize: 11, color: "#334155", lineHeight: 1.8, textAlign: "right" },
  row: { flexDirection: "row-reverse", marginBottom: 4 },
  bullet: { fontSize: 11, color: "#3b82f6", marginLeft: 8, width: 16, textAlign: "center" },
  bulletText: { fontSize: 11, color: "#334155", flex: 1, textAlign: "right" },
  statsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginTop: 10 },
  statCard: { width: "30%", backgroundColor: "#f1f5f9", borderRadius: 8, padding: 12 },
  statValue: { fontSize: 18, fontWeight: 700, color: "#1e40af", textAlign: "center" },
  statLabel: { fontSize: 9, color: "#64748b", textAlign: "center", marginTop: 4 },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: "row-reverse", backgroundColor: "#1e3a8a", padding: 8, borderRadius: 4 },
  tableHeaderText: { fontSize: 10, color: "#ffffff", fontWeight: 700, flex: 1, textAlign: "center" },
  tableRow: { flexDirection: "row-reverse", padding: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tableCell: { fontSize: 10, color: "#334155", flex: 1, textAlign: "center" },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row-reverse", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#94a3b8" },
  badge: { backgroundColor: "#dbeafe", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4, marginBottom: 4 },
  badgeText: { fontSize: 9, color: "#1d4ed8" },
  badgeRow: { flexDirection: "row-reverse", flexWrap: "wrap", marginTop: 6 },
});

interface PlanPDFProps {
  companyName: string;
  companyNameEn?: string;
  month: string;
  executiveSummary: string;
  objectives: Array<{ goal: string; metric: string; target_value: string }>;
  platformStrategy: Record<string, { why: string; content_types: string[]; posting_frequency: string; budget_allocation: string }>;
  adCampaigns: Array<{ name: string; platform: string; objective: string; budget: string; expected_results: Record<string, string> }>;
  budgetBreakdown: Record<string, { amount: number; percentage: number }>;
  kpis: Array<{ name: string; target: string; measurement: string }>;
  agencyName?: string;
}

export function MarketingPlanPDF({
  companyName,
  companyNameEn,
  month,
  executiveSummary,
  objectives,
  platformStrategy,
  adCampaigns,
  budgetBreakdown,
  kpis,
  agencyName = "MarketPro",
}: PlanPDFProps) {
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <Text style={s.coverTitle}>خطة التسويق الرقمي</Text>
          <Text style={s.coverCompany}>{companyName}</Text>
          {companyNameEn && <Text style={{ ...s.coverSubtitle, fontSize: 14 }}>{companyNameEn}</Text>}
          <Text style={s.coverSubtitle}>{month}</Text>
          <Text style={s.coverDate}>إعداد: {agencyName}</Text>
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>{agencyName}</Text>
          <Text style={s.footerText}>سري - للاستخدام الداخلي</Text>
        </View>
      </Page>

      {/* Executive Summary + Objectives */}
      <Page size="A4" style={s.page}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>الملخص التنفيذي</Text>
          <Text style={s.text}>{executiveSummary}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>الأهداف</Text>
          {objectives.map((obj, i) => (
            <View key={i} style={{ ...s.row, marginBottom: 8, backgroundColor: "#f8fafc", padding: 10, borderRadius: 6 }}>
              <Text style={s.bullet}>●</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ ...s.bulletText, fontWeight: 700 }}>{obj.goal}</Text>
                <Text style={{ fontSize: 9, color: "#64748b", textAlign: "right", marginTop: 2 }}>
                  القياس: {obj.metric} | الهدف: {obj.target_value}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>{agencyName}</Text>
          <Text style={s.footerText}>2</Text>
        </View>
      </Page>

      {/* Platform Strategy */}
      <Page size="A4" style={s.page}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>استراتيجية المنصات</Text>
          {Object.entries(platformStrategy).map(([platform, strategy]) => (
            <View key={platform} style={{ marginBottom: 16, backgroundColor: "#f8fafc", padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: 700, color: "#1e40af", textAlign: "right" }}>
                {platform}
              </Text>
              <Text style={{ ...s.text, marginTop: 4 }}>{strategy.why}</Text>
              <View style={s.badgeRow}>
                {strategy.content_types.map((type, i) => (
                  <View key={i} style={s.badge}>
                    <Text style={s.badgeText}>{type}</Text>
                  </View>
                ))}
              </View>
              <View style={{ ...s.row, marginTop: 6 }}>
                <Text style={{ fontSize: 9, color: "#64748b" }}>
                  النشر: {strategy.posting_frequency} | الميزانية: {strategy.budget_allocation}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>{agencyName}</Text>
          <Text style={s.footerText}>3</Text>
        </View>
      </Page>

      {/* Ad Campaigns + Budget */}
      <Page size="A4" style={s.page}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>الحملات الإعلانية المخطط لها</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={s.tableHeaderText}>الحملة</Text>
              <Text style={s.tableHeaderText}>المنصة</Text>
              <Text style={s.tableHeaderText}>الهدف</Text>
              <Text style={s.tableHeaderText}>الميزانية</Text>
            </View>
            {adCampaigns.map((campaign, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={s.tableCell}>{campaign.name}</Text>
                <Text style={s.tableCell}>{campaign.platform}</Text>
                <Text style={s.tableCell}>{campaign.objective}</Text>
                <Text style={s.tableCell}>{campaign.budget}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>توزيع الميزانية</Text>
          <View style={s.statsGrid}>
            {Object.entries(budgetBreakdown).map(([key, val]) => (
              <View key={key} style={s.statCard}>
                <Text style={s.statValue}>${val.amount}</Text>
                <Text style={s.statLabel}>{key} ({val.percentage}%)</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>مؤشرات النجاح (KPIs)</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={s.tableHeaderText}>المؤشر</Text>
              <Text style={s.tableHeaderText}>الهدف</Text>
              <Text style={s.tableHeaderText}>طريقة القياس</Text>
            </View>
            {kpis.map((kpi, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={s.tableCell}>{kpi.name}</Text>
                <Text style={s.tableCell}>{kpi.target}</Text>
                <Text style={s.tableCell}>{kpi.measurement}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>{agencyName}</Text>
          <Text style={s.footerText}>4</Text>
        </View>
      </Page>
    </Document>
  );
}
