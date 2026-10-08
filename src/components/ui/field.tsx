"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import styles from "./field.module.css";

export type FieldStatus =
  { tone: "hint" | "error" | "ok"; text: ReactNode } | null | undefined;

export function FieldMessage({
  id,
  status,
}: {
  id: string;
  status: FieldStatus;
}) {
  if (!status) return <span id={id} hidden />;
  const icon: IconName | null =
    status.tone === "error" ? "alert" : status.tone === "ok" ? "check" : null;
  return (
    <p
      id={id}
      className={styles[status.tone]}
      role={status.tone === "error" ? "alert" : undefined}
    >
      {icon && <Icon name={icon} size={15} strokeWidth={2.2} />}
      <span>{status.text}</span>
    </p>
  );
}

export function TextField({
  label,
  optional,
  icon,
  status,
  trailing,
  valid,
  ...input
}: {
  label: string;
  optional?: boolean;
  icon?: IconName;
  status?: FieldStatus;
  trailing?: ReactNode;
  valid?: boolean;
} & ComponentProps<"input">) {
  const generated = useId();
  const id = input.id ?? generated;
  const messageId = `${id}-message`;
  const invalid = status?.tone === "error";
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
          {optional && <span className={styles.optional}> · 선택</span>}
        </label>
      </div>
      <div
        className={styles.control}
        data-invalid={invalid || undefined}
        data-valid={(valid && !invalid) || undefined}
      >
        {icon && (
          <span className={styles.lead}>
            <Icon name={icon} size={19} />
          </span>
        )}
        <input
          {...input}
          id={id}
          className={styles.input}
          aria-invalid={invalid || undefined}
          aria-describedby={messageId}
        />
        {trailing && <span className={styles.trail}>{trailing}</span>}
      </div>
      <FieldMessage id={messageId} status={status} />
    </div>
  );
}

export function PasswordField({
  status,
  ...props
}: { status?: FieldStatus } & Omit<
  ComponentProps<typeof TextField>,
  "type" | "trailing"
>) {
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  const capsStatus: FieldStatus = caps
    ? { tone: "hint", text: "Caps Lock이 켜져 있어요." }
    : null;
  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      icon="lock"
      status={status ?? capsStatus}
      onKeyUp={(event) => setCaps(event.getModifierState?.("CapsLock"))}
      onBlur={(event) => {
        setCaps(false);
        props.onBlur?.(event);
      }}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
          aria-pressed={visible}
        >
          <Icon name={visible ? "eyeOff" : "eye"} size={19} />
        </button>
      }
    />
  );
}

export function TextArea({
  label,
  hideLabel,
  status,
  footer,
  ...area
}: {
  label: string;
  hideLabel?: boolean;
  status?: FieldStatus;
  footer?: ReactNode;
} & ComponentProps<"textarea">) {
  const generated = useId();
  const id = area.id ?? generated;
  const messageId = `${id}-message`;
  const invalid = status?.tone === "error";
  return (
    <div className={styles.field}>
      <label className={hideLabel ? "sr-only" : styles.label} htmlFor={id}>
        {label}
      </label>
      <div
        className={styles.control}
        data-invalid={invalid || undefined}
        style={{ display: "block" }}
      >
        <textarea
          {...area}
          id={id}
          className={styles.textarea}
          aria-invalid={invalid || undefined}
          aria-describedby={messageId}
        />
        {footer}
      </div>
      <FieldMessage id={messageId} status={status} />
    </div>
  );
}

export function Checklist({
  items,
}: {
  items: { label: string; met: boolean }[];
}) {
  return (
    <ul className={styles.checklist} aria-label="조건">
      {items.map((item) => (
        <li key={item.label} className={styles.check} data-met={item.met}>
          <Icon
            name={item.met ? "check" : "info"}
            size={14}
            strokeWidth={2.2}
          />
          {item.label}
          <span className="sr-only">{item.met ? " 충족" : " 미충족"}</span>
        </li>
      ))}
    </ul>
  );
}
