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
            {welcome ? `${firstName}님, 환영해요` : "지금 오가는 이야기"}
          </h1>
          {welcome && (
            <p className="page-lede">
              첫 글을 남기거나, 곁에 둘 사람을 먼저 찾아보세요.
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
                  title="아직 팔로잉 피드가 조용해요"
                  actions={
                    <ButtonLink href="/people">
                      <Icon name="follow" size={18} /> 사람들 둘러보기
                    </ButtonLink>
                  }
                >
                  팔로우한 사람과 내 글이 여기에 모여요. 마음이 가는 사람을 찾아
                  팔로우해 보세요.
                </EmptyState>
              ) : (
                <EmptyState
                  tone={toneFor(viewer.id)}
                  icon="compose"
                  title="첫 이야기를 기다리고 있어요"
                >
                  위 입력창에 지금 떠오르는 한 줄을 남겨 보세요.
                </EmptyState>
              )
            }
          />
        )}
      </div>
      <aside className="page-aside" aria-label="내 정보와 추천">
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
            <div>
              <p className={landing.live}>지금 around에서</p>
              <h2 className={landing.liveTitle}>오가는 이야기</h2>
            </div>
            <Link href="/people" className="link">
              사람들 보기
            </Link>
          </div>
          {serviceError && (
            <p className="muted" style={{ marginTop: 12 }}>
              로그인 상태를 확인하지 못했어요. 새로고침하면 대부분 해결돼요.
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
            endText="가장 처음 글까지 왔어요."
            empty={
              <EmptyState
                tone="gold"
                icon="sparkle"
                title="아직 아무도 글을 쓰지 않았어요"
                actions={
                  <ButtonLink href="/signup">첫 글 쓰러 가기</ButtonLink>
                }
              >
                가입하고 around의 첫 이야기를 남겨 주세요.
              </EmptyState>
            }
          />
        )}
        <div className={landing.joinBand} data-tone="blue">
          <div>
            <p className={landing.joinTitle}>대화에 끼고 싶다면</p>
            <p className={landing.joinText}>
              가입하면 바로 글을 쓰고 댓글을 남길 수 있어요.
            </p>
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
