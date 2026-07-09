import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  documentId,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { parseSubjects } from '../utils/parseSubjects';
import { subjectsArrayToMap, subjectsMapToOrderedArray } from '../utils/subjectsMap';
import { FALLBACK_SUBJECT } from '../constants/subjects';

const logDocId = (studentId, date) => studentId + '_' + date;

function fromSnap(snap) {
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    studentId: data.studentId,
    date: data.date,
    rawText: data.rawText,
    subjects: subjectsMapToOrderedArray(data.subjects),
  };
}

export async function getDailyLog(studentId, date) {
  const snap = await getDoc(doc(db, 'dailyLogs', logDocId(studentId, date)));
  return fromSnap(snap);
}

// 학생의 모든 기록을 최신 날짜순으로 반환. 문서 ID가 "studentId_YYYY-MM-DD"라
// 사전순 정렬이 곧 날짜순이라 복합 인덱스 없이 documentId() 범위 쿼리로 처리한다.
// prefixEnd는 유니코드 사전순으로 prefix로 시작하는 모든 문자열보다 큰 상한값.
export async function listDailyLogs(studentId) {
  const prefix = studentId + '_';
  const prefixEnd = prefix + String.fromCharCode(0xf8ff);
  const q = query(
    collection(db, 'dailyLogs'),
    where(documentId(), '>=', prefix),
    where(documentId(), '<', prefixEnd),
    orderBy(documentId(), 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(fromSnap);
}

// 학생이 오늘의 서술형 텍스트를 저장. 같은 날 재저장 시 이미 매겨진 percent는
// 과목명 기준으로 보존한다(선생님이 먼저 채점했는데 학생이 다시 저장해도 안 날아가게).
export async function saveStudentEntry(studentId, date, rawText) {
  const parsed = parseSubjects(rawText);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  const existing = await getDoc(ref);
  const existingSubjects = existing.exists() ? existing.data().subjects ?? {} : {};

  const merged = parsed.map((s) => {
    if (s.subject === FALLBACK_SUBJECT) return s;
    const prior = existingSubjects[s.subject];
    return { ...s, percent: typeof prior?.percent === 'number' ? prior.percent : null };
  });

  await setDoc(ref, {
    studentId,
    date,
    rawText,
    subjects: subjectsArrayToMap(merged),
    updatedAt: serverTimestamp(),
  });
}

// 선생님이 과목별 percent를 저장. percentsBySubject 예: { 국어: 50, 수학: 100 }
// 각 과목 필드만 원자적으로 갱신(배열 전체를 읽고 다시 쓰지 않음).
export async function saveTeacherRatings(studentId, date, percentsBySubject) {
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  const updates = { updatedAt: serverTimestamp() };
  for (const [subject, percent] of Object.entries(percentsBySubject)) {
    updates['subjects.' + subject + '.percent'] = percent === '' || percent === null ? null : Number(percent);
  }
  await updateDoc(ref, updates);
}
