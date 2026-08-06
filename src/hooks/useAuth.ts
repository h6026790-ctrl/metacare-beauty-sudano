import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "staff" | "customer";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  // Starts true so role-dependent UI never renders as "not a customer"
  // before the user_roles query has answered.
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (!data.session?.user) setRolesLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setRoles([]); setRolesLoading(false); return; }
    let cancelled = false;
    setRolesLoading(true);
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      if (cancelled) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
      setRolesLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  return {
    session,
    user,
    roles,
    loading,
    rolesLoading,
    hasRole: (r: AppRole) => roles.includes(r),
    isStaff: roles.includes("staff") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
    // Customer surfaces are for pure customer accounts only.
    isCustomer: roles.includes("customer") && !roles.includes("staff") && !roles.includes("admin"),
    signOut: () => supabase.auth.signOut(),
  };
}

