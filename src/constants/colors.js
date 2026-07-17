import { SUBJECTS, FALLBACK_SUBJECT } from './subjects';

// 과목 순서(국어~한문) 대응 10색. 기타 fallback은 아래 FALLBACK_COLOR 별도 유지.
const PALETTE = [
  '#e53e3e', // 1 빨강   — 국어
  '#f5a623', // 2 노랑   — 수학
  '#27ae60', // 3 초록   — 영어
  '#2a78d6', // 4 파랑   — 과학
  '#e8622a', // 5 주황   — 사회
  '#2c3e8c', // 6 남색   — 역사
  '#7c3aed', // 7 보라   — 도덕
  '#e87ba4', // 8 분홍   — 일본어
  '#2d3748', // 9 연한검정 — 중국어
  '#8b5e3c', // 10 나무색  — 한문
];

const MUTED = '#e1e0d9'; // 미평가 과목 표시용 (gridline hairline 톤)
const FALLBACK_COLOR = '#898781'; // '기타' 버킷은 그래프에 나타나지 않지만 안전값으로 유지

export function getSubjectColor(subject) {
  if (subject === FALLBACK_SUBJECT) return FALLBACK_COLOR;
  const idx = SUBJECTS.indexOf(subject);
  if (idx === -1) return FALLBACK_COLOR;
  // SUBJECTS가 팔레트(8색)를 넘어서면 새 하시 색을 만들지 않고 마지막 슬롯을 재사용한다 —
  // 검증되지 않은 색보다는 색이 겹치는 편이 CVD 안전성 측면에서 낫다.
  return PALETTE[idx % PALETTE.length];
}

export const UNRATED_COLOR = MUTED;
