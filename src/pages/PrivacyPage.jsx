export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', color: '#222', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>개인정보처리방침</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>시행일: 2024년 1월 1일</p>

      <p>
        화랑멘토링스쿨(이하 "회사")은 이용자의 개인정보를 중요하게 생각하며,
        「개인정보 보호법」에 따라 아래와 같이 개인정보처리방침을 수립·공개합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
        <ul>
          <li>필수항목: 이름, 이메일 주소, 비밀번호(암호화 저장)</li>
          <li>서비스 이용 과정에서 자동 생성·수집: 학습 기록, 출석 기록, 플래너 내용, 수납 내역, 접속 일시</li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 수집 및 이용 목적">
        <ul>
          <li>회원 식별 및 로그인 서비스 제공</li>
          <li>학습 현황 및 출석 관리</li>
          <li>수납 내역 관리</li>
          <li>학원-학생-학부모 간 학습 정보 공유</li>
          <li>서비스 개선 및 고객 지원</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간">
        <p>
          수집한 개인정보는 회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 의해
          보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
        </p>
        <ul>
          <li>전자상거래 관련 기록: 5년 (전자상거래법)</li>
          <li>접속 로그: 3개월 (통신비밀보호법)</li>
        </ul>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
          다만, 이용자의 동의가 있거나 법령에 의한 경우는 예외로 합니다.
        </p>
      </Section>

      <Section title="5. 개인정보 처리 위탁">
        <p>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
        <ul>
          <li>수탁자: Google LLC (Firebase) — 목적: 데이터베이스 및 인증 서비스 운영</li>
        </ul>
      </Section>

      <Section title="6. 이용자의 권리">
        <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
        <ul>
          <li>개인정보 열람 요청</li>
          <li>오류 정정 요청</li>
          <li>삭제 요청</li>
          <li>처리 정지 요청</li>
        </ul>
        <p>권리 행사는 아래 개인정보 보호책임자에게 이메일로 요청하시면 됩니다.</p>
      </Section>

      <Section title="7. 개인정보의 파기">
        <p>
          보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.
          전자 파일 형태의 정보는 복구 불가능한 방법으로 영구 삭제합니다.
        </p>
      </Section>

      <Section title="8. 개인정보 보호책임자">
        <ul>
          <li>회사명: 화랑멘토링스쿨</li>
          <li>이메일: cherydew135@naver.com</li>
        </ul>
        <p>개인정보 관련 문의, 불만, 피해 구제 등은 위 이메일로 연락해 주시기 바랍니다.</p>
      </Section>

      <Section title="9. 개인정보처리방침 변경">
        <p>
          이 방침은 법령·정책 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지를 통해 안내합니다.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 6 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
