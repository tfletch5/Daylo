import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/auth";
import { supabase } from "../../src/lib/supabase";
import { Tables } from "../../src/types/database";

type Request = Tables<"requests">;
type Availability = Tables<"availability">;

export default function Home() {
  const { profile, signOut } = useAuthStore();
  const [upcomingGames, setUpcomingGames] = useState<Request[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [openSlots, setOpenSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!profile) return;

    const today = new Date().toISOString().split("T")[0];

    const [gamesRes, requestsRes, slotsRes] = await Promise.all([
      supabase
        .from("requests")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(5),
      supabase
        .from("requests")
        .select("*")
        .eq("status", "pending")
        .eq("recipient_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("availability")
        .select("*")
        .eq("coach_id", profile.id)
        .eq("is_booked", false)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(5),
    ]);

    setUpcomingGames(gamesRes.data || []);
    setPendingRequests(requestsRes.data || []);
    setOpenSlots(slotsRes.data || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1B2A4A" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1B2A4A"
        />
      }
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1B2A4A" }}>
            Welcome, {profile?.first_name || "Coach"}
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>
            Here's your scheduling overview
          </Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={{ color: "#EF4444", fontWeight: "600" }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Requests */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1B2A4A" }}>
            Pending Requests
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/requests")}>
            <Text style={{ color: "#F97316", fontWeight: "600", fontSize: 14 }}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        {pendingRequests.length === 0 ? (
          <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
            No pending requests
          </Text>
        ) : (
          pendingRequests.map((req) => (
            <View
              key={req.id}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}
              >
                {req.sport.charAt(0).toUpperCase() + req.sport.slice(1)} —{" "}
                {req.date}
              </Text>
              <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                {req.time_start} – {req.time_end} • {req.home_away}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Upcoming Games */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#1B2A4A",
            marginBottom: 12,
          }}
        >
          Upcoming Games
        </Text>
        {upcomingGames.length === 0 ? (
          <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
            No upcoming games scheduled
          </Text>
        ) : (
          upcomingGames.map((game) => (
            <View
              key={game.id}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}
              >
                {game.sport.charAt(0).toUpperCase() + game.sport.slice(1)} —{" "}
                {game.date}
              </Text>
              <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                {game.time_start} – {game.time_end} • {game.venue || "TBD"}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Open Availability */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1B2A4A" }}>
            Your Open Slots
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/availability")}>
            <Text style={{ color: "#F97316", fontWeight: "600", fontSize: 14 }}>
              Manage
            </Text>
          </TouchableOpacity>
        </View>
        {openSlots.length === 0 ? (
          <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
            No open availability slots
          </Text>
        ) : (
          openSlots.map((slot) => (
            <View
              key={slot.id}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}
              >
                {slot.sport.charAt(0).toUpperCase() + slot.sport.slice(1)} —{" "}
                {slot.date}
              </Text>
              <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                {slot.time_start} – {slot.time_end} •{" "}
                {slot.home_away_preference} • {slot.venue || "Flexible"}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
