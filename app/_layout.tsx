import { useEffect, useRef } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "../src/store/auth";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen
          name="(tabs)" // Points to the (tabs) folder
          options={{
            drawerLabel: "Home",
            title: "Overview",
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: "Profile",
            title: "My Profile",
          }}
        />
        <Drawer.Screen
          name="manage-school"
          options={{
            drawerLabel: "Manage School",
            title: "Manage School",
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
