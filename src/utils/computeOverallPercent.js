/**
 * subjects: [{ subject, rawText, percent }]
 * percent가 숫자인(=선생님이 평가한) 과목만 평균. 평가된 과목이 없으면 null(미평가).
 */
export function computeOverallPercent(subjects) {
  const rated = subjects.filter((s) => typeof s.percent === 'number');
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, s) => acc + s.percent, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}
