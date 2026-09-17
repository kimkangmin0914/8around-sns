import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { readProfile, readFollowing, readConnections } from "@/lib/people";
import { readPosts } from "@/lib/posts";
import { PAGE_SIZE, validateOffset } from "@/lib/validation";
import { FollowButton } from "@/components/follow-button";
import { PersonRow } from "@/components/person-row";
import { PostRow } from "@/components/post-row";
import { AccountMenu } from "@/components/account-menu";
import { SessionBoundary } from "@/components/session-boundary";
import { ServiceError } from "@/components/service-error";

export const dynamic = "force-dynamic";
export const metadata = { title: "프로필" };

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    tab?: string | string[];
    offset?: string | string[];
  }>;
}) {
  const { username } = await params;
  if (!/^[a-z0-9_]{3,20}$/.test(username)) notFound();
  const query = await searchParams;
  const tab = query.tab ?? "posts";
  const offset = validateOffset(query.offset);
  const href = `/u/${username}`;
  if (
    offset === null ||
    (tab !== "posts" && tab !== "followers" && tab !== "following")
  )
    return <ServiceError message="목록 주소를 확인해 주세요." href={href} />;
  const [result, viewer] = await Promise.all([
    readProfile(username),
    getViewer(),
  ]);
  if (!result.ok)
    return <ServiceError message="프로필을 불러오지 못했습니다." href={href} />;
  if (!result.profile) notFound();
  const profile = result.profile;
  const relationship =
    viewer.status === "ready" && viewer.id !== profile.id
      ? await readFollowing(viewer.id, profile.id)
      : null;
  const posts = tab === "posts" ? await readPosts(offset, profile.id) : null;
  const connections =
    tab !== "posts" ? await readConnections(profile.id, tab, offset) : null;
  const hasMore =
    (posts?.ok && posts.hasMore) || (connections?.ok && connections.hasMore);
  return (
    <>
      <header className="page-heading">
        <h1>프로필</h1>
        {viewer.status === "ready" && viewer.id === profile.id && (
          <AccountMenu />
        )}
      </header>
      <section className="profile-header stack" aria-label="사용자 소개">
        <div className="profile-identity">
          <span className="avatar" aria-hidden="true">
            {Array.from(profile.display_name)[0]}
          </span>
          <div className="person-copy">
            <h2>{profile.display_name}</h2>
            <p className="post-meta">@{profile.username}</p>
          </div>
        </div>
        {profile.bio && <p className="post-body muted">{profile.bio}</p>}
        {viewer.status === "ready" &&
          relationship &&
          (relationship.ok ? (
            <SessionBoundary key={viewer.id} userId={viewer.id}>
              <FollowButton
                key={`${profile.id}:${relationship.following}`}
                userId={viewer.id}
                targetId={profile.id}
                following={relationship.following}
              />
            </SessionBoundary>
          ) : (
            <ServiceError
              message="팔로우 상태를 확인하지 못했습니다."
              href={href}
            />
          ))}
        {viewer.status === "guest" && (
          <Link className="text-link" href="/login">
            로그인하고 팔로우하기
          </Link>
        )}
        {viewer.status === "onboarding" && (
          <Link className="text-link" href="/onboarding">
            프로필 설정 후 팔로우하기
          </Link>
        )}
        {viewer.status === "error" && (
          <p className="error">
            로그인 상태를 확인하지 못했습니다. 새로고침해 주세요.
          </p>
        )}
      </section>
      <nav className="profile-tabs" aria-label="프로필 목록">
        <Link href={href} aria-current={tab === "posts" ? "page" : undefined}>
          글
        </Link>
        <Link
          href={`${href}?tab=followers`}
          aria-current={tab === "followers" ? "page" : undefined}
        >
          팔로워 {profile.followers[0]?.count ?? 0}
        </Link>
        <Link
          href={`${href}?tab=following`}
          aria-current={tab === "following" ? "page" : undefined}
        >
          팔로잉 {profile.following[0]?.count ?? 0}
        </Link>
      </nav>
      {posts &&
        (!posts.ok ? (
          <ServiceError message="글을 불러오지 못했습니다." href={href} />
        ) : posts.posts.length ? (
          posts.posts.map((post) => <PostRow key={post.id} post={post} />)
        ) : (
          <p className="empty muted">아직 작성한 글이 없습니다.</p>
        ))}
      {connections &&
        (!connections.ok ? (
          <ServiceError
            message="관계 목록을 불러오지 못했습니다."
            href={`${href}?tab=${tab}`}
          />
        ) : connections.people.length ? (
          <ul className="person-list">
            {connections.people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </ul>
        ) : (
          <p className="empty muted">
            아직 {tab === "followers" ? "팔로워가" : "팔로잉한 사람이"}{" "}
            없습니다.
          </p>
        ))}
      <div className="feed-footer actions">
        {offset > 0 && (
          <Link className="text-link" href={`${href}?tab=${tab}`}>
            처음으로
          </Link>
        )}
        {hasMore && (
          <Link
            className="button button-outline"
            href={`${href}?tab=${tab}&offset=${offset + PAGE_SIZE}`}
          >
            더 보기
          </Link>
        )}
      </div>
    </>
  );
}
