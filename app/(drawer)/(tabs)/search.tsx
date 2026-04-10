import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../../src/lib/supabase";
import { Tables } from "../../../src/types/database";

type School = Tables<"schools">;

const SPORTS = ["football", "soccer"] as const;
const DIVISIONS = ["1A", "2A", "3A", "4A", "5A", "6A"] as const;

export default function Search() {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<string | null>(null);
  const [division, setDivision] = useState<string | null>(null);
  const [conference, setConference] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);

    let q = supabase.from("schools").select("*");

    if (query.trim()) {
      q = q.ilike("name", `%${query.trim()}%`);
    }
    if (division) {
      q = q.eq("division", division);
    }
    if (conference.trim()) {
      q = q.ilike("conference", `%${conference.trim()}%`);
    }

    q = q.order("name", { ascending: true }).limit(50);

    const { data, error } = await q;
    setResults(data || []);
    setLoading(false);
  }, [query, sport, division, conference]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Filters */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <TextInput
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            marginBottom: 12,
          }}
          placeholder="Search schools..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: "#6B7280",
            marginBottom: 6,
          }}
        >
          SPORT
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {SPORTS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSport(sport === s ? null : s)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: sport === s ? "#1B2A4A" : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  color: sport === s ? "#FFFFFF" : "#374151",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: "#6B7280",
            marginBottom: 6,
          }}
        >
          DIVISION
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {DIVISIONS.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDivision(division === d ? null : d)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: division === d ? "#1B2A4A" : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  color: division === d ? "#FFFFFF" : "#374151",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            marginBottom: 12,
          }}
          placeholder="Conference (optional)"
          placeholderTextColor="#9CA3AF"
          value={conference}
          onChangeText={setConference}
        />

        <TouchableOpacity
          onPress={handleSearch}
          style={{
            backgroundColor: "#F97316",
            borderRadius: 8,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#1B2A4A" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            searched ? (
              <View style={{ alignItems: "center", marginTop: 32 }}>
                <Text style={{ fontSize: 16, color: "#9CA3AF" }}>
                  No schools found
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/school/[id]",
                  params: { id: item.id },
                })
              }
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
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#1B2A4A" }}
              >
                {item.name}
              </Text>
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                {item.mascot ? `${item.mascot} • ` : ""}
                {item.city && item.state
                  ? `${item.city}, ${item.state}`
                  : "Location not set"}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                {item.division && (
                  <View
                    style={{
                      backgroundColor: "#EFF6FF",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#3B82F6",
                        fontWeight: "600",
                      }}
                    >
                      {item.division}
                    </Text>
                  </View>
                )}
                {item.conference && (
                  <View
                    style={{
                      backgroundColor: "#F0FDF4",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#10B981",
                        fontWeight: "600",
                      }}
                    >
                      {item.conference}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
