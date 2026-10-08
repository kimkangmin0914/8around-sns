import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer, type ReadyViewer } from "@/server/queries/viewer";
import { listPosts } from "@/server/queries/posts";
import { parseTab } from "@/lib/validation";
import { toneFor } from "@/lib/tone";
import { Composer } from "@/components/feed/composer";
import { FeedList } from "@/components/feed/feed-list";
import { FeedAside, SiteFoot } from "@/components/feed/aside";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { Hero, Statement } from "@/components/landing/hero";
import { AboutBento } from "@/components/landing/about-bento";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import landing from "@/components/landing/landing.module.css";

export const dynamic = "force-dynamic";

type Search = Promise<{ tab?: string | string[]; welcome?: string }>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const viewer = await getViewer();
  if (viewer.status === "onboarding") redirect("/onboarding");
  const query = await searchParams;
  if (viewer.status === "ready")
    return (
      <Feed viewer={viewer} tab={query.tab} welcome={query.welcome === "1"} />
    );
  return <Landing serviceError={viewer.status === "error"} />;
}

async function Feed({
  viewer,
  tab: rawTab,
  welcome,
}: {
  viewer: ReadyViewer;
  tab: unknown;
  welcome: boolean;
}) {
  const tab = parseTab(rawTab, ["all", "following"] as const, "all") ?? "all";
  const feed = await listPosts(
    tab === "following"
      ? { kind: "following", viewerId: viewer.id }
      : { kind: "all" },
  );
  const firstName = viewer.profile.display_name;
  return (
    <div className="page">
      <div className="page-main">
        <section className="section" data-tight>
          <span className="section-eyebrow eyebrow">피드</span>
          <h1 className="page-title">
            {welcome ? `${firstName}님, 반가워요` : "최근 글"}
          </h1>
          {welcome && (
            <p className="page-lede">
              첫 글을 쓰거나 팔로우할 사람을 찾아보세요.
            </p>
          )}
          <div style={{ marginTop: 24 }}>
            <Composer
              userId={viewer.id}
              displayName={viewer.profile.display_name}
            />
          </div>
        </section>
        <FeedTabs active={tab} />
        {!feed.ok ? (
          <ErrorState
            action={
              <ButtonLink
                href={tab === "following" ? "/?tab=following" : "/"}
                variant="secondary"
              >
                <Icon name="refresh" size={18} /> 다시 불러오기
              </ButtonLink>
            }
          />
        ) : (
          <FeedList
            key={tab}
            initial={feed.items}
            next={feed.next}
            scope={tab}
            empty={
              tab === "following" ? (
                <EmptyState
                  tone="zen"
                  icon="people"
                  title="아직 팔로우한 사람이 없어요"
                  actions={
                    <ButtonLink href="/people">
                      <Icon name="follow" size={18} /> 사람들 둘러보기
                    </ButtonLink>
                  }
                >
                  팔로우한 사람의 글과 내 글이 여기에 모여요.
                </EmptyState>
              ) : (
                <EmptyState
                  tone={toneFor(viewer.id)}
                  icon="compose"
                  title="아직 글이 없어요"
                />
              )
            }
          />
        )}
      </div>
      <aside className="page-aside" aria-label="내 정보와 새로 온 사람">
        <FeedAside viewer={viewer} />
      </aside>
    </div>
  );
}

async function Landing({ serviceError }: { serviceError: boolean }) {
  const feed = await listPosts({ kind: "all" });
  return (
    <div className="page">
      <div className="page-full">
        <Hero />
        <Statement />
        <AboutBento />
      </div>
      <div className="page-main">
        <section className="section" data-tight>
          <span className="section-eyebrow eyebrow">둘러보기</span>
          <div className={landing.liveHead}>
            <h2 className={landing.liveTitle}>최근 글</h2>
            <Link href="/people" className="link">
              사람들 보기
            </Link>
          </div>
          {serviceError && (
            <p className="muted" style={{ marginTop: 12 }}>
              로그인 상태를 확인하지 못했어요. 새로고침해 주세요.
            </p>
          )}
        </section>
        {!feed.ok ? (
          <ErrorState
            action={
              <ButtonLink href="/" variant="secondary">
                <Icon name="refresh" size={18} /> 다시 불러오기
              </ButtonLink>
            }
          />
        ) : (
          <FeedList
            initial={feed.items}
            next={feed.next}
            scope="all"
            empty={
              <EmptyState
                tone="gold"
                icon="sparkle"
                title="아직 글이 없어요"
                actions={
                  <ButtonLink href="/signup">가입하고 첫 글 쓰기</ButtonLink>
                }
              />
            }
          />
        )}
        <div className={landing.joinBand} data-tone="blue">
          <div>
            <p className={landing.joinTitle}>직접 쓰고 답해 보세요</p>
            <p className={landing.joinText}>이메일과 비밀번호만 있으면 돼요.</p>
          </div>
          <ButtonLink href="/signup" variant="tone">
            가입하기 <Icon name="arrowRight" size={18} />
          </ButtonLink>
        </div>
      </div>
      <aside className="page-aside" aria-label="사이트 정보">
        <SiteFoot />
      </aside>
    </div>
  );
}
