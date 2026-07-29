import {
  collection, query, where, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getPlannerEntries(studentId) {
  const q = query(collection(db, 'plannerEntries'), where('studentId', '==', studentId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPlannerEntry(studentId, dates, memo) {
  await addDoc(collection(db, 'plannerEntries'), {
    studentId,
    dates: [...dates].sort(),
    memo,
    createdAt: serverTimestamp(),
  });
}

export async function updatePlannerEntry(entryId, dates, memo) {
  await updateDoc(doc(db, 'plannerEntries', entryId), { dates: [...dates].sort(), memo });
}

export async function deletePlannerEntry(entryId) {
  await deleteDoc(doc(db, 'plannerEntries', entryId));
}
