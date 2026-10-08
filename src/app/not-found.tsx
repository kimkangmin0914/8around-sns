import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { StatusScreen } from "@/components/ui/status-screen";

export const metadata = { title: "페이지를 찾을 수 없어요" };

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      tone="gold"
      title="페이지를 찾을 수 없어요"
      body="주소가 정확한지 확인해 주세요."
      actions={
        <>
          <ButtonLink href="/">
            <Icon name="feed" size={18} /> 피드로 가기
          </ButtonLink>
          <ButtonLink href="/people" variant="secondary">
            사람들 보기
          </ButtonLink>
        </>
      }
    />
  );
}
