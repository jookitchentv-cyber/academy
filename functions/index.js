const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const https = require('https');
const crypto = require('crypto');

initializeApp();

function solapiAuth(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(8).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

// Firestore Timestamp → "2026년 7월 16일 오전 9시 30분" (KST)
function formatKoreanDateTime(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 1;
  const day = kst.getUTCDate();
  let hours = kst.getUTCHours();
  const minutes = kst.getUTCMinutes();
  const ampm = hours < 12 ? '오전' : '오후';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  const minuteStr = minutes > 0 ? ` ${String(minutes).padStart(2, '0')}분` : '';
  return `${year}년 ${month}월 ${day}일 ${ampm} ${hours}시${minuteStr}`;
}

function solapiRequest(messageBody) {
  const apiKey    = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const bodyStr   = JSON.stringify({ message: messageBody });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.solapi.com',
        path: '/messages/v4/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': solapiAuth(apiKey, apiSecret),
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          const result = JSON.parse(raw);
          console.log('Solapi 응답:', JSON.stringify(result));
          if (result.errorCode) {
            reject(new Error(`${result.errorCode}: ${result.errorMessage}`));
          } else {
            resolve(result);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// 알림톡 시도 → 실패 시 SMS로 자동 재발송
async function sendMessage(to, templateId, variables, smsText) {
  const sender = process.env.SOLAPI_SENDER;
  const pfId   = process.env.SOLAPI_PF_ID;

  try {
    await solapiRequest({
      to,
      from: sender,
      type: 'ATA',
      kakaoOptions: { pfId, templateId, variables },
    });
    console.log('알림톡 발송 성공');
  } catch (e) {
    console.log('알림톡 실패(' + e.message + '), SMS로 대체 발송');
    await solapiRequest({
      to,
      from: sender,
      type: Buffer.byteLength(smsText, 'utf8') > 90 ? 'LMS' : 'SMS',
      text: smsText,
    });
    console.log('SMS 발송 성공');
  }
}

async function getParentAndStudent(db, studentId) {
  const studentSnap = await db.collection('students').doc(studentId).get();
  const student = studentSnap.exists ? studentSnap.data() : null;
  return {
    parent: student ? { phone: student.phone || null } : null,
    student,
  };
}

// 등원 알림: 선생님이 attendanceConfirmedAt을 설정하면 자동 발송
exports.sendAttendanceAlim = onDocumentUpdated('dailyLogs/{docId}', async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();

  if (before.attendanceConfirmedAt || !after.attendanceConfirmedAt) return;

  const { studentId } = after;
  const db = getFirestore();
  const { parent, student } = await getParentAndStudent(db, studentId);

  if (!parent?.phone || !student?.name) {
    console.log('조기 종료: phone 또는 학생 이름 없음');
    return;
  }

  const arrivalTs  = after.attendanceRequestedAt ?? after.attendanceConfirmedAt;
  const arrivalStr = formatKoreanDateTime(arrivalTs);

  await sendMessage(
    parent.phone,
    'KA01TP2607161159295672WvSkLzOiFO',
    {
      '#{학생이름}':       student.name,
      '#{등원날짜및시간}': arrivalStr,
    },
    `안녕하세요 화랑멘토링스쿨입니다!\n\n${student.name} 학생\n\n${arrivalStr}\n\n등원했습니다.`
  );

  console.log(`등원 알림 발송 완료: ${student.name} / ${arrivalStr}`);
});

// 하원 보고: 선생님이 "부모님께 전송" 버튼을 클릭할 때 호출
exports.sendDailyReport = onCall(async (request) => {
  const { studentId, date } = request.data ?? {};
  if (!studentId || !date) throw new HttpsError('invalid-argument', 'studentId와 date는 필수입니다.');

  const db = getFirestore();
  const docRef = db.collection('dailyLogs').doc(`${studentId}_${date}`);

  const [logSnap, { parent, student }] = await Promise.all([
    docRef.get(),
    getParentAndStudent(db, studentId),
  ]);

  if (!logSnap.exists)  throw new HttpsError('not-found', '해당 날짜 기록이 없습니다.');
  if (!parent?.phone)   throw new HttpsError('failed-precondition', '부모님 연락처가 없습니다.');
  if (!student?.name)   throw new HttpsError('not-found', '학생 정보가 없습니다.');

  const log = logSnap.data();
  if (!log.comment) throw new HttpsError('failed-precondition', '선생님 피드백을 먼저 입력해주세요.');

  // 하원 시간 = 전송 시각 (KST). 당일 전송이면 날짜+시각, 다음날 이후 전송이면 날짜만 표시.
  const nowMs = Date.now();
  const nowKST = new Date(nowMs + 9 * 60 * 60 * 1000);
  const sendDate = [
    nowKST.getUTCFullYear(),
    String(nowKST.getUTCMonth() + 1).padStart(2, '0'),
    String(nowKST.getUTCDate()).padStart(2, '0'),
  ].join('-');
  const [ly, lm, ld] = date.split('-');
  const departureStr = sendDate === date
    ? formatKoreanDateTime(new Date(nowMs))
    : `${ly}년 ${Number(lm)}월 ${Number(ld)}일`;

  const planText   = log.plan?.rawText ?? '작성 내용 없음';
  const actualText = log.rawText       ?? '작성 내용 없음';

  try {
    await sendMessage(
      parent.phone,
      'KA01TP260716120728528Ht5OBcxDCGy',
      {
        '#{학생이름}':    student.name,
        '#{하원날짜시간}': departureStr,
        '#{금일학습목표}': planText,
        '#{금일학습량}':  actualText,
        '#{피드백}':      log.comment,
      },
      `안녕하세요 화랑멘토링스쿨입니다!\n\n${student.name} 학생\n\n${departureStr}에 하원했습니다.\n\n[금일 학습 목표]\n${planText}\n\n[금일 학습량]\n${actualText}\n\n[피드백]\n${log.comment}`
    );
  } catch (e) {
    throw new HttpsError('internal', `메시지 전송 실패: ${e.message}`);
  }

  await docRef.update({ reportSentAt: FieldValue.serverTimestamp() });

  console.log(`하원 보고 발송 완료: ${student.name} / ${date}`);
  return { success: true };
});

// 매년 1월 1일 00:00 KST (= 12월 31일 15:00 UTC) 학년 자동 진급
const GRADE_ORDER = ['중1', '중2', '중3', '고1', '고2', '고3'];

exports.advanceGrades = onSchedule({ schedule: '0 15 31 12 *', timeZone: 'Asia/Seoul' }, async () => {
  const db = getFirestore();
  const snap = await db.collection('students').get();
  const batch = db.batch();

  snap.docs.forEach((doc) => {
    const { grade } = doc.data();
    const idx = GRADE_ORDER.indexOf(grade);
    if (idx === -1 || grade === '고3') return;
    batch.update(doc.ref, { grade: GRADE_ORDER[idx + 1] });
  });

  await batch.commit();
  console.log('학년 자동 진급 완료');
});
