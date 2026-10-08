"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isMissingSession } from "@/lib/supabase/auth-session";
import { Loader } from "@/components/brand/mark";

/**
 * If another tab signs out or switches account, this tab must not keep
 * acting as the old person. It re-checks identity on focus and hides
 * drafts until a fresh server render confirms who is here.
 */
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
    let client: ReturnType<typeof createClient>;
    try {
      client = createClient();
    } catch {
      return;
    }
    let active = true;
    let checking = false;
    const refreshFor = (id: string | undefined) => {
      if (active && id !== userId) {
        setBlockedGeneration(generation);
        router.refresh();
      }
    };
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

  if (blockedGeneration === generation)
    return (
      <div
        role="status"
        style={{
          display: "grid",
          placeItems: "center",
          gap: 12,
          minHeight: "60dvh",
          color: "var(--ink-2)",
        }}
      >
        <Loader size={28} label="로그인 상태 확인 중" />
        <p>
          다른 탭에서 로그인 상태가 바뀌었어요. 화면을 다시 불러오고 있어요.
        </p>
      </div>
    );
  return children;
}
