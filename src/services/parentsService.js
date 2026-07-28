import { collection, query, where, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getParentByStudentId(studentId) {
  const q = query(collection(db, 'parents'), where('studentId', '==', studentId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { parentId: d.id, ...d.data() };
}

export async function updateParentPhone(parentId, phone) {
  await updateDoc(doc(db, 'parents', parentId), { phone: phone.trim() || null });
}
