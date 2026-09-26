"use client";

// Lets a screen tell the native back bar what to call itself.
//
// Most screens have a fixed name that NativeBackBar knows from the path. A list
// detail does not — it should show the list's own name, which is only known once
// the screen has loaded it. Rather than have the back bar fetch the list a second
// time, the screen reports its title here and the bar reads it.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ScreenTitleValue {
  title: string | null;
  setTitle: (title: string | null) => void;
}

const ScreenTitleContext = createContext<ScreenTitleValue>({
  title: null,
  setTitle: () => {},
});

export function ScreenTitleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [title, setTitle] = useState<string | null>(null);
  const value = useMemo(() => ({ title, setTitle }), [title]);

  return (
    <ScreenTitleContext.Provider value={value}>
      {children}
    </ScreenTitleContext.Provider>
  );
}

/** Read the current screen title. Used by the back bar. */
export function useScreenTitle(): string | null {
  return useContext(ScreenTitleContext).title;
}

/**
 * Publish a title for as long as this screen is mounted, clearing it on the way
 * out so the next screen does not inherit it.
 */
export function useSetScreenTitle(title: string | null | undefined) {
  const { setTitle } = useContext(ScreenTitleContext);
  const clear = useCallback(() => setTitle(null), [setTitle]);

  useEffect(() => {
    setTitle(title ?? null);
    return clear;
  }, [title, setTitle, clear]);
}
