"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { useShell } from "@/components/shell/shell-context";

export function ComposeButton({
  children = "새 글 쓰기",
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick" | "children"> & {
  children?: string;
}) {
  const { openCompose } = useShell();
  return (
    <Button {...props} onClick={openCompose} aria-keyshortcuts="n">
      <Icon name="compose" size={18} />
      {children}
    </Button>
  );
}
