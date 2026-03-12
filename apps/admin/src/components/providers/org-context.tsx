"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";

interface OrgLimits {
  max_clients: number;
  max_posts_month: number;
  max_campaigns: number;
  ai_credits_month: number;
  max_team_members: number;
}

interface Organization {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  type: "agency" | "brand";
  logo_url: string | null;
  plan: "free" | "starter" | "pro" | "enterprise";
  limits: OrgLimits;
  settings: Record<string, unknown>;
}

interface OrgMember {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "manager" | "viewer";
  accepted_at: string | null;
}

interface OrgContextType {
  org: Organization | null;
  orgRole: string | null;
  members: OrgMember[];
  loading: boolean;
  refreshOrg: () => Promise<void>;
  canManage: boolean;
}

const OrgContext = createContext<OrgContextType>({
  org: null,
  orgRole: null,
  members: [],
  loading: true,
  refreshOrg: async () => {},
  canManage: false,
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refreshOrg = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.active_organization_id) return;

      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.active_organization_id)
        .single();

      if (orgData) {
        setOrg(orgData as unknown as Organization);
      }

      const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", profile.active_organization_id)
        .eq("user_id", user.id)
        .single();

      if (membership) {
        setOrgRole(membership.role);
      }

      const { data: membersData } = await supabase
        .from("organization_members")
        .select("id, user_id, role, accepted_at")
        .eq("organization_id", profile.active_organization_id);

      if (membersData) {
        setMembers(membersData as unknown as OrgMember[]);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshOrg();
  }, [refreshOrg]);

  const canManage = orgRole === "owner" || orgRole === "admin";

  return (
    <OrgContext.Provider value={{ org, orgRole, members, loading, refreshOrg, canManage }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);
