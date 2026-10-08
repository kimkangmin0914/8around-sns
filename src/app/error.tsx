"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { StatusScreen } from "@/components/ui/status-screen";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const router = useRouter();
  // reset() alone re-renders the cached server payload; fetch it again first.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });
  return (
    <StatusScreen
      code="Error"
      tone="crimson"
      title="화면을 표시하지 못했어요"
      body="다시 시도해 주세요. 쓰던 글은 이 브라우저에 남아 있어요."
      actions={
        <>
          <Button onClick={retry}>
            <Icon name="refresh" size={18} /> 다시 시도
          </Button>
          <ButtonLink href="/" variant="secondary">
            피드로 가기
          </ButtonLink>
        </>
      }
    />
  );
}
