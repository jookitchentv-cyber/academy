import { useState, useEffect, useCallback } from 'react';
import {
  getPlannerEntries,
  addPlannerEntry,
  updatePlannerEntry,
  deletePlannerEntry,
} from '../../services/plannerService';
import Loading from '../common/Loading';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad = n => String(n).padStart(2, '0');

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateStr(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getDatesInRange(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const start = new Date(Math.min(new Date(ay, am - 1, ad), new Date(by, bm - 1, bd)));
  const end   = new Date(Math.max(new Date(ay, am - 1, ad), new Date(by, bm - 1, bd)));
  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return dates;
}

function fmtDates(dates) {
  const sorted = [...dates].sort();
  if (sorted.length === 0) return '';
  const first = sorted[0];
  const last  = sorted[sorted.length - 1];
  const [fy, fm, fd] = first.split('-').map(Number);
  const [ly, lm, ld] = last.split('-').map(Number);
  if (sorted.length === 1) return `${fm}월 ${fd}일`;
  const daySpan = Math.round((new Date(ly, lm - 1, ld) - new Date(fy, fm - 1, fd)) / 86400000);
  if (daySpan === sorted.length - 1) {
    // 연속 범위
    return fm === lm ? `${fm}월 ${fd}~${ld}일` : `${fm}월 ${fd}일~${lm}월 ${ld}일`;
  }
  // 비연속(구버전 데이터) 폴백
  return sorted.map(d => { const [,m,day] = d.split('-'); return `${parseInt(m)}월 ${parseInt(day)}일`; }).join(', ');
}

function IconPencil() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

export default function PlannerCalendar({ studentId }) {
  const today = getToday();
  const initD = new Date();
  const [ym, setYm] = useState({ year: initD.getFullYear(), month: initD.getMonth() + 1 });
  const [entries, setEntries] = useState(null);
  const [mode, setMode] = useState('idle'); // idle | selecting | viewing | editing
  const [pickedDates, setPickedDates] = useState(new Set());
  const [anchor, setAnchor] = useState(null);
  const [newMemo, setNewMemo] = useState('');
  const [viewedEntry, setViewedEntry] = useState(null);
  const [editMemo, setEditMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    try {
      const data = await getPlannerEntries(studentId);
      setEntries(data);
    } catch {
      setErr('플래너를 불러오지 못했습니다.');
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  // Reset to idle when pickedDates becomes empty in selecting mode
  useEffect(() => {
    if (mode === 'selecting' && pickedDates.size === 0) setMode('idle');
  }, [mode, pickedDates.size]);

  const dateToEntry = new Map();
  if (entries) entries.forEach(e => e.dates.forEach(d => dateToEntry.set(d, e)));

  function handleDay(date) {
    if (mode === 'editing') return;
    const entry = dateToEntry.get(date);
    if (mode === 'selecting') {
      if (pickedDates.has(date)) {
        // 선택된 날짜 재클릭 → 취소
        setMode('idle'); setPickedDates(new Set()); setAnchor(null); setNewMemo('');
      } else if (entry) {
        setViewedEntry(entry); setMode('viewing');
        setPickedDates(new Set()); setAnchor(null); setNewMemo('');
      } else {
        // 두 번째 클릭: 앵커~현재 날짜 범위 전체 선택
        setPickedDates(new Set(getDatesInRange(anchor, date)));
      }
    } else {
      if (entry) {
        setViewedEntry(entry); setMode('viewing');
        setPickedDates(new Set()); setAnchor(null); setNewMemo('');
      } else {
        // 첫 번째 클릭: 앵커 설정 + 단일 선택
        setAnchor(date);
        setPickedDates(new Set([date]));
        setMode('selecting');
        setViewedEntry(null); setNewMemo('');
      }
    }
  }

  async function handleSave() {
    if (!newMemo.trim() || pickedDates.size === 0) return;
    setSaving(true); setErr('');
    try {
      await addPlannerEntry(studentId, [...pickedDates], newMemo.trim());
      await load();
      setMode('idle'); setPickedDates(new Set()); setAnchor(null); setNewMemo('');
    } catch { setErr('저장에 실패했습니다.'); }
    finally { setSaving(false); }
  }

  async function handleUpdate() {
    if (!editMemo.trim() || !viewedEntry) return;
    setSaving(true); setErr('');
    try {
      await updatePlannerEntry(viewedEntry.id, viewedEntry.dates, editMemo.trim());
      const updated = { ...viewedEntry, memo: editMemo.trim() };
      setEntries(prev => prev.map(e => e.id === viewedEntry.id ? updated : e));
      setViewedEntry(updated); setMode('viewing');
    } catch { setErr('수정에 실패했습니다.'); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!viewedEntry) return;
    setSaving(true); setErr('');
    try {
      await deletePlannerEntry(viewedEntry.id);
      setEntries(prev => prev.filter(e => e.id !== viewedEntry.id));
      setMode('idle'); setViewedEntry(null);
    } catch { setErr('삭제에 실패했습니다.'); }
    finally { setSaving(false); }
  }

  function prevMonth() {
    setYm(({ year, month }) =>
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    );
  }
  function nextMonth() {
    setYm(({ year, month }) =>
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    );
  }

  const { year, month } = ym;
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWd = new Date(year, month - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: dateStr(year, month, d) });
  }

  if (entries === null && !err) return <Loading />;

  return (
    <>
      {err && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '8px 0', textAlign: 'center' }}>{err}</p>}

      <div className="calendar__nav" style={{ marginTop: 8 }}>
        <button className="calendar__nav-btn" onClick={prevMonth}>‹</button>
        <p className="calendar__title">{year}년 {month}월</p>
        <button className="calendar__nav-btn" onClick={nextMonth}>›</button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
      </div>
      <div className="planner-grid">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`b${i}`} className="planner-cell planner-cell--blank" />;
          const entry = dateToEntry.get(cell.date);
          const isToday = cell.date === today;
          const inEntry = !!entry;
          const inPick = !inEntry && pickedDates.has(cell.date);
          const isViewed = inEntry && viewedEntry?.id === entry.id;
          const hasColor = inEntry || inPick;
          return (
            <button
              key={cell.date}
              type="button"
              className={`planner-cell${isToday && !hasColor ? ' planner-cell--today' : ''}`}
              onClick={() => handleDay(cell.date)}
            >
              {inEntry && <div className={`planner-pill${isViewed ? ' planner-pill--active' : ''}`} />}
              {inPick && <div className="planner-pill planner-pill--pick" />}
              <span className="planner-day" style={{ color: hasColor ? '#fff' : undefined, fontWeight: isToday ? 700 : undefined }}>
                {cell.day}
              </span>
              {isToday && hasColor && <span className="planner-today-dot" />}
            </button>
          );
        })}
      </div>

      {mode === 'idle' && entries?.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
          날짜를 눌러 학습 계획을 추가해보세요
        </p>
      )}

      {mode === 'selecting' && pickedDates.size > 0 && (
        <div className="planner-panel">
          <p className="planner-panel__label">{fmtDates(pickedDates)}</p>
          <textarea
            className="study-input"
            style={{ minHeight: 96, fontSize: 15, marginBottom: 10 }}
            placeholder="학습 계획을 입력하세요"
            value={newMemo}
            onChange={e => setNewMemo(e.target.value)}
            autoFocus
          />
          {err && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 8px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="logout-button" style={{ fontSize: 13 }}
              onClick={() => { setMode('idle'); setPickedDates(new Set()); setAnchor(null); setNewMemo(''); setErr(''); }}>
              취소
            </button>
            <button className="logout-button" style={{ fontSize: 13, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', minWidth: 56 }}
              onClick={handleSave} disabled={saving || !newMemo.trim()}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {mode === 'viewing' && viewedEntry && (
        <div className="planner-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p className="planner-panel__label" style={{ margin: 0 }}>{fmtDates(viewedEntry.dates)}</p>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
              onClick={() => { setMode('editing'); setEditMemo(viewedEntry.memo); setErr(''); }}
            >
              <IconPencil />
            </button>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: 15, color: 'var(--text-primary)', margin: '0 0 10px' }}>
            {viewedEntry.memo}
          </p>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontSize: 12, color: 'var(--text-muted)' }}
            onClick={() => setMode('idle')}
          >
            닫기
          </button>
        </div>
      )}

      {mode === 'editing' && viewedEntry && (
        <div className="planner-panel">
          <p className="planner-panel__label">{fmtDates(viewedEntry.dates)}</p>
          <textarea
            className="study-input"
            style={{ minHeight: 96, fontSize: 15, marginBottom: 10 }}
            value={editMemo}
            onChange={e => setEditMemo(e.target.value)}
            autoFocus
          />
          {err && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 8px' }}>{err}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }} />
            <button className="logout-button" style={{ fontSize: 13 }}
              onClick={() => { setMode('viewing'); setErr(''); }}>
              취소
            </button>
            <button className="logout-button" style={{ fontSize: 13, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', minWidth: 56 }}
              onClick={handleUpdate} disabled={saving || !editMemo.trim()}>
              {saving ? '저장 중...' : '저장'}
            </button>
            <div style={{ flex: 1 }} />
            <button className="logout-button" style={{ fontSize: 13, background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}
              onClick={handleDelete} disabled={saving}>
              삭제
            </button>
          </div>
        </div>
      )}
    </>
  );
}
