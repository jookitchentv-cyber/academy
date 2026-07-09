import { SUBJECTS, FALLBACK_SUBJECT } from '../constants/subjects';

// 과목명 뒤에 흔히 붙는 조사 + 구분 문자를 함께 제거한다.
const PARTICLES = ['은', '는', '이', '가', '을', '를', '도', '만'];
const PARTICLE_RE = new RegExp(`^(${PARTICLES.join('|')})?[\\s,:\\-]*`);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 긴 키워드를 먼저 매칭해 짧은 키워드가 부분 문자열로 먼저 잡히는 걸 방지.
const ORDERED_SUBJECTS = [...SUBJECTS].sort((a, b) => b.length - a.length);
const KEYWORD_RE = new RegExp(`(${ORDERED_SUBJECTS.map(escapeRe).join('|')})`, 'g');

/**
 * 학생이 입력한 자유 서술 텍스트를 과목 키워드 등장 위치 기준으로 문단 나누기 한다.
 * 텍스트 분석/수치 추출 없이 순수 정규식 분리만 수행 — 완료도 평가는 선생님이 직접 함.
 */
export function parseSubjects(rawText) {
  const text = (rawText ?? '').trim();
  if (!text) return [];

  const matches = [...text.matchAll(KEYWORD_RE)];
  if (matches.length === 0) {
    return [{ subject: FALLBACK_SUBJECT, rawText: text, percent: undefined }];
  }

  const segments = [];
  if (matches[0].index > 0) {
    segments.push({ subject: FALLBACK_SUBJECT, text: text.slice(0, matches[0].index) });
  }
  matches.forEach((m, i) => {
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    segments.push({ subject: m[1], text: text.slice(m.index, end) });
  });

  const order = [];
  const bucket = new Map();
  for (const seg of segments) {
    const isKnown = seg.subject !== FALLBACK_SUBJECT;
    let body = seg.text;
    if (isKnown) {
      body = body.slice(seg.subject.length).replace(PARTICLE_RE, '');
    }
    body = body.trim();
    if (!bucket.has(seg.subject)) {
      bucket.set(seg.subject, []);
      order.push(seg.subject);
    }
    if (body) bucket.get(seg.subject).push(body);
  }

  return order.map((subject) => ({
    subject,
    rawText: bucket.get(subject).join(' '),
    percent: subject === FALLBACK_SUBJECT ? undefined : null,
  }));
}
