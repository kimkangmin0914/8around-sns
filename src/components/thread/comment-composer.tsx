"use client";

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

export function CommentComposer({
  userId,
  displayName,
  postId,
  parent,
  autoFocus = false,
  onPosted,
  onCancel,
}: {
  userId: string;
  displayName: string;
  postId: string;
  /** Replying: the top-level comment, plus whom we answer (for the @mention). */
  parent?: { id: string; name: string; username: string | null };
  autoFocus?: boolean;
  onPosted: (id: string, parentId: string | null) => void;
  onCancel?: () => void;
}) {
  const reply = Boolean(parent);
  const [content, setContent] = useState(() =>
    parent?.username ? `@${parent.username} ` : "",
  );
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const busy = useRef(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  // Put the caret after the prefilled @mention.
  useEffect(() => {
    if (!autoFocus || !area.current) return;
    const node = area.current;
    node.focus({ preventScroll: true });
    node.setSelectionRange(node.value.length, node.value.length);
    node.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [autoFocus]);

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
        onPosted(result.data.id, result.data.parentId);
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
          {reply ? `${parent?.name}님에게 답글` : "댓글"}
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
          rows={reply ? 2 : 2}
          placeholder={
            reply ? "답글을 남겨 주세요" : "이 글에 댓글을 남겨 보세요"
          }
          disabled={pending}
          aria-invalid={failure?.status === "input" || undefined}
          aria-describedby={`${id}-feedback`}
          onChange={(event) => {
            setContent(event.target.value);
            if (failure?.status === "input") setFailure(null);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
            if (event.key === "Escape" && onCancel) {
              event.preventDefault();
              onCancel();
            }
          }}
        />
        <div id={`${id}-feedback`} aria-live="polite">
          {failure && (
            <p className={styles.composerError}>
              <Icon name="alert" size={15} strokeWidth={2.1} />
              {failure.status === "uncertain"
                ? "저장됐는지 확인하지 못했어요. 쓴 내용은 남겨 두었어요. 새로고침해서 확인해 주세요."
                : failure.message}
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
      </div>
    </form>
  );
}
