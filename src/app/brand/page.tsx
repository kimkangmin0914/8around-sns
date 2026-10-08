import { Loader, Mark, Wordmark } from "@/components/brand/mark";
import { Icon, type IconName } from "@/components/icons/icon";
import { SeatMark } from "@/components/people/seat-mark";
import { TONES, TONE_LABEL, type Tone } from "@/lib/tone";
import styles from "./brand.module.css";

export const metadata = {
  title: "디자인 노트",
  description: "beside의 이름, 마크, 색, 글자, 목소리, 움직임.",
};

const PAIRS: Record<(typeof TONES)[number], [string, string]> = {
  blue: ["#0061FE", "#FFFFFF"],
  navy: ["#283750", "#B4C8E1"],
  gold: ["#FAD24B", "#684505"],
  zen: ["#3DD3EE", "#055463"],
  sunset: ["#FA551E", "#4E0119"],
  lime: ["#B4DC19", "#175641"],
  crimson: ["#892055", "#FFAFA5"],
  orchid: ["#C8AFF0", "#682760"],
};

const ICONS: IconName[] = [
  "feed",
  "people",
  "person",
  "compose",
  "comment",
  "reply",
  "follow",
  "following",
  "unfollow",
  "link",
  "at",
  "mail",
  "lock",
  "eye",
  "calendar",
  "login",
  "logout",
  "menu",
  "grid",
  "sparkle",
  "alert",
  "info",
  "refresh",
  "external",
];

const SEATS: {
  id: string;
  tone: Tone;
  posts: number;
  seat: "open" | "taken" | "self";
  caption: string;
}[] = [
  {
    id: "seat-a",
    tone: "gold",
    posts: 0,
    seat: "open",
    caption: "글 0 · 빈자리",
  },
  { id: "seat-b", tone: "zen", posts: 3, seat: "open", caption: "글 3" },
  {
    id: "seat-c",
    tone: "navy",
    posts: 6,
    seat: "taken",
    caption: "글 6 · 팔로잉",
  },
  {
    id: "seat-d",
    tone: "sunset",
    posts: 12,
    seat: "self",
    caption: "글 12 · 내 프로필",
  },
];

const VOICE = [
  {
    rule: "한 문장에는 한 가지만.",
    yes: "글을 올렸어요.",
    no: "작성하신 게시글이 성공적으로 등록되었습니다.",
  },
  {
    rule: "해요체로, 느낌표 없이.",
    yes: "다시 만나서 반가워요.",
    no: "환영합니다!! 다시 오셨군요!",
  },
  {
    rule: "실패는 사실대로, 다음 행동과 함께.",
    yes: "저장됐는지 확인하지 못했어요. 쓴 내용은 남겨 두었어요.",
    no: "앗! 알 수 없는 오류가 발생했어요 😢",
  },
  {
    rule: "기능 이름은 평범한 말로.",
    yes: "피드 · 팔로잉 · 답글",
    no: "타임라인 · 내 사람들 · 리플",
  },
  {
    rule: "꾸밈말 대신 필요한 정보.",
    yes: "프로필은 나중에 바꿀 수 없어요.",
    no: "나만의 특별한 공간을 마음껏 꾸며 보세요.",
  },
];

const MOTION = [
  {
    title: "바로 반응해요",
    body: "팔로우는 서버 응답을 기다리지 않고 먼저 바뀌어요. 실패하면 되돌려요.",
  },
  {
    title: "어디서 왔는지 보여줘요",
    body: "새 글은 위에서 내려오고, 새 댓글은 잠시 밝아져요.",
  },
  {
    title: "장식은 조금만",
    body: "메뉴 타일이 사방에서 모이고, 첫 화면에 이름표 커서가 지나가요. 깊이는 떠 있는 것과 장식에만 쓰고, 읽는 글자는 평평하게 둬요.",
  },
  {
    title: "움직임 줄이기를 따라요",
    body: "운영체제에서 움직임 줄이기를 켜면 모든 전환이 바로 끝나요.",
  },
];

export default function BrandPage() {
  return (
    <div className="page">
      <div className="page-wide">
        <section className={`section ${styles.hero}`}>
          <span className="section-eyebrow eyebrow">디자인 노트</span>
          <div className={styles.heroMark}>
            <Mark size={168} variant="tones" />
          </div>
          <h1 className={styles.heroTitle}>
            여덟 칸과
            <br />
            빈자리 하나
          </h1>
          <p className="page-lede">
            가운데 빈칸은 화면을 보는 사람의 자리예요. 이름과 색, 글자, 목소리,
            움직임이 모두 이 생각에서 나왔어요.
          </p>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">이름</span>
          <h2 className={styles.h2}>beside</h2>
          <p className={styles.p}>
            &lsquo;곁에&rsquo;라는 뜻이에요. 가운데 자리 곁에 여덟 칸이 놓인
            마크를 그대로 읽은 이름이에요.
          </p>
          <ul className={styles.nameFacts}>
            <li>
              <b>beside</b>
              <span>곁에, 옆에</span>
            </li>
            <li>
              <b>읽기</b>
              <span>비사이드</span>
            </li>
            <li>
              <b>소문자</b>
              <span>워드마크는 늘 소문자 beside</span>
            </li>
          </ul>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">마크</span>
          <div className={styles.split}>
            <div>
              <h2 className={styles.h2}>Eight beside you</h2>
              <p className={styles.p}>
                3×3 격자에서 가운데를 뺀 여덟 칸으로, 8around에서 왔어요. 모서리
                칸은 각진 모서리가 가운데를 향해요. 가운데 빈칸은 보는 사람의
                자리이고, 가입하면 그 사람의 색으로 채워져요.
              </p>
              <div className={styles.markRow}>
                <span className={styles.markChip}>
                  <Mark size={36} />
                </span>
                <span className={styles.markChip} data-tone="blue">
                  <Mark size={36} />
                </span>
                <span className={styles.markChip}>
                  <Wordmark className={styles.word} />
                </span>
                <span className={styles.markChip} aria-label="로딩 표시">
                  <Loader size={36} label="로딩 표시 예시" />
                </span>
              </div>
            </div>
            <div className={styles.markBig} aria-hidden="true">
              <Mark size={240} variant="tones" />
            </div>
          </div>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">자리 마크</span>
          <h2 className={styles.h2}>사람마다 다른 여덟 칸</h2>
          <p className={styles.p}>
            프로필의 큰 그림은 그 사람의 여덟 칸이에요. 칸 모양은 사람마다
            정해져 있고, 글을 쓸 때마다 한 칸씩 채워져요. 가운데는 보는 사람의
            자리라서, 팔로우하면 내 색으로 채워져요.
          </p>
          <ul className={styles.seats}>
            {SEATS.map((sample) => (
              <li
                key={sample.id}
                className={styles.seatCard}
                data-tone={sample.tone}
              >
                <SeatMark
                  id={sample.id}
                  posts={sample.posts}
                  seat={sample.seat}
                  viewerTone={sample.seat === "taken" ? "orchid" : null}
                  size="112px"
                />
                <span className={styles.seatCaption}>{sample.caption}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">색</span>
          <h2 className={styles.h2}>여덟 쌍의 색</h2>
          <p className={styles.p}>
            색은 배경과 글자가 한 쌍이에요. 사람마다 한 쌍이 정해지고, 아바타와
            프로필, 사람들 목록에서 같은 색으로 보여요. 바탕은 코코넛, 글자는
            그래파이트, 행동은 블루예요.
          </p>
          <ul className={styles.swatches}>
            {TONES.map((tone, index) => (
              <li
                key={tone}
                className={styles.swatch}
                data-tone={tone}
                style={{ ["--i" as string]: index }}
              >
                <span className={styles.swatchName}>{TONE_LABEL[tone]}</span>
                <span className={styles.swatchHex}>
                  {PAIRS[tone][0]}
                  <br />
                  {PAIRS[tone][1]}
                </span>
                <span className={styles.swatchAa} aria-hidden="true">
                  Aa
                </span>
              </li>
            ))}
          </ul>
          <ul className={styles.core}>
            <li>
              <span style={{ background: "#0061FE" }} /> Blue #0061FE
            </li>
            <li>
              <span style={{ background: "#F7F5F2" }} /> Coconut #F7F5F2
            </li>
            <li>
              <span style={{ background: "#1E1919" }} /> Graphite #1E1919
            </li>
          </ul>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">글자</span>
          <div className={styles.typeGrid}>
            <div className={styles.typeCard}>
              <p className={styles.typeMeta}>한글 · 본문과 제목</p>
              <p className={styles.typeKo}>짧은 글, 긴 대화</p>
              <p className={styles.typeName}>Pretendard Variable</p>
              <p className={styles.p}>
                제목은 굵고 좁게. 글이 짧으면 크게, 길면 읽기 좋은 크기로
                보여요.
              </p>
            </div>
            <div className={styles.typeCard}>
              <p className={styles.typeMeta}>숫자 · 라틴 · 사용자 이름</p>
              <p className={`${styles.typeLat} wide`}>@beside 128</p>
              <p className={styles.typeName}>Archivo Expanded</p>
              <p className={styles.p}>
                숫자와 @사용자 이름에 써요. 숫자는 고정폭이라 값이 바뀌어도
                흔들리지 않아요.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">목소리</span>
          <h2 className={styles.h2}>간결하게, 정확하게, 정중하게</h2>
          <ul className={styles.voice}>
            {VOICE.map((item) => (
              <li key={item.rule} className={styles.voiceItem}>
                <p className={styles.voiceRule}>{item.rule}</p>
                <p className={styles.voiceDo}>
                  <span>이렇게</span>
                  {item.yes}
                </p>
                <p className={styles.voiceDont}>
                  <span>이렇게는 말고</span>
                  {item.no}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">아이콘</span>
          <h2 className={styles.h2}>한쪽 모서리만 날카롭게</h2>
          <p className={styles.p}>
            24px 격자, 1.9px 선. 아바타·버튼·토스트처럼 한 모서리만 각지게
            남겨요.
          </p>
          <ul className={styles.icons}>
            {ICONS.map((name) => (
              <li key={name} className={styles.icon}>
                <Icon name={name} size={28} />
                <span>{name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">움직임</span>
          <h2 className={styles.h2}>움직임은 이유가 있을 때만</h2>
          <ol className={styles.motion}>
            {MOTION.map((item, index) => (
              <li key={item.title} className={styles.motionItem}>
                <span className={`${styles.motionNum} num`}>0{index + 1}</span>
                <h3 className={styles.motionTitle}>{item.title}</h3>
                <p className={styles.p}>{item.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
