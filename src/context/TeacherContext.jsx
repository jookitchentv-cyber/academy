import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { listStudents } from '../services/studentsService';

const TeacherCtx = createContext(null);

export function TeacherProvider({ children }) {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch(() => setError('학생 목록을 불러오지 못했습니다.'));
  }, []);

  const refresh = useCallback(() => {
    listStudents()
      .then(setStudents)
      .catch(() => setError('학생 목록을 불러오지 못했습니다.'));
  }, []);

  return (
    <TeacherCtx.Provider value={{ students, error, refresh }}>
      {children}
    </TeacherCtx.Provider>
  );
}

export function useTeacher() {
  return useContext(TeacherCtx);
}
