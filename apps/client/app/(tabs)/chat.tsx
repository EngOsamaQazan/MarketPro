import { useEffect, useState, useRef } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { supabase } from "@/lib/supabase";

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) return;

      let { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("company_id", profile.company_id)
        .single();

      if (!conv) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ company_id: profile.company_id })
          .select()
          .single();
        conv = newConv;
      }

      if (conv) {
        setConversationId(conv.id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("*, profiles(full_name, role)")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });
        if (msgs) setMessages(msgs);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        scrollRef.current?.scrollToEnd({ animated: true });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  async function sendMessage() {
    if (!newMessage.trim() || !conversationId) return;
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: newMessage.trim(),
    });
    setNewMessage("");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>💬</Text>
            <Text style={styles.emptyChatText}>ابدأ محادثة مع فريق التسويق</Text>
          </View>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <View key={msg.id} style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                {!isMe && (
                  <Text style={styles.senderName}>
                    {msg.profiles?.full_name || "فريق التسويق"}
                  </Text>
                )}
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                  {msg.content}
                </Text>
                <Text style={[styles.time, isMe && styles.timeMe]}>
                  {new Date(msg.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="اكتب رسالتك..."
          placeholderTextColor="#94a3b8"
          multiline
          textAlign="right"
          onSubmitEditing={sendMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  messages: { flex: 1, padding: 16 },
  emptyChat: { alignItems: "center", paddingTop: 80 },
  emptyChatIcon: { fontSize: 48, marginBottom: 12 },
  emptyChatText: { fontSize: 15, color: "#94a3b8" },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12, marginBottom: 8 },
  bubbleMe: { alignSelf: "flex-start", backgroundColor: "#2563eb", borderBottomLeftRadius: 4 },
  bubbleOther: { alignSelf: "flex-end", backgroundColor: "#fff", borderBottomRightRadius: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  senderName: { fontSize: 11, fontWeight: "600", color: "#3b82f6", marginBottom: 4, textAlign: "right" },
  bubbleText: { fontSize: 14, color: "#0f172a", lineHeight: 22, textAlign: "right" },
  bubbleTextMe: { color: "#fff" },
  time: { fontSize: 10, color: "#94a3b8", marginTop: 4, textAlign: "left" },
  timeMe: { color: "rgba(255,255,255,0.6)" },
  inputBar: { flexDirection: "row-reverse", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f1f5f9", alignItems: "flex-end", gap: 8 },
  input: { flex: 1, backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100, color: "#0f172a" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
  sendBtnText: { fontSize: 20, color: "#fff", fontWeight: "700" },
});
