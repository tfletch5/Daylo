import { useState } from "react";
import { Tabs } from "expo-router";
import { Text, TouchableOpacity, Modal, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/store/auth";
import {
  Home,
  Search,
  Calendar,
  Inbox,
  MessageSquare,
  Menu,
  User,
  School,
  LogOut,
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
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <>
      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        profile={profile}
        onNavigateProfile={() => {
          setMenuVisible(false);
          router.push("/profile");
        }}
        onNavigateSchool={() => {
          setMenuVisible(false);
          router.push("/manage-school");
        }}
        onSignOut={() => {
          setMenuVisible(false);
          handleSignOut();
        }}
      />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#1B2A4A" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={{ marginRight: 16 }}
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
    </>
  );
}

function MenuModal({
  visible,
  onClose,
  profile,
  onNavigateProfile,
  onNavigateSchool,
  onSignOut,
}: any) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: "#1B2A4A",
            marginTop: 60,
            marginHorizontal: 16,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#FFFFFF" }}>
              Daylo
            </Text>
            <Text style={{ fontSize: 14, color: "#9CA3AF", marginTop: 4 }}>
              {profile?.first_name} {profile?.last_name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onNavigateProfile}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              paddingHorizontal: 20,
            }}
          >
            <User size={20} color="#FFFFFF" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 16, color: "#FFFFFF" }}>
              Manage Profile
            </Text>
          </TouchableOpacity>

          {profile?.approval_status === "approved" && (
            <TouchableOpacity
              onPress={onNavigateSchool}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                paddingHorizontal: 20,
              }}
            >
              <School size={20} color="#FFFFFF" style={{ marginRight: 16 }} />
              <Text style={{ fontSize: 16, color: "#FFFFFF" }}>
                Manage Schools
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onSignOut}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderTopColor: "#374151",
            }}
          >
            <LogOut size={20} color="#EF4444" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 16, color: "#EF4444" }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
