import { getSubjectColor } from '../../constants/colors';

const SIZE = 68;
const R = 27;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function SubjectMeter({ subject, percent }) {
  const rated = typeof percent === 'number';
  const color = getSubjectColor(subject);
  const filled = rated ? Math.max(0, Math.min(100, percent)) : 0;
  const dash = (filled / 100) * CIRCUMFERENCE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={SIZE} height={SIZE}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8e8e8" strokeWidth={10} />
        {rated && (
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            strokeLinecap="round"
            strokeDashoffset={CIRCUMFERENCE / 4}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px` }}
          />
        )}
        <text
          x={CX} y={CY}
          textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight={700}
          fill={rated ? color : '#aaa'}
        >
          {rated ? `${percent}%` : '미평가'}
        </text>
      </svg>
    </div>
  );
}
