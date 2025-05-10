"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/client";
import { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  last_login: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch user profile from our users table
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data as UserProfile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setProfile(null);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
