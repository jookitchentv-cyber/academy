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
import { parseSubjects } from '../utils/parseSubjects';
import {
  subjectsArrayToMap,
  subjectsMapToOrderedArray,
  planSubjectsToMap,
} from '../utils/subjectsMap';
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
    attendanceConfirmed: data.attendanceConfirmed === true,
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

// 학생이 오늘 "실제로 한" 학습량을 저장(금일 학습량). 같은 날 재저장 시 이미 매겨진
// percent는 과목명 기준으로 보존한다(선생님이 먼저 채점했는데 학생이 다시 저장해도
// 안 날아가게). merge:true로 써서 같은 문서의 plan/comment 필드를 건드리지 않는다.
export async function saveStudentEntry(studentId, date, rawText) {
  invalidate(studentId, date);
  const parsed = parseSubjects(rawText);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  const existing = await getDoc(ref);
  const existingSubjects = existing.exists() ? existing.data().subjects ?? {} : {};

  const merged = parsed.map((s) => {
    if (s.subject === FALLBACK_SUBJECT) return s;
    const prior = existingSubjects[s.subject];
    return { ...s, percent: typeof prior?.percent === 'number' ? prior.percent : null };
  });

  await setDoc(
    ref,
    {
      studentId,
      date,
      rawText,
      subjects: subjectsArrayToMap(merged),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// 학생이 오늘 "계획한" 학습 내용을 저장(금일 학습 계획). 학습량과는 별개 데이터라
// plan 필드 아래에 따로 저장하고, 채점 대상이 아니므로 percent는 두지 않는다.
// merge:true로 써서 같은 문서의 subjects/comment 필드를 건드리지 않는다.
export async function saveStudentPlan(studentId, date, rawText) {
  invalidate(studentId, date);
  const parsed = parseSubjects(rawText);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));

  await setDoc(
    ref,
    {
      studentId,
      date,
      plan: {
        rawText,
        subjects: planSubjectsToMap(parsed),
      },
      updatedAt: serverTimestamp(),
    },
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

// 선생님이 그 날짜의 "출석확인"(학생이 쓴 학습 계획 확인)을 완료 처리.
// 학생이 계획을 다시 저장해도 이 필드는 건드리지 않는다 — 한 번 확인되면
// 계획을 다시 쓴다고 자동으로 대기 상태로 돌아가지 않는다(단순한 설계).
export async function confirmAttendance(studentId, date) {
  invalidate(studentId, date);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  await updateDoc(ref, { attendanceConfirmed: true, updatedAt: serverTimestamp() });
}
