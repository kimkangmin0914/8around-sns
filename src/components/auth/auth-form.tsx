"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signIn, signUp } from "@/server/actions/auth";
import {
  EMAIL_PATTERN,
  PASSWORD_MIN,
  codePointLength,
  safeNext,
  validateCredentials,
} from "@/lib/validation";
import type { Failure } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Checklist, PasswordField, TextField } from "@/components/ui/field";
import { Icon } from "@/components/icons/icon";
import { useToast } from "@/components/ui/toast";
import styles from "./auth.module.css";

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  next?: string | null;
}) {
  const signup = mode === "signup";
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const busy = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const focusAfter = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (pending || !focusAfter.current) return;
    focusAfter.current.focus();
    focusAfter.current.select();
    focusAfter.current = null;
  }, [pending]);

  const longEnough = codePointLength(password) >= PASSWORD_MIN;
  const tooLong = new TextEncoder().encode(password).length > 72;
  const emailProblem = !email.trim()
    ? "이메일을 입력해 주세요."
    : !EMAIL_PATTERN.test(email.trim()) || email.trim().length > 254
      ? "이메일 형식을 확인해 주세요. 예: name@example.com"
      : null;
  const passwordProblem = !password
    ? "비밀번호를 입력해 주세요."
    : signup && !longEnough
      ? `비밀번호는 ${PASSWORD_MIN}자 이상으로 정해 주세요.`
      : tooLong
        ? "너무 길어요. 영문·숫자 기준 72자까지 쓸 수 있어요."
        : null;

  async function submit(form: HTMLFormElement) {
    if (busy.current) return;
    setTouched({ email: true, password: true });
    setFailure(null);
    if (emailProblem || passwordProblem) {
      (emailProblem ? emailRef : passwordRef).current?.focus();
      return;
    }
    if (!validateCredentials({ email, password }, signup).ok) return;
    busy.current = true;
    setPending(true);
    try {
      const result = await (signup ? signUp : signIn)(new FormData(form));
      if (result.status === "success") {
        setPassword("");
        toast({ tone: "success", message: result.message });
        router.replace(signup ? "/onboarding" : (safeNext(next) ?? "/"));
        router.refresh();
        return;
      }
      setFailure(result);
      // Inputs are disabled while pending; focus once they are enabled again.
      const field =
        result.field === "email"
          ? emailRef
          : result.field === "password"
            ? passwordRef
            : null;
      focusAfter.current = field?.current ?? null;
    } catch {
      setFailure({
        status: "uncertain",
        message: "결과를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const emailMessage =
    failure?.field === "email"
      ? failure.message
      : touched.email && email
        ? emailProblem
        : touched.email && touched.password
          ? emailProblem
          : null;
  const passwordMessage =
    failure?.field === "password"
      ? failure.message
      : tooLong
        ? passwordProblem
        : touched.password && touched.email
          ? passwordProblem
          : null;

  return (
    <>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit(event.currentTarget);
        }}
      >
        {failure && !failure.field && (
          <p
            className={styles.formError}
            data-status={failure.status}
            role="alert"
          >
            <Icon name="alert" size={18} strokeWidth={2.1} />
            <span>{failure.message}</span>
          </p>
        )}
        <TextField
          label="이메일"
          name="email"
          type="email"
          icon="mail"
          autoComplete={signup ? "email" : "username"}
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="name@example.com"
          ref={emailRef}
          value={email}
          disabled={pending}
          required
          onChange={(event) => {
            setEmail(event.target.value);
            if (failure) setFailure(null);
          }}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          status={emailMessage ? { tone: "error", text: emailMessage } : null}
        />
        <div style={{ display: "grid", gap: 10 }}>
          <PasswordField
            label="비밀번호"
            name="password"
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder={signup ? "8자 이상" : "비밀번호"}
            ref={passwordRef}
            value={password}
            disabled={pending}
            required
            onChange={(event) => {
              setPassword(event.target.value);
              if (failure) setFailure(null);
            }}
            status={
              passwordMessage
                ? { tone: "error", text: passwordMessage }
                : undefined
            }
          />
          {signup && (
            <Checklist
              items={[{ label: `${PASSWORD_MIN}자 이상`, met: longEnough }]}
            />
          )}
        </div>
        {signup && (
          <p className={styles.note}>
            <Icon name="info" size={16} />
            <span>
              이메일 인증 없이 바로 시작해요. 다른 서비스에서 쓰는 비밀번호는
              피해 주세요. 지금은 메일로 비밀번호를 찾을 수 없어요.
            </span>
          </p>
        )}
        <Button
          type="submit"
          size="l"
          block
          busy={pending}
          busyLabel={signup ? "계정을 만드는 중" : "로그인하는 중"}
        >
          {signup ? "계정 만들기" : "로그인"}
          <Icon name="arrowRight" size={18} strokeWidth={2.2} />
        </Button>
      </form>
      <p className={styles.switch}>
        {signup ? "이미 계정이 있나요? " : "처음 오셨나요? "}
        <Link
          className="link"
          href={
            signup
              ? `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`
              : "/signup"
          }
        >
          {signup ? "로그인" : "1분 만에 가입하기"}
        </Link>
      </p>
    </>
  );
}
