"use client";

import { usePathname } from "next/navigation";
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
  keysOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  openCompose: () => void;
  closeCompose: () => void;
  openKeys: () => void;
  closeKeys: () => void;
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
  const [keysOpen, setKeysOpen] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);

  // Another account (or signing out) closes whatever was open for the last one.
  const identity = viewer.status === "ready" ? viewer.id : viewer.status;
  const [seenIdentity, setSeenIdentity] = useState(identity);
  if (identity !== seenIdentity) {
    setSeenIdentity(identity);
    setMenuOpen(false);
    setComposeOpen(false);
    setKeysOpen(false);
    setFresh(null);
  }
  // "Just posted" highlights belong to the page they happened on.
  const pathname = usePathname();
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setFresh(null);
  }

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openCompose = useCallback(() => {
    setMenuOpen(false);
    setComposeOpen(true);
  }, []);
  const closeCompose = useCallback(() => setComposeOpen(false), []);
  const openKeys = useCallback(() => {
    setMenuOpen(false);
    setKeysOpen(true);
  }, []);
  const closeKeys = useCallback(() => setKeysOpen(false), []);
  const markFresh = useCallback((id: string | null) => setFresh(id), []);

  const value = useMemo(
    () => ({
      viewer,
      menuOpen,
      composeOpen,
      keysOpen,
      openMenu,
      closeMenu,
      openCompose,
      closeCompose,
      openKeys,
      closeKeys,
      fresh,
      markFresh,
    }),
    [
      viewer,
      menuOpen,
      composeOpen,
      keysOpen,
      openMenu,
      closeMenu,
      openCompose,
      closeCompose,
      openKeys,
      closeKeys,
      fresh,
      markFresh,
    ],
  );
  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}
