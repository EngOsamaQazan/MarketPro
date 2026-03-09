"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Database } from "@marketpro/shared/src/types/database";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Tables["profiles"]["Row"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setProfile(data);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, []);

  return { user, profile, loading, signOut };
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Tables["companies"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setCompanies(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const addCompany = useCallback(async (company: Tables["companies"]["Insert"]) => {
    const { data, error } = await supabase
      .from("companies")
      .insert(company)
      .select()
      .single();
    if (!error && data) {
      setCompanies((prev) => [data, ...prev]);
    }
    return { data, error };
  }, []);

  const updateCompany = useCallback(async (id: string, updates: Tables["companies"]["Update"]) => {
    const { data, error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setCompanies((prev) => prev.map((c) => (c.id === id ? data : c)));
    }
    return { data, error };
  }, []);

  return { companies, loading, fetchCompanies, addCompany, updateCompany };
}

export function useMarketingPlans(companyId?: string) {
  const [plans, setPlans] = useState<Tables["marketing_plans"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("marketing_plans")
      .select("*")
      .order("month", { ascending: false });

    if (companyId) query = query.eq("company_id", companyId);

    const { data, error } = await query;
    if (!error && data) setPlans(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return { plans, loading, fetchPlans };
}

export function useCampaigns(companyId?: string) {
  const [campaigns, setCampaigns] = useState<Tables["ad_campaigns"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("ad_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (companyId) query = query.eq("company_id", companyId);

    const { data, error } = await query;
    if (!error && data) setCampaigns(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const updateCampaign = useCallback(async (id: string, updates: Tables["ad_campaigns"]["Update"]) => {
    const { data, error } = await supabase
      .from("ad_campaigns")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setCampaigns((prev) => prev.map((c) => (c.id === id ? data : c)));
    }
    return { data, error };
  }, []);

  return { campaigns, loading, fetchCampaigns, updateCampaign };
}

export function useContent(companyId?: string) {
  const [content, setContent] = useState<Tables["content_calendar"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("content_calendar")
      .select("*")
      .order("scheduled_date", { ascending: true });

    if (companyId) query = query.eq("company_id", companyId);

    const { data, error } = await query;
    if (!error && data) setContent(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  return { content, loading, fetchContent };
}

export function useReports(companyId?: string) {
  const [reports, setReports] = useState<Tables["monthly_reports"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("monthly_reports")
      .select("*")
      .order("month", { ascending: false });

    if (companyId) query = query.eq("company_id", companyId);

    const { data, error } = await query;
    if (!error && data) setReports(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return { reports, loading, fetchReports };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Tables["notifications"]["Row"][]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, fetchNotifications, markAsRead };
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    activeCampaigns: 0,
    totalSpend: 0,
    totalContent: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [companies, campaigns, content] = await Promise.all([
        supabase.from("companies").select("id, status", { count: "exact" }),
        supabase.from("ad_campaigns").select("id, status, spent_amount"),
        supabase.from("content_calendar").select("id, approval_status", { count: "exact" }),
      ]);

      const companiesData = companies.data || [];
      const campaignsData = campaigns.data || [];
      const contentData = content.data || [];

      setStats({
        totalClients: companiesData.length,
        activeClients: companiesData.filter((c) => c.status === "active").length,
        activeCampaigns: campaignsData.filter((c) => c.status === "active").length,
        totalSpend: campaignsData.reduce((sum, c) => sum + (c.spent_amount || 0), 0),
        totalContent: contentData.length,
        pendingApprovals: contentData.filter((c) => c.approval_status === "pending").length,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  return { stats, loading };
}
