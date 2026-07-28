import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { listDailyLogs } from '../../services/dailyLogsService';
import { getStudent } from '../../services/studentsService';
import { formatDateLabel } from '../../utils/date';
import Loading from '../../components/common/Loading';

function IconList() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export default function DailyStudyLayout() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [showList, setShowList] = useState(false);
  const [logs, setLogs] = useState(null);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    getStudent(studentId).then((s) => { if (s?.name) setStudentName(s.name); }).catch(() => {});
  }, [studentId]);

  function openList() {
    setShowList(true);
    if (logs === null) {
      listDailyLogs(studentId).then(setLogs).catch(() => setLogs([]));
    }
  }

  function goToDate(date) {
    navigate(`/teacher/students/${studentId}/daily/${date}`);
    setShowList(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" className="back-link" style={{ marginLeft: 6 }}>← 뒤로</Link>
        <h1 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0 }}>일상 공부</h1>
        <span style={{ fontWeight: 600, fontSize: 15, marginRight: 6 }}>{studentName}</span>
      </div>

      <Outlet />

      {showList && (
        <div className="modal-overlay" onClick={() => setShowList(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">날짜 목록</h2>
              <button className="modal-close" onClick={() => setShowList(false)}>✕</button>
            </div>
            {logs === null ? (
              <Loading />
            ) : logs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0' }}>기록이 없습니다.</p>
            ) : (
              <ul className="log-list" style={{ maxHeight: '60vh', overflowY: 'auto', margin: 0 }}>
                {logs.map((log) => (
                  <li key={log.date}>
                    <button
                      onClick={() => goToDate(log.date)}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', textAlign: 'left' }}
                    >
                      <span className="log-date">{formatDateLabel(log.date)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
