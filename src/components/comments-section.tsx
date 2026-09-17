import Link from "next/link";
import {
  readRoots,
  readRoot,
  readReplies,
  type ThreadComment,
} from "@/lib/comments";
import { commentPageHref, parseCommentPage } from "@/lib/comment-page";
import { PAGE_SIZE } from "@/lib/validation";
import type { Viewer } from "@/lib/viewer";
import { CommentComposer } from "@/components/comment-composer";
import { SessionBoundary } from "@/components/session-boundary";
import { ServiceError } from "@/components/service-error";

function CommentBody({ comment }: { comment: ThreadComment }) {
  return (
    <>
      <header className="post-header">
        {comment.author ? (
          <Link className="post-author" href={`/u/${comment.author.username}`}>
            {comment.author.display_name}
          </Link>
        ) : (
          <span className="post-author">알 수 없는 작성자</span>
        )}
        <span className="post-meta">
          @{comment.author?.username ?? "unknown"}
        </span>
        <time className="post-meta" dateTime={comment.created_at}>
          {new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(comment.created_at))}
        </time>
      </header>
      <p className="post-body">{comment.content}</p>
    </>
  );
}

export async function CommentsSection({
  postId,
  count,
  viewer,
  page,
}: {
  postId: string;
  count: number;
  viewer: Viewer;
  page: NonNullable<ReturnType<typeof parseCommentPage>>;
}) {
  const { offset, thread, replyOffset } = page;
  const href = commentPageHref(postId, offset);
  const roots = await readRoots(postId, offset);
  let selected = roots.ok
    ? roots.comments.find((comment) => comment.id === thread)
    : undefined;
  let selectionError = "";
  if (thread && !selected) {
    const result = await readRoot(postId, thread);
    if (!result.ok) selectionError = "답글 대상을 불러오지 못했습니다.";
    else if (!result.comment)
      selectionError = "이 글의 최상위 댓글을 답글 대상으로 선택해 주세요.";
    else selected = result.comment;
  }
  const replies = selected ? await readReplies(selected, replyOffset) : null;
  // A linked older root stays visible even when it is outside the current root page.
  const comments = roots.ok
    ? [
        ...(selected && !roots.comments.some((root) => root.id === selected.id)
          ? [selected]
          : []),
        ...roots.comments,
      ]
    : selected
      ? [selected]
      : [];
  const content = (
    <section
      id="comments"
      className="comments-section"
      aria-label="댓글과 답글"
    >
      <div className="page-heading">
        <h2>댓글 {count}개</h2>
        <span className="hint">답글 포함 · 최신순</span>
      </div>
      {viewer.status === "ready" ? (
        <CommentComposer userId={viewer.id} postId={postId} />
      ) : viewer.status === "error" ? (
        <p className="notice error">
          로그인 상태를 확인하지 못했습니다. 새로고침해 주세요.
        </p>
      ) : (
        <p className="notice">
          <Link
            className="text-link"
            href={viewer.status === "onboarding" ? "/onboarding" : "/login"}
          >
            {viewer.status === "onboarding"
              ? "프로필 설정 후 댓글 남기기"
              : "로그인하고 댓글 남기기"}
          </Link>
        </p>
      )}
      {selectionError && (
        <ServiceError message={selectionError} href={`${href}#comments`} />
      )}
      {!roots.ok && (
        <ServiceError
          message="댓글을 불러오지 못했습니다."
          href={`${href}#comments`}
        />
      )}
      {roots.ok && comments.length === 0 && (
        <p className="empty muted">
          {offset
            ? "이 페이지에는 댓글이 없습니다."
            : "첫 번째 댓글을 남겨 주세요."}
        </p>
      )}
      {comments.map((comment) => (
        <article
          className="comment-root"
          id={`comment-${comment.id}`}
          key={comment.id}
        >
          <CommentBody comment={comment} />
          <div className="comment-actions">
            {viewer.status === "ready" && (
              <CommentComposer
                userId={viewer.id}
                postId={postId}
                offset={offset}
                parent={{
                  id: comment.id,
                  displayName: comment.author?.display_name ?? "작성자",
                }}
              />
            )}
            {comment.id === selected?.id ? (
              <Link
                className="text-link"
                href={`${href}#comment-${comment.id}`}
                scroll={false}
              >
                답글 접기
              </Link>
            ) : (
              <Link
                className="text-link"
                href={`${commentPageHref(postId, offset, comment.id)}#comment-${comment.id}`}
                scroll={false}
              >
                답글 보기
              </Link>
            )}
          </div>
          {comment.id === selected?.id && replies && (
            <div
              className="replies"
              aria-label={`${comment.author?.display_name ?? "작성자"}님의 댓글에 달린 답글`}
            >
              {!replies.ok ? (
                <ServiceError
                  message="답글을 불러오지 못했습니다."
                  href={commentPageHref(
                    postId,
                    offset,
                    comment.id,
                    replyOffset,
                  )}
                />
              ) : (
                <>
                  {replies.comments.map((reply) => (
                    <article
                      className="comment-reply"
                      id={`comment-${reply.id}`}
                      key={reply.id}
                    >
                      <CommentBody comment={reply} />
                    </article>
                  ))}
                  {replies.comments.length === 0 && (
                    <p className="notice muted">
                      아직 이 페이지에 답글이 없습니다.
                    </p>
                  )}
                  <div className="actions">
                    {replyOffset > 0 && (
                      <Link
                        className="text-link"
                        href={`${commentPageHref(postId, offset, comment.id)}#comment-${comment.id}`}
                        scroll={false}
                      >
                        첫 답글 페이지
                      </Link>
                    )}
                    {replies.hasMore && (
                      <Link
                        className="button button-outline"
                        href={`${commentPageHref(postId, offset, comment.id, replyOffset + PAGE_SIZE)}#comment-${comment.id}`}
                        scroll={false}
                      >
                        답글 더 보기
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </article>
      ))}
      <div className="feed-footer actions">
        {offset > 0 && (
          <Link
            className="text-link"
            href={`${commentPageHref(postId)}#comments`}
          >
            첫 댓글 페이지
          </Link>
        )}
        {roots.ok && roots.hasMore && (
          <Link
            className="button button-outline"
            href={`${commentPageHref(postId, offset + PAGE_SIZE)}#comments`}
          >
            댓글 더 보기
          </Link>
        )}
      </div>
    </section>
  );
  return viewer.status === "ready" ? (
    <SessionBoundary key={`${viewer.id}:${postId}`} userId={viewer.id}>
      {content}
    </SessionBoundary>
  ) : (
    content
  );
}
