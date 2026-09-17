import Link from "next/link";
import { PersonRow } from "@/components/person-row";
import { ServiceError } from "@/components/service-error";
import { readPeople } from "@/lib/people";
import { PAGE_SIZE, validateOffset } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "사람들" };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string | string[] }>;
}) {
  const { offset: rawOffset } = await searchParams;
  const offset = validateOffset(rawOffset);
  if (offset === null)
    return <ServiceError message="목록 주소를 확인해 주세요." href="/people" />;
  const result = await readPeople(offset);
  return (
    <>
      <header className="page-heading">
        <div>
          <h1>사람들</h1>
        </div>
      </header>
      {!result.ok ? (
        <ServiceError message="사람들을 불러오지 못했습니다." href="/people" />
      ) : (
        <>
          <ul className="person-list">
            {result.people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </ul>
          {result.people.length === 0 && (
            <p className="empty muted">아직 이곳에 소개된 사람이 없습니다.</p>
          )}
          <div className="feed-footer actions">
            {offset > 0 && (
              <Link className="text-link" href="/people">
                처음으로
              </Link>
            )}
            {result.hasMore && (
              <Link
                className="button button-outline"
                href={`/people?offset=${offset + PAGE_SIZE}`}
              >
                더 보기
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
