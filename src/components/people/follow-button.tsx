"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { setFollowing } from "@/server/actions/follows";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { useToast } from "@/components/ui/toast";
import { useShell } from "@/components/shell/shell-context";
import styles from "./follow-button.module.css";

/**
 * Optimistic follow toggle. Flips immediately, rolls back if the server
 * disagrees. While following, hover reveals "언팔로우" so the intent is clear.
 */
export function FollowButton({
  targetId,
  targetName,
  following,
  followsYou = false,
  size = "m",
  variant = "default",
}: {
  targetId: string;
  targetName: string;
  following: boolean;
  followsYou?: boolean;
  size?: "s" | "m";
  variant?: "default" | "onTone" | "subtle";
}) {
  const { viewer } = useShell();
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState(following);
  const [synced, setSynced] = useState(following);
  const [pending, setPending] = useState(false);
  const [pop, setPop] = useState(0);
  const busy = useRef(false);

  // Accept a fresh server value when it changes underneath us.
  if (synced !== following) {
    setSynced(following);
    setState(following);
  }

  if (viewer.status !== "ready") {
    return (
      <Button
        size={size}
        variant={variant === "onTone" ? "tone" : "primary"}
        onClick={() =>
          router.push(viewer.status === "onboarding" ? "/onboarding" : "/login")
        }
      >
        <Icon name="follow" size={18} />
        팔로우
      </Button>
    );
  }
  if (viewer.id === targetId) return null;

  async function toggle() {
    if (busy.current || viewer.status !== "ready") return;
    busy.current = true;
    const next = !state;
    setState(next);
    if (next) setPop((value) => value + 1);
    setPending(true);
    const form = new FormData();
    form.set("followee_id", targetId);
    form.set("following", String(next));
    try {
      const result = await setFollowing(viewer.id, form);
      if (result.status === "success") {
        setState(result.data.following);
        toast({ tone: "success", message: result.message });
        router.refresh();
      } else {
        setState(!next);
        toast({ tone: "error", message: result.message });
      }
    } catch {
      setState(!next);
      toast({
        tone: "error",
        message: "팔로우 상태를 확인하지 못했어요. 새로고침해 주세요.",
      });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const label = state
    ? `${targetName}님 팔로우 그만두기`
    : followsYou
      ? `${targetName}님 맞팔로우`
      : `${targetName}님 팔로우`;

  return (
    <button
      type="button"
      className={styles.button}
      data-following={state || undefined}
      data-size={size}
      data-variant={variant}
      data-pending={pending || undefined}
      aria-pressed={state}
      aria-label={label}
      onClick={toggle}
    >
      <span className={styles.face} key={pop} data-pop={pop > 0 || undefined}>
        {state ? (
          <>
            <span className={styles.on}>
              <Icon name="following" size={18} />
              팔로잉
            </span>
            <span className={styles.off}>
              <Icon name="unfollow" size={18} />
              언팔로우
            </span>
          </>
        ) : (
          <span className={styles.idle}>
            <Icon name="follow" size={18} />
            {followsYou ? "맞팔로우" : "팔로우"}
          </span>
        )}
      </span>
    </button>
  );
}
