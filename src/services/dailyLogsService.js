import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  documentId,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { subjectsMapToOrderedArray } from '../utils/subjectsMap';
import { FALLBACK_SUBJECT } from '../constants/subjects';

const logDocId = (studentId, date) => studentId + '_' + date;

const cache = new Map();
const cacheKey = (type, ...args) => type + ':' + args.join(':');

function invalidate(studentId, date) {
  cache.delete(cacheKey('log', studentId, date));
  cache.delete(cacheKey('list', studentId));
}

function fromSnap(snap) {
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    studentId: data.studentId,
    date: data.date,
    rawText: data.rawText,
    subjects: subjectsMapToOrderedArray(data.subjects),
    plan: subjectsMapToOrderedArray(data.plan?.subjects),
    planRawText: data.plan?.rawText ?? '',
    comment: data.comment ?? null,
    attendanceRequestedAt: data.attendanceRequestedAt ?? null,
    attendanceConfirmedAt: data.attendanceConfirmedAt ?? null,
    departureTime: data.departureTime ?? null,
    reportSentAt: data.reportSentAt ?? null,
  };
}

export async function getDailyLog(studentId, date) {
  const key = cacheKey('log', studentId, date);
  if (cache.has(key)) return cache.get(key);
  const snap = await getDoc(doc(db, 'dailyLogs', logDocId(studentId, date)));
  const result = fromSnap(snap);
  cache.set(key, result);
  return result;
}

// 학생의 모든 기록을 최신 날짜순으로 반환. 문서 ID가 "studentId_YYYY-MM-DD"라
// prefix 범위 쿼리로 해당 학생 것만 가져온다. documentId()에 range 필터와 orderBy를
// 같이 걸면(둘 다 자동 __name__ 인덱스를 쓸 거라 예상했지만) Firestore가 실제로는
// 복합 인덱스를 요구해서, orderBy는 서버가 아니라 클라이언트에서 정렬한다
// (레코드 수가 적은 개인용 앱이라 정렬 비용은 무시할 만함).
// prefixEnd는 유니코드 사전순으로 prefix로 시작하는 모든 문자열보다 큰 상한값.
export async function listDailyLogs(studentId) {
  const key = cacheKey('list', studentId);
  if (cache.has(key)) return cache.get(key);
  const prefix = studentId + '_';
  const prefixEnd = prefix + String.fromCharCode(0xf8ff);
  const q = query(
    collection(db, 'dailyLogs'),
    where(documentId(), '>=', prefix),
    where(documentId(), '<', prefixEnd),
  );
  const snap = await getDocs(q);
  const result = snap.docs.map(fromSnap).sort((a, b) => b.date.localeCompare(a.date));
  cache.set(key, result);
  return result;
}

// 과목 선택 UI → 학습량 저장. parser 없이 selections에서 직접 subjects map 구성.
// 재저장 시 선생님이 이미 매긴 percent는 과목명 기준으로 보존한다.
// 저장 시각 = 하원 시간(departureTime)으로 함께 기록한다.
export async function saveStudentEntry(studentId, date, selections) {
  invalidate(studentId, date);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  const existing = await getDoc(ref);
  const existingSubjects = existing.exists() ? existing.data().subjects ?? {} : {};

  const rawText = Object.entries(selections)
    .filter(([, text]) => text.trim())
    .map(([subject, text]) => subject === FALLBACK_SUBJECT ? text : `${subject} ${text}`)
    .join('\n');

  const subjectsMap = {};
  for (const [subject, text] of Object.entries(selections)) {
    if (!text.trim()) continue;
    const prior = existingSubjects[subject];
    subjectsMap[subject] = {
      rawText: text,
      ...(subject !== FALLBACK_SUBJECT && {
        percent: typeof prior?.percent === 'number' ? prior.percent : null,
      }),
    };
  }

  await setDoc(
    ref,
    { studentId, date, rawText, subjects: subjectsMap, departureTime: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// 과목 선택 UI → 학습 계획 저장. percent 없음(채점 대상 아님).
export async function saveStudentPlan(studentId, date, selections) {
  invalidate(studentId, date);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));

  const rawText = Object.entries(selections)
    .filter(([, text]) => text.trim())
    .map(([subject, text]) => subject === FALLBACK_SUBJECT ? text : `${subject} ${text}`)
    .join('\n');

  const subjectsMap = {};
  for (const [subject, text] of Object.entries(selections)) {
    if (!text.trim()) continue;
    subjectsMap[subject] = { rawText: text };
  }

  await setDoc(
    ref,
    { studentId, date, plan: { rawText, subjects: subjectsMap }, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// 선생님이 과목별 percent와 코멘트를 저장. percentsBySubject 예: { 국어: 50, 수학: 100 }
// 각 필드만 원자적으로 갱신(배열/문서 전체를 읽고 다시 쓰지 않음). comment가 undefined면
// 건드리지 않고, 빈 문자열/null이면 지운다.
export async function saveTeacherRatings(studentId, date, percentsBySubject, comment) {
  invalidate(studentId, date);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  const updates = { updatedAt: serverTimestamp() };
  for (const [subject, percent] of Object.entries(percentsBySubject)) {
    updates['subjects.' + subject + '.percent'] = percent === '' || percent === null ? null : Number(percent);
  }
  if (comment !== undefined) {
    updates.comment = comment === '' ? null : comment;
  }
  await updateDoc(ref, updates);
}

// 학생이 출석 버튼을 눌렀을 때 호출. attendanceRequestedAt 기록.
export async function requestAttendance(studentId, date) {
  invalidate(studentId, date);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  await setDoc(
    ref,
    {
      studentId,
      date,
      attendanceRequestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// 선생님이 출석을 확인할 때 호출. attendanceConfirmedAt 기록 → Cloud Function이 등원 알림 발송.
export async function confirmAttendance(studentId, date) {
  invalidate(studentId, date);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  await updateDoc(ref, { attendanceConfirmedAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
