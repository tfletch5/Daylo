import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen
          name="(tabs)" // Points to the (tabs) folder
          options={{
            drawerLabel: "Home",
            title: "Overview",
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="manage-school"
          options={{
            drawerLabel: "Manage School",
            title: "Manage School",
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: "Profile",
            title: "My Profile",
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
