import { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useAuthStore } from "../../src/store/auth";
import {
  Home,
  Search,
  Calendar,
  Inbox,
  MessageSquare,
  Menu,
} from "lucide-react-native";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, any> = {
    home: Home,
    search: Search,
    availability: Calendar,
    requests: Inbox,
    messages: MessageSquare,
  };
  const Icon = icons[name] || Home;
  return <Icon size={22} color={focused ? "#F97316" : "#9CA3AF"} />;
}

export default function TabsLayout() {
  const navigation = useNavigation();

  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#1B2A4A" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ marginLeft: 16 }}
          >
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: "#F97316",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Availability",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="availability" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="requests" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="messages" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
