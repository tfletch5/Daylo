import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAuthStore } from "../../src/store/auth";
import { supabase } from "../../src/lib/supabase";
import { Tables } from "../../src/types/database";

type Message = Tables<"messages">;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState("Coach");
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoading(false);

    // Mark unread messages as read
    if (profile) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", profile.id)
        .eq("is_read", false);
    }
  }, [conversationId, profile]);

  const fetchOtherUser = useCallback(async () => {
    if (!conversationId || !profile) return;
    const { data: convo } = await supabase
      .from("conversations")
      .select("participant_a, participant_b")
      .eq("id", conversationId)
      .single();

    if (convo) {
      const otherId = convo.participant_a === profile.id ? convo.participant_b : convo.participant_a;
      const { data: other } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", otherId)
        .single();
      if (other) {
        setOtherName(`${other.first_name || ""} ${other.last_name || ""}`.trim() || "Coach");
      }
    }
  }, [conversationId, profile]);

  useEffect(() => {
    fetchMessages();
    fetchOtherUser();
  }, [fetchMessages, fetchOtherUser]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          // Mark as read if from other user
          if (newMsg.sender_id !== profile?.id) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, profile]);

  const handleSend = async () => {
    if (!input.trim() || !profile || !conversationId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content: input.trim(),
    });
    setSending(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setInput("");
    }
  };

  const handleAttachImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      Alert.alert("Error", "File must be under 10MB.");
      return;
    }

    await uploadAndSendFile(asset.uri, asset.fileName || "image.jpg", "image/jpeg");
  };

  const handleAttachDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_FILE_SIZE) {
      Alert.alert("Error", "File must be under 10MB.");
      return;
    }

    await uploadAndSendFile(asset.uri, asset.name, "application/pdf");
  };

  const uploadAndSendFile = async (uri: string, fileName: string, mimeType: string) => {
    if (!profile || !conversationId) return;
    setSending(true);

    const filePath = `${conversationId}/${Date.now()}-${fileName}`;
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error: uploadErr } = await supabase.storage
      .from("message-attachments")
      .upload(filePath, blob, { contentType: mimeType });

    if (uploadErr) {
      setSending(false);
      Alert.alert("Upload Error", uploadErr.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("message-attachments")
      .getPublicUrl(filePath);

    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content: `📎 ${fileName}`,
      file_url: urlData.publicUrl,
      file_type: mimeType,
      file_name: fileName,
      file_size_bytes: blob.size,
    });

    setSending(false);
    if (msgErr) Alert.alert("Error", msgErr.message);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1B2A4A" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: otherName }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 48 }}>
              <Text style={{ color: "#9CA3AF" }}>No messages yet. Start the conversation!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.sender_id === profile?.id;
            return (
              <View
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: isMine ? "#1B2A4A" : "#FFFFFF",
                    borderRadius: 16,
                    borderBottomRightRadius: isMine ? 4 : 16,
                    borderBottomLeftRadius: isMine ? 16 : 4,
                    padding: 12,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  {item.content && (
                    <Text
                      style={{
                        color: isMine ? "#FFFFFF" : "#374151",
                        fontSize: 15,
                        lineHeight: 20,
                      }}
                    >
                      {item.content}
                    </Text>
                  )}
                  {item.file_url && (
                    <Text
                      style={{
                        color: isMine ? "#FDBA74" : "#F97316",
                        fontSize: 13,
                        marginTop: item.content ? 4 : 0,
                        textDecorationLine: "underline",
                      }}
                    >
                      {item.file_name || "Attachment"}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#9CA3AF",
                    marginTop: 2,
                    alignSelf: isMine ? "flex-end" : "flex-start",
                    marginHorizontal: 4,
                  }}
                >
                  {formatTime(item.created_at)}
                </Text>
              </View>
            );
          }}
        />

        {/* Input bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            gap: 8,
          }}
        >
          <TouchableOpacity onPress={handleAttachImage} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20 }}>🖼️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAttachDocument} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20 }}>📄</Text>
          </TouchableOpacity>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: "#F3F4F6",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              maxHeight: 100,
            }}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={{
              backgroundColor: input.trim() ? "#F97316" : "#E5E7EB",
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
