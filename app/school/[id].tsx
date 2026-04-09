import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useAuthStore } from "../../src/store/auth";
import { supabase } from "../../src/lib/supabase";
import { Tables } from "../../src/types/database";

type School = Tables<"schools">;
type Availability = Tables<"availability">;

export default function SchoolDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const [school, setSchool] = useState<School | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [coaches, setCoaches] = useState<Array<{ coach_id: string; sport: string; profiles: { first_name: string | null; last_name: string | null } | null }>>([]);
  const [loading, setLoading] = useState(true);

  // Request modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [reqVenue, setReqVenue] = useState("");
  const [reqHomeAway, setReqHomeAway] = useState<string>("away");
  const [submitting, setSubmitting] = useState(false);

  // Coach's own schools for the request
  const [mySchools, setMySchools] = useState<Array<{ school_id: string; sport: string; schools: { name: string } | null }>>([]);
  const [selectedMySchool, setSelectedMySchool] = useState("");

  const fetchSchool = useCallback(async () => {
    if (!id) return;

    const [schoolRes, slotsRes, coachesRes] = await Promise.all([
      supabase.from("schools").select("*").eq("id", id).single(),
      supabase
        .from("availability")
        .select("*")
        .eq("school_id", id)
        .eq("is_booked", false)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true }),
      supabase
        .from("coach_schools")
        .select("coach_id, sport, profiles(first_name, last_name)")
        .eq("school_id", id),
    ]);

    setSchool(schoolRes.data);
    setSlots(slotsRes.data || []);
    setCoaches((coachesRes.data as any) || []);
    setLoading(false);
  }, [id]);

  const fetchMySchools = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("coach_schools")
      .select("school_id, sport, schools(name)")
      .eq("coach_id", profile.id);
    setMySchools((data as any) || []);
  }, [profile]);

  useEffect(() => {
    fetchSchool();
    fetchMySchools();
  }, [fetchSchool, fetchMySchools]);

  const openRequestModal = (slot: Availability) => {
    setSelectedSlot(slot);
    setReqVenue(slot.venue || "");
    setReqHomeAway(slot.home_away_preference === "home" ? "away" : "home");
    // Auto-select matching school if possible
    const matching = mySchools.find((s) => s.sport === slot.sport);
    setSelectedMySchool(matching?.school_id || "");
    setModalVisible(true);
  };

  const handleSendRequest = async () => {
    if (!selectedSlot || !profile || !selectedMySchool) {
      Alert.alert("Error", "Please select your school.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("requests").insert({
      requester_id: profile.id,
      requester_school_id: selectedMySchool,
      recipient_id: selectedSlot.coach_id,
      recipient_school_id: selectedSlot.school_id,
      availability_id: selectedSlot.id,
      sport: selectedSlot.sport,
      date: selectedSlot.date,
      time_start: selectedSlot.time_start,
      time_end: selectedSlot.time_end,
      home_away: reqHomeAway,
      venue: reqVenue || null,
    });

    setSubmitting(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Request Sent", "Your game request has been sent to the coach.");
      setModalVisible(false);
      fetchSchool();
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1B2A4A" />
      </View>
    );
  }

  if (!school) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#9CA3AF" }}>School not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: school.name }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* School Header */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1B2A4A" }}>{school.name}</Text>
          {school.mascot && (
            <Text style={{ fontSize: 16, color: "#F97316", fontWeight: "600", marginTop: 4 }}>
              {school.mascot}
            </Text>
          )}
          {(school.city || school.state) && (
            <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 8 }}>
              {[school.address, school.city, school.state, school.zip_code].filter(Boolean).join(", ")}
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {school.division && (
              <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ fontSize: 12, color: "#3B82F6", fontWeight: "600" }}>Division: {school.division}</Text>
              </View>
            )}
            {school.conference && (
              <View style={{ backgroundColor: "#F0FDF4", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ fontSize: 12, color: "#10B981", fontWeight: "600" }}>Conference: {school.conference}</Text>
              </View>
            )}
          </View>
          {(school.contact_phone || school.contact_email) && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
              {school.contact_phone && (
                <Text style={{ fontSize: 13, color: "#6B7280" }}>📞 {school.contact_phone}</Text>
              )}
              {school.contact_email && (
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>✉️ {school.contact_email}</Text>
              )}
            </View>
          )}
        </View>

        {/* Coaches */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1B2A4A", marginBottom: 12 }}>Coaches</Text>
          {coaches.length === 0 ? (
            <Text style={{ color: "#9CA3AF", fontSize: 14 }}>No coaches listed</Text>
          ) : (
            coaches.map((c, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: i < coaches.length - 1 ? 1 : 0, borderBottomColor: "#F3F4F6" }}>
                <Text style={{ fontSize: 14, color: "#374151", fontWeight: "500" }}>
                  {c.profiles?.first_name || ""} {c.profiles?.last_name || ""}
                </Text>
                <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, color: "#3B82F6", fontWeight: "600" }}>
                    {c.sport.charAt(0).toUpperCase() + c.sport.slice(1)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Available Slots */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1B2A4A", marginBottom: 12 }}>
            Available Game Slots
          </Text>
          {slots.length === 0 ? (
            <Text style={{ color: "#9CA3AF", fontSize: 14 }}>No open slots at this time</Text>
          ) : (
            slots.map((slot) => {
              const isOwn = slot.coach_id === profile?.id;
              return (
                <View
                  key={slot.id}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>
                        {slot.date}
                      </Text>
                      <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                        {slot.time_start} – {slot.time_end}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <View style={{ backgroundColor: "#FFF7ED", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                        <Text style={{ fontSize: 11, color: "#F97316", fontWeight: "600" }}>
                          {slot.home_away_preference.charAt(0).toUpperCase() + slot.home_away_preference.slice(1)}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                        <Text style={{ fontSize: 11, color: "#3B82F6", fontWeight: "600" }}>
                          {slot.sport.charAt(0).toUpperCase() + slot.sport.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {slot.venue && (
                    <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>📍 {slot.venue}</Text>
                  )}
                  {!isOwn && (
                    <TouchableOpacity
                      onPress={() => openRequestModal(slot)}
                      style={{
                        backgroundColor: "#F97316",
                        borderRadius: 8,
                        padding: 10,
                        alignItems: "center",
                        marginTop: 10,
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                        Send Game Request
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Send Request Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1B2A4A" }}>Send Game Request</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#6B7280", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {selectedSlot && (
            <View style={{ backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                {selectedSlot.sport.charAt(0).toUpperCase() + selectedSlot.sport.slice(1)} — {selectedSlot.date}
              </Text>
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                {selectedSlot.time_start} – {selectedSlot.time_end}
              </Text>
            </View>
          )}

          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Your School *</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {mySchools
              .filter((s) => selectedSlot && s.sport === selectedSlot.sport)
              .map((s) => (
                <TouchableOpacity
                  key={s.school_id}
                  onPress={() => setSelectedMySchool(s.school_id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: selectedMySchool === s.school_id ? "#1B2A4A" : "#F3F4F6",
                  }}
                >
                  <Text style={{ color: selectedMySchool === s.school_id ? "#FFFFFF" : "#374151", fontWeight: "600" }}>
                    {s.schools?.name || "Unknown"}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Home/Away</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {(["home", "away", "neutral"] as const).map((ha) => (
              <TouchableOpacity
                key={ha}
                onPress={() => setReqHomeAway(ha)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: reqHomeAway === ha ? "#1B2A4A" : "#F3F4F6",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: reqHomeAway === ha ? "#FFFFFF" : "#374151", fontWeight: "600" }}>
                  {ha.charAt(0).toUpperCase() + ha.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Venue (optional)</Text>
          <TextInput
            style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 24 }}
            value={reqVenue}
            onChangeText={setReqVenue}
            placeholder="Proposed venue"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity
            onPress={handleSendRequest}
            disabled={submitting}
            style={{ backgroundColor: "#F97316", borderRadius: 8, padding: 16, alignItems: "center", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Send Request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </>
  );
}
