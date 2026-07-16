// 출석 상태는 dailyLogs 문서에서 파생한다:
// - attendanceRequestedAt 없음 → 'none' (출석 버튼 미클릭)
// - attendanceRequestedAt 있고 attendanceConfirmedAt 없음 → 'pending' (선생님 확인 대기)
// - attendanceConfirmedAt 있음 → 'confirmed' (선생님 확인 완료)
export function getAttendanceStatus(log) {
  if (!log || !log.attendanceRequestedAt) return 'none';
  if (!log.attendanceConfirmedAt) return 'pending';
  return 'confirmed';
}
