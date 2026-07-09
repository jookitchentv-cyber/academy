// 로컬 날짜 기준 "YYYY-MM-DD" 문자열. toISOString()은 UTC라 늦은 밤 입력이
// 다음날로 밀릴 수 있어 사용하지 않는다.
export function todayString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(dateString) {
  const [y, m, d] = dateString.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}
