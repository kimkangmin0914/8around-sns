import { Loader, Mark, Wordmark } from "@/components/brand/mark";
import { Icon, type IconName } from "@/components/icons/icon";
import { TONES, TONE_LABEL } from "@/lib/tone";
import styles from "./brand.module.css";

export const metadata = {
  title: "디자인 노트",
  description: "beside를 이루는 이름, 마크, 색, 글자, 목소리, 움직임의 규칙.",
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

const VOICE = [
  {
    rule: "한 문장에 하나만. 군더더기는 뽑아요.",
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
    rule: "B면 비유는 아껴서. 기능 이름은 늘 평범하게.",
    yes: "오늘의 B면 · 팔로잉 · 답글",
    no: "B면 트랙에 리플 남기기",
  },
];

const MOTION = [
  {
    title: "바로 반응해요",
    body: "누르는 순간 버튼이 눌리고, 팔로우는 서버를 기다리지 않고 먼저 바뀌어요. 틀리면 조용히 되돌려요.",
  },
  {
    title: "어디서 왔는지 보여줘요",
    body: "새 글은 위에서 떨어지고, 새 댓글은 잠시 빛나요. 화면이 바뀐 이유를 눈으로 따라갈 수 있어요.",
  },
  {
    title: "윙크 정도의 장난",
    body: "메뉴 타일이 사방에서 모여들고 커서가 헤드라인 주변을 떠다녀요. 색종이를 뿌리지는 않아요.",
  },
  {
    title: "줄이길 원하면 줄여요",
    body: "운영체제에서 움직임 줄이기를 켜면 모든 전환이 즉시 끝나요. 정보는 하나도 사라지지 않아요.",
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
            여덟 칸이 둘러싼
            <br />
            빈자리 하나
          </h1>
          <p className="page-lede">
            beside의 모든 화면은 하나의 생각에서 출발해요. 가운데는 비워 두고,
            그 둘레에 곁에 둔 사람들의 이야기를 놓는다. 이 페이지는 그 생각이
            이름과 색, 글자와 목소리, 움직임으로 옮겨진 규칙이에요.
          </p>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">이름</span>
          <h2 className={styles.h2}>beside, 비사이드</h2>
          <p className={styles.p}>
            곁(beside)이라는 뜻과, 소리 내 읽으면 들리는 B면(B-side)을 함께
            담았어요. 레코드의 B면은 덜 다듬어졌지만 더 솔직한 곡이 실리는
            자리예요. 잘 보이려는 앞면은 다른 곳에 두고, 여기서는 곁에 둔
            사람들과 꾸밈없는 한 줄을 나눠요.
          </p>
          <ul className={styles.nameFacts}>
            <li>
              <b>beside</b>
              <span>곁에, 옆에. 둘레에 놓인 여덟 칸</span>
            </li>
            <li>
              <b>B-side</b>
              <span>보여주기용 앞면이 아닌 뒷면, 꾸밈없는 나</span>
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
                3×3 격자에서 가운데를 뺀 여덟 칸. 8around에서 온 모양이에요.
                모서리 칸은 날카로운 모서리를 가운데로 향하고, 가운데 빈칸은
                지금 화면을 보는 당신의 자리예요. 가입할 때 그 빈칸이 당신의
                색으로 채워져요.
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
          <span className="section-eyebrow eyebrow">색</span>
          <h2 className={styles.h2}>여덟 쌍의 색</h2>
          <p className={styles.p}>
            모든 색은 배경과 글자가 짝을 이뤄요. 한 사람에게 한 쌍이 정해지고,
            아바타·프로필·사람들 벽에서 같은 색으로 나타나요. 기본 바탕은
            코코넛, 글자는 그래파이트, 행동은 블루예요.
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
              <p className={styles.typeKo}>가나다 곁에</p>
              <p className={styles.typeName}>Pretendard Variable</p>
              <p className={styles.p}>
                제목은 굵게, 자간은 좁게. 짧은 글은 크게 보여주고 긴 글은 읽기
                좋은 크기를 지켜요.
              </p>
            </div>
            <div className={styles.typeCard}>
              <p className={styles.typeMeta}>숫자 · 라틴 · 사용자 이름</p>
              <p className={`${styles.typeLat} wide`}>@beside 128</p>
              <p className={styles.typeName}>Archivo Expanded</p>
              <p className={styles.p}>
                넓은 그로테스크로 숫자와 @이름을 또렷하게. 팔로워 수와 시간은
                고정폭 숫자로 흔들리지 않아요.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <span className="section-eyebrow eyebrow">목소리</span>
          <h2 className={styles.h2}>짧게, 사실대로, 다정하게</h2>
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
            24px 격자, 1.9px 선. 말풍선의 꼬리처럼 한 모서리만 각지게 남겨
            아바타·버튼·토스트와 같은 언어를 써요.
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
