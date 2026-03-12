import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "./supabase-server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
  orgId: string;
  orgRole: string;
  error: null;
}

export interface AuthError {
  user: null;
  supabase: SupabaseClient;
  orgId: null;
  orgRole: null;
  error: NextResponse;
}

export async function requireAuth(): Promise<AuthContext | AuthError> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, orgId: null, orgRole: null, error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.active_organization_id;

  if (!orgId) {
    return { user: null, supabase, orgId: null, orgRole: null, error: NextResponse.json({ error: "لا توجد منظمة نشطة" }, { status: 403 }) };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { user: null, supabase, orgId: null, orgRole: null, error: NextResponse.json({ error: "ليس لديك صلاحية على هذه المنظمة" }, { status: 403 }) };
  }

  return { user, supabase, orgId, orgRole: membership.role, error: null };
}

export async function requireOrgAdmin(): Promise<AuthContext | AuthError> {
  const result = await requireAuth();
  if (result.error) return result;

  if (!["owner", "admin"].includes(result.orgRole)) {
    return {
      user: null,
      supabase: result.supabase,
      orgId: null,
      orgRole: null,
      error: NextResponse.json({ error: "يجب أن تكون مدير المنظمة" }, { status: 403 }),
    };
  }

  return result;
}
