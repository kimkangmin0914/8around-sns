"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { completeProfile } from "@/actions/auth";
import { validateProfile } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { actionMessage } from "@/components/action-message";
import { uncertainWrite, type ActionResult } from "@/lib/action-result";

export function ProfileForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [values, setValues] = useState({
    username: "",
    display_name: "",
    bio: "",
  });
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.current) return;
        const checked = validateProfile(values);
        if (!checked.ok) {
          setResult({ status: "input", message: checked.message });
          return;
        }
        const form = new FormData(event.currentTarget);
        busy.current = true;
        setPending(true);
        setResult(null);
        try {
          const next = await completeProfile(userId, form);
          setResult(next);
          if (next.status === "success") {
            router.replace("/");
            router.refresh();
          }
        } catch {
          setResult(uncertainWrite);
        } finally {
          busy.current = false;
          setPending(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="username">사용자명</label>
        <input
          id="username"
          name="username"
          className="input"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={values.username}
          onChange={(e) => setValues({ ...values, username: e.target.value })}
          required
          disabled={pending}
          aria-describedby="username-hint"
        />
        <p id="username-hint" className="hint">
          소문자 영문·숫자·밑줄 3~20자. 다른 사람과 겹칠 수 없습니다.
        </p>
      </div>
      <div className="field">
        <label htmlFor="display-name">표시 이름</label>
        <input
          id="display-name"
          name="display_name"
          className="input"
          autoComplete="nickname"
          value={values.display_name}
          onChange={(e) =>
            setValues({ ...values, display_name: e.target.value })
          }
          required
          disabled={pending}
          aria-describedby="name-hint"
        />
        <p id="name-hint" className="hint">
          1~30자
        </p>
      </div>
      <div className="field">
        <label htmlFor="bio">
          소개 <span className="muted">(선택)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          className="input"
          value={values.bio}
          onChange={(e) => setValues({ ...values, bio: e.target.value })}
          disabled={pending}
          aria-describedby="bio-hint"
        />
        <p id="bio-hint" className="hint">
          160자 이내
        </p>
      </div>
      <p className="hint">
        이 정보는 누구나 볼 수 있습니다. 최초 설정 후에는 수정할 수 없습니다.
      </p>
      {result && (
        <p
          role={result.status === "success" ? "status" : "alert"}
          className={result.status === "success" ? "success" : "error"}
        >
          {result.status === "uncertain"
            ? "저장 결과를 확인하지 못했습니다. 입력한 내용은 남아 있습니다."
            : actionMessage(result.message)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "저장하고 있습니다…" : "프로필 저장"}
      </Button>
    </form>
  );
}
