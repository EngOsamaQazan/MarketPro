import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";

type LoginMethod = "email" | "username" | "phone";

const METHODS: { key: LoginMethod; label: string; placeholder: string; keyboard: "email-address" | "phone-pad" | "default" }[] = [
  { key: "email", label: "البريد الإلكتروني", placeholder: "email@example.com", keyboard: "email-address" },
  { key: "username", label: "اسم المستخدم", placeholder: "username", keyboard: "default" },
  { key: "phone", label: "رقم الهاتف", placeholder: "0797707062", keyboard: "phone-pad" },
];

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<LoginMethod>("email");

  const adminUrl = Constants.expoConfig?.extra?.supabaseUrl
    ? `${Constants.expoConfig.extra.supabaseUrl.replace("supabase.co", "supabase.co")}`
    : process.env.EXPO_PUBLIC_ADMIN_URL || "";

  async function resolveEmail(id: string): Promise<string | null> {
    if (method === "email") return id;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq(method === "phone" ? "phone" : "username", id)
        .single();

      if (error || !data) {
        Alert.alert(
          "خطأ",
          method === "phone" ? "رقم الهاتف غير مسجل" : "اسم المستخدم غير موجود"
        );
        return null;
      }
      return data.email;
    } catch {
      Alert.alert("خطأ", "حدث خطأ أثناء التحقق");
      return null;
    }
  }

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      Alert.alert("خطأ", "الرجاء إدخال جميع الحقول");
      return;
    }

    setLoading(true);

    const email = await resolveEmail(identifier.trim());
    if (!email) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert("خطأ في تسجيل الدخول", "بيانات الدخول غير صحيحة");
    } else {
      router.replace("/(tabs)");
    }
    setLoading(false);
  }

  const current = METHODS.find((m) => m.key === method)!;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>س</Text>
        </View>
        <Text style={styles.title}>سطوة</Text>
        <Text style={styles.subtitle}>بوابة العميل</Text>
      </View>

      <View style={styles.form}>
        {/* Method Tabs */}
        <View style={styles.tabs}>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.tab, method === m.key && styles.tabActive]}
              onPress={() => {
                setMethod(m.key);
                setIdentifier("");
              }}
            >
              <Text style={[styles.tabText, method === m.key && styles.tabTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{current.label}</Text>
        <TextInput
          style={styles.input}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={current.placeholder}
          keyboardType={current.keyboard}
          autoCapitalize="none"
          textAlign="left"
        />

        <Text style={styles.label}>كلمة المرور</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          textAlign="left"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>تسجيل الدخول</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center", marginBottom: 16, shadowColor: "#2563eb", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  logoText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  title: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  form: { backgroundColor: "#fff", borderRadius: 20, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tabs: { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 11, fontWeight: "600", color: "#94a3b8" },
  tabTextActive: { color: "#2563eb" },
  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8, textAlign: "right" },
  input: { backgroundColor: "#f1f5f9", borderRadius: 12, padding: 14, fontSize: 15, color: "#0f172a", marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  button: { backgroundColor: "#2563eb", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
