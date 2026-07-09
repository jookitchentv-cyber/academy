import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 코드로 학생/선생님을 찾는다. 자릿수가 아니라 실제 컬렉션 조회 결과로 role을 판별한다
 * (자릿수는 코드 발급 관례일 뿐, DB 조회가 더 안전한 판별 기준).
 * 반환값: { role: 'student', studentId, name } | { role: 'teacher', teacherId } | null
 */
export async function loginWithCode(code) {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const studentsQ = query(collection(db, 'students'), where('code', '==', trimmed), limit(1));
  const studentSnap = await getDocs(studentsQ);
  if (!studentSnap.empty) {
    const doc = studentSnap.docs[0];
    return { role: 'student', studentId: doc.id, name: doc.data().name };
  }

  const teachersQ = query(collection(db, 'teachers'), where('code', '==', trimmed), limit(1));
  const teacherSnap = await getDocs(teachersQ);
  if (!teacherSnap.empty) {
    return { role: 'teacher', teacherId: teacherSnap.docs[0].id };
  }

  return null;
}
