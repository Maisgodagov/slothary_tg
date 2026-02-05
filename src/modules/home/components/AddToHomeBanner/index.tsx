import type { ReactNode } from "react";

import { BannerAction, BannerBody, BannerTitle, BannerWrapper } from "./styles";

export interface AddToHomeBannerProps {
  title?: string;
  description?: ReactNode;
  actionLabel?: string;
  onInstall: () => void;
  installing?: boolean;
}

export function AddToHomeBanner({
  title = "Установите Slothary на главный экран",
  description = "Открывайте веб‑приложение быстрее и без поиска бота в чате.",
  actionLabel = "Добавить на экран",
  onInstall,
  installing = false,
}: AddToHomeBannerProps) {
  return (
    <BannerWrapper>
      <BannerBody>
        <BannerTitle>{title}</BannerTitle>
        <div>{description}</div>
      </BannerBody>
      <BannerAction type="button" onClick={onInstall} disabled={installing}>
        {installing ? "Открываем установку..." : actionLabel}
      </BannerAction>
    </BannerWrapper>
  );
}
