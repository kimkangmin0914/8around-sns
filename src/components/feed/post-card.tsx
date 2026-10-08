import Link from "next/link";
import type { FeedPost } from "@/server/queries/posts";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { Icon } from "@/components/icons/icon";
import { CopyLink } from "@/components/feed/copy-link";
import { fullTime, relativeTime } from "@/lib/time";
import { sizeForContent } from "@/lib/text";
import styles from "./post-card.module.css";

/**
 * One post in a list. The whole row opens the conversation; the author,
 * mentions and actions stay independently clickable above that link.
 */
export function PostCard({
  post,
  fresh = false,
  index = 0,
}: {
  post: FeedPost;
  fresh?: boolean;
  index?: number;
}) {
  const author = post.author;
  const name = author?.display_name ?? "알 수 없는 사람";
  const href = `/posts/${post.id}`;
  return (
    <article
      className={styles.post}
      data-fresh={fresh || undefined}
      style={{ ["--i" as string]: Math.min(index, 8) }}
      aria-labelledby={`post-${post.id}-author`}
    >
      {author ? (
        <Link
          href={`/u/${author.username}`}
          className={styles.avatarLink}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Avatar id={author.id} name={name} />
        </Link>
      ) : (
        <Avatar id={null} name="?" />
      )}
      <div className={styles.main}>
        <header className={styles.head}>
          {author ? (
            <Link
              id={`post-${post.id}-author`}
              href={`/u/${author.username}`}
              className={styles.name}
            >
              {name}
            </Link>
          ) : (
            <span id={`post-${post.id}-author`} className={styles.name}>
              {name}
            </span>
          )}
          {author && <span className={styles.handle}>@{author.username}</span>}
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          <time
            className={styles.time}
            dateTime={post.created_at}
            title={fullTime(post.created_at)}
            suppressHydrationWarning
          >
            {relativeTime(post.created_at)}
          </time>
        </header>
        <RichText
          text={post.content}
          className={styles.content}
          size={sizeForContent(post.content)}
        />
        <footer className={styles.foot}>
          <Link
            href={`${href}#comments`}
            className={styles.action}
            aria-label={
              post.comment_count
                ? `댓글 ${post.comment_count}개 보기`
                : "첫 댓글 달기"
            }
          >
            <Icon name="comment" size={18} />
            {post.comment_count ? (
              <>
                <span className="num">{post.comment_count}</span>
                <span className={styles.actionText}>댓글</span>
              </>
            ) : (
              <span className={styles.actionText}>첫 댓글</span>
            )}
          </Link>
          <CopyLink path={href} label={`${name}님의 글 링크 복사`} />
        </footer>
      </div>
      <Link
        href={href}
        className={styles.cover}
        tabIndex={-1}
        aria-hidden="true"
      />
    </article>
  );
}
