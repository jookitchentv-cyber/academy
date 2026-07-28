// KST(UTC+9) 기준 "YYYY-MM-DD" 문자열.
export function todayString(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(dateString) {
  const [y, m, d] = dateString.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export function formatDateShort(dateString) {
  const [y, m, d] = dateString.split('-');
  return `${String(y).slice(2)}년 ${Number(m)}월 ${Number(d)}일`;
}
