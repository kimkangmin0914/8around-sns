import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { StatusScreen } from "@/components/ui/status-screen";

export const metadata = { title: "찾을 수 없어요" };

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      tone="gold"
      title="찾는 곳이 곁에 없어요"
      body="주소가 바뀌었거나 없는 사람·글이에요. 철자를 확인하거나 피드에서 다시 찾아보세요."
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
