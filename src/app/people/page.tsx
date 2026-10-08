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
          <h1 className="page-title">모든 사람</h1>
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
                endText="모든 사람을 봤어요."
                empty={
                  <EmptyState
                    tone="zen"
                    icon="people"
                    title="아직 가입한 사람이 없어요"
                  />
                }
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
