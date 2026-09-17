"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function AccountMenu() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const result = await signOut();
            if (result.status === "success") {
              router.replace("/");
              router.refresh();
            } else setError(result.message);
          } catch {
            setError(
              "로그아웃 결과를 확인하지 못했습니다. 다시 확인해 주세요.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "로그아웃 중…" : "로그아웃"}
      </Button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
