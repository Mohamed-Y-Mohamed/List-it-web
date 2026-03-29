"use client";

import { useEffect, useState } from "react";
import { AppSetting } from "@/types/schema";

/**
 * Hook that fetches the available color palette from the colors_retriever API.
 * Returns the list of colors and a loading flag.
 */
export function useAppColors() {
  const [colors, setColors] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/colors_retriever")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setColors(json.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch app colors:", err);
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { colors, loading };
}
