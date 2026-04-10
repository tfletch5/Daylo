import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/auth";
import { supabase } from "../src/lib/supabase";
import { Tables } from "../src/types/database";

type School = Tables<"schools">;
type CoachSchool = Tables<"coach_schools">;

export default function ManageSchoolScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [coachSchools, setCoachSchools] = useState<CoachSchool[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    school_id: "",
    sport: "",
    is_primary: false,
  });

  useEffect(() => {
    fetchSchools();
    fetchCoachSchools();
  }, []);

  const fetchSchools = async () => {
    const { data } = await supabase
      .from("schools")
      .select("*")
      .ilike("name", `%${searchQuery}%`)
      .order("name");
    setSchools(data || []);
  };

  const fetchCoachSchools = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("coach_schools")
      .select("*, schools(*)")
      .eq("coach_id", profile.id);
    setCoachSchools(data || []);
  };

  const handleAddSchool = async () => {
    if (!profile || !formData.school_id || !formData.sport) {
      Alert.alert("Error", "Please select a school and sport");
      return;
    }

    setLoading(true);
    try {
      // Check if already associated
      const { data: existing } = await supabase
        .from("coach_schools")
        .select("*")
        .eq("coach_id", profile.id)
        .eq("school_id", formData.school_id)
        .eq("sport", formData.sport)
        .single();

      if (existing) {
        Alert.alert(
          "Error",
          "You're already associated with this school for this sport",
        );
        return;
      }

      const { error } = await supabase.from("coach_schools").insert({
        coach_id: profile.id,
        school_id: formData.school_id,
        sport: formData.sport,
        is_primary: formData.is_primary,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "School added successfully");
        setShowAddForm(false);
        setFormData({ school_id: "", sport: "", is_primary: false });
        fetchCoachSchools();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add school");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSchool = async (coachSchoolId: string) => {
    Alert.alert(
      "Remove School",
      "Are you sure you want to remove this school association?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("coach_schools")
              .delete()
              .eq("id", coachSchoolId);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              Alert.alert("Success", "School removed successfully");
              fetchCoachSchools();
            }
          },
        },
      ],
    );
  };

  const SPORTS = [
    "football",
    "soccer",
    "basketball",
    "baseball",
    "softball",
    "volleyball",
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={{ padding: 16 }}>
        {/* My Schools */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#1B2A4A",
            marginBottom: 16,
          }}
        >
          My Schools
        </Text>

        {coachSchools.length === 0 ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ color: "#6B7280", fontSize: 14 }}>
              No schools associated yet. Add your first school below.
            </Text>
          </View>
        ) : (
          coachSchools.map((cs) => (
            <View
              key={cs.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#1B2A4A" }}
                >
                  {(cs as any).schools?.name || "Unknown School"}
                </Text>
                <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>
                  {cs.sport.charAt(0).toUpperCase() + cs.sport.slice(1)}
                  {cs.is_primary && " (Primary)"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveSchool(cs.id)}
                style={{
                  backgroundColor: "#FEE2E2",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{ color: "#DC2626", fontSize: 12, fontWeight: "600" }}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Add School Button */}
        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={{
            backgroundColor: "#F97316",
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
            Add School
          </Text>
        </TouchableOpacity>

        {/* Add School Form */}
        {showAddForm && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1B2A4A",
                marginBottom: 16,
              }}
            >
              Add New School
            </Text>

            {/* School Search */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1B2A4A",
                  marginBottom: 8,
                }}
              >
                Search School
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: "#FFFFFF",
                }}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Type to search schools..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* School Selection */}
            {schools.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#1B2A4A",
                    marginBottom: 8,
                  }}
                >
                  Select School
                </Text>
                <ScrollView style={{ maxHeight: 120 }}>
                  {schools.map((school) => (
                    <TouchableOpacity
                      key={school.id}
                      onPress={() =>
                        setFormData({ ...formData, school_id: school.id })
                      }
                      style={{
                        padding: 12,
                        backgroundColor:
                          formData.school_id === school.id
                            ? "#F3F4F6"
                            : "#FFFFFF",
                        borderRadius: 8,
                        marginBottom: 4,
                        borderWidth: 1,
                        borderColor:
                          formData.school_id === school.id
                            ? "#F97316"
                            : "#E5E7EB",
                      }}
                    >
                      <Text style={{ fontSize: 14, color: "#1B2A4A" }}>
                        {school.name}
                      </Text>
                      {school.city && school.state && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#6B7280",
                            marginTop: 2,
                          }}
                        >
                          {school.city}, {school.state}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Sport Selection */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1B2A4A",
                  marginBottom: 8,
                }}
              >
                Sport
              </Text>
              <ScrollView horizontal style={{ maxHeight: 50 }}>
                {SPORTS.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    onPress={() => setFormData({ ...formData, sport })}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor:
                        formData.sport === sport ? "#F97316" : "#F3F4F6",
                      borderRadius: 20,
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: formData.sport === sport ? "#FFFFFF" : "#374151",
                      }}
                    >
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Primary School Toggle */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#1B2A4A" }}
              >
                Primary School
              </Text>
              <Switch
                value={formData.is_primary}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_primary: value })
                }
              />
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setFormData({ school_id: "", sport: "", is_primary: false });
                  setSearchQuery("");
                }}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddSchool}
                disabled={loading || !formData.school_id || !formData.sport}
                style={{
                  flex: 1,
                  backgroundColor:
                    loading || !formData.school_id || !formData.sport
                      ? "#9CA3AF"
                      : "#F97316",
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Add School
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
