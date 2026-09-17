"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setFollowing } from "@/actions/follows";
import { uncertainWrite, type ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { actionMessage } from "@/components/action-message";

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
  const [serverFollowing, setServerFollowing] = useState(following);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const busy = useRef(false);
  const button = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  if (serverFollowing !== following) {
    setServerFollowing(following);
    setConfirmed(following);
    if (confirmed !== following) setResult(null);
  }
  useEffect(() => {
    if (!pending && restoreFocus.current) {
      restoreFocus.current = false;
      // Do not take focus back if the user moved to another control meanwhile.
      if (document.activeElement === document.body) button.current?.focus();
    }
  }, [pending]);
  return (
    <div className="follow-control stack">
      <Button
        ref={button}
        className="follow-submit"
        variant={confirmed ? "outline" : "default"}
        disabled={pending}
        aria-pressed={confirmed}
        onClick={async (event) => {
          if (busy.current) return;
          restoreFocus.current = document.activeElement === event.currentTarget;
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
        {pending ? "확인 중…" : confirmed ? "팔로잉 · 해제" : "팔로우"}
      </Button>
      <div aria-live="polite">
        {result && (
          <p className={result.status === "success" ? "success" : "error"}>
            {actionMessage(result.message)}
          </p>
        )}
      </div>
      {result?.status === "uncertain" && (
        <Button variant="outline" onClick={() => router.refresh()}>
          팔로우 상태 다시 확인
        </Button>
      )}
    </div>
  );
}
