import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

class AccessCheckError extends Error {}

// Only explicitly prepared assignment accounts; no admin keys or signup here.
export function validateAccessSettings(settings) {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "ACCESS_CHECK_PROJECT_REF",
    "ACCESS_CHECK_EMAIL_A",
    "ACCESS_CHECK_PASSWORD_A",
    "ACCESS_CHECK_EMAIL_B",
    "ACCESS_CHECK_PASSWORD_B",
  ];
  if (
    required.some(
      (name) => typeof settings[name] !== "string" || !settings[name].trim(),
    )
  )
    throw new AccessCheckError(
      ".env.test.local의 프로젝트 확인값과 A·B 계정 설정이 필요합니다.",
    );
  let parsed;
  try {
    parsed = new URL(settings.NEXT_PUBLIC_SUPABASE_URL);
  } catch {
    throw new AccessCheckError("점검 프로젝트 URL 형식을 확인해 주세요.");
  }
  if (
    !/^[a-z0-9]{20}$/.test(settings.ACCESS_CHECK_PROJECT_REF) ||
    parsed.origin !==
      `https://${settings.ACCESS_CHECK_PROJECT_REF}.supabase.co` ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  )
    throw new AccessCheckError(
      "명시적으로 확인한 과제 프로젝트와 URL이 일치하지 않습니다.",
    );
  if (
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(
      settings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    )
  )
    throw new AccessCheckError("일반 publishable key만 사용할 수 있습니다.");
  const A = {
    email: settings.ACCESS_CHECK_EMAIL_A.trim(),
    password: settings.ACCESS_CHECK_PASSWORD_A,
  };
  const B = {
    email: settings.ACCESS_CHECK_EMAIL_B.trim(),
    password: settings.ACCESS_CHECK_PASSWORD_B,
  };
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(A.email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(B.email) ||
    A.email.toLowerCase() === B.email.toLowerCase()
  )
    throw new AccessCheckError("서로 다른 실제 점검 계정 A·B가 필요합니다.");
  return {
    url: parsed.origin,
    key: settings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    A,
    B,
  };
}

const check = (condition, message) => {
  if (!condition) throw new AccessCheckError(message);
};
const safeFetch = async (input, init) => {
  try {
    return await fetch(input, { ...init, signal: AbortSignal.timeout(12000) });
  } catch {
    throw new AccessCheckError("점검 서비스 연결 실패");
  }
};
const clientFor = ({ url, key }) =>
  createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: safeFetch },
  });
const pass = (label) => console.log(`PASS ${label}`);
function denied(result, codes, label) {
  check(
    result.error && codes.includes(result.error.code),
    `${label}: 예상한 DB 거절을 확인하지 못했습니다.`,
  );
  pass(`${label} (${result.error.code})`);
}

export async function runAccessCheck(settings) {
  const config = validateAccessSettings(settings);
  const A = clientFor(config),
    B = clientFor(config),
    guest = clientFor(config);
  const marker = `[점검 ${randomUUID()}]`;
  const created = { posts: 0, comments: 0, follows: 0 };
  let stage = "A·B 로그인";
  try {
    // Independent clients and real getUser checks; SDK sessions stay in this process.
    for (const [client, credentials] of [
      [A, config.A],
      [B, config.B],
    ]) {
      const result = await client.auth.signInWithPassword(credentials);
      check(!result.error, "준비된 점검 계정으로 로그인하지 못했습니다.");
    }
    const identityA = await A.auth.getUser(),
      identityB = await B.auth.getUser();
    const a = identityA.data.user,
      b = identityB.data.user;
    check(
      !identityA.error &&
        !identityB.error &&
        a &&
        b &&
        a.id !== b.id &&
        !a.is_anonymous &&
        !b.is_anonymous,
      "A·B의 서로 다른 비익명 사용자 ID를 확인하지 못했습니다.",
    );
    const profiles = await A.from("profiles")
      .select("id")
      .in("id", [a.id, b.id]);
    check(
      !profiles.error && profiles.data?.length === 2,
      "A·B의 프로필 완료와 SQL 적용을 확인해 주세요.",
    );
    pass("확인된 과제 프로젝트 · 서로 다른 A·B 로그인 · 프로필 완료");

    stage = "글 작성과 B 조회";
    const contents = [
      `${marker} A의 글\n한글·줄바꿈과 이모지 😀`,
      `${marker} 다른 글의 부모 연결 거절 점검`,
    ];
    const posts = await A.from("posts")
      .insert(contents.map((content) => ({ content })))
      .select("id,author_id,content");
    check(!posts.error && posts.data?.length === 2, "점검 게시글 저장 실패");
    created.posts = posts.data.length;
    check(
      posts.data.every((post) => post.author_id === a.id),
      "게시글 작성자 불일치",
    );
    const P1 = posts.data.find((post) => post.content === contents[0]);
    const P2 = posts.data.find((post) => post.content === contents[1]);
    check(P1 && P2, "저장된 게시글 본문 불일치");
    const read = await B.from("posts")
      .select("id,author_id,content")
      .eq("id", P1.id)
      .single();
    check(
      !read.error &&
        read.data.author_id === a.id &&
        read.data.content === contents[0],
      "B의 A 게시글 조회 불일치",
    );
    pass("A 게시글 2개 저장 · B의 동일 작성자·본문 조회");

    stage = "글·프로필 익명·사칭 거절";
    const rejected = `${marker} 저장되면 안 되는 입력`;
    denied(
      await guest.from("posts").insert({ content: rejected }),
      ["42501"],
      "익명 게시글 거절",
    );
    denied(
      await guest.from("profiles").insert({
        username: `probe_${randomUUID().slice(0, 8)}`,
        display_name: "점검",
      }),
      ["42501"],
      "익명 프로필 거절",
    );
    denied(
      await A.from("posts").insert({ content: rejected, author_id: b.id }),
      ["42501"],
      "게시글 작성자 사칭 열 거절",
    );
    denied(
      await A.from("profiles").insert({
        id: b.id,
        username: `probe_${randomUUID().slice(0, 8)}`,
        display_name: "점검",
      }),
      ["42501"],
      "프로필 소유자 사칭 열 거절",
    );
    for (const content of [" \t\n ", "가".repeat(501)])
      denied(
        await A.from("posts").insert({ content }),
        ["23514"],
        "잘못된 게시글 길이·공백 거절",
      );

    stage = "C1·C2 저장과 계층 조회";
    const first = await B.from("comments")
      .insert({ post_id: P1.id, content: `${marker} B의 최상위 댓글\n😀` })
      .select("id,post_id,parent_id,author_id,content")
      .single();
    check(!first.error && first.data, "C1 저장 실패");
    created.comments++;
    const C1 = first.data;
    check(
      C1.post_id === P1.id && C1.parent_id === null && C1.author_id === b.id,
      "C1 글·부모·작성자 불일치",
    );
    const second = await A.from("comments")
      .insert({
        post_id: P1.id,
        parent_id: C1.id,
        content: `${marker} A의 답글\n부모 아래에서 읽어요.`,
      })
      .select("id,post_id,parent_id,author_id,content")
      .single();
    check(!second.error && second.data, "C2 저장 실패");
    created.comments++;
    const C2 = second.data;
    const comments = await B.from("comments")
      .select("id,post_id,parent_id,author_id,content")
      .eq("post_id", P1.id);
    check(
      !comments.error &&
        comments.data.length === 2 &&
        comments.data.some(
          (row) =>
            row.id === C1.id &&
            row.parent_id === null &&
            row.content === C1.content,
        ) &&
        comments.data.some(
          (row) =>
            row.id === C2.id &&
            row.parent_id === C1.id &&
            row.author_id === a.id &&
            row.content === C2.content,
        ),
      "B의 댓글·답글 계층 조회 불일치",
    );
    pass("B의 C1 · A의 C2 저장 및 독립 B 세션의 계층·본문 조회");

    stage = "잘못된 댓글 연결 거절";
    denied(
      await A.from("comments").insert({
        post_id: P2.id,
        parent_id: C1.id,
        content: rejected,
      }),
      ["23514", "23503"],
      "다른 글의 부모 거절",
    );
    denied(
      await A.from("comments").insert({
        post_id: P1.id,
        parent_id: C2.id,
        content: rejected,
      }),
      ["23514"],
      "깊이 2 답글 거절",
    );
    denied(
      await A.from("comments").insert({
        post_id: P1.id,
        parent_id: randomUUID(),
        content: rejected,
      }),
      ["23514", "23503"],
      "없는 부모 거절",
    );
    denied(
      await A.from("comments").insert({
        post_id: P1.id,
        author_id: b.id,
        content: rejected,
      }),
      ["42501"],
      "댓글 작성자 사칭 열 거절",
    );
    denied(
      await guest
        .from("comments")
        .insert({ post_id: P1.id, content: rejected }),
      ["42501"],
      "익명 댓글 거절",
    );
    for (const content of [" \t\n ", "가".repeat(501)])
      denied(
        await A.from("comments").insert({ post_id: P1.id, content }),
        ["23514"],
        "잘못된 댓글 길이·공백 거절",
      );
    for (const table of ["posts", "comments"]) {
      const result = await A.from(table).select("id").eq("content", rejected);
      check(
        !result.error && result.data.length === 0,
        "거절 대상이 실제로 저장됐습니다.",
      );
    }
    const storedCount = await A.from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", P1.id);
    check(
      !storedCount.error && storedCount.count === 2,
      "댓글 거절 검사 뒤 행 수 불일치",
    );
    pass("거절된 글·댓글 저장 0개 · 정상 댓글 2개 유지");

    stage = "팔로우 접근 규칙";
    const relation = (client) =>
      client
        .from("follows")
        .select("follower_id,followee_id")
        .eq("follower_id", a.id)
        .eq("followee_id", b.id);
    const before = await relation(A);
    check(
      !before.error && before.data.length <= 1,
      "기존 팔로우 관계 조회 실패",
    );
    const follow = await A.from("follows").insert({ followee_id: b.id });
    check(
      before.data.length ? follow.error?.code === "23505" : !follow.error,
      "A→B 생성 또는 기존 관계 유지 실패",
    );
    if (!before.data.length) created.follows++;
    denied(
      await A.from("follows").insert({ followee_id: b.id }),
      ["23505"],
      "같은 A→B 중복 거절",
    );
    const unique = await relation(B);
    check(
      !unique.error && unique.data.length === 1,
      "A→B 관계 수가 1이 아닙니다.",
    );
    const removed = await B.from("follows")
      .delete()
      .eq("follower_id", a.id)
      .eq("followee_id", b.id)
      .select();
    const remaining = await relation(A);
    check(
      !removed.error &&
        removed.data.length === 0 &&
        !remaining.error &&
        remaining.data.length === 1,
      "B가 A의 팔로우를 해제했습니다.",
    );
    pass("A→B 관계 1개 · B의 타인 관계 해제 영향 0개");
    denied(
      await A.from("follows").insert({ followee_id: a.id }),
      ["23514"],
      "자기 팔로우 거절",
    );
    denied(
      await A.from("follows").insert({ follower_id: b.id, followee_id: a.id }),
      ["42501"],
      "팔로워 사칭 열 거절",
    );
    denied(
      await guest.from("follows").insert({ followee_id: b.id }),
      ["42501"],
      "익명 팔로우 거절",
    );
    pass("실제 접근 검사 완료 · 기존 자료 보존");
  } catch (error) {
    // Only our fixed messages are printed; SDK responses may contain private data.
    throw new AccessCheckError(
      `${stage}: ${error instanceof AccessCheckError ? error.message : "통신 또는 응답 확인 실패"}`,
    );
  } finally {
    for (const client of [A, B]) {
      try {
        const result = await client.auth.signOut({ scope: "local" });
        if (result.error) {
          console.error("점검 세션 로그아웃 결과 미확인");
          process.exitCode = 1;
        }
      } catch {
        console.error("점검 세션 로그아웃 결과 미확인");
        process.exitCode = 1;
      }
    }
    console.log(
      `추가 확인 자료: 게시글 ${created.posts}개, 댓글 ${created.comments}개, 팔로우 ${created.follows}개. 기존 계정·자료 초기화 없음.`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    let settings;
    try {
      settings = parseEnv(await readFile(".env.test.local", "utf8"));
    } catch {
      throw new AccessCheckError(
        "Git 제외 .env.test.local에 확인한 과제 프로젝트와 점검 계정 A·B를 준비해 주세요.",
      );
    }
    await runAccessCheck(settings);
  } catch (error) {
    console.error(
      `FAIL ${error instanceof AccessCheckError ? error.message : "점검 결과 미확인"}`,
    );
    process.exitCode = 1;
  }
}
