"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import styles from "./toast.module.css";

type Toast = {
  id: number;
  tone: "success" | "error" | "info";
  message: string;
  action?: { label: string; href: string };
  leaving?: boolean;
};

type ToastInput = Omit<Toast, "id" | "leaving">;

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export const useToast = () => useContext(ToastContext);

const ICONS: Record<Toast["tone"], IconName> = {
  success: "check",
  error: "alert",
  info: "info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) =>
      list.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast,
      ),
    );
    window.setTimeout(
      () => setToasts((list) => list.filter((toast) => toast.id !== id)),
      220,
    );
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.action ? 6000 : 3600);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={styles.toast}
            data-tone={toast.tone}
            data-leaving={toast.leaving || undefined}
          >
            <span className={styles.icon}>
              <Icon name={ICONS[toast.tone]} size={16} strokeWidth={2.4} />
            </span>
            <span className={styles.message}>{toast.message}</span>
            {toast.action && (
              <Link
                href={toast.action.href}
                className={styles.action}
                onClick={() => dismiss(toast.id)}
              >
                {toast.action.label}
              </Link>
            )}
            <button
              type="button"
              className={styles.close}
              onClick={() => dismiss(toast.id)}
              aria-label="알림 닫기"
            >
              <Icon name="close" size={14} strokeWidth={2.2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
