import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { readPosts } from "@/lib/posts";
import { PAGE_SIZE, validateOffset } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/account-menu";
import { PostComposer } from "@/components/post-composer";
import { PostRow } from "@/components/post-row";
import { ServiceError } from "@/components/service-error";
import { SessionBoundary } from "@/components/session-boundary";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string | string[] }>;
}) {
  const params = await searchParams;
  const offset = validateOffset(params.offset);
  if (offset === null)
    return (
      <section className="surface stack">
        <h1>페이지 위치를 확인해 주세요</h1>
        <Link className="text-link" href="/">
          최신 글 보기
        </Link>
      </section>
    );
  const [viewer, feed] = await Promise.all([getViewer(), readPosts(offset)]);
  if (viewer.status === "onboarding") redirect("/onboarding");
  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">사람과 사람 사이</p>
          <h1>전체 글</h1>
        </div>
        {viewer.status === "ready" ? (
          <AccountMenu />
        ) : (
          <Button variant="ghost" asChild>
            <Link href="/login">로그인</Link>
          </Button>
        )}
      </header>
      {viewer.status === "ready" ? (
        <SessionBoundary key={viewer.id} userId={viewer.id}>
          <PostComposer
            userId={viewer.id}
            displayName={viewer.profile.display_name}
          />
        </SessionBoundary>
      ) : viewer.status === "error" ? (
        <ServiceError message="로그인 상태를 확인하지 못했습니다." />
      ) : (
        <section className="surface stack">
          <h2>당신의 하루를 들려주세요.</h2>
          <p className="muted">
            가벼운 생각부터 오래 남은 이야기까지.
            <br />
            여기서 함께 나눠요.
          </p>
          <div className="actions">
            <Button asChild>
              <Link href="/signup">가입하고 글 쓰기</Link>
            </Button>
            <Link className="text-link" href="/login">
              이미 계정이 있어요
            </Link>
          </div>
        </section>
      )}
      {!feed.ok ? (
        <ServiceError
          message="글을 불러오지 못했습니다."
          href={offset ? `/?offset=${offset}` : "/"}
        />
      ) : (
        <section aria-label="최신 게시글">
          {offset > 0 && (
            <div className="notice">
              <Link href="/" className="text-link">
                최신 글부터 보기
              </Link>
            </div>
          )}
          {feed.posts.length ? (
            feed.posts.map((post) => <PostRow key={post.id} post={post} />)
          ) : (
            <div className="empty">
              <h2>
                {offset
                  ? "이전 글을 모두 읽었습니다."
                  : "아직 올라온 이야기가 없어요."}
              </h2>
              <p className="muted">
                {offset
                  ? "최신 글에서 이야기를 이어가세요."
                  : "첫 이야기를 남겨보세요."}
              </p>
            </div>
          )}
          {feed.hasMore && (
            <div className="feed-footer">
              <Button variant="outline" asChild>
                <Link href={`/?offset=${offset + PAGE_SIZE}`}>더 보기</Link>
              </Button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
