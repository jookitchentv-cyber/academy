import { collection, getDocs, getDoc, setDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function saveAnnouncement(teacherId, { date, type, note, targetStudentIds }) {
  const ref = doc(db, 'teacherAnnouncements', `${teacherId}_${date}`);
  await setDoc(ref, { teacherId, date, type, note: note || '', targetStudentIds, updatedAt: serverTimestamp() });
}

export async function listAnnouncementsForTeacher(teacherId) {
  const q = query(collection(db, 'teacherAnnouncements'), where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function listAnnouncementsForStudent(studentId) {
  const snap = await getDocs(collection(db, 'teacherAnnouncements'));
  return snap.docs.map((d) => d.data()).filter((a) => a.targetStudentIds.includes(studentId));
}

// 전체 삭제 또는 일부 학생만 제거. studentIdsToRemove가 비어있으면 문서 전체 삭제.
export async function removeAnnouncement(teacherId, date, studentIdsToRemove) {
  const ref = doc(db, 'teacherAnnouncements', `${teacherId}_${date}`);
  if (studentIdsToRemove.length === 0) {
    await deleteDoc(ref);
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
}

export function buildAnnouncementMap(announcements) {
  const map = new Map();
  for (const a of announcements) map.set(a.date, a);
  return map;
}
