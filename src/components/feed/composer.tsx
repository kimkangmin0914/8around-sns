"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPost } from "@/server/actions/posts";
import {
  CONTENT_LIMIT,
  codePointLength,
  normalizeText,
  validateContent,
} from "@/lib/validation";
import { uncertainWrite, type Failure } from "@/lib/action-result";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CountRing } from "@/components/ui/count-ring";
import { Icon } from "@/components/icons/icon";
import { useToast } from "@/components/ui/toast";
import { useShell } from "@/components/shell/shell-context";
import styles from "./composer.module.css";

const noopSubscribe = () => () => {};

const draftKey = (userId: string, variant: string) =>
  `beside:draft:${variant}:${userId}`;

export function Composer({
  userId,
  displayName,
  variant = "inline",
  autoFocus = false,
  onPosted,
}: {
  userId: string;
  displayName: string;
  variant?: "inline" | "dialog";
  autoFocus?: boolean;
  onPosted?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { markFresh } = useShell();
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const mac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => true,
  );
  const busy = useRef(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  // Restore an unsent draft (per account) once the page is hydrated.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey(userId, variant));
      // Syncing from browser storage, which the server render cannot see.
      // Another account's text must never stay on screen: reset when empty.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContent(saved ?? "");
    } catch {
      /* Storage can be unavailable; drafts are a convenience. */
    }
  }, [userId, variant]);

  useEffect(() => {
    try {
      if (content) sessionStorage.setItem(draftKey(userId, variant), content);
      else sessionStorage.removeItem(draftKey(userId, variant));
    } catch {
      /* ignore */
    }
  }, [content, userId, variant]);

  const length = codePointLength(normalizeText(content));
  const empty = length === 0;
  const over = length > CONTENT_LIMIT;

  async function submit() {
    if (busy.current) return;
    const checked = validateContent(content);
    if (!checked.ok) {
      setFailure({ status: "input", message: checked.message });
      area.current?.focus();
      return;
    }
    busy.current = true;
    setPending(true);
    setFailure(null);
    const form = new FormData();
    form.set("content", content);
    try {
      const result = await createPost(userId, form);
      if (result.status === "success") {
        setContent("");
        try {
          sessionStorage.removeItem(draftKey(userId, variant));
        } catch {
          /* ignore */
        }
        markFresh(result.data.id);
        toast({
          tone: "success",
          message: result.message,
          action: { label: "보기", href: `/posts/${result.data.id}` },
        });
        onPosted?.();
        router.refresh();
      } else setFailure(result);
    } catch {
      setFailure(uncertainWrite);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <form
      className={styles.composer}
      data-variant={variant}
      data-pending={pending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className={styles.row}>
        <Avatar
          id={userId}
          name={displayName}
          size={variant === "dialog" ? 40 : 44}
        />
        <div className={styles.body}>
          <label htmlFor={id} className="sr-only">
            새 글 내용
          </label>
          <textarea
            ref={area}
            id={id}
            name="content"
            className={styles.input}
            placeholder="지금 생각을 적어 보세요"
            value={content}
            rows={variant === "dialog" ? 5 : 2}
            autoFocus={autoFocus}
            readOnly={pending}
            aria-busy={pending || undefined}
            aria-invalid={failure?.status === "input" || over || undefined}
            aria-describedby={`${id}-feedback ${id}-count`}
            onChange={(event) => {
              setContent(event.target.value);
              if (failure?.status === "input") setFailure(null);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (event.metaKey || event.ctrlKey) &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault();
                void submit();
              }
            }}
          />
        </div>
      </div>
      <div id={`${id}-feedback`} aria-live="polite" className={styles.feedback}>
        {!failure && over && (
          <p className={styles.error} data-status="input">
            <Icon name="alert" size={16} strokeWidth={2.1} />
            <span>
              {CONTENT_LIMIT}자를 넘었어요. {length - CONTENT_LIMIT}자 줄여
              주세요.
            </span>
          </p>
        )}
        {failure && (
          <p className={styles.error} data-status={failure.status}>
            <Icon name="alert" size={16} strokeWidth={2.1} />
            <span>
              {failure.status === "uncertain"
                ? "저장됐는지 확인하지 못했어요. 쓴 내용은 남겨 두었어요."
                : failure.message}
            </span>
            {failure.status === "uncertain" && (
              <button
                type="button"
                className={styles.retry}
                onClick={() => router.refresh()}
              >
                <Icon name="refresh" size={14} strokeWidth={2.2} /> 새로고침
              </button>
            )}
          </p>
        )}
      </div>
      <div className={styles.bar}>
        <span className={styles.hint}>
          <kbd>{mac ? "⌘" : "Ctrl"}</kbd>
          <kbd>Enter</kbd>
          <span>로 올리기</span>
        </span>
        <div className={styles.actions}>
          <CountRing count={length} limit={CONTENT_LIMIT} id={`${id}-count`} />
          <Button
            type="submit"
            busy={pending}
            busyLabel="올리는 중"
            disabled={empty || over}
            className={styles.submit}
          >
            <Icon name="arrowUp" size={18} strokeWidth={2.2} />
            올리기
          </Button>
        </div>
      </div>
      <p className={styles.notice}>올린 글은 고치거나 지울 수 없어요.</p>
    </form>
  );
}
