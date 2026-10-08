"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ShellViewer =
  | { status: "guest" | "error" }
  | { status: "onboarding"; id: string }
  | {
      status: "ready";
      id: string;
      username: string;
      displayName: string;
    };

type ShellState = {
  viewer: ShellViewer;
  menuOpen: boolean;
  composeOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  openCompose: () => void;
  closeCompose: () => void;
  /** Id of something the viewer just created, so lists can highlight it. */
  fresh: string | null;
  markFresh: (id: string | null) => void;
};

const ShellContext = createContext<ShellState | null>(null);

export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside <ShellProvider>");
  return value;
}

export function ShellProvider({
  viewer,
  children,
}: {
  viewer: ShellViewer;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openCompose = useCallback(() => {
    setMenuOpen(false);
    setComposeOpen(true);
  }, []);
  const closeCompose = useCallback(() => setComposeOpen(false), []);
  const markFresh = useCallback((id: string | null) => setFresh(id), []);

  const value = useMemo(
    () => ({
      viewer,
      menuOpen,
      composeOpen,
      openMenu,
      closeMenu,
      openCompose,
      closeCompose,
      fresh,
      markFresh,
    }),
    [
      viewer,
      menuOpen,
      composeOpen,
      openMenu,
      closeMenu,
      openCompose,
      closeCompose,
      fresh,
      markFresh,
    ],
  );
  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}
