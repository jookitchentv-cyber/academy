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

// 계획(plan)만 쓰고 학습량(subjects)은 아직 안 쓴 과목도 점검 화면에 보여야 한다 —
// subjects 배열만 훑으면 그런 과목이 통째로 사라진다. SUBJECTS 순서를 따르는
// 하나의 목록으로 합쳐서 반환한다. (기타는 각 화면에서 별도로 다루므로 제외)
export function mergeSubjectsWithPlan(subjects = [], plan = []) {
  const bySubject = new Map();
  for (const s of subjects) {
    if (s.subject === FALLBACK_SUBJECT) continue;
    bySubject.set(s.subject, { subject: s.subject, percent: s.percent, rawText: s.rawText, planText: undefined });
  }
  for (const p of plan) {
    if (p.subject === FALLBACK_SUBJECT) continue;
    const entry = bySubject.get(p.subject) ?? { subject: p.subject, percent: undefined, rawText: undefined, planText: undefined };
    entry.planText = p.rawText;
    bySubject.set(p.subject, entry);
  }
  return SUBJECTS.filter((name) => bySubject.has(name)).map((name) => bySubject.get(name));
}
