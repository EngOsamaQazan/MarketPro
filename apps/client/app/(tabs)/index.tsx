import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { registerForPushNotifications, addNotificationListeners } from "@/lib/notifications";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  followers_count: number;
}

const TYPE_ICONS: Record<string, string> = {
  plan_ready: "📋",
  report_ready: "📊",
  approval_needed: "✅",
  alert: "⚠️",
  message: "💬",
  content_request: "📝",
};

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘",
  instagram: "📸",
  tiktok: "🎵",
  snapchat: "👻",
  x: "𝕏",
  linkedin: "💼",
  youtube: "▶️",
  twitter: "🐦",
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877f2",
  instagram: "#e4405f",
  tiktok: "#010101",
  snapchat: "#fffc00",
  x: "#000000",
  linkedin: "#0a66c2",
  youtube: "#ff0000",
  twitter: "#1da1f2",
};

export default function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ campaigns: 0, content: 0, followers: 0 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
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
      const [campaigns, content, social, notifs, approvals] = await Promise.all([
        supabase.from("ad_campaigns").select("id", { count: "exact" }).eq("company_id", profileData.company_id).eq("status", "active"),
        supabase.from("content_calendar").select("id", { count: "exact" }).eq("company_id", profileData.company_id).eq("status", "published"),
        supabase.from("social_accounts").select("id, platform, account_name, followers_count").eq("company_id", profileData.company_id),
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("content_calendar").select("id", { count: "exact" }).eq("company_id", profileData.company_id).eq("approval_status", "pending"),
      ]);

      const accounts = (social.data || []) as SocialAccount[];
      setSocialAccounts(accounts);
      setStats({
        campaigns: campaigns.count || 0,
        content: content.count || 0,
        followers: accounts.reduce((sum, a) => sum + (a.followers_count || 0), 0),
      });
      setNotifications(notifs.data || []);
      setPendingApprovals(approvals.count || 0);
    }
  }

  useEffect(() => {
    loadData();
    registerForPushNotifications();

    const removeListeners = addNotificationListeners(
      () => { loadData(); },
    );

    return () => { removeListeners(); };
  }, []);

  // Realtime subscription for notifications
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("client-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev].slice(0, 5));
          },
        )
        .subscribe();
    }

    setupRealtime();
    return () => { channel?.unsubscribe(); };
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function handleRequestContent() {
    Alert.prompt(
      "طلب محتوى إضافي",
      "ما المحتوى الذي تريد طلبه؟",
      async (text) => {
        if (!text?.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: prof } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();
        if (!prof?.company_id) return;

        const { data: managers } = await supabase
          .from("profiles")
          .select("id")
          .eq("company_id", prof.company_id)
          .in("role", ["admin", "manager"]);

        if (managers) {
          const notifs = managers.map((m) => ({
            user_id: m.id,
            type: "content_request",
            title: "طلب محتوى إضافي",
            body: text.trim(),
            is_read: false,
          }));
          await supabase.from("notifications").insert(notifs);
        }
        Alert.alert("تم", "تم إرسال طلبك بنجاح");
      },
      "plain-text",
      "",
      "default",
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          {profile?.full_name ? `مرحباً ${profile.full_name}` : "مرحباً بك"}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {profile?.companies?.name || "إليك ملخص أداء حملاتك التسويقية"}
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

      {/* Connected Platforms */}
      {socialAccounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المنصات المتصلة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformsList}>
            {socialAccounts.map((account) => (
              <View key={account.id} style={styles.platformCard}>
                <View style={[styles.platformIconContainer, { backgroundColor: (PLATFORM_COLORS[account.platform] || "#64748b") + "15" }]}>
                  <Text style={styles.platformEmoji}>{PLATFORM_ICONS[account.platform] || "📱"}</Text>
                </View>
                <Text style={styles.platformName}>{account.platform}</Text>
                <Text style={styles.platformFollowers}>
                  {(account.followers_count || 0).toLocaleString()}
                </Text>
                <Text style={styles.platformFollowersLabel}>متابع</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {pendingApprovals > 0 && (
        <TouchableOpacity style={styles.approvalBanner} onPress={() => router.push("/(tabs)/approvals")}>
          <Text style={styles.approvalIcon}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.approvalTitle}>{pendingApprovals} موافقة معلقة</Text>
            <Text style={styles.approvalSubtitle}>يوجد محتوى بانتظار مراجعتك</Text>
          </View>
          <Text style={styles.approvalArrow}>←</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>آخر التحديثات</Text>
        {notifications.length === 0 ? (
          <View style={styles.updateCard}>
            <Text style={styles.updateIcon}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.updateTitle}>النظام يعمل بنجاح</Text>
              <Text style={styles.updateSubtitle}>سيتم تحديث البيانات تلقائياً</Text>
            </View>
          </View>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.updateCard, !notif.is_read && styles.unreadCard]}
              onPress={async () => {
                if (!notif.is_read) {
                  await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
                }
                if (notif.type === "report_ready") router.push("/(tabs)/reports");
                else if (notif.type === "plan_ready") router.push("/(tabs)/plan");
                else if (notif.type === "approval_needed") router.push("/(tabs)/approvals");
                else if (notif.type === "message") router.push("/(tabs)/chat");
              }}
            >
              <Text style={styles.updateIcon}>{TYPE_ICONS[notif.type] || "🔔"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.updateTitle, !notif.is_read && { fontWeight: "800" }]}>{notif.title}</Text>
                <Text style={styles.updateSubtitle} numberOfLines={2}>{notif.body}</Text>
                <Text style={styles.timeText}>
                  {new Date(notif.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              {!notif.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/plan")}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>الخطة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/reports")}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>التقارير</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/approvals")}>
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionLabel}>الموافقات</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/chat")}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>المحادثة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.requestActionCard]} onPress={handleRequestContent}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionLabel}>طلب محتوى</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 30 }} />
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
  approvalBanner: { flexDirection: "row-reverse", backgroundColor: "#fffbeb", borderColor: "#fbbf24", borderWidth: 1, borderRadius: 16, margin: 16, padding: 16, alignItems: "center", gap: 12 },
  approvalIcon: { fontSize: 28 },
  approvalTitle: { fontSize: 14, fontWeight: "700", color: "#92400e", textAlign: "right" },
  approvalSubtitle: { fontSize: 12, color: "#b45309", marginTop: 2, textAlign: "right" },
  approvalArrow: { fontSize: 20, color: "#b45309" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 12, textAlign: "right" },
  updateCard: { flexDirection: "row-reverse", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", gap: 12, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  unreadCard: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe", borderWidth: 1 },
  updateIcon: { fontSize: 28 },
  updateTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a", textAlign: "right" },
  updateSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 2, textAlign: "right" },
  timeText: { fontSize: 10, color: "#cbd5e1", marginTop: 4, textAlign: "right" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3b82f6" },
  quickActions: { padding: 16 },
  actionsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
  actionCard: { width: "22%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  requestActionCard: { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe" },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: "600", color: "#334155" },

  platformsList: { gap: 10, paddingHorizontal: 2 },
  platformCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    width: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  platformIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  platformEmoji: { fontSize: 22 },
  platformName: { fontSize: 12, fontWeight: "700", color: "#334155", textTransform: "capitalize" },
  platformFollowers: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginTop: 2 },
  platformFollowersLabel: { fontSize: 10, color: "#94a3b8" },
});
