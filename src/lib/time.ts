const TIME_ZONE = "Asia/Seoul";

const fullFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

const dayFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  month: "long",
  day: "numeric",
});

const yearDayFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
});

const monthFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "long",
});

const yearOf = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric" })
    .format(date)
    .trim();

/** "방금", "3분 전", "5시간 전", "어제", "9월 18일", "2025년 9월 18일" */
export function relativeTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (!Number.isFinite(seconds)) return "";
  if (seconds < 45) return "방금";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.round(hours / 24);
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return yearOf(date) === yearOf(now)
    ? dayFormat.format(date)
    : yearDayFormat.format(date);
}

export const fullTime = (iso: string) => fullFormat.format(new Date(iso));
export const joinedMonth = (iso: string) => monthFormat.format(new Date(iso));
