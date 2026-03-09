import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ campaigns: 0, content: 0, followers: 0 });
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*, companies(*)")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    if (profileData?.company_id) {
      const [campaigns, content, social] = await Promise.all([
        supabase.from("ad_campaigns").select("id", { count: "exact" }).eq("company_id", profileData.company_id).eq("status", "active"),
        supabase.from("content_calendar").select("id", { count: "exact" }).eq("company_id", profileData.company_id).eq("status", "published"),
        supabase.from("social_accounts").select("followers_count").eq("company_id", profileData.company_id),
      ]);

      setStats({
        campaigns: campaigns.count || 0,
        content: content.count || 0,
        followers: (social.data || []).reduce((sum, a) => sum + (a.followers_count || 0), 0),
      });
    }
  }

  useEffect(() => { loadData(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          مرحباً {profile?.full_name || ""}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          إليك ملخص أداء حملاتك التسويقية
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: "#eff6ff" }]}>
          <Text style={[styles.statValue, { color: "#2563eb" }]}>{stats.campaigns}</Text>
          <Text style={styles.statLabel}>حملة نشطة</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#f0fdf4" }]}>
          <Text style={[styles.statValue, { color: "#16a34a" }]}>{stats.content}</Text>
          <Text style={styles.statLabel}>منشور</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#faf5ff" }]}>
          <Text style={[styles.statValue, { color: "#9333ea" }]}>
            {stats.followers.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>متابع</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>آخر التحديثات</Text>
        <View style={styles.updateCard}>
          <Text style={styles.updateIcon}>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.updateTitle}>النظام يعمل بنجاح</Text>
            <Text style={styles.updateSubtitle}>سيتم تحديث البيانات تلقائياً</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  welcomeCard: { backgroundColor: "#2563eb", margin: 16, padding: 24, borderRadius: 20 },
  welcomeTitle: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "right" },
  welcomeSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6, textAlign: "right" },
  statsGrid: { flexDirection: "row-reverse", paddingHorizontal: 16, gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 12, textAlign: "right" },
  updateCard: { flexDirection: "row-reverse", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  updateIcon: { fontSize: 28 },
  updateTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a", textAlign: "right" },
  updateSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 2, textAlign: "right" },
});
