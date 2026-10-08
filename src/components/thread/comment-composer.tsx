"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createComment } from "@/server/actions/comments";
import {
  CONTENT_LIMIT,
  codePointLength,
  normalizeText,
  validateComment,
} from "@/lib/validation";
import { uncertainWrite, type Failure } from "@/lib/action-result";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CountRing } from "@/components/ui/count-ring";
import { Icon } from "@/components/icons/icon";
import styles from "./thread.module.css";

export type PostedComment = {
  id: string;
  parentId: string | null;
  createdAt: string;
  content: string;
};

const BARE_MENTION = /^@[a-z0-9_]{3,20}\s*$/i;

export function CommentComposer({
  userId,
  displayName,
  postId,
  parent,
  focusKey,
  onPosted,
  onCancel,
}: {
  userId: string;
  displayName: string;
  postId: string;
  /** Replying: the top-level comment, plus whom we answer (for the @mention). */
  parent?: { id: string; name: string; username: string | null };
  /** Changes each time the composer should take focus (a new "답글" click). */
  focusKey?: number;
  onPosted: (comment: PostedComment) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const reply = Boolean(parent);
  const mentionFor = (username: string | null | undefined) =>
    username ? `@${username} ` : "";
  const [content, setContent] = useState(() => mentionFor(parent?.username));
  // Answering someone else in the same thread swaps the @mention, but never
  // throws away text the person has already written.
  const [mention, setMention] = useState(parent?.username ?? null);
  if ((parent?.username ?? null) !== mention) {
    setMention(parent?.username ?? null);
    setContent((current) =>
      !current.trim() || BARE_MENTION.test(current)
        ? mentionFor(parent?.username)
        : current,
    );
  }
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const busy = useRef(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  // Put the caret after the prefilled @mention.
  useEffect(() => {
    if (focusKey === undefined || !area.current) return;
    const node = area.current;
    node.focus({ preventScroll: true });
    node.setSelectionRange(node.value.length, node.value.length);
    node.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusKey]);

  const length = codePointLength(normalizeText(content));
  const onlyMention =
    parent?.username && normalizeText(content) === `@${parent.username}`;

  async function submit() {
    if (busy.current) return;
    const checked = validateComment({
      post_id: postId,
      parent_id: parent?.id ?? "",
      content,
    });
    if (!checked.ok || onlyMention) {
      setFailure({
        status: "input",
        message: checked.ok ? "답글 내용을 입력해 주세요." : checked.message,
      });
      area.current?.focus();
      return;
    }
    busy.current = true;
    setPending(true);
    setFailure(null);
    const form = new FormData();
    form.set("post_id", postId);
    form.set("parent_id", parent?.id ?? "");
    form.set("content", content);
    try {
      const result = await createComment(userId, form);
      if (result.status === "success") {
        setContent("");
        onPosted({
          id: result.data.id,
          parentId: result.data.parentId,
          createdAt: result.data.createdAt ?? new Date().toISOString(),
          content: checked.value.content,
        });
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
      data-reply={reply || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Avatar id={userId} name={displayName} size={reply ? 32 : 40} />
      <div className={styles.composerBody}>
        <label htmlFor={id} className="sr-only">
          {reply ? `${parent?.name}님에게 답글` : "댓글 쓰기"}
        </label>
        {reply && (
          <p className={styles.replyingTo} aria-hidden="true">
            <Icon name="reply" size={14} strokeWidth={2.2} />
            <strong>{parent?.name}</strong>님에게 답글
          </p>
        )}
        <textarea
          ref={area}
          id={id}
          className={styles.composerInput}
          value={content}
          rows={2}
          placeholder={reply ? "답글을 남겨 보세요" : "댓글을 남겨 보세요"}
          readOnly={pending}
          aria-busy={pending || undefined}
          aria-invalid={failure?.status === "input" || undefined}
          aria-describedby={`${id}-feedback`}
          onChange={(event) => {
            setContent(event.target.value);
            if (failure?.status === "input") setFailure(null);
          }}
          onKeyDown={(event) => {
            // Safari ends a Hangul syllable with keyCode 229 and isComposing false.
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
            if (event.key === "Escape" && onCancel && !pending) {
              event.preventDefault();
              onCancel();
            }
          }}
        />
        <div id={`${id}-feedback`} aria-live="polite">
          {!failure && length > CONTENT_LIMIT && (
            <p className={styles.composerError}>
              <Icon name="alert" size={15} strokeWidth={2.1} />
              {CONTENT_LIMIT}자를 넘었어요. {length - CONTENT_LIMIT}자 줄여
              주세요.
            </p>
          )}
          {failure && (
            <p className={styles.composerError}>
              <Icon name="alert" size={15} strokeWidth={2.1} />
              <span>
                {failure.status === "uncertain"
                  ? "저장됐는지 확인하지 못했어요. 쓴 내용은 남겨 두었어요."
                  : failure.message}
              </span>
              {failure.status === "uncertain" && (
                <button
                  type="button"
                  className={styles.composerRetry}
                  onClick={() => router.refresh()}
                >
                  <Icon name="refresh" size={14} strokeWidth={2.2} /> 새로고침
                </button>
              )}
            </p>
          )}
        </div>
        <div className={styles.composerBar}>
          <CountRing count={length} limit={CONTENT_LIMIT} />
          <div className={styles.composerActions}>
            {onCancel && (
              <Button
                variant="ghost"
                size="s"
                onClick={onCancel}
                disabled={pending}
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              size="s"
              busy={pending}
              busyLabel="남기는 중"
              disabled={
                length === 0 || length > CONTENT_LIMIT || Boolean(onlyMention)
              }
            >
              {reply ? "답글 남기기" : "댓글 남기기"}
            </Button>
          </div>
        </div>
        <p className={styles.composerNotice}>
          올린 {reply ? "답글" : "댓글"}은 고치거나 지울 수 없어요.
        </p>
      </div>
    </form>
  );
}
