import Link from "next/link";
import { notFound } from "next/navigation";
import { readPost } from "@/lib/posts";
import { isUuid } from "@/lib/validation";
import { PostRow } from "@/components/post-row";
import { ServiceError } from "@/components/service-error";
import { CommentsSection } from "@/components/comments-section";
import { parseCommentPage } from "@/lib/comment-page";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "이야기" };

export default async function PostDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    offset?: string | string[];
    thread?: string | string[];
    replyOffset?: string | string[];
  }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const page = parseCommentPage(await searchParams);
  if (!page)
    return (
      <ServiceError
        message="댓글 목록 주소를 확인해 주세요."
        href={`/posts/${id}`}
      />
    );
  const [result, viewer] = await Promise.all([readPost(id), getViewer()]);
  if (!result.ok)
    return (
      <ServiceError message="글을 불러오지 못했습니다." href={`/posts/${id}`} />
    );
  if (!result.post) notFound();
  return (
    <>
      <header className="page-heading">
        <h1>이야기</h1>
        <Link href="/" className="text-link">
          전체 글
        </Link>
      </header>
      <PostRow post={result.post} detail />
      <CommentsSection
        postId={id}
        count={result.post.comments[0]?.count ?? 0}
        viewer={viewer}
        page={page}
      />
    </>
  );
}
