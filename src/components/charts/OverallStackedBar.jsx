import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
  }));

  const data = [...slices, { name: REST_KEY, value: 100 - (overall ?? 0) }];

  return (
    <div className="overall-chart">
      {/* 도넛 + 중앙 텍스트 */}
      <div style={{ position: 'relative', height: 152 }}>
        <ResponsiveContainer width="100%" height={152}>
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
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.name === REST_KEY ? 'rgba(11,11,11,0.08)' : getSubjectColor(entry.name)}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const entry = payload[0];
                if (entry.name === REST_KEY) return (
                  <div style={{ background: '#fff', border: '1px solid #ddd', padding: '6px 10px', borderRadius: 6, fontSize: 13 }}>
                    <span style={{ color: '#9ca3af' }}>●</span>{' '}
                    나머지: {overall !== null ? `${100 - overall}%` : '미평가'}
                  </div>
                );
                const s = subjects.find((x) => x.subject === entry.name);
                return (
                  <div style={{ background: '#fff', border: '1px solid #ddd', padding: '6px 10px', borderRadius: 6, fontSize: 13 }}>
                    <span style={{ color: entry.fill }}>●</span>{' '}
                    {entry.name}: {typeof s?.percent === 'number' ? `${s.percent}%` : '미평가'}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* 중앙 텍스트 — inset:0 + flex center로 완벽 중앙 */}
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

      {/* 범례 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12, color: 'var(--text-secondary)', justifyContent: 'center', lineHeight: '1.8', marginTop: 4 }}>
        {slices.map((s) => (
          <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: getSubjectColor(s.name), flexShrink: 0, display: 'inline-block' }} />
            {s.name}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9ca3af', flexShrink: 0, display: 'inline-block' }} />
          나머지
        </span>
      </div>
    </div>
  );
}
