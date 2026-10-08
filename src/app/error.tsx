"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { StatusScreen } from "@/components/ui/status-screen";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <StatusScreen
      code="Oops"
      tone="crimson"
      title="잠시 연결이 끊겼어요"
      body="화면을 그리는 중에 문제가 생겼어요. 다시 시도하면 대부분 해결돼요. 쓰던 글은 이 브라우저에 남아 있어요."
      actions={
        <>
          <Button onClick={reset}>
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
