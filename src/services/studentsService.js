import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function listStudents() {
  const snap = await getDocs(collection(db, 'students'));
  return snap.docs.map((d) => ({ studentId: d.id, ...d.data() }));
}

export async function getStudent(studentId) {
  const snap = await getDoc(doc(db, 'students', studentId));
  return snap.exists() ? { studentId: snap.id, ...snap.data() } : null;
}
