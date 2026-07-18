import { createContext, useContext, useState, useEffect } from 'react';
import { subscribeStudents } from '../services/studentsService';

const TeacherCtx = createContext(null);

export function TeacherProvider({ children }) {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeStudents(
      (data) => setStudents(data),
      () => setError('학생 목록을 불러오지 못했습니다.'),
    );
    return unsubscribe;
  }, []);

  return (
    <TeacherCtx.Provider value={{ students, error }}>
      {children}
    </TeacherCtx.Provider>
  );
}

export function useTeacher() {
  return useContext(TeacherCtx);
}
