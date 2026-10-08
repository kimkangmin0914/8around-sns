import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/server/queries/viewer";
import { getProfile, listConnections } from "@/server/queries/people";
import { listPosts } from "@/server/queries/posts";
import { USERNAME_PATTERN, parseTab } from "@/lib/validation";
import { toneFor } from "@/lib/tone";
import { joinedMonth } from "@/lib/time";
import { FeedList } from "@/components/feed/feed-list";
import { PeopleList } from "@/components/people/people-list";
import { FollowButton } from "@/components/people/follow-button";
import { SeatMark } from "@/components/people/seat-mark";
import { Tilt } from "@/components/ui/tilt";
import { Count } from "@/components/ui/count";
import { ComposeButton } from "@/components/shell/compose-button";
import { SiteFoot } from "@/components/feed/aside";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import styles from "./profile.module.css";

export const dynamic = "force-dynamic";

type Params = Promise<{ username: string }>;
type Search = Promise<{ tab?: string | string[] }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { username } = await params;
  if (!USERNAME_PATTERN.test(username)) return { title: "프로필" };
  const result = await getProfile(username, null);
  if (!result.ok || !result.profile) return { title: "프로필" };
  return {
    title: `${result.profile.display_name} (@${username})`,
    description:
      result.profile.bio || `${result.profile.display_name}님이 beside에 쓴 글`,
  };
}

const TABS = ["posts", "followers", "following"] as const;

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { username } = await params;
  if (!USERNAME_PATTERN.test(username)) notFound();
  const tab = parseTab((await searchParams).tab, TABS, "posts");
  const href = `/u/${username}`;
  const viewer = await getViewer();
  const viewerId = viewer.status === "ready" ? viewer.id : null;
  const result = await getProfile(username, viewerId);
  if (!result.ok)
    return (
      <div className="page">
        <div className="page-main">
          <ErrorState
            title="프로필을 불러오지 못했어요"
            action={
              <ButtonLink href={href} variant="secondary">
                <Icon name="refresh" size={18} /> 다시 불러오기
              </ButtonLink>
            }
          />
        </div>
      </div>
    );
  const profile = result.profile;
  if (!profile) notFound();
  const activeTab = tab ?? "posts";
  const self = profile.relation?.self ?? false;
  const relation = profile.relation;

  const [posts, people] = await Promise.all([
    activeTab === "posts"
      ? listPosts({ kind: "author", authorId: profile.id })
      : null,
    activeTab !== "posts"
      ? listConnections(profile.id, activeTab, viewerId)
      : null,
  ]);

  const tabs = [
    { key: "posts", label: "글", count: profile.counts.posts, href },
    {
      key: "followers",
      label: "팔로워",
      count: profile.counts.followers,
      href: `${href}?tab=followers`,
    },
    {
      key: "following",
      label: "팔로잉",
      count: profile.counts.following,
      href: `${href}?tab=following`,
    },
  ] as const;

  return (
    <div className="page">
      <div className="page-main">
        <section className="section" data-tight>
          <span className="section-eyebrow eyebrow">프로필</span>
          <Tilt
            className={styles.hero}
            data-tone={toneFor(profile.id)}
            data-seat-scope=""
          >
            {relation?.followsYou && !self && (
              <p className={styles.badges}>
                <span className={styles.badge}>
                  <Icon name="following" size={14} strokeWidth={2.2} />
                  {relation.following ? "서로 팔로우" : "나를 팔로우"}
                </span>
              </p>
            )}
            <div className={styles.copy}>
              <h1 className={styles.name}>{profile.display_name}</h1>
              <p className={styles.handle}>@{profile.username}</p>
              {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
              <p className={styles.joined}>
                <Icon name="calendar" size={15} />
                {joinedMonth(profile.created_at)} 가입
              </p>
              <div className={styles.actions}>
                {self ? (
                  <ComposeButton variant="tone" size="m" />
                ) : (
                  <FollowButton
                    targetId={profile.id}
                    targetName={profile.display_name}
                    following={relation?.following ?? false}
                    followsYou={relation?.followsYou ?? false}
                    variant="onTone"
                  />
                )}
              </div>
            </div>
            <SeatMark
              className={styles.mark}
              id={profile.id}
              posts={profile.counts.posts}
              seat={self ? "self" : relation?.following ? "taken" : "open"}
              viewerTone={viewerId ? toneFor(viewerId) : null}
              invite={
                viewer.status === "ready"
                  ? {
                      name: viewer.profile.display_name,
                      tone: toneFor(viewer.id),
                    }
                  : null
              }
              size="var(--mark)"
              hero
            />
          </Tilt>
        </section>
        <nav
          className={styles.tabs}
          aria-label={`${profile.display_name}님의 글과 팔로우 목록`}
        >
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={styles.tab}
              aria-current={activeTab === item.key ? "page" : undefined}
              scroll={false}
            >
              <Count value={item.count} className={`num ${styles.tabCount}`} />
              <span className={styles.tabLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
        {activeTab === "posts" &&
          posts &&
          (!posts.ok ? (
            <ErrorState
              title="글을 불러오지 못했어요"
              action={
                <ButtonLink href={href} variant="secondary">
                  <Icon name="refresh" size={18} /> 다시 불러오기
                </ButtonLink>
              }
            />
          ) : (
            <FeedList
              key={`posts-${profile.id}`}
              initial={posts.items}
              next={posts.next}
              scope="author"
              authorId={profile.id}
              endText={`${profile.display_name}님의 글을 모두 봤어요.`}
              empty={
                <EmptyState
                  tone={toneFor(profile.id)}
                  icon="compose"
                  title={self ? "아직 쓴 글이 없어요" : "아직 글이 없어요"}
                  actions={
                    self ? <ComposeButton>첫 글 쓰기</ComposeButton> : null
                  }
                />
              }
            />
          ))}
        {activeTab !== "posts" &&
          people &&
          (!people.ok ? (
            <ErrorState
              title="목록을 불러오지 못했어요"
              action={
                <ButtonLink
                  href={`${href}?tab=${activeTab}`}
                  variant="secondary"
                >
                  <Icon name="refresh" size={18} /> 다시 불러오기
                </ButtonLink>
              }
            />
          ) : (
            <PeopleList
              key={`${activeTab}-${profile.id}`}
              initial={people.items}
              next={people.next}
              layout="rows"
              profileId={profile.id}
              tab={activeTab}
              endText={
                activeTab === "followers"
                  ? "팔로워를 모두 봤어요."
                  : "팔로잉을 모두 봤어요."
              }
              empty={
                <EmptyState
                  tone={activeTab === "followers" ? "lime" : "orchid"}
                  icon={activeTab === "followers" ? "people" : "follow"}
                  title={
                    activeTab === "followers"
                      ? "아직 팔로워가 없어요"
                      : "아직 팔로우한 사람이 없어요"
                  }
                  actions={
                    self && activeTab === "following" ? (
                      <ButtonLink href="/people">
                        <Icon name="people" size={18} /> 사람들 둘러보기
                      </ButtonLink>
                    ) : null
                  }
                />
              }
            />
          ))}
      </div>
      <aside className="page-aside" aria-label="사이트 정보">
        <SiteFoot />
      </aside>
    </div>
  );
}
