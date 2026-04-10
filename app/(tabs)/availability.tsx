import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useAuthStore } from "../../src/store/auth";
import { supabase } from "../../src/lib/supabase";
import { Tables } from "../../src/types/database";

type Availability = Tables<"availability">;

const SPORTS = ["football", "soccer"] as const;
const PREFERENCES = ["home", "away", "either"] as const;

export default function AvailabilityScreen() {
  const { profile } = useAuthStore();
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [formSport, setFormSport] = useState<string>("football");
  const [formDate, setFormDate] = useState("");
  const [formTimeStart, setFormTimeStart] = useState("");
  const [formTimeEnd, setFormTimeEnd] = useState("");
  const [formPreference, setFormPreference] = useState<string>("home");
  const [formVenue, setFormVenue] = useState("");
  const [formDistance, setFormDistance] = useState("");
  const [formSchoolId, setFormSchoolId] = useState("");
  const [coachSchools, setCoachSchools] = useState<
    Array<{
      id: string;
      school_id: string;
      sport: string;
      schools: { name: string } | null;
    }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!profile) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("coach_id", profile.id)
      .gte("date", today)
      .order("date", { ascending: true });
    setSlots(data || []);
    setLoading(false);
  }, [profile]);

  const fetchCoachSchools = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("coach_schools")
      .select("id, school_id, sport, schools(name)")
      .eq("coach_id", profile.id);
    setCoachSchools((data as any) || []);
  }, [profile]);

  useEffect(() => {
    fetchSlots();
    fetchCoachSchools();
  }, [fetchSlots, fetchCoachSchools]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSlots();
    setRefreshing(false);
  }, [fetchSlots]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Slot",
      "Are you sure you want to delete this availability slot?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase.from("availability").delete().eq("id", id);
            fetchSlots();
          },
        },
      ],
    );
  };

  const handleCreate = async () => {
    if (
      !profile ||
      !formSchoolId ||
      !formDate ||
      !formTimeStart ||
      !formTimeEnd
    ) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (school, date, start time, end time).",
      );
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("availability").insert({
      coach_id: profile.id,
      school_id: formSchoolId,
      sport: formSport,
      date: formDate,
      time_start: formTimeStart,
      time_end: formTimeEnd,
      home_away_preference: formPreference,
      venue: formVenue || null,
      max_travel_distance_miles: formDistance ? parseInt(formDistance) : null,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setModalVisible(false);
      resetForm();
      fetchSlots();
    }
  };

  const resetForm = () => {
    setFormDate("");
    setFormTimeStart("");
    setFormTimeEnd("");
    setFormVenue("");
    setFormDistance("");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1B2A4A" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1B2A4A"
          />
        }
        ListHeaderComponent={
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 12 }}>
            {slots.length} upcoming slot{slots.length !== 1 ? "s" : ""}
          </Text>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 48 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#374151" }}>
              No availability slots
            </Text>
            <Text style={{ fontSize: 14, color: "#9CA3AF", marginTop: 4 }}>
              Add your first slot to let other coaches find you
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#1B2A4A" }}
                >
                  {item.date}
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                  {item.time_start} – {item.time_end}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: item.is_booked ? "#FEE2E2" : "#F0FDF4",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  alignSelf: "flex-start",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: item.is_booked ? "#EF4444" : "#10B981",
                  }}
                >
                  {item.is_booked ? "Booked" : "Open"}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <View
                style={{
                  backgroundColor: "#EFF6FF",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{ fontSize: 11, color: "#3B82F6", fontWeight: "600" }}
                >
                  {item.sport.charAt(0).toUpperCase() + item.sport.slice(1)}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#FFF7ED",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{ fontSize: 11, color: "#F97316", fontWeight: "600" }}
                >
                  {item.home_away_preference.charAt(0).toUpperCase() +
                    item.home_away_preference.slice(1)}
                </Text>
              </View>
              {item.venue && (
                <View
                  style={{
                    backgroundColor: "#F3F4F6",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#6B7280",
                      fontWeight: "600",
                    }}
                  >
                    {item.venue}
                  </Text>
                </View>
              )}
            </View>
            {!item.is_booked && (
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={{ marginTop: 12 }}
              >
                <Text
                  style={{ color: "#EF4444", fontWeight: "600", fontSize: 13 }}
                >
                  Delete Slot
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#F97316",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text style={{ fontSize: 28, color: "#FFFFFF", lineHeight: 30 }}>
          +
        </Text>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1B2A4A" }}>
              New Availability Slot
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#6B7280", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Sport *
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {SPORTS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setFormSport(s)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: formSport === s ? "#1B2A4A" : "#F3F4F6",
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: formSport === s ? "#FFFFFF" : "#374151",
                    fontWeight: "600",
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            School *
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {coachSchools
              .filter((cs) => cs.sport === formSport)
              .map((cs) => (
                <TouchableOpacity
                  key={cs.id}
                  onPress={() => setFormSchoolId(cs.school_id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor:
                      formSchoolId === cs.school_id ? "#1B2A4A" : "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      color:
                        formSchoolId === cs.school_id ? "#FFFFFF" : "#374151",
                      fontWeight: "600",
                    }}
                  >
                    {cs.schools?.name || "Unknown"}
                  </Text>
                </TouchableOpacity>
              ))}
            {coachSchools.filter((cs) => cs.sport === formSport).length ===
              0 && (
              <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
                No schools linked for this sport. Add one in your profile.
              </Text>
            )}
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Date * (YYYY-MM-DD)
          </Text>
          <TextInput
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              padding: 14,
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="2025-09-12"
            placeholderTextColor="#9CA3AF"
            value={formDate}
            onChangeText={setFormDate}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Start Time * (HH:MM)
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 16,
                  marginBottom: 16,
                }}
                placeholder="19:00"
                placeholderTextColor="#9CA3AF"
                value={formTimeStart}
                onChangeText={setFormTimeStart}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                End Time * (HH:MM)
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 16,
                  marginBottom: 16,
                }}
                placeholder="21:00"
                placeholderTextColor="#9CA3AF"
                value={formTimeEnd}
                onChangeText={setFormTimeEnd}
              />
            </View>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Home/Away Preference
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {PREFERENCES.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setFormPreference(p)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: formPreference === p ? "#1B2A4A" : "#F3F4F6",
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: formPreference === p ? "#FFFFFF" : "#374151",
                    fontWeight: "600",
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Venue (optional)
          </Text>
          <TextInput
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              padding: 14,
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="Memorial Stadium"
            placeholderTextColor="#9CA3AF"
            value={formVenue}
            onChangeText={setFormVenue}
          />

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Max Travel Distance (miles, optional)
          </Text>
          <TextInput
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              padding: 14,
              fontSize: 16,
              marginBottom: 24,
            }}
            placeholder="50"
            placeholderTextColor="#9CA3AF"
            value={formDistance}
            onChangeText={setFormDistance}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            onPress={handleCreate}
            disabled={submitting}
            style={{
              backgroundColor: "#F97316",
              borderRadius: 8,
              padding: 16,
              alignItems: "center",
              opacity: submitting ? 0.7 : 1,
              marginBottom: 32,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}
              >
                Create Slot
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}
