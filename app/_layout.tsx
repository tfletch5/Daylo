import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "../src/store/auth";
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from "../src/lib/notifications";

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    initialize().then(() => {
      const { user } = useAuthStore.getState();
      if (user) {
        registerForPushNotifications(user.id);
      }
    });

    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === "message" && data?.conversationId) {
        router.push({
          pathname: "/chat/[id]",
          params: { id: data.conversationId as string },
        });
      } else if (data?.type === "request") {
        router.push("/(tabs)/requests");
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1B2A4A" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#F9FAFB" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{
            title: "Profile",
            headerStyle: { backgroundColor: "#1B2A4A" },
            headerTintColor: "#FFFFFF",
          }}
        />
        <Stack.Screen
          name="manage-school"
          options={{
            title: "Manage Schools",
            headerStyle: { backgroundColor: "#1B2A4A" },
            headerTintColor: "#FFFFFF",
          }}
        />
        <Stack.Screen
          name="pending"
          options={{ title: "Account Pending", headerBackVisible: false }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ title: "Set Up Profile", headerBackVisible: false }}
        />
      </Stack>
    </>
  );
}
