import { collection, getDocs, getDoc, setDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const cache = new Map();

function invalidateTeacher(teacherId) {
  cache.delete('teacher:' + teacherId);
}

export async function saveAnnouncement(teacherId, { date, type, note, targetStudentIds }) {
  const ref = doc(db, 'teacherAnnouncements', `${teacherId}_${date}`);
  await setDoc(ref, { teacherId, date, type, note: note || '', targetStudentIds, updatedAt: serverTimestamp() });
  invalidateTeacher(teacherId);
}

export async function listAnnouncementsForTeacher(teacherId) {
  const key = 'teacher:' + teacherId;
  if (cache.has(key)) return cache.get(key);
  const q = query(collection(db, 'teacherAnnouncements'), where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  const result = snap.docs.map((d) => d.data());
  cache.set(key, result);
  return result;
}

export async function listAnnouncementsForStudent(studentId) {
  const key = 'student:' + studentId;
  if (cache.has(key)) return cache.get(key);
  const q = query(collection(db, 'teacherAnnouncements'), where('targetStudentIds', 'array-contains', studentId));
  const snap = await getDocs(q);
  const result = snap.docs.map((d) => d.data());
  cache.set(key, result);
  return result;
}

export async function removeAnnouncement(teacherId, date, studentIdsToRemove) {
  const ref = doc(db, 'teacherAnnouncements', `${teacherId}_${date}`);
  if (studentIdsToRemove.length === 0) {
    await deleteDoc(ref);
    invalidateTeacher(teacherId);
    return;
  }
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const remaining = snap.data().targetStudentIds.filter((id) => !studentIdsToRemove.includes(id));
  if (remaining.length === 0) {
    await deleteDoc(ref);
  } else {
    await updateDoc(ref, { targetStudentIds: remaining, updatedAt: serverTimestamp() });
  }
  invalidateTeacher(teacherId);
}

export function buildAnnouncementMap(announcements) {
  const map = new Map();
  for (const a of announcements) map.set(a.date, a);
  return map;
}
