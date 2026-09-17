import { Avatar } from "@/components/avatar";
import Link from "next/link";
import type { FeedPost } from "@/lib/posts";

export function PostRow({
  post,
  detail = false,
}: {
  post: FeedPost;
  detail?: boolean;
}) {
  return (
    <article className={detail ? "post post-detail" : "post"}>
      <Avatar name={post.author?.display_name} />
      <div className="post-copy">
        <header className="post-header">
          {post.author ? (
            <Link className="post-author" href={`/u/${post.author.username}`}>
              {post.author.display_name}
            </Link>
          ) : (
            <span className="post-author">알 수 없는 작성자</span>
          )}
          <span className="post-meta">
            @{post.author?.username ?? "unknown"}
          </span>
          <time className="post-meta" dateTime={post.created_at}>
            {new Intl.DateTimeFormat("ko-KR", {
              timeZone: "Asia/Seoul",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(post.created_at))}
          </time>
        </header>
        <p className="post-body">{post.content}</p>
        {!detail && (
          <footer className="post-footer">
            <Link className="text-link" href={`/posts/${post.id}#comments`}>
              댓글 {post.comments[0]?.count ?? 0}개
            </Link>
          </footer>
        )}
      </div>
    </article>
  );
}
