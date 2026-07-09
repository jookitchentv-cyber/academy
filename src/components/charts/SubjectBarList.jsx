import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { getSubjectColor, UNRATED_COLOR } from '../../constants/colors';

export default function SubjectBarList({ subjects }) {
  const data = subjects.map((s) => ({
    subject: s.subject,
    value: typeof s.percent === 'number' ? s.percent : 0,
    rated: typeof s.percent === 'number',
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 16}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="subject"
          width={56}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
        />
        <Tooltip
          formatter={(value, _name, item) => [item.payload.rated ? `${value}%` : '미평가', item.payload.subject]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((d) => (
            <Cell key={d.subject} fill={d.rated ? getSubjectColor(d.subject) : UNRATED_COLOR} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            content={({ x, y, width, height, value, index }) => {
              const rated = data[index]?.rated;
              const label = rated ? `${value}%` : '미평가';
              return (
                <text
                  x={x + width + 6}
                  y={y + height / 2}
                  dy={4}
                  fill="var(--text-secondary)"
                  fontSize={13}
                >
                  {label}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
