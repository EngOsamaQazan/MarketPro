import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import * as Notifications from "expo-notifications";
import { registerForPushNotifications } from "@/lib/notifications";

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotifications();

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const type = data?.type as string | undefined;

      if (type === "report_ready") router.push("/(tabs)/reports");
      else if (type === "plan_ready") router.push("/(tabs)/plan");
      else if (type === "approval_needed") router.push("/(tabs)/approvals");
      else if (type === "message") router.push("/(tabs)/chat");
      else router.push("/(tabs)");
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
