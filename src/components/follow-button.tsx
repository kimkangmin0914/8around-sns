"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setFollowing } from "@/actions/follows";
import { uncertainWrite, type ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";

export function FollowButton({
  userId,
  targetId,
  following,
}: {
  userId: string;
  targetId: string;
  following: boolean;
}) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(following);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const busy = useRef(false);
  return (
    <div className="stack">
      <Button
        variant={confirmed ? "outline" : "default"}
        disabled={pending}
        aria-pressed={confirmed}
        onClick={async () => {
          if (busy.current) return;
          busy.current = true;
          setPending(true);
          setResult(null);
          const form = new FormData();
          form.set("followee_id", targetId);
          form.set("following", String(!confirmed));
          try {
            const next = await setFollowing(userId, form);
            setResult(next);
            if (
              next.status === "success" &&
              typeof next.following === "boolean"
            ) {
              setConfirmed(next.following);
              router.refresh();
            }
          } catch {
            setResult(uncertainWrite);
          } finally {
            busy.current = false;
            setPending(false);
          }
        }}
      >
        {pending
          ? "확인하고 있습니다…"
          : confirmed
            ? "팔로잉 · 해제"
            : "팔로우"}
      </Button>
      <div aria-live="polite">
        {result && (
          <p className={result.status === "success" ? "success" : "error"}>
            {result.message}
          </p>
        )}
      </div>
      {result?.status === "uncertain" && (
        <Button variant="outline" onClick={() => router.refresh()}>
          관계 다시 확인
        </Button>
      )}
    </div>
  );
}
