import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/server/queries/viewer";
import { getProfile, listConnections } from "@/server/queries/people";
import { listPosts } from "@/server/queries/posts";
import { USERNAME_PATTERN, parseTab } from "@/lib/validation";
import { initialOf, toneFor } from "@/lib/tone";
import { joinedMonth } from "@/lib/time";
import { FeedList } from "@/components/feed/feed-list";
import { PeopleList } from "@/components/people/people-list";
import { FollowButton } from "@/components/people/follow-button";
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
    description: result.profile.bio || `${result.profile.display_name}님의 B면`,
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
          <div className={styles.hero} data-tone={toneFor(profile.id)}>
            <div className={styles.badges}>
              {self && <span className={styles.badge}>내 프로필</span>}
              {relation?.followsYou && !self && (
                <span className={styles.badge}>
                  <Icon name="following" size={14} strokeWidth={2.2} />
                  나를 팔로우해요
                </span>
              )}
            </div>
            <h1 className={styles.name}>{profile.display_name}</h1>
            <p className={styles.handle}>@{profile.username}</p>
            {profile.bio ? (
              <p className={styles.bio}>{profile.bio}</p>
            ) : (
              <p className={styles.bio} data-empty>
                {self ? "아직 소개가 없어요." : "소개가 아직 없어요."}
              </p>
            )}
            <p className={styles.joined}>
              <Icon name="calendar" size={15} />
              {joinedMonth(profile.created_at)} 합류
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
            <span className={styles.initial} aria-hidden="true">
              {initialOf(profile.display_name)}
            </span>
          </div>
        </section>
        <nav
          className={styles.tabs}
          aria-label={`${profile.display_name}님의 목록`}
        >
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={styles.tab}
              aria-current={activeTab === item.key ? "page" : undefined}
              scroll={false}
            >
              <span className={`num ${styles.tabCount}`}>{item.count}</span>
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
              endText={`${profile.display_name}님의 첫 글까지 왔어요.`}
              empty={
                <EmptyState
                  tone={toneFor(profile.id)}
                  icon="compose"
                  title={self ? "아직 쓴 글이 없어요" : "아직 글이 없어요"}
                  actions={
                    self ? <ComposeButton>첫 글 쓰기</ComposeButton> : null
                  }
                >
                  {self
                    ? "첫 글은 짧아도 좋아요. 지금 떠오르는 한 줄이면 충분해요."
                    : `${profile.display_name}님이 글을 쓰면 여기에 보여요.`}
                </EmptyState>
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
                >
                  {activeTab === "followers"
                    ? self
                      ? "글을 쓰고 대화에 참여하면 곁에 두려는 사람이 생겨요."
                      : `${profile.display_name}님을 처음으로 팔로우해 보세요.`
                    : self
                      ? "마음이 가는 사람을 팔로우하면 여기에 모여요."
                      : `${profile.display_name}님은 아직 아무도 팔로우하지 않았어요.`}
                </EmptyState>
              }
            />
          ))}
      </div>
      <aside className="page-aside" aria-label="사이트 정보">
        <SiteFoot shortcut={viewer.status === "ready"} />
      </aside>
    </div>
  );
}
