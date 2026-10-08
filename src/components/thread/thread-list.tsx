"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loadThreads } from "@/server/actions/comments";
import type { Thread, ThreadComment } from "@/server/queries/comments";
import { droppedRows, mergeNewestFirst } from "@/lib/list";
import { Avatar } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/relative-time";
import { RichText } from "@/components/ui/rich-text";
import { Icon } from "@/components/icons/icon";
import { ButtonLink } from "@/components/ui/button";
import { LoadMore } from "@/components/ui/load-more";
import { useToast } from "@/components/ui/toast";
import {
  CommentComposer,
  type PostedComment,
} from "@/components/thread/comment-composer";
import styles from "./thread.module.css";

type Me = { id: string; displayName: string; username: string } | null;
type ReplyTarget = {
  rootId: string;
  name: string;
  username: string | null;
  key: number;
};

const COLLAPSE_AFTER = 3;
const PREVIEW = 2;

function Comment({
  comment,
  depth,
  onReply,
  canReply,
  fresh,
  byAuthor,
}: {
  comment: ThreadComment;
  depth: 0 | 1;
  onReply: () => void;
  canReply: boolean;
  fresh: boolean;
  /** Written by the person who wrote the post. */
  byAuthor: boolean;
}) {
  const name = comment.author?.display_name ?? "알 수 없는 사람";
  return (
    <article
      id={`comment-${comment.id}`}
      className={styles.comment}
      tabIndex={-1}
      data-nav-item=""
      data-depth={depth}
      data-fresh={fresh || undefined}
    >
      <Link
        href={comment.author ? `/u/${comment.author.username}` : "#"}
        className={styles.avatar}
        tabIndex={-1}
        aria-hidden="true"
      >
        <Avatar
          id={comment.author?.id}
          name={name}
          size={depth === 0 ? 40 : 32}
        />
      </Link>
      <div className={styles.commentMain}>
        <header className={styles.commentHead}>
          {comment.author ? (
            <Link
              href={`/u/${comment.author.username}`}
              className={styles.name}
            >
              {name}
            </Link>
          ) : (
            <span className={styles.name}>{name}</span>
          )}
          {byAuthor && <span className={styles.authorTag}>글쓴이</span>}
          {comment.author && (
            <span className={styles.handle}>@{comment.author.username}</span>
          )}
          <span className={styles.meta} aria-hidden="true">
            ·
          </span>
          <RelativeTime iso={comment.created_at} className={styles.meta} />
        </header>
        <RichText text={comment.content} className={styles.body} />
        <div className={styles.commentFoot}>
          {canReply ? (
            <button
              type="button"
              className={styles.replyButton}
              onClick={onReply}
              aria-label={`${name}님에게 답글`}
            >
              <Icon name="reply" size={16} />
              답글
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ThreadList({
  postId,
  postAuthorId,
  initial,
  next,
  me,
  guestHref,
}: {
  postId: string;
  postAuthorId: string | null;
  initial: Thread[];
  next: string | null;
  me: Me;
  /** Where a guest goes to join (login with a return path). */
  guestHref: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [more, setMore] = useState<Thread[]>([]);
  // undefined until a page has been loaded; then the server's next cursor.
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [target, setTarget] = useState<ReplyTarget | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const counter = useRef(0);
  const previous = useRef(initial);
  const scrolledTo = useRef<string | null>(null);
  const focusFresh = useRef(true);

  // A new comment pushes the oldest thread off the refreshed first page;
  // keep it (at the top of the loaded pages) instead of losing it.
  useEffect(() => {
    const dropped = droppedRows(previous.current, initial);
    previous.current = initial;
    if (dropped.length && more.length)
      setMore((list) => mergeNewestFirst(dropped, list));
  }, [initial, more.length]);

  const threads = mergeNewestFirst(initial, more).map((thread) => {
    // A refreshed first page wins for replies; older pages keep theirs.
    const latest = initial.find((item) => item.id === thread.id);
    return latest ?? thread;
  });
  const activeCursor = cursor === undefined ? next : cursor;

  // Deep links (#comment-…) open the right thread, then scroll and flash.
  useEffect(() => {
    let hash = "";
    try {
      hash = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return; // A malformed hash is ignored, not an error page.
    }
    if (!hash.startsWith("comment-")) return;
    const id = hash.slice("comment-".length);
    const owner = initial.find((thread) =>
      thread.replies.some((reply) => reply.id === id),
    );
    // Syncing from the URL hash, which the server render cannot see.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (owner) setExpanded((set) => new Set(set).add(owner.id));
    setFresh(id);
    // Run once for the landing URL only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When something new (or deep-linked) is on screen, bring it into view
  // once, and give it focus so keyboard users continue from there.
  useEffect(() => {
    if (!fresh || scrolledTo.current === fresh) return;
    const node = document.getElementById(`comment-${fresh}`);
    if (!node) return;
    scrolledTo.current = fresh;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (focusFresh.current) node.focus({ preventScroll: true });
    node.scrollIntoView({
      block: "center",
      behavior: still ? "auto" : "smooth",
    });
  }, [fresh, initial, more]);

  /** Replies attach to the top-level comment; answering a reply adds an @mention. */
  function reply(rootId: string, to: ThreadComment) {
    if (!me) {
      router.push(guestHref);
      return;
    }
    counter.current += 1;
    const mention =
      to.parent_id && to.author && to.author.username !== me.username
        ? to.author.username
        : null;
    setTarget({
      rootId,
      name: to.author?.display_name ?? "알 수 없는 사람",
      username: mention,
      key: counter.current,
    });
    setExpanded((set) => new Set(set).add(rootId));
  }

  function posted(comment: PostedComment) {
    const { id, parentId } = comment;
    setFresh(id);
    // Only the composer that posted closes; a reply draft elsewhere stays.
    if (parentId)
      setTarget((current) => (current?.rootId === parentId ? null : current));
    // A reply's composer goes away, so its comment takes focus; after a
    // top-level comment the person stays in the root composer.
    focusFresh.current = Boolean(parentId);
    if (parentId) {
      setExpanded((set) => new Set(set).add(parentId));
      // Threads from older pages are not refreshed by the server; add the
      // reply to them directly.
      if (me)
        setMore((list) =>
          list.map((thread) =>
            thread.id === parentId &&
            !thread.replies.some((reply) => reply.id === id)
              ? {
                  ...thread,
                  replies: [
                    ...thread.replies,
                    {
                      id,
                      post_id: postId,
                      parent_id: parentId,
                      content: comment.content,
                      created_at: comment.createdAt,
                      author: {
                        id: me.id,
                        username: me.username,
                        display_name: me.displayName,
                      },
                    },
                  ],
                }
              : thread,
          ),
        );
    }
    toast({
      tone: "success",
      message: parentId ? "답글을 남겼어요." : "댓글을 남겼어요.",
    });
    router.refresh();
  }

  async function loadMore() {
    if (!activeCursor || loadState === "loading") return;
    setLoadState("loading");
    try {
      const page = await loadThreads({ postId, cursor: activeCursor });
      if (!page.ok) throw new Error();
      setMore((list) => mergeNewestFirst(list, page.items));
      setCursor(page.next);
      setLoadState("idle");
    } catch {
      setLoadState("error");
    }
  }

  return (
    <div className={styles.threads}>
      <div className={styles.rootComposer}>
        {me ? (
          <CommentComposer
            userId={me.id}
            displayName={me.displayName}
            postId={postId}
            onPosted={posted}
          />
        ) : (
          <div className={styles.join}>
            <p>
              <strong>댓글을 남기려면 로그인해 주세요.</strong>
            </p>
            <ButtonLink href={guestHref} size="s">
              <Icon name="login" size={16} /> 로그인
            </ButtonLink>
          </div>
        )}
      </div>

      {threads.length === 0 ? (
        <div className={styles.none}>
          <Icon name="comment" size={22} />
          <p>아직 댓글이 없어요.</p>
        </div>
      ) : (
        <ol className={styles.list} aria-label="댓글">
          {threads.map((thread) => {
            const total = thread.replies.length;
            const open = expanded.has(thread.id) || total <= COLLAPSE_AFTER;
            const shown = open
              ? thread.replies
              : thread.replies.slice(0, PREVIEW);
            const replying = target?.rootId === thread.id;
            return (
              <li key={thread.id} className={styles.thread}>
                <Comment
                  comment={thread}
                  depth={0}
                  canReply
                  byAuthor={
                    !!postAuthorId && thread.author?.id === postAuthorId
                  }
                  fresh={fresh === thread.id}
                  onReply={() => reply(thread.id, thread)}
                />
                {(total > 0 || replying) && (
                  <div className={styles.replies}>
                    {total > 0 && (
                      <ol
                        aria-label={`${thread.author?.display_name ?? "알 수 없는 사람"}님 댓글의 답글 ${total}개`}
                      >
                        {shown.map((item) => (
                          <li key={item.id}>
                            <Comment
                              comment={item}
                              depth={1}
                              canReply
                              byAuthor={
                                !!postAuthorId &&
                                item.author?.id === postAuthorId
                              }
                              fresh={fresh === item.id}
                              onReply={() => reply(thread.id, item)}
                            />
                          </li>
                        ))}
                      </ol>
                    )}
                    {total > COLLAPSE_AFTER && (
                      <button
                        type="button"
                        className={styles.toggle}
                        aria-expanded={open}
                        onClick={() =>
                          setExpanded((set) => {
                            const copy = new Set(set);
                            if (copy.has(thread.id)) copy.delete(thread.id);
                            else copy.add(thread.id);
                            return copy;
                          })
                        }
                      >
                        <span
                          className={styles.toggleLine}
                          aria-hidden="true"
                        />
                        {open
                          ? "답글 접기"
                          : `답글 ${total - PREVIEW}개 더 보기`}
                        <Icon
                          name="chevronDown"
                          size={16}
                          style={{
                            transform: open ? "rotate(180deg)" : undefined,
                          }}
                        />
                      </button>
                    )}
                    {replying && me && target && (
                      <CommentComposer
                        key={thread.id}
                        userId={me.id}
                        displayName={me.displayName}
                        postId={postId}
                        parent={{
                          id: thread.id,
                          name: target.name,
                          username: target.username,
                        }}
                        focusKey={target.key}
                        onPosted={posted}
                        onCancel={() => {
                          setTarget(null);
                          // Hand focus back to the comment being answered.
                          requestAnimationFrame(() =>
                            document
                              .getElementById(`comment-${thread.id}`)
                              ?.focus({ preventScroll: true }),
                          );
                        }}
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {activeCursor && (
        <LoadMore state={loadState} onLoad={loadMore} label="이전 댓글 보기" />
      )}
    </div>
  );
}
