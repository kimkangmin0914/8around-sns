import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/server/queries/posts";
import { listThreads } from "@/server/queries/comments";
import { getProfile } from "@/server/queries/people";
import { getViewer } from "@/server/queries/viewer";
import { isUuid } from "@/lib/validation";
import { fullTime } from "@/lib/time";
import { sizeForContent } from "@/lib/text";
import { toneFor, initialOf } from "@/lib/tone";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { Icon } from "@/components/icons/icon";
import { ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/empty-state";
import { FollowButton } from "@/components/people/follow-button";
import { CopyLink } from "@/components/feed/copy-link";
import { ThreadList } from "@/components/thread/thread-list";
import { SiteFoot } from "@/components/feed/aside";
import styles from "./post.module.css";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "글" };
  const result = await getPost(id);
  if (!result.ok || !result.post) return { title: "글" };
  const name = result.post.author?.display_name ?? "알 수 없는 사람";
  const excerpt = [...result.post.content].slice(0, 60).join("");
  return { title: `${name}: ${excerpt}`, description: result.post.content };
}

export default async function PostPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [result, viewer] = await Promise.all([getPost(id), getViewer()]);
  const backHref = "/";
  if (!result.ok)
    return (
      <div className="page">
        <div className="page-main">
          <ErrorState
            title="글을 불러오지 못했어요"
            action={
              <ButtonLink href={`/posts/${id}`} variant="secondary">
                <Icon name="refresh" size={18} /> 다시 불러오기
              </ButtonLink>
            }
          />
        </div>
      </div>
    );
  const post = result.post;
  if (!post) notFound();
  const viewerId = viewer.status === "ready" ? viewer.id : null;
  const [threads, author] = await Promise.all([
    listThreads(id),
    post.author ? getProfile(post.author.username, viewerId) : null,
  ]);
  const name = post.author?.display_name ?? "알 수 없는 사람";
  const authorProfile = author?.ok ? author.profile : null;
  const size = sizeForContent(post.content);
  const me =
    viewer.status === "ready"
      ? {
          id: viewer.id,
          displayName: viewer.profile.display_name,
          username: viewer.profile.username,
        }
      : null;
  const guestHref =
    viewer.status === "onboarding"
      ? "/onboarding"
      : `/login?next=${encodeURIComponent(`/posts/${id}`)}`;

  return (
    <div className="page">
      <div className="page-main">
        <section className="section" data-tight>
          <span className="section-eyebrow eyebrow">대화</span>
          <Link href={backHref} className={styles.back}>
            <Icon name="arrowLeft" size={18} />
            피드로
          </Link>
        </section>
        <article className={styles.post} aria-labelledby="post-author">
          <header className={styles.head}>
            {post.author ? (
              <Link href={`/u/${post.author.username}`} className={styles.who}>
                <Avatar id={post.author.id} name={name} size={52} />
                <span className={styles.whoCopy}>
                  <span id="post-author" className={styles.name}>
                    {name}
                  </span>
                  <span className={styles.handle}>@{post.author.username}</span>
                </span>
              </Link>
            ) : (
              <span id="post-author" className={styles.name}>
                {name}
              </span>
            )}
            {authorProfile && !authorProfile.relation?.self && (
              <FollowButton
                targetId={authorProfile.id}
                targetName={authorProfile.display_name}
                following={authorProfile.relation?.following ?? false}
                followsYou={authorProfile.relation?.followsYou ?? false}
                size="s"
              />
            )}
          </header>
          <RichText
            text={post.content}
            className={styles.content}
            size={size}
          />
          <footer className={styles.foot}>
            <time dateTime={post.created_at} className={styles.time}>
              {fullTime(post.created_at)}
            </time>
            <span className={styles.count}>
              <Icon name="comment" size={16} />
              댓글 <span className="num">{post.comment_count}</span>
            </span>
            <CopyLink path={`/posts/${post.id}`} label="이 글 링크 복사" />
          </footer>
        </article>
        <section
          id="comments"
          className={styles.comments}
          aria-labelledby="comments-title"
        >
          <h2 id="comments-title" className="sr-only">
            댓글 {post.comment_count}개
          </h2>
          {!threads.ok ? (
            <ErrorState
              title="댓글을 불러오지 못했어요"
              action={
                <ButtonLink href={`/posts/${id}`} variant="secondary">
                  <Icon name="refresh" size={18} /> 다시 불러오기
                </ButtonLink>
              }
            />
          ) : (
            <ThreadList
              postId={id}
              initial={threads.items}
              next={threads.next}
              me={me}
              guestHref={guestHref}
            />
          )}
        </section>
      </div>
      <aside className="page-aside" aria-label="글쓴이">
        {authorProfile && (
          <div className="aside-block">
            <Link
              href={`/u/${authorProfile.username}`}
              className={styles.card}
              data-tone={toneFor(authorProfile.id)}
            >
              <span className={styles.cardLabel}>글쓴이</span>
              <span className={styles.cardName}>
                {authorProfile.display_name}
              </span>
              <span className={styles.cardHandle}>
                @{authorProfile.username}
              </span>
              {authorProfile.bio && (
                <span className={styles.cardBio}>{authorProfile.bio}</span>
              )}
              <span className={styles.cardStats}>
                <span>
                  <b className="num">{authorProfile.counts.followers}</b> 팔로워
                </span>
                <span>
                  <b className="num">{authorProfile.counts.posts}</b> 글
                </span>
              </span>
              <span className={styles.cardInitial} aria-hidden="true">
                {initialOf(authorProfile.display_name)}
              </span>
            </Link>
          </div>
        )}
        <SiteFoot shortcut={viewer.status === "ready"} />
      </aside>
    </div>
  );
}
