"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/icons/icon";
import { Loader } from "@/components/brand/mark";
import { useToast } from "@/components/ui/toast";
import { signOut } from "@/server/actions/auth";
import type { ShellViewer } from "@/components/shell/shell-context";
import styles from "./account-menu.module.css";

/** Avatar button that opens a small panel: who you are, profile, sign out. */
export function AccountMenu({
  viewer,
  placement = "right",
}: {
  viewer: Extract<ShellViewer, { status: "ready" | "onboarding" }>;
  placement?: "right" | "below";
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = viewer.status === "ready" ? viewer.displayName : "새 계정";

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    try {
      const result = await signOut();
      if (result.status === "success") {
        setOpen(false);
        toast({ tone: "success", message: result.message });
        router.replace("/");
        router.refresh();
      } else toast({ tone: "error", message: result.message });
    } catch {
      toast({
        tone: "error",
        message: "로그아웃 결과를 확인하지 못했어요. 새로고침해 주세요.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.root} ref={root} data-placement={placement}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${name} 계정 메뉴`}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar id={viewer.id} name={name} size={36} />
      </button>
      {open && (
        <div className={styles.panel} id={panelId}>
          <div className={styles.who}>
            <Avatar id={viewer.id} name={name} size={40} />
            <div>
              <p className={styles.name}>{name}</p>
              <p className={styles.handle}>
                {viewer.status === "ready"
                  ? `@${viewer.username}`
                  : "프로필을 아직 만들지 않았어요"}
              </p>
            </div>
          </div>
          <ul className={styles.list}>
            <li>
              <Link
                className={styles.item}
                href={
                  viewer.status === "ready"
                    ? `/u/${viewer.username}`
                    : "/onboarding"
                }
                onClick={() => setOpen(false)}
              >
                <Icon name="person" size={18} />
                {viewer.status === "ready" ? "내 프로필" : "프로필 만들기"}
              </Link>
            </li>
            <li>
              <button
                type="button"
                className={styles.item}
                onClick={handleSignOut}
                disabled={pending}
              >
                {pending ? (
                  <Loader size={18} label="로그아웃하는 중" />
                ) : (
                  <Icon name="logout" size={18} />
                )}
                로그아웃
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
