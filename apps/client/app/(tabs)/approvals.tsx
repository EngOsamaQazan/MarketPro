import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { supabase } from "@/lib/supabase";

export default function ApprovalsScreen() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("approval_status", "pending")
      .order("scheduled_date", { ascending: true });
    if (data) setItems(data);
  }

  useEffect(() => { load(); }, []);

  async function handleApproval(id: string, status: "approved" | "rejected") {
    await supabase
      .from("content_calendar")
      .update({ approval_status: status, status: status === "approved" ? "approved" : "draft" })
      .eq("id", id);
    Alert.alert("تم", status === "approved" ? "تمت الموافقة بنجاح" : "تم الرفض");
    load();
  }

  const platformIcons: Record<string, string> = {
    facebook: "📘", instagram: "📸", tiktok: "🎵",
    snapchat: "👻", x: "𝕏", linkedin: "💼", youtube: "▶️",
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>الموافقات المعلقة</Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>لا توجد موافقات معلقة</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.platformIcon}>{platformIcons[item.platform] || "📱"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.platform}>{item.platform}</Text>
                <Text style={styles.date}>{item.scheduled_date} - {item.scheduled_time}</Text>
              </View>
            </View>

            <Text style={styles.content}>{item.text_content}</Text>

            {item.hashtags?.length > 0 && (
              <Text style={styles.hashtags}>{item.hashtags.join(" ")}</Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleApproval(item.id, "approved")}
              >
                <Text style={styles.approveBtnText}>✓ موافقة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleApproval(item.id, "rejected")}
              >
                <Text style={styles.rejectBtnText}>✕ رفض</Text>
              </TouchableOpacity>
            </View>
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
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 12 },
  platformIcon: { fontSize: 28 },
  platform: { fontSize: 14, fontWeight: "600", color: "#334155", textAlign: "right" },
  date: { fontSize: 12, color: "#94a3b8", textAlign: "right" },
  content: { fontSize: 14, color: "#0f172a", lineHeight: 24, textAlign: "right" },
  hashtags: { fontSize: 12, color: "#3b82f6", marginTop: 8, textAlign: "right" },
  actions: { flexDirection: "row-reverse", gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center" },
  approveBtn: { backgroundColor: "#f0fdf4" },
  approveBtnText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },
  rejectBtn: { backgroundColor: "#fef2f2" },
  rejectBtnText: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
});
