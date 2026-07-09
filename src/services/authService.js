import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/** 학생 로그인: 이름 + 4자리 코드가 둘 다 일치해야 함. */
export async function loginStudent(name, code) {
  const trimmedName = name.trim();
  const trimmedCode = code.trim();
  if (!trimmedName || !trimmedCode) return null;

  const q = query(
    collection(db, 'students'),
    where('name', '==', trimmedName),
    where('code', '==', trimmedCode),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc = snap.docs[0];
  return { role: 'student', studentId: doc.id, name: doc.data().name };
}

/** 선생님 로그인: 코드만으로 확인. */
export async function loginTeacher(code) {
  const trimmedCode = code.trim();
  if (!trimmedCode) return null;

  const q = query(collection(db, 'teachers'), where('code', '==', trimmedCode), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  return { role: 'teacher', teacherId: snap.docs[0].id };
}
