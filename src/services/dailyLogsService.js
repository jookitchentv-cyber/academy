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
  arrayUnion,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { subjectsMapToOrderedArray } from '../utils/subjectsMap';
import { getAttendanceStatus } from '../utils/attendance';
import { FALLBACK_SUBJECT } from '../constants/subjects';

const logDocId = (studentId, date) => studentId + '_' + date;

const cache = new Map();
const CACHE_TTL = 60_000; // 60초
const cacheKey = (type, ...args) => type + ':' + args.join(':');

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return undefined; }
  return entry.value;
}
function cacheSet(key, value) { cache.set(key, { value, ts: Date.now() }); }

function invalidate(studentId, date) {
  cache.delete(cacheKey('log', studentId, date));
  cache.delete(cacheKey('index', studentId));
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

// students/{studentId} 문서에서 logDates + logAttendance를 한 번에 읽어 캐싱.
// logDates 필드가 없는 기존 학생은 구 prefix 쿼리로 1회 마이그레이션.
async function getStudentIndex(studentId) {
  const key = cacheKey('index', studentId);
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const studentSnap = await getDoc(doc(db, 'students', studentId));
  const data = studentSnap.exists() ? studentSnap.data() : {};

  let dates;
  let rawAttendance;

  if (Array.isArray(data.logDates)) {
    dates = data.logDates;
    rawAttendance = data.logAttendance ?? {};
  } else {
    // 기존 학생 1회 마이그레이션
    const prefix = studentId + '_';
    const prefixEnd = prefix + String.fromCharCode(0xf8ff);
    const q = query(
      collection(db, 'dailyLogs'),
      where(documentId(), '>=', prefix),
      where(documentId(), '<', prefixEnd),
    );
    const snap = await getDocs(q);
    dates = [];
    rawAttendance = {};
    for (const d of snap.docs) {
      const dd = d.data();
      if (!dd.date) continue;
      dates.push(dd.date);
      const status = getAttendanceStatus({
        attendanceRequestedAt: dd.attendanceRequestedAt,
        attendanceConfirmedAt: dd.attendanceConfirmedAt,
      });
      if (status !== 'none') rawAttendance[dd.date] = status;
    }
    if (studentSnap.exists()) {
      updateDoc(doc(db, 'students', studentId), {
        logDates: dates,
        logAttendance: rawAttendance,
      }).catch(() => {});
    }
  }

  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a)).map((date) => ({ date }));
  const attendanceMap = new Map(Object.entries(rawAttendance));
  const result = { dates: sortedDates, attendanceMap };
  cacheSet(key, result);
  return result;
}

// 날짜 목록 반환 (네비게이션·모달용)
export async function listDailyLogs(studentId) {
  return (await getStudentIndex(studentId)).dates;
}

// 출결 상태 Map<date, 'pending'|'confirmed'> 반환 (캘린더용)
export async function getAttendanceMap(studentId) {
  return (await getStudentIndex(studentId)).attendanceMap;
}

export async function getDailyLog(studentId, date) {
  const snap = await getDoc(doc(db, 'dailyLogs', logDocId(studentId, date)));
  return fromSnap(snap);
}

export function subscribeDailyLog(studentId, date, onUpdate, onError) {
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  return onSnapshot(ref, (snap) => onUpdate(fromSnap(snap)), onError);
}

export function subscribeTodayAttendance(studentId, date, onUpdate) {
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) { onUpdate('none'); return; }
    const d = snap.data();
    onUpdate(getAttendanceStatus({
      attendanceRequestedAt: d.attendanceRequestedAt,
      attendanceConfirmedAt: d.attendanceConfirmedAt,
    }));
  });
}

// 날짜·출결 인덱스 업데이트
async function updateStudentIndex(studentId, date, attendanceStatus = null) {
  const updates = { logDates: arrayUnion(date) };
  if (attendanceStatus) updates[`logAttendance.${date}`] = attendanceStatus;
  await updateDoc(doc(db, 'students', studentId), updates);
  cache.delete(cacheKey('index', studentId));
}

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
    { mergeFields: ['studentId', 'date', 'rawText', 'subjects', 'departureTime', 'updatedAt'] },
  );
  await updateStudentIndex(studentId, date);
}

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
    { mergeFields: ['studentId', 'date', 'plan', 'updatedAt'] },
  );
  await updateStudentIndex(studentId, date);
}

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
  await updateStudentIndex(studentId, date, 'pending');
}

export async function confirmAttendance(studentId, date) {
  invalidate(studentId, date);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  await updateDoc(ref, { attendanceConfirmedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await updateDoc(doc(db, 'students', studentId), { [`logAttendance.${date}`]: 'confirmed' });
  cache.delete(cacheKey('index', studentId));
}

export async function forceConfirmAttendance(studentId, date) {
  invalidate(studentId, date);
  const ref = doc(db, 'dailyLogs', logDocId(studentId, date));
  await setDoc(
    ref,
    { studentId, date, attendanceConfirmedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );
  await updateStudentIndex(studentId, date, 'confirmed');
}
