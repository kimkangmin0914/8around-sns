"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { Mark } from "@/components/brand/mark";
import { useShell } from "@/components/shell/shell-context";
import { useToast } from "@/components/ui/toast";
import { signOut } from "@/server/actions/auth";
import { SeatMark } from "@/components/people/seat-mark";
import { closesOnBackdrop, restoreFocus } from "@/components/shell/dialog";
import { useShortcutsEnabled } from "@/components/shell/shortcuts";
import styles from "./bento-menu.module.css";

const REPO = "https://github.com/kimkangmin0914/8around-sns";

type Tile = {
  slot: "a" | "b" | "c" | "d" | "e" | "f" | "g";
  label: string;
  note?: string;
  art: ReactNode;
} & (
  | { href: string; external?: boolean }
  | { onSelect: () => void | Promise<void> }
);

function NodeArt() {
  return (
    <svg viewBox="0 0 120 120" className={styles.art} aria-hidden="true">
      <path d="M18 30 L96 62 L18 98" />
      <rect x="10" y="22" width="16" height="16" rx="4" />
      <rect x="88" y="54" width="16" height="16" rx="4" />
      <rect x="10" y="90" width="16" height="16" rx="4" />
    </svg>
  );
}

function CurveArt() {
  return (
    <svg viewBox="0 0 120 120" className={styles.art} aria-hidden="true">
      <path d="M16 104 C 70 104, 50 16, 104 16" />
      <path d="M16 104 H44 M104 16 H76" className={styles.handle} />
      <rect x="8" y="96" width="16" height="16" rx="4" />
      <rect x="96" y="8" width="16" height="16" rx="4" />
    </svg>
  );
}

function QuoteArt() {
  return (
    <span className={styles.quotes} aria-hidden="true">
      <Icon name="quote" size={88} strokeWidth={0} fill="currentColor" />
      <Icon
        name="quote"
        size={88}
        strokeWidth={0}
        fill="currentColor"
        style={{ transform: "rotate(180deg)" }}
      />
    </span>
  );
}

function BigIcon({ name }: { name: IconName }) {
  return (
    <span className={styles.bigIcon} aria-hidden="true">
      <Icon name={name} size={96} strokeWidth={1.6} />
    </span>
  );
}

export function BentoMenu() {
  const { viewer, menuOpen, closeMenu, openCompose } = useShell();
  const keys = useShortcutsEnabled();
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (menuOpen && !node.open) {
      setClosing(false);
      node.showModal();
      // autoFocus fires before showModal(); focus the close button now.
      node.querySelector<HTMLElement>("[data-menu-close]")?.focus();
    }
    if (!menuOpen && node.open) {
      setClosing(true);
      const timer = window.setTimeout(() => {
        node.close();
        setClosing(false);
        restoreFocus();
      }, 200);
      return () => window.clearTimeout(timer);
    }
  }, [menuOpen]);

  const ready = viewer.status === "ready";
  const me = ready ? `/u/${viewer.username}` : null;

  const tiles: Tile[] = [
    {
      slot: "a",
      label: "피드",
      href: "/",
      art: <NodeArt />,
    },
    ready
      ? {
          slot: "b",
          label: "글쓰기",
          note: keys ? "단축키 N" : undefined,
          art: <QuoteArt />,
          onSelect: openCompose,
        }
      : {
          slot: "b",
          label: "회원가입",
          art: <QuoteArt />,
          href: viewer.status === "onboarding" ? "/onboarding" : "/signup",
        },
    {
      slot: "c",
      label: "사람들",
      href: "/people",
      art: (
        <span className={styles.markArt} aria-hidden="true">
          <Mark size={104} />
        </span>
      ),
    },
    {
      slot: "d",
      label: ready ? "내 프로필" : "로그인",
      note: ready ? `@${viewer.username}` : undefined,
      href: me ?? "/login",
      art: ready ? (
        <span className={styles.seat} aria-hidden="true">
          <SeatMark
            id={viewer.id}
            posts={0}
            seat="self"
            size="clamp(84px, 6vw + 40px, 132px)"
          />
        </span>
      ) : (
        <BigIcon name="login" />
      ),
    },
    ready
      ? {
          slot: "e",
          label: "팔로워",
          href: `${me}?tab=followers`,
          art: <BigIcon name="people" />,
        }
      : {
          slot: "e",
          label: "소스 코드",
          note: "GitHub",
          href: REPO,
          external: true,
          art: <BigIcon name="external" />,
        },
    ready
      ? {
          slot: "f",
          label: "팔로잉",
          href: `${me}?tab=following`,
          art: <CurveArt />,
        }
      : {
          slot: "f",
          label: "소개",
          href: "/#about",
          art: <CurveArt />,
        },
    ready
      ? {
          slot: "g",
          label: "로그아웃",
          art: <BigIcon name="logout" />,
          onSelect: async () => {
            const result = await signOut().catch(() => null);
            closeMenu();
            if (result?.status === "success") {
              toast({ tone: "success", message: result.message });
              router.replace("/");
              router.refresh();
            } else
              toast({
                tone: "error",
                message:
                  result?.message ??
                  "로그아웃 결과를 확인하지 못했어요. 새로고침해 주세요.",
              });
          },
        }
      : {
          slot: "g",
          label: "디자인 노트",
          href: "/brand",
          art: <BigIcon name="grid" />,
        },
  ];

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="전체 메뉴"
      data-closing={closing || undefined}
      onCancel={(event) => {
        event.preventDefault();
        closeMenu();
      }}
      {...closesOnBackdrop(closeMenu)}
    >
      {menuOpen || closing ? (
        <nav className={styles.grid} aria-label="전체 메뉴">
          {tiles.map((tile) => {
            const body = (
              <>
                <span className={styles.label}>{tile.label}</span>
                {tile.note && <span className={styles.note}>{tile.note}</span>}
                {tile.art}
              </>
            );
            const tone = {
              a: "navy",
              b: "gold",
              c: "zen",
              d: "sunset",
              e: "lime",
              f: "orchid",
              g: "crimson",
            }[tile.slot];
            if ("onSelect" in tile)
              return (
                <button
                  key={tile.slot}
                  type="button"
                  className={styles.tile}
                  data-slot={tile.slot}
                  data-tone={tone}
                  onClick={tile.onSelect}
                >
                  {body}
                </button>
              );
            return (
              <Link
                key={tile.slot}
                href={tile.href}
                className={styles.tile}
                data-slot={tile.slot}
                data-tone={tone}
                onClick={closeMenu}
                {...(tile.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {body}
              </Link>
            );
          })}
          <button
            type="button"
            className={styles.close}
            onClick={closeMenu}
            aria-label="메뉴 닫기"
            data-menu-close=""
          >
            <Icon name="close" size={28} strokeWidth={1.7} />
          </button>
        </nav>
      ) : null}
    </dialog>
  );
}
