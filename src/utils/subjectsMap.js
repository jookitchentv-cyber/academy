import { SUBJECTS, FALLBACK_SUBJECT } from '../constants/subjects';

// Firestore에는 subjects를 과목명 key의 map으로 저장(배열이면 선생님의 percent
// 저장이 배열 전체 read-modify-write가 되어 동시 수정 시 값이 날아갈 수 있음).
// 화면 렌더링에는 SUBJECTS 순서를 따르는 배열이 필요하므로 상호 변환한다.

export function subjectsArrayToMap(subjectsArray) {
  const map = {};
  for (const s of subjectsArray) {
    map[s.subject] =
      s.subject === FALLBACK_SUBJECT
        ? { rawText: s.rawText }
        : { rawText: s.rawText, percent: typeof s.percent === 'number' ? s.percent : null };
  }
  return map;
}

export function subjectsMapToOrderedArray(map = {}) {
  const order = [...SUBJECTS, FALLBACK_SUBJECT];
  return order
    .filter((subject) => map[subject])
    .map((subject) => ({ subject, ...map[subject] }));
}

// "금일 학습 계획"은 채점 대상이 아니라 참고용 텍스트일 뿐이라 percent 개념이 없다.
export function planSubjectsToMap(subjectsArray) {
  const map = {};
  for (const s of subjectsArray) {
    map[s.subject] = { rawText: s.rawText };
  }
  return map;
}
