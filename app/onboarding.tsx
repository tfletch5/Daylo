import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../src/store/auth";
import { supabase } from "../src/lib/supabase";

const SPORTS = ["football", "soccer"] as const;

export default function Onboarding() {
  const { profile, fetchProfile } = useAuthStore();
  const [step, setStep] = useState(0);

  // Step 0: Personal details
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  // Step 1: School
  const [schoolName, setSchoolName] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [schoolState, setSchoolState] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolZip, setSchoolZip] = useState("");
  const [schoolMascot, setSchoolMascot] = useState("");
  const [schoolConference, setSchoolConference] = useState("");
  const [schoolDivision, setSchoolDivision] = useState("");

  // Step 2: Sport selection
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!firstName || !lastName) {
      Alert.alert("Error", "First and last name are required.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() })
      .eq("id", profile!.id);
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setStep(1);
    }
  };

  const handleSaveSchool = async () => {
    if (!schoolName) {
      Alert.alert("Error", "School name is required.");
      return;
    }
    setLoading(true);

    const { data: school, error: schoolErr } = await supabase
      .from("schools")
      .insert({
        name: schoolName.trim(),
        city: schoolCity.trim() || null,
        state: schoolState.trim() || null,
        address: schoolAddress.trim() || null,
        zip_code: schoolZip.trim() || null,
        mascot: schoolMascot.trim() || null,
        conference: schoolConference.trim() || null,
        division: schoolDivision.trim() || null,
        created_by: profile!.id,
      })
      .select()
      .single();

    setLoading(false);
    if (schoolErr) {
      Alert.alert("Error", schoolErr.message);
    } else if (school) {
      setStep(2);
    }
  };

  const handleFinish = async () => {
    if (selectedSports.length === 0) {
      Alert.alert("Error", "Select at least one sport.");
      return;
    }
    setLoading(true);

    // Get the school we just created
    const { data: schools } = await supabase
      .from("schools")
      .select("id")
      .eq("created_by", profile!.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!schools || schools.length === 0) {
      setLoading(false);
      Alert.alert("Error", "Could not find school. Please try again.");
      return;
    }

    const schoolId = schools[0].id;

    const inserts = selectedSports.map((sport, i) => ({
      coach_id: profile!.id,
      school_id: schoolId,
      sport,
      is_primary: i === 0,
    }));

    const { error } = await supabase.from("coach_schools").insert(inserts);

    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      await fetchProfile();
      router.replace("/(tabs)/home");
    }
  };

  const toggleSport = (s: string) => {
    setSelectedSports((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {/* Progress */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: i <= step ? "#F97316" : "#E5E7EB",
              }}
            />
          ))}
        </View>

        {step === 0 && (
          <>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#1B2A4A", marginBottom: 4 }}>
              Personal Details
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              Tell us about yourself
            </Text>

            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
              First Name *
            </Text>
            <TextInput
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
              Last Name *
            </Text>
            <TextInput
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Smith"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
              Phone (optional)
            </Text>
            <TextInput
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 24 }}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={loading}
              style={{ backgroundColor: "#1B2A4A", borderRadius: 8, padding: 16, alignItems: "center", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#1B2A4A", marginBottom: 4 }}>
              Your School
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              Enter your school's information
            </Text>

            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>School Name *</Text>
            <TextInput
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
              value={schoolName}
              onChangeText={setSchoolName}
              placeholder="Lincoln High School"
              placeholderTextColor="#9CA3AF"
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>City</Text>
                <TextInput
                  style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
                  value={schoolCity}
                  onChangeText={setSchoolCity}
                  placeholder="Dallas"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>State</Text>
                <TextInput
                  style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
                  value={schoolState}
                  onChangeText={setSchoolState}
                  placeholder="TX"
                  placeholderTextColor="#9CA3AF"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Address</Text>
            <TextInput
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
              value={schoolAddress}
              onChangeText={setSchoolAddress}
              placeholder="123 Main St"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Zip Code</Text>
            <TextInput
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
              value={schoolZip}
              onChangeText={setSchoolZip}
              placeholder="75001"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />

            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Mascot</Text>
            <TextInput
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
              value={schoolMascot}
              onChangeText={setSchoolMascot}
              placeholder="Lions"
              placeholderTextColor="#9CA3AF"
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Conference</Text>
                <TextInput
                  style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
                  value={schoolConference}
                  onChangeText={setSchoolConference}
                  placeholder="District 7"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Division</Text>
                <TextInput
                  style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 }}
                  value={schoolDivision}
                  onChangeText={setSchoolDivision}
                  placeholder="5A"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveSchool}
              disabled={loading}
              style={{ backgroundColor: "#1B2A4A", borderRadius: 8, padding: 16, alignItems: "center", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#1B2A4A", marginBottom: 4 }}>
              Select Sports
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              Which sports do you coach?
            </Text>

            <View style={{ gap: 12, marginBottom: 32 }}>
              {SPORTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleSport(s)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: selectedSports.includes(s) ? "#1B2A4A" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: selectedSports.includes(s) ? "#1B2A4A" : "#D1D5DB",
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <Text style={{ fontSize: 28, marginRight: 16 }}>
                    {s === "football" ? "🏈" : "⚽"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: selectedSports.includes(s) ? "#FFFFFF" : "#374151",
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleFinish}
              disabled={loading}
              style={{ backgroundColor: "#F97316", borderRadius: 8, padding: 16, alignItems: "center", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Get Started</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
