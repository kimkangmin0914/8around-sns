"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { loadPosts } from "@/server/actions/posts";
import type { FeedPost } from "@/server/queries/posts";
import { droppedRows, mergeNewestFirst } from "@/lib/list";
import { PostCard } from "@/components/feed/post-card";
import { EndOfList, LoadMore } from "@/components/ui/load-more";
import { useShell } from "@/components/shell/shell-context";

/**
 * Server renders the first page; this keeps appended pages across
 * router.refresh() so new posts slot in at the top without losing scroll.
 */
export function FeedList({
  initial,
  next,
  scope,
  authorId,
  empty,
  endText = "여기까지 모두 읽었어요.",
}: {
  initial: FeedPost[];
  next: string | null;
  scope: "all" | "following" | "author";
  authorId?: string;
  empty: ReactNode;
  endText?: string;
}) {
  const { fresh } = useShell();
  const [more, setMore] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const previous = useRef(initial);

  useEffect(() => {
    const dropped = droppedRows(previous.current, initial);
    previous.current = initial;
    if (dropped.length && more.length)
      setMore((list) => mergeNewestFirst(dropped, list));
  }, [initial, more.length]);

  const activeCursor = more.length ? cursor : next;
  const items = mergeNewestFirst(initial, more);

  async function load() {
    if (!activeCursor || state === "loading") return;
    setState("loading");
    try {
      const page = await loadPosts({ scope, authorId, cursor: activeCursor });
      if (!page.ok) throw new Error();
      setMore((list) => mergeNewestFirst(list, page.items));
      setCursor(page.next);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (items.length === 0) return <>{empty}</>;
  return (
    <>
      <div role="feed" aria-busy={state === "loading"} aria-label="글 목록">
        {items.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            fresh={post.id === fresh}
            index={index < initial.length ? index : 0}
          />
        ))}
      </div>
      {activeCursor ? (
        <LoadMore state={state} onLoad={load} label="이전 글 더 보기" />
      ) : (
        <EndOfList text={endText} />
      )}
    </>
  );
}
