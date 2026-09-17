import { expect, it } from "vitest";
import {
  readFields,
  validateContent,
  validateProfile,
} from "../src/lib/validation";

async function transmit(values: Record<string, string>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(values)) body.set(key, value);
  return new Request("http://localhost/", { method: "POST", body }).formData();
}

it("multipart의 CRLF 변환 후에도 줄바꿈을 포함한 500자 글을 저장할 수 있다", async () => {
  const content = "한글😀\n" + "가".repeat(496);
  const received = await transmit({ content });
  const wireValue = received.get("content") as string;
  expect([...wireValue]).toHaveLength(501);
  expect(wireValue).toContain("\r\n");
  expect(validateContent(content)).toEqual({ ok: true, value: content });
  expect(validateContent(wireValue)).toEqual({ ok: true, value: content });
});

it("줄바꿈을 보정해도 실제 501자 본문은 거절한다", async () => {
  const received = await transmit({ content: "가\n" + "😀".repeat(499) });
  expect(validateContent(received.get("content") as string).ok).toBe(false);
});

it("160자 소개도 화면과 서버에서 동일하게 검증한다", async () => {
  const values = {
    username: "sai_test",
    display_name: "사이",
    bio: "가\n" + "😀".repeat(158),
  };
  const received = readFields(await transmit(values), [
    "username",
    "display_name",
    "bio",
  ]);
  expect(received.ok).toBe(true);
  if (received.ok)
    expect(validateProfile(received.value)).toEqual({
      ok: true,
      value: values,
    });
});

it("복사해 넣은 CR 줄바꿈도 한 번의 줄바꿈으로 보존한다", () => {
  expect(validateContent(" 첫 줄\r다음 줄\r\n끝 줄 ")).toEqual({
    ok: true,
    value: "첫 줄\n다음 줄\n끝 줄",
  });
});
