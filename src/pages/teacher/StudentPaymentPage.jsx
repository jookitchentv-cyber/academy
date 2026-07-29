import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { getPaymentSettings, savePaymentSettings, callSendPaymentAlim } from '../../services/paymentService';
import Loading from '../../components/common/Loading';

const pad = n => String(n).padStart(2, '0');

function getYM() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function countClassDays(logAttendance, year, month) {
  if (!logAttendance) return 0;
  const prefix = `${year}-${pad(month)}-`;
  return Object.entries(logAttendance).filter(
    ([date, status]) => date.startsWith(prefix) && (status === 'confirmed' || status === 'departed')
  ).length;
}

function fmtFeeInput(val) {
  const digits = val.replace(/[^0-9]/g, '');
  return digits ? Number(digits).toLocaleString('ko-KR') : '';
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  fontSize: 15,
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
};

export default function StudentPaymentPage() {
  const { studentId } = useParams();
  const { students } = useTeacher();
  const student = students?.find(s => s.studentId === studentId) ?? null;

  const [ym, setYm] = useState(getYM());
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editFee, setEditFee] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [customTotal, setCustomTotal] = useState(''); // 수동 수정 가능한 결제금액
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    getPaymentSettings().then(s => {
      setSettings(s);
      setEditFee(s.feePerDay ? fmtFeeInput(String(s.feePerDay)) : '');
    });
  }, []);

  // 월·설정 바뀌면 결제금액·전송 상태 초기화
  useEffect(() => {
    setSent(false);
    setErr('');
    if (!student || !settings) return;
    const days = countClassDays(student.logAttendance, ym.year, ym.month);
    const total = days * (settings.feePerDay ?? 0);
    setCustomTotal(fmtFeeInput(String(total)));
  }, [ym, settings]); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const s = {
        feePerDay: Number(editFee.replace(/,/g, '')) || 0,
        bankInfo: '신한은행 110-553-424930 화랑',
      };
      await savePaymentSettings(s);
      setSettings(s);
      setShowSettings(false);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleSend() {
    if (!student) return;
    const classDays = countClassDays(student.logAttendance, ym.year, ym.month);
    const totalFee = Number(customTotal.replace(/,/g, '')) || 0;

    setSending(true); setErr('');
    try {
      await callSendPaymentAlim({
        studentId,
        year: ym.year,
        month: ym.month,
        classDays,
        totalFee,
        note: note.trim(),
        bankInfo: settings?.bankInfo ?? '신한은행 110-553-424930 화랑',
      });
      setSent(true);
    } catch (e) {
      setErr(e.message || '전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }

  if (!students || !settings) return <Loading />;
  if (!student) return <p style={{ padding: 24, color: 'var(--text-muted)' }}>학생을 찾을 수 없습니다.</p>;

  const { year, month } = ym;
  const classDays = countClassDays(student.logAttendance, year, month);
  const autoTotal = classDays * (settings.feePerDay ?? 0);
  const isModified = customTotal !== fmtFeeInput(String(autoTotal));
  const hasPhone = !!student.phone;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>← 뒤로</Link>
        <h1 style={{ flex: 1, textAlign: 'center' }}>{student.name} 수납</h1>
        <button
          className="logout-button"
          style={{ fontSize: 12 }}
          onClick={() => setShowSettings(v => !v)}
        >
          ⚙ 설정
        </button>
      </div>

      {showSettings && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>일일 수업료 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              value={editFee}
              onChange={e => setEditFee(fmtFeeInput(e.target.value))}
              placeholder="59,000"
              style={inputStyle}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>계좌: 신한은행 110-553-424930 화랑 (고정)</p>
          <div style={{ textAlign: 'center' }}>
            <button
              className="logout-button"
              style={{ fontSize: 13, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      <div className="calendar__nav" style={{ marginTop: 0, marginBottom: 20 }}>
        <button className="calendar__nav-btn" onClick={prevMonth}>‹</button>
        <p className="calendar__title">{year}년 {month}월</p>
        <button className="calendar__nav-btn" onClick={nextMonth}>›</button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 20px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 18, alignItems: 'flex-end' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>수업일수</p>
            <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {classDays}<span style={{ fontSize: 16, fontWeight: 600 }}>일</span>
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>결제금액</p>
              {isModified && (
                <button
                  style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  onClick={() => setCustomTotal(fmtFeeInput(String(autoTotal)))}
                >
                  초기화
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="text"
                inputMode="numeric"
                value={customTotal}
                onChange={e => { setSent(false); setCustomTotal(fmtFeeInput(e.target.value)); }}
                style={{
                  ...inputStyle,
                  fontSize: 22,
                  fontWeight: 800,
                  color: isModified ? 'var(--danger)' : 'var(--accent)',
                  border: isModified ? '1px solid var(--danger)' : '1px solid var(--border)',
                  padding: '4px 8px',
                  width: '100%',
                }}
              />
              <span style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>원</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>특이사항 (선택)</label>
          <textarea
            className="study-input"
            style={{ minHeight: 72, fontSize: 14, marginBottom: 0 }}
            placeholder="예: 결석 1회 포함, 체험수업 제외 등"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {err && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 10px', textAlign: 'center' }}>{err}</p>}
        {!hasPhone && (
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 10px', textAlign: 'center' }}>학부모 연락처가 등록되지 않았습니다.</p>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            className="logout-button"
            style={{
              fontSize: 15,
              fontWeight: 700,
              background: sent ? '#22c55e' : 'var(--accent)',
              color: '#fff',
              borderColor: sent ? '#22c55e' : 'var(--accent)',
              padding: '10px 32px',
            }}
            onClick={handleSend}
            disabled={sending || !hasPhone || sent}
          >
            {sending ? '전송 중...' : sent ? '알림톡 전송 완료 ✓' : '알림톡 전송'}
          </button>
        </div>
      </div>

      {(settings.feePerDay ?? 0) === 0 && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          ⚙ 설정에서 일일 수업료를 입력해주세요
        </p>
      )}
    </div>
  );
}
