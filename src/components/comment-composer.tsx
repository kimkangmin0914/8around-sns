"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createComment } from "@/actions/comments";
import {
  codePointLength,
  normalizeText,
  validateComment,
} from "@/lib/validation";
import { commentPageHref } from "@/lib/comment-page";
import { uncertainWrite, type ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { actionMessage } from "@/components/action-message";

export function CommentComposer({
  userId,
  postId,
  offset = 0,
  parent,
}: {
  userId: string;
  postId: string;
  offset?: number;
  parent?: { id: string; displayName: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!parent);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const restoreFocus = useRef(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const inputId = `comment-input-${parent?.id ?? "root"}`;
  const destination = commentPageHref(postId, parent ? offset : 0, parent?.id);
  if (!open)
    return (
      <Button
        variant="ghost"
        ref={(button) => {
          if (button && restoreFocus.current) {
            restoreFocus.current = false;
            button.focus();
          }
        }}
        onClick={() => setOpen(true)}
      >
        답글 쓰기
      </Button>
    );
  return (
    <form
      className="comment-composer stack"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.current) return;
        const checked = validateComment({
          post_id: postId,
          parent_id: parent?.id ?? "",
          content,
        });
        if (!checked.ok) {
          setResult({ status: "input", message: checked.message });
          return;
        }
        const form = new FormData(event.currentTarget);
        busy.current = true;
        setPending(true);
        setResult(null);
        try {
          const next = await createComment(userId, form);
          setResult(next);
          if (next.status === "success") {
            setContent("");
            router.replace(`${destination}#comment-${next.id}`);
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
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="parent_id" value={parent?.id ?? ""} />
      <div className="field">
        <label htmlFor={inputId}>
          {parent ? `${parent.displayName}님에게 답글` : "댓글 남기기"}
        </label>
        <textarea
          id={inputId}
          name="content"
          className="input"
          autoFocus={Boolean(parent)}
          placeholder={
            parent
              ? "이 이야기에 답해 주세요."
              : "함께 나누고 싶은 이야기가 있나요?"
          }
          value={content}
          disabled={pending}
          onChange={(event) => setContent(event.target.value)}
          aria-describedby={`${inputId}-count ${inputId}-feedback`}
          aria-invalid={result?.status === "input"}
        />
      </div>
      <div className="form-footer">
        <span className="hint" id={`${inputId}-count`}>
          {codePointLength(normalizeText(content))} / 500자
        </span>
        <div className="actions">
          {parent && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                restoreFocus.current = true;
                setOpen(false);
              }}
            >
              취소
            </Button>
          )}
          <Button className="comment-submit" type="submit" disabled={pending}>
            {pending ? "남기는 중…" : parent ? "답글 남기기" : "댓글 남기기"}
          </Button>
        </div>
      </div>
      <div id={`${inputId}-feedback`} aria-live="polite">
        {result && (
          <p className={result.status === "success" ? "success" : "error"}>
            {result.status === "uncertain"
              ? "저장 결과를 확인하지 못했습니다. 입력한 내용은 남아 있습니다."
              : actionMessage(result.message)}
            {result.status === "success" && result.id && (
              <>
                {" "}
                <Link
                  href={`${destination}#comment-${result.id}`}
                  className="text-link"
                >
                  남긴 {parent ? "답글" : "댓글"} 보기
                </Link>
              </>
            )}
          </p>
        )}
      </div>
      {result?.status === "uncertain" && (
        <Button
          type="button"
          variant="outline"
          onClick={() => router.refresh()}
        >
          초안을 유지하고 댓글 확인
        </Button>
      )}
    </form>
  );
}
