import { todayString } from '../../utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n) => String(n).padStart(2, '0');

const STATUS_MARK = { pending: '!', confirmed: '✓' };
const ANNOUNCE_LABEL = { cancel: '휴강', time_change: '시간변경' };

export default function MonthCalendar({ year, month, statusByDate, announcementsByDate, onDayClick, onPrev, onNext }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = new Date(year, month - 1, 1).getDay();
  const today = todayString();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${pad(month)}-${pad(d)}`;
    cells.push({ day: d, date, status: statusByDate.get(date) ?? 'none' });
  }

  return (
    <div className="calendar">
      <div className="calendar__nav">
        <button type="button" className="calendar__nav-btn" onClick={onPrev} style={{ visibility: onPrev ? 'visible' : 'hidden' }}>
          ‹
        </button>
        <p className="calendar__title">{year}년 {month}월</p>
        <button type="button" className="calendar__nav-btn" onClick={onNext} style={{ visibility: onNext ? 'visible' : 'hidden' }}>
          ›
        </button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} className="calendar-cell calendar-cell--blank" />;
          const announce = announcementsByDate?.get(cell.date);
          const classNames = [
            'calendar-cell',
            `calendar-cell--${cell.status}`,
            cell.date === today ? 'calendar-cell--today' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const content = (
            <>
              <span className="calendar-cell__day">{cell.day}</span>
              {STATUS_MARK[cell.status] && <span className="calendar-cell__mark">{STATUS_MARK[cell.status]}</span>}
              {announce && (
                <span className={`calendar-cell__announce calendar-cell__announce--${announce.type}`}>
                  {ANNOUNCE_LABEL[announce.type]}
                </span>
              )}
            </>
          );
          return onDayClick ? (
            <button key={cell.date} type="button" className={classNames} onClick={() => onDayClick(cell.date, cell.status)}>
              {content}
            </button>
          ) : (
            <div key={cell.date} className={classNames}>
              {content}
            </div>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span><i className="calendar-swatch calendar-swatch--none" /> 정상 수업</span>
        <span><i className="calendar-swatch calendar-swatch--pending" /> 확인 대기</span>
        <span><i className="calendar-swatch calendar-swatch--confirmed" /> 확인 완료</span>
        <span><i className="calendar-swatch calendar-swatch--cancel" /> 휴강</span>
        <span><i className="calendar-swatch calendar-swatch--time-change" /> 시간변경</span>
      </div>
    </div>
  );
}
