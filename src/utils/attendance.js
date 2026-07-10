// 출석확인 상태는 별도 컬렉션 없이 dailyLogs 문서에서 그대로 파생시킨다:
// - plan을 아예 안 썼으면 'none'
// - plan은 있는데 선생님이 아직 확인 안 했으면 'pending'
// - 선생님이 확인 처리했으면 'confirmed'
export function getAttendanceStatus(log) {
  if (!log || !log.plan || log.plan.length === 0) return 'none';
  return log.attendanceConfirmed ? 'confirmed' : 'pending';
}
