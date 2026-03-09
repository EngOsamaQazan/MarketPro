import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase-server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

async function queryApiKeys(query: (client: ReturnType<typeof createClient>) => Promise<any>): Promise<any> {
  try {
    const sessionClient = await createServerSupabaseClient();
    const result = await query(sessionClient as any);
    if (!result.error && result.data) return result;
  } catch {
    // Not in a request context (e.g. cron job), fall through
  }

  const admin = getAdminClient();
  if (admin) {
    return query(admin);
  }

  return { data: null, error: new Error("No Supabase client available") };
}

export async function getApiKey(service: string, keyName: string = "api_key"): Promise<string | null> {
  const { data } = await queryApiKeys((client) =>
    client
      .from("api_keys")
      .select("key_value")
      .eq("service", service)
      .eq("key_name", keyName)
      .eq("is_active", true)
      .single()
  );

  return data?.key_value ?? null;
}

export async function getAnthropicKey(): Promise<string> {
  const dbKey = await getApiKey("anthropic");
  if (dbKey) return dbKey;

  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  throw new Error("مفتاح Anthropic API غير مُعدّ. أضفه من شاشة الإعدادات أو في متغيرات البيئة.");
}

export async function getServiceKeys(service: string): Promise<Record<string, string>> {
  const { data } = await queryApiKeys((client) =>
    client
      .from("api_keys")
      .select("key_name, key_value")
      .eq("service", service)
      .eq("is_active", true)
  );

  if (!data) return {};
  return Object.fromEntries(data.map((k: any) => [k.key_name, k.key_value]));
}

export function getSupabaseAdmin() {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }
  return admin;
}
