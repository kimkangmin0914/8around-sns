import { getViewer } from "@/server/queries/viewer";
import { listPeople } from "@/server/queries/people";
import { PeopleList } from "@/components/people/people-list";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "사람들" };

export default async function PeoplePage() {
  const viewer = await getViewer();
  const viewerId = viewer.status === "ready" ? viewer.id : null;
  const people = await listPeople(viewerId);
  return (
    <div className="page">
      <div className="page-wide">
        <section className="section" data-tight>
          <span className="section-eyebrow eyebrow">사람들</span>
          <h1 className="page-title">곁에 둘 사람을 찾아요</h1>
          <p className="page-lede">
            최근에 온 사람부터 보여드려요. 팔로우하면 그 사람의 글이 팔로잉
            피드에 모여요.
          </p>
          {viewer.status === "guest" && (
            <div style={{ marginTop: 20 }}>
              <ButtonLink
                href="/login?next=%2Fpeople"
                variant="secondary"
                size="s"
              >
                <Icon name="login" size={16} /> 로그인하고 팔로우하기
              </ButtonLink>
            </div>
          )}
        </section>
        <section className="section" data-tight>
          {!people.ok ? (
            <ErrorState
              title="사람들을 불러오지 못했어요"
              action={
                <ButtonLink href="/people" variant="secondary">
                  <Icon name="refresh" size={18} /> 다시 불러오기
                </ButtonLink>
              }
            />
          ) : (
            <div style={{ margin: "0 calc(var(--gutter) * -1)" }}>
              <PeopleList
                initial={people.items}
                next={people.next}
                layout="tiles"
                endText="지금 around에 있는 사람은 여기까지예요."
                empty={
                  <EmptyState
                    tone="zen"
                    icon="people"
                    title="아직 아무도 없어요"
                  >
                    첫 번째 사람이 되어 주세요.
                  </EmptyState>
                }
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
