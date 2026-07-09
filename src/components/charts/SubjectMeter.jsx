import { getSubjectColor, UNRATED_COLOR } from '../../constants/colors';

// 과목 박스 안에 들어가는 단일 막대(meter). percent가 숫자면 그 값만큼 채워지고,
// null/undefined(미평가)면 빈 트랙 + "미평가" 라벨만 보인다. 학생 화면에서는
// 항상 읽기 전용으로 쓰이고, 선생님 화면에서는 입력 중인 값을 그대로 반영해 미리보기로 쓴다.
export default function SubjectMeter({ subject, percent }) {
  const rated = typeof percent === 'number';
  const width = rated ? Math.max(0, Math.min(100, percent)) : 0;

  return (
    <div className="subject-meter">
      <div className="subject-meter__track">
        <div
          className="subject-meter__fill"
          style={{ width: `${width}%`, background: rated ? getSubjectColor(subject) : UNRATED_COLOR }}
        />
      </div>
      <span className="subject-meter__label">{rated ? `${percent}%` : '미평가'}</span>
    </div>
  );
}
