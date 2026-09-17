"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isMissingSession } from "@/lib/auth-session";

export function SessionBoundary({
  userId,
  generation,
  children,
}: {
  userId: string;
  generation: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [blockedGeneration, setBlockedGeneration] = useState<string | null>(
    null,
  );
  useEffect(() => {
    const client = createClient();
    let active = true;
    let checking = false;
    const refreshFor = (id: string | undefined) => {
      if (active && id !== userId) {
        setBlockedGeneration(generation);
        router.refresh();
      }
    };
    // Server Action cookie changes in another tab need a fresh identity check.
    // A connection error alone must not discard the current draft.
    const checkSession = async () => {
      if (checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const { data, error } = await client.auth.getUser();
        if (!error || isMissingSession(error)) refreshFor(data.user?.id);
      } catch {
        /* Keep drafts when identity cannot be checked. */
      } finally {
        checking = false;
      }
    };
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      refreshFor(session?.user.id);
    });
    window.addEventListener("focus", checkSession);
    window.addEventListener("pageshow", checkSession);
    document.addEventListener("visibilitychange", checkSession);
    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", checkSession);
      window.removeEventListener("pageshow", checkSession);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [router, userId, generation]);
  // Only a fresh server render with verified identity can release this block.
  // Ordinary refreshes keep children mounted; mismatches discard old drafts.
  if (blockedGeneration === generation)
    return (
      <p role="status" className="notice">
        로그인 상태가 바뀌었습니다. 화면을 다시 확인하고 있습니다.
      </p>
    );
  return children;
}
