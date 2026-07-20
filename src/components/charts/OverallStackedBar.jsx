import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getSubjectColor } from '../../constants/colors';
import { computeOverallPercent } from '../../utils/computeOverallPercent';

const REST_KEY = '__rest__';

export default function OverallStackedBar({ subjects }) {
  const overall = computeOverallPercent(subjects);
  const rated = subjects.filter((s) => typeof s.percent === 'number');
  const ratedSum = rated.reduce((acc, s) => acc + s.percent, 0);

  const slices = rated.map((s) => ({
    name: s.subject,
    value: ratedSum > 0 ? (s.percent / ratedSum) * (overall ?? 0) : 0,
    percent: s.percent,
  }));

  const restPct = Math.round((100 - (overall ?? 0)) * 10) / 10;
  const data = [...slices, { name: REST_KEY, value: 100 - (overall ?? 0) }];

  return (
    <div className="overall-chart">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        {/* 도넛 + 중앙 텍스트 */}
        <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={76}
                dataKey="value"
                startAngle={90}
                endAngle={450}
                stroke="var(--chart-surface)"
                strokeWidth={2}
                isAnimationActive={false}
                style={{ pointerEvents: 'none' }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === REST_KEY ? 'rgba(11,11,11,0.08)' : getSubjectColor(entry.name)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* 중앙 텍스트 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>전체</span>
            <span style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)' }}>
              {overall === null ? '미평가' : `${overall}%`}
            </span>
          </div>
        </div>

        {/* 우측 세로 범례 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          {slices.map((s) => (
            <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: getSubjectColor(s.name), flexShrink: 0 }} />
              <span style={{ color: getSubjectColor(s.name), fontWeight: 600 }}>{s.name} {Math.round(s.value * 10) / 10}%</span>
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#9ca3af', flexShrink: 0 }} />
            <span style={{ color: '#9ca3af' }}>나머지 {restPct}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
