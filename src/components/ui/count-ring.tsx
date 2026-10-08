import styles from "./count-ring.module.css";

/** Character budget ring: quiet until the last 20%, then shows what's left. */
export function CountRing({
  count,
  limit,
  id,
}: {
  count: number;
  limit: number;
  id?: string;
}) {
  const ratio = Math.min(count / limit, 1);
  const left = limit - count;
  const state = left < 0 ? "over" : left <= limit * 0.1 ? "near" : "ok";
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className={styles.ring} data-state={state} id={id}>
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <circle cx="12" cy="12" r={radius} className={styles.track} />
        <circle
          cx="12"
          cy="12"
          r={radius}
          className={styles.value}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <span className={styles.left} aria-hidden={left > limit * 0.2}>
        {left <= limit * 0.2 ? left : ""}
      </span>
      <span className="sr-only">
        {count}자 입력, {limit}자까지 쓸 수 있어요.
      </span>
    </span>
  );
}
