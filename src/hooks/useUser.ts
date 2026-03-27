"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/client";
import { logger } from "@/lib/logger";
import { useAuth } from "@/context/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  last_login: string;
}

/**
 * Returns the authenticated user (from AuthContext) together with their
 * extended profile row from the `users` table.
 *
 * Auth state management is fully delegated to AuthContext so there is only
 * one active auth listener in the application.
 */
export function useUser() {
  // Reuse the existing auth subscription from AuthContext — no duplicate listener.
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, email, display_name, avatar_url, created_at, last_login")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data as UserProfile);
      } catch (error) {
        logger.error("Error fetching user profile", error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  return { user, profile, loading: authLoading || profileLoading };
}
