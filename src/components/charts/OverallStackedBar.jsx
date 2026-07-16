import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { getSubjectColor } from '../../constants/colors';
import { computeOverallPercent } from '../../utils/computeOverallPercent';

// 과목별 percent를 넣되, 세그먼트 길이의 합이 정확히 전체 평균(overall)이 되도록
// 비율로 정규화한다 (그냥 percent를 그대로 쌓으면 합이 100을 넘어가 버림).
export default function OverallStackedBar({ subjects }) {
  const overall = computeOverallPercent(subjects);
  const rated = subjects.filter((s) => typeof s.percent === 'number');
  const ratedSum = rated.reduce((acc, s) => acc + s.percent, 0);

  const row = { name: '전체' };
  for (const s of subjects) {
    row[s.subject] =
      typeof s.percent === 'number' && ratedSum > 0 ? (s.percent / ratedSum) * overall : 0;
  }

  return (
    <div className="overall-chart">
      <div className="overall-chart__hero">
        <span className="overall-chart__label">전체</span>
        <span className="overall-chart__value">{overall === null ? '미평가' : `${overall}%`}</span>
      </div>
      <ResponsiveContainer width="100%" height={64}>
        <BarChart data={[row]} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" hide />
          {subjects.map((s) => (
            <Bar
              key={s.subject}
              dataKey={s.subject}
              stackId="overall"
              fill={getSubjectColor(s.subject)}
              stroke="var(--chart-surface)"
              strokeWidth={2}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
