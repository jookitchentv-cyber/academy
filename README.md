# 화랑 — 학습 관리 웹앱

학생이 매일 공부한 내용을 자유 서술형으로 기록하고, 선생님이 과목별 완료 퍼센트를 매겨
막대그래프로 보여주는 웹앱. React(Vite) + Firestore. 별도 백엔드 서버 없이 프론트에서
Firestore를 직접 읽고 씁니다.

## 기술 스택

- React (Vite) + react-router-dom
- Firebase Firestore (Firebase Auth는 사용하지 않음 — 코드 로그인은 Firestore 조회로 처리)
- recharts (막대그래프)
- vitest (파싱/계산 로직 단위 테스트)

## 로컬 개발

```bash
npm install
npm run dev
```

Firestore를 실제로 호출하는 기능(로그인, 기록 저장/조회, 퍼센트 저장)을 쓰려면 아래 "Firebase
프로젝트 설정"을 먼저 마쳐야 합니다. 그 전까지는 로그인 화면 등 UI만 확인할 수 있습니다.

```bash
npm test        # parseSubjects / computeOverallPercent 단위 테스트
npm run build   # 프로덕션 빌드
```

## Firebase 프로젝트 설정 (아직 안 했다면)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Firestore Database 활성화 (프로덕션 모드로 시작해도 무방 — 규칙은 이 저장소의
   `firestore.rules`로 덮어씀)
3. 프로젝트 설정 → 일반 → "웹 앱 추가" 후 나오는 config 값을 `.env`에 채우기
   (`.env.example`을 복사해서 `.env` 생성)
4. `.firebaserc`의 `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`를 실제 프로젝트 ID로 교체

## 데모 계정 시딩 (Firestore 콘솔에서 수동으로)

`students` 컬렉션에 문서 하나:

```json
{ "name": "지창", "code": "2585" }
```

`teachers` 컬렉션에 문서 하나:

```json
{ "code": "880603" }
```

(문서 ID는 자동 생성 ID로 두면 됩니다. `students` 문서의 ID가 곧 로그인 후 사용되는
`studentId`이고, `dailyLogs` 문서 ID의 접두어로도 쓰입니다.)

## 배포

```bash
npx firebase login
npx firebase deploy --only firestore:rules,hosting
```

`npm run build`로 만든 `dist/`를 Hosting이 서빙합니다(`firebase.json` 설정 완료).

## 알려진 한계

- **인증 없음**: Firebase Auth를 쓰지 않기로 한 설계라 Firestore 보안 규칙이 요청자를
  검증할 수 없습니다. 배포 URL과 Firebase 웹 config를 아는 사람은 누구나 데이터를 읽고
  쓸 수 있습니다. 학생 1명 + 선생님 1명 규모의 데모용 트레이드오프이며, 더 넓게 쓰려면
  Firebase Auth 도입이 필요합니다 (`firestore.rules` 참고).
- **과목 파싱**: 과목 키워드가 문장 어디에 등장하든(문장 맨 앞이 아니어도) 그 위치부터
  다음 과목 키워드 전까지를 해당 과목 내용으로 인식하는 단순 정규식 방식입니다. 다른
  과목을 설명하는 문장 중간에 우연히 과목 키워드가 섞여 있으면 잘못 나뉠 수 있습니다.
- **Firestore 연동은 실제 프로젝트 생성 전까지 end-to-end로 검증되지 않았습니다.**
  `parseSubjects`/`computeOverallPercent` 같은 순수 로직은 `npm test`로 확인했지만,
  로그인 조회·기록 저장·퍼센트 반영처럼 Firestore가 실제로 관여하는 흐름은 위 설정을
  마친 뒤 브라우저에서 직접 확인해야 합니다. 체크리스트:
  - [ ] 학생 코드(`2585`)로 로그인 → 이름 "지창" 표시
  - [ ] 선생님 코드(`880603`)로 로그인 → 학생 목록에 "지창" 표시
  - [ ] 학생이 "수학 쎈 53페이지부터 100페이지까지 풀었다" 저장 → 과목별로 잘 나뉘는지
  - [ ] 선생님이 해당 날짜에서 퍼센트 입력 후 저장 → 학생 쪽 그래프에 반영되는지
