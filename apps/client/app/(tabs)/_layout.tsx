import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={badgeStyles.badge}>
      <Text style={badgeStyles.text}>{count > 9 ? "9+" : count}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  text: { fontSize: 10, fontWeight: "800", color: "#fff" },
});

export default function TabsLayout() {
  const [approvalCount, setApprovalCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    async function loadBadges() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) return;

      const { count: approvals } = await supabase
        .from("content_calendar")
        .select("id", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .eq("approval_status", "pending");

      setApprovalCount(approvals || 0);

      const { count: unread } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setUnreadMessages(unread || 0);
    }

    loadBadges();
    const interval = setInterval(loadBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#fff", elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#f1f5f9", height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="home" size={size} color={color} />
              <TabBadge count={unreadMessages} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "الخطة",
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "التقارير",
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: "الموافقات",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="checkmark-circle" size={size} color={color} />
              <TabBadge count={approvalCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "المحادثة",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
