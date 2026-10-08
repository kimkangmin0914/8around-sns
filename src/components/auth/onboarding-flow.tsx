"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { checkUsername, completeProfile } from "@/server/actions/auth";
import {
  BIO_LIMIT,
  NAME_LIMIT,
  codePointLength,
  normalizeText,
  usernameProblem,
  validateProfile,
} from "@/lib/validation";
import { initialOf, toneFor } from "@/lib/tone";
import type { Failure } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { TextArea, TextField, type FieldStatus } from "@/components/ui/field";
import { Icon } from "@/components/icons/icon";
import { Loader } from "@/components/brand/mark";
import { useToast } from "@/components/ui/toast";
import { AuthArt, AuthShell, Stepper } from "@/components/auth/auth-shell";
import styles from "./auth.module.css";

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "done"; available: boolean | null; message: string };

type Checked = { username: string; available: boolean | null; message: string };

export function OnboardingFlow({
  userId,
  suggestion,
}: {
  userId: string;
  suggestion: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState(suggestion);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [checked, setChecked] = useState<Checked | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const busy = useRef(false);
  const tone = toneFor(userId);

  const formatProblem = username ? usernameProblem(username) : null;

  // Debounced availability check; an answer only counts for the name it was asked about.
  useEffect(() => {
    if (!username || formatProblem) return;
    let live = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkUsername(username);
        if (live) setChecked({ username, ...result });
      } catch {
        if (live)
          setChecked({
            username,
            available: null,
            message: "사용할 수 있는지 확인하지 못했어요.",
          });
      }
    }, 380);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [username, formatProblem]);

  const availability: Availability =
    !username || formatProblem
      ? { state: "idle" }
      : checked?.username === username
        ? {
            state: "done",
            available: checked.available,
            message: checked.message,
          }
        : { state: "checking" };

  const nameLength = codePointLength(normalizeText(name));
  const bioLength = codePointLength(normalizeText(bio));

  const usernameStatus: FieldStatus =
    failure?.field === "username"
      ? { tone: "error", text: failure.message }
      : formatProblem
        ? { tone: "error", text: formatProblem }
        : availability.state === "checking"
          ? {
              tone: "hint",
              text: (
                <span className={styles.checking}>
                  <Loader size={14} label="확인 중" /> 확인하는 중
                </span>
              ),
            }
          : availability.state === "done"
            ? {
                tone:
                  availability.available === true
                    ? "ok"
                    : availability.available === false
                      ? "error"
                      : "hint",
                text: availability.message,
              }
            : {
                tone: "hint",
                text: "영문 소문자·숫자·밑줄(_) 3~20자. 프로필 주소(/u/이름)에 쓰여요.",
              };

  async function submit(form: HTMLFormElement) {
    if (busy.current) return;
    const checked = validateProfile({ username, display_name: name, bio });
    if (!checked.ok) {
      setFailure({ status: "input", message: checked.message });
      return;
    }
    if (availability.state === "done" && availability.available === false) {
      setFailure({
        status: "input",
        message: availability.message,
        field: "username",
      });
      return;
    }
    busy.current = true;
    setPending(true);
    setFailure(null);
    try {
      const result = await completeProfile(userId, new FormData(form));
      if (result.status === "success") {
        toast({ tone: "success", message: result.message });
        router.replace("/?welcome=1");
        router.refresh();
        return;
      }
      setFailure(result);
    } catch {
      setFailure({
        status: "uncertain",
        message: "저장됐는지 확인하지 못했어요. 새로고침해서 확인해 주세요.",
      });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const preview = (
    <span className={styles.centerYou} data-tone={tone} key={tone}>
      <span className={styles.previewStack}>
        <span className={styles.previewInitial}>
          {name.trim() ? initialOf(name) : "?"}
        </span>
        <span className={styles.previewName}>{name.trim() || "이름"}</span>
        <span className={styles.previewHandle}>@{username || "username"}</span>
      </span>
    </span>
  );

  return (
    <AuthShell
      art={<AuthArt center={preview} />}
      stepper={<Stepper step={2} />}
      eyebrow="프로필"
      title="어떻게 불러드릴까요?"
      lede="프로필은 모두에게 보이고, 나중에 바꿀 수 없어요."
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit(event.currentTarget);
        }}
      >
        {failure && failure.field !== "username" && (
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
          label="사용자 이름"
          name="username"
          icon="at"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          value={username}
          disabled={pending}
          required
          valid={
            availability.state === "done" && availability.available === true
          }
          onChange={(event) => {
            setUsername(event.target.value.toLowerCase().replace(/\s/g, ""));
            if (failure) setFailure(null);
          }}
          status={usernameStatus}
        />
        <TextField
          label="이름"
          name="display_name"
          icon="person"
          autoComplete="nickname"
          placeholder="다른 사람에게 보일 이름"
          value={name}
          disabled={pending}
          required
          onChange={(event) => {
            setName(event.target.value);
            if (failure) setFailure(null);
          }}
          trailing={
            <span
              className={styles.counter}
              data-over={nameLength > NAME_LIMIT || undefined}
            >
              {nameLength}/{NAME_LIMIT}
            </span>
          }
          status={
            nameLength > NAME_LIMIT
              ? { tone: "error", text: `${NAME_LIMIT}자 이내로 줄여 주세요.` }
              : null
          }
        />
        <TextArea
          label="소개 (선택)"
          name="bio"
          placeholder="좋아하는 것, 쓰고 싶은 이야기"
          value={bio}
          rows={3}
          disabled={pending}
          onChange={(event) => {
            setBio(event.target.value);
            if (failure) setFailure(null);
          }}
          status={
            bioLength > BIO_LIMIT
              ? { tone: "error", text: `${BIO_LIMIT}자 이내로 줄여 주세요.` }
              : { tone: "hint", text: `${bioLength}/${BIO_LIMIT}자` }
          }
        />
        <Button
          type="submit"
          size="l"
          block
          busy={pending}
          busyLabel="프로필을 만드는 중"
          disabled={
            !username ||
            Boolean(formatProblem) ||
            !nameLength ||
            nameLength > NAME_LIMIT ||
            bioLength > BIO_LIMIT
          }
        >
          시작하기
          <Icon name="arrowRight" size={18} strokeWidth={2.2} />
        </Button>
      </form>
    </AuthShell>
  );
}
