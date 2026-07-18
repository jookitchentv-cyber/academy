import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function listStudents() {
  const snap = await getDocs(collection(db, 'students'));
  return snap.docs
    .map((d) => ({ studentId: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTs = a.createdAt?.toMillis?.() ?? 0;
      const bTs = b.createdAt?.toMillis?.() ?? 0;
      return bTs - aTs;
    });
}

export async function getStudent(studentId) {
  const snap = await getDoc(doc(db, 'students', studentId));
  return snap.exists() ? { studentId: snap.id, ...snap.data() } : null;
}

// excludeStudentId: 수정 시 본인 제외
export async function isCodeTaken(code, excludeStudentId = null) {
  const q = query(collection(db, 'students'), where('code', '==', code));
  const snap = await getDocs(q);
  return snap.docs.some((d) => d.id !== excludeStudentId);
}

export async function isParentCodeTaken(parentCode, excludeStudentId = null) {
  const q = query(collection(db, 'students'), where('parentCode', '==', parentCode));
  const snap = await getDocs(q);
  return snap.docs.some((d) => d.id !== excludeStudentId);
}

export async function createStudent({ name, grade, code, parentCode, phone }) {
  const ref = await addDoc(collection(db, 'students'), { name, grade, code, parentCode: parentCode || '', phone: phone || '', createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateStudent(studentId, { name, grade, code, parentCode, phone }) {
  await updateDoc(doc(db, 'students', studentId), { name, grade, code, parentCode: parentCode || '', phone: phone || '' });
}

export async function deleteStudent(studentId) {
  await deleteDoc(doc(db, 'students', studentId));
}

export async function updateStudentMemo(studentId, memo) {
  await updateDoc(doc(db, 'students', studentId), { memo: memo || '' });
}
