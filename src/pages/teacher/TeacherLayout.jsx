import { Outlet, useLocation, Link } from 'react-router-dom';
import { TeacherProvider } from '../../context/TeacherContext';

function IconStudents() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconAnnouncement() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );
}

function IconTable() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M3 15h18"/>
      <path d="M9 3v18"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export default function TeacherLayout() {
  const { pathname } = useLocation();

  const isAnnouncement = pathname.startsWith('/teacher/announcements');
  const isTable = pathname.startsWith('/teacher/students-table');
  const isSettings = pathname.startsWith('/teacher/settings');
  const isStudents = !isAnnouncement && !isTable && !isSettings;

  function tabCls(active) {
    return `teacher-tab${active ? ' teacher-tab--active' : ''}`;
  }

  return (
    <TeacherProvider>
    <div className="teacher-layout">
      <div className="teacher-layout__content">
        <Outlet />
      </div>
      <nav className="teacher-tab-bar">
        <Link to="/teacher" className={tabCls(isStudents)}>
          <IconStudents />
          <span className="teacher-tab__label">학생</span>
        </Link>
        <Link to="/teacher/students-table" className={tabCls(isTable)}>
          <IconTable />
          <span className="teacher-tab__label">현황</span>
        </Link>
        <Link to="/teacher/announcements/new" className={tabCls(isAnnouncement)}>
          <IconAnnouncement />
          <span className="teacher-tab__label">공지</span>
        </Link>
        <Link to="/teacher/settings" className={tabCls(isSettings)}>
          <IconSettings />
          <span className="teacher-tab__label">설정</span>
        </Link>
      </nav>
    </div>
    </TeacherProvider>
  );
}
