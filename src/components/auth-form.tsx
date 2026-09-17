"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/actions/auth";
import { validateCredentials } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.current) return;
        const values = validateCredentials({ email, password }, signup);
        if (!values.ok) {
          setResult({ status: "input", message: values.message });
          return;
        }
        const form = new FormData(event.currentTarget);
        busy.current = true;
        setPending(true);
        setResult(null);
        try {
          const next = await (signup ? signUp(form) : signIn(form));
          setResult(next);
          if (next.status === "success") {
            setPassword("");
            router.replace(signup ? "/onboarding" : "/");
            router.refresh();
          }
        } catch {
          setResult({
            status: "uncertain",
            message:
              "인증 결과를 확인하지 못했습니다. 잠시 후 로그인 화면에서 다시 확인해 주세요.",
          });
        } finally {
          busy.current = false;
          setPending(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          className="input"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={pending}
        />
      </div>
      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          className="input"
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={pending}
          aria-describedby={signup ? "password-hint" : undefined}
        />
        {signup && (
          <p id="password-hint" className="hint">
            8자 이상, UTF-8 기준 72바이트 이내
          </p>
        )}
      </div>
      {result && (
        <p
          role={result.status === "success" ? "status" : "alert"}
          className={result.status === "success" ? "success" : "error"}
        >
          {result.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "확인하고 있습니다…" : signup ? "가입하기" : "로그인"}
      </Button>
    </form>
  );
}
