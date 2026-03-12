import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { supabase } from "@/lib/supabase";

export default function ApprovalsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);

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

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleApproval(id: string, status: "approved" | "rejected") {
    const note = rejectionNotes[id]?.trim();

    if (status === "rejected" && !note) {
      Alert.alert("مطلوب", "يرجى كتابة سبب الرفض قبل المتابعة");
      return;
    }

    const updatePayload: Record<string, unknown> = {
      approval_status: status,
      status: status === "approved" ? "approved" : "draft",
    };
    if (status === "rejected" && note) {
      updatePayload.rejection_note = note;
    }

    const { error } = await supabase
      .from("content_calendar")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      Alert.alert("خطأ", "فشل في تحديث الحالة");
      return;
    }

    Alert.alert("تم", status === "approved" ? "تمت الموافقة بنجاح" : "تم الرفض");
    setRejectionNotes((prev) => { const next = { ...prev }; delete next[id]; return next; });
    load();
  }

  async function handleRequestContent() {
    Alert.prompt(
      "طلب محتوى إضافي",
      "ما المحتوى الذي تريد طلبه؟",
      async (text) => {
        if (!text?.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();
        if (!profile?.company_id) return;

        const { data: managers } = await supabase
          .from("profiles")
          .select("id")
          .eq("company_id", profile.company_id)
          .in("role", ["admin", "manager"]);

        if (managers) {
          const notifications = managers.map((m) => ({
            user_id: m.id,
            type: "content_request",
            title: "طلب محتوى إضافي",
            body: text.trim(),
            is_read: false,
          }));
          await supabase.from("notifications").insert(notifications);
        }

        Alert.alert("تم", "تم إرسال طلبك بنجاح");
      },
      "plain-text",
      "",
      "default",
    );
  }

  const platformIcons: Record<string, string> = {
    facebook: "📘", instagram: "📸", tiktok: "🎵",
    snapchat: "👻", x: "𝕏", linkedin: "💼", youtube: "▶️",
  };

  const contentTypeLabels: Record<string, string> = {
    post: "منشور", story: "ستوري", reel: "ريلز",
    video: "فيديو", carousel: "كاروسيل", article: "مقالة",
  };

  function renderFacebookPreview(item: any) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>معاينة فيسبوك</Text>
        <View style={styles.fbCard}>
          <View style={styles.fbHeader}>
            <View style={styles.fbAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fbName}>صفحة الشركة</Text>
              <Text style={styles.fbTime}>{item.scheduled_date} · 🌐</Text>
            </View>
            <Text style={styles.fbDots}>⋯</Text>
          </View>
          <Text style={styles.fbContent}>{item.text_content}</Text>
          {item.hashtags?.length > 0 && (
            <Text style={styles.fbHashtags}>{item.hashtags.join(" ")}</Text>
          )}
          {item.media_url && (
            <View style={styles.fbImagePlaceholder}>
              <Text style={styles.placeholderText}>🖼️ صورة/فيديو</Text>
            </View>
          )}
          <View style={styles.fbEngagement}>
            <Text style={styles.fbEngagementText}>👍 إعجاب</Text>
            <Text style={styles.fbEngagementText}>💬 تعليق</Text>
            <Text style={styles.fbEngagementText}>↗️ مشاركة</Text>
          </View>
        </View>
      </View>
    );
  }

  function renderInstagramPreview(item: any) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>معاينة انستقرام</Text>
        <View style={styles.igCard}>
          <View style={styles.igHeader}>
            <View style={styles.igAvatar} />
            <Text style={styles.igUsername}>حساب_الشركة</Text>
            <Text style={styles.igDots}>⋯</Text>
          </View>
          <View style={styles.igImagePlaceholder}>
            <Text style={styles.placeholderText}>🖼️ صورة</Text>
          </View>
          <View style={styles.igActions}>
            <Text style={styles.igActionIcon}>♡</Text>
            <Text style={styles.igActionIcon}>💬</Text>
            <Text style={styles.igActionIcon}>↗️</Text>
            <Text style={[styles.igActionIcon, { marginRight: "auto" }]}>🔖</Text>
          </View>
          <Text style={styles.igCaption}>
            <Text style={styles.igCaptionUser}>حساب_الشركة </Text>
            {item.text_content}
          </Text>
          {item.hashtags?.length > 0 && (
            <Text style={styles.igHashtags}>{item.hashtags.join(" ")}</Text>
          )}
        </View>
      </View>
    );
  }

  function renderGenericPreview(item: any) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>معاينة المحتوى</Text>
        <View style={styles.genericCard}>
          <View style={styles.genericHeader}>
            <View style={styles.genericAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.genericName}>حساب الشركة</Text>
              <Text style={styles.genericPlatform}>
                {platformIcons[item.platform] || "📱"} {item.platform}
              </Text>
            </View>
          </View>
          <Text style={styles.genericContent}>{item.text_content}</Text>
          {item.hashtags?.length > 0 && (
            <Text style={styles.genericHashtags}>{item.hashtags.join(" ")}</Text>
          )}
        </View>
      </View>
    );
  }

  function renderPreview(item: any) {
    if (item.platform === "facebook") return renderFacebookPreview(item);
    if (item.platform === "instagram") return renderInstagramPreview(item);
    return renderGenericPreview(item);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <Text style={styles.pageTitle}>الموافقات المعلقة</Text>
      <Text style={styles.subtitle}>{items.length} عنصر بانتظار مراجعتك</Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>لا توجد موافقات معلقة</Text>
          <Text style={styles.emptySubtext}>جميع المحتوى تمت مراجعته</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.platformIcon}>{platformIcons[item.platform] || "📱"}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.headerRow}>
                  <Text style={styles.platform}>{item.platform}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{contentTypeLabels[item.content_type] || item.content_type}</Text>
                  </View>
                  {item.ai_generated && (
                    <View style={[styles.typeBadge, { backgroundColor: "#f5f3ff" }]}>
                      <Text style={[styles.typeText, { color: "#7c3aed" }]}>AI</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.date}>
                  {item.scheduled_date} - {item.scheduled_time}
                </Text>
              </View>
            </View>

            <Text style={styles.content}>{item.text_content}</Text>

            {item.hashtags?.length > 0 && (
              <Text style={styles.hashtags}>{item.hashtags.join(" ")}</Text>
            )}

            {/* Preview toggle */}
            <TouchableOpacity
              style={styles.previewToggle}
              onPress={() => setExpandedPreview(expandedPreview === item.id ? null : item.id)}
            >
              <Text style={styles.previewToggleText}>
                {expandedPreview === item.id ? "إخفاء المعاينة ▲" : "معاينة المنشور ▼"}
              </Text>
            </TouchableOpacity>

            {expandedPreview === item.id && renderPreview(item)}

            {/* Rejection note input */}
            <TextInput
              style={styles.noteInput}
              placeholder="ملاحظة (مطلوبة عند الرفض)..."
              placeholderTextColor="#94a3b8"
              textAlign="right"
              multiline
              value={rejectionNotes[item.id] || ""}
              onChangeText={(text) =>
                setRejectionNotes((prev) => ({ ...prev, [item.id]: text }))
              }
            />

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

      {/* Request additional content */}
      <TouchableOpacity style={styles.requestBtn} onPress={handleRequestContent}>
        <Text style={styles.requestBtnIcon}>📝</Text>
        <Text style={styles.requestBtnText}>طلب محتوى إضافي</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", textAlign: "right" },
  subtitle: { fontSize: 13, color: "#94a3b8", marginBottom: 16, textAlign: "right" },
  emptyCard: { backgroundColor: "#fff", borderRadius: 20, padding: 40, alignItems: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#334155" },
  emptySubtext: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 12 },
  headerRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  platformIcon: { fontSize: 28 },
  platform: { fontSize: 14, fontWeight: "600", color: "#334155", textAlign: "right" },
  date: { fontSize: 12, color: "#94a3b8", textAlign: "right", marginTop: 2 },
  typeBadge: { backgroundColor: "#f1f5f9", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: "600", color: "#475569" },
  content: { fontSize: 14, color: "#0f172a", lineHeight: 24, textAlign: "right" },
  hashtags: { fontSize: 12, color: "#3b82f6", marginTop: 8, textAlign: "right" },

  previewToggle: { marginTop: 12, alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#f1f5f9" },
  previewToggleText: { fontSize: 12, fontWeight: "600", color: "#2563eb" },

  noteInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    fontSize: 13,
    color: "#0f172a",
    backgroundColor: "#fafafa",
    minHeight: 48,
    textAlignVertical: "top",
  },

  actions: { flexDirection: "row-reverse", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center" },
  approveBtn: { backgroundColor: "#f0fdf4" },
  approveBtnText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },
  rejectBtn: { backgroundColor: "#fef2f2" },
  rejectBtnText: { fontSize: 14, fontWeight: "700", color: "#dc2626" },

  requestBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  requestBtnIcon: { fontSize: 18 },
  requestBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Facebook preview
  previewContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
  previewLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", marginBottom: 8, textAlign: "right" },
  fbCard: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e4e6eb", overflow: "hidden" },
  fbHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 8, padding: 12 },
  fbAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#dbeafe" },
  fbName: { fontSize: 13, fontWeight: "700", color: "#050505", textAlign: "right" },
  fbTime: { fontSize: 11, color: "#65676b", textAlign: "right" },
  fbDots: { fontSize: 18, color: "#65676b" },
  fbContent: { fontSize: 14, color: "#050505", lineHeight: 22, paddingHorizontal: 12, textAlign: "right" },
  fbHashtags: { fontSize: 13, color: "#385898", paddingHorizontal: 12, marginTop: 4, textAlign: "right" },
  fbImagePlaceholder: { backgroundColor: "#f0f2f5", height: 180, justifyContent: "center", alignItems: "center", marginTop: 8 },
  placeholderText: { fontSize: 16, color: "#94a3b8" },
  fbEngagement: { flexDirection: "row-reverse", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#e4e6eb", marginTop: 8 },
  fbEngagementText: { fontSize: 12, fontWeight: "600", color: "#65676b" },

  // Instagram preview
  igCard: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#dbdbdb", overflow: "hidden" },
  igHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 8, padding: 10 },
  igAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "transparent", borderWidth: 2, borderColor: "#c13584" },
  igUsername: { fontSize: 13, fontWeight: "700", color: "#262626", flex: 1, textAlign: "right" },
  igDots: { fontSize: 16, color: "#262626" },
  igImagePlaceholder: { backgroundColor: "#fafafa", height: 200, justifyContent: "center", alignItems: "center" },
  igActions: { flexDirection: "row-reverse", gap: 14, paddingHorizontal: 12, paddingVertical: 8 },
  igActionIcon: { fontSize: 20 },
  igCaption: { fontSize: 13, color: "#262626", lineHeight: 20, paddingHorizontal: 12, paddingBottom: 8, textAlign: "right" },
  igCaptionUser: { fontWeight: "700" },
  igHashtags: { fontSize: 12, color: "#00376b", paddingHorizontal: 12, paddingBottom: 10, textAlign: "right" },

  // Generic preview
  genericCard: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", padding: 14 },
  genericHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 10 },
  genericAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e2e8f0" },
  genericName: { fontSize: 13, fontWeight: "700", color: "#0f172a", textAlign: "right" },
  genericPlatform: { fontSize: 11, color: "#94a3b8", textAlign: "right" },
  genericContent: { fontSize: 14, color: "#0f172a", lineHeight: 22, textAlign: "right" },
  genericHashtags: { fontSize: 12, color: "#3b82f6", marginTop: 6, textAlign: "right" },
});
