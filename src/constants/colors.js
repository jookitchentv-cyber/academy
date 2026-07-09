import { SUBJECTS, FALLBACK_SUBJECT } from './subjects';

// dataviz 스킬의 검증된 카테고리 팔레트(8색, CVD-safe 고정 순서). 국어가 첫 번째라
// 스펙 예시대로 파랑이 되고, 나머지 과목은 팔레트의 고정 순서를 그대로 따른다
// (임의로 특정 색을 골라 순서를 건너뛰면 인접 색상 간 CVD 안전거리가 깨짐).
const PALETTE = [
  '#2a78d6', // 1 blue
  '#1baf7a', // 2 aqua
  '#eda100', // 3 yellow
  '#008300', // 4 green
  '#4a3aa7', // 5 violet
  '#e34948', // 6 red
  '#e87ba4', // 7 magenta
  '#eb6834', // 8 orange
];

const MUTED = '#e1e0d9'; // 미평가 과목 표시용 (gridline hairline 톤)
const FALLBACK_COLOR = '#898781'; // '기타' 버킷은 그래프에 나타나지 않지만 안전값으로 유지

export function getSubjectColor(subject) {
  if (subject === FALLBACK_SUBJECT) return FALLBACK_COLOR;
  const idx = SUBJECTS.indexOf(subject);
  if (idx === -1) return FALLBACK_COLOR;
  // SUBJECTS가 팔레트(8색)를 넘어서면 새 하시 색을 만들지 않고 마지막 슬롯을 재사용한다 —
  // 검증되지 않은 색보다는 색이 겹치는 편이 CVD 안전성 측면에서 낫다.
  return PALETTE[Math.min(idx, PALETTE.length - 1)];
}

export const UNRATED_COLOR = MUTED;
