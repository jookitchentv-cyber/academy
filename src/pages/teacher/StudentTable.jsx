import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listStudents } from '../../services/studentsService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function StudentTable() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch(() => setError('학생 목록을 불러오지 못했습니다.'));
  }, []);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" className="back-link">← 뒤로</Link>
        <h1 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0 }}>학생 현황</h1>
      </div>

      {students === null ? <Loading /> : (
        <div style={{ overflowX: 'auto', margin: '-5px -8px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['가입날짜', '이름', '학년', '학생', '부모', '연락처'].map((h) => (
                  <th key={h} style={{ padding: '6px 12px', margin: 0, textAlign: 'center', borderTop: '2px solid #e0e0e0', borderBottom: '2px solid #e0e0e0', borderRight: '1px solid #e0e0e0', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const dateStr = s.createdAt?.toDate
                  ? s.createdAt.toDate().toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })
                  : '-';
                return (
                <tr key={s.studentId} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e0e0e0', borderRight: '1px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: 13 }}>{dateStr}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0', borderRight: '1px solid #e0e0e0' }}>{s.name}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0', borderRight: '1px solid #e0e0e0' }}>{s.grade || '-'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0', borderRight: '1px solid #e0e0e0', fontFamily: 'monospace' }}>{s.code}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0', borderRight: '1px solid #e0e0e0', fontFamily: 'monospace' }}>{s.parentCode || '-'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>{s.phone || '-'}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {students.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', marginTop: 32 }}>등록된 학생이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
