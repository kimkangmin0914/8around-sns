"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { createPost } from "@/actions/posts";
import {
  codePointLength,
  normalizeText,
  validateContent,
} from "@/lib/validation";
import { uncertainWrite, type ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { actionMessage } from "@/components/action-message";

export function PostComposer({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <form
      className="post-composer stack"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.current) return;
        const checked = validateContent(content);
        if (!checked.ok) {
          setResult({ status: "input", message: checked.message });
          return;
        }
        const form = new FormData(event.currentTarget);
        busy.current = true;
        setPending(true);
        setResult(null);
        try {
          const next = await createPost(userId, form);
          setResult(next);
          if (next.status === "success") {
            setContent("");
            router.replace("/");
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
      <div className="field">
        <label htmlFor="content">{displayName}님의 이야기</label>
        <textarea
          id="content"
          name="content"
          className="input"
          placeholder="오늘 나누고 싶은 이야기를 적어 주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={pending}
          aria-describedby="content-count content-feedback"
          aria-invalid={result?.status === "input"}
        />
      </div>
      <div className="form-footer">
        <span className="hint" id="content-count">
          {codePointLength(normalizeText(content))} / 500자
        </span>
        <Button className="post-submit" type="submit" disabled={pending}>
          <ArrowUp size={16} aria-hidden="true" />
          {pending ? "게시 중…" : "게시하기"}
        </Button>
      </div>
      <div id="content-feedback" aria-live="polite">
        {result && (
          <p className={result.status === "success" ? "success" : "error"}>
            {result.status === "uncertain"
              ? "저장 결과를 확인하지 못했습니다. 입력한 내용은 남아 있습니다."
              : actionMessage(result.message)}
            {result.status === "success" && result.id && (
              <>
                {" "}
                <Link className="text-link" href={`/posts/${result.id}`}>
                  게시한 글 보기
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
          초안을 유지하고 목록 확인
        </Button>
      )}
    </form>
  );
}
