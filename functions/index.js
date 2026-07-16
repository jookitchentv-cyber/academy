const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onCall } = require('firebase-functions/v2/https');
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

async function sendAlimTalk(to, templateId, variables) {
  const apiKey    = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender    = process.env.SOLAPI_SENDER;
  const pfId      = process.env.SOLAPI_PF_ID;

  const body = JSON.stringify({
    message: {
      to,
      from: sender,
      type: 'ATA',
      kakaoOptions: { pfId, templateId, variables, disableSms: false },
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.solapi.com',
        path: '/messages/v4/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': solapiAuth(apiKey, apiSecret),
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          const result = JSON.parse(raw);
          console.log('Solapi 응답:', JSON.stringify(result));
          if (result.errorCode) {
            reject(new Error(`Solapi 오류: ${result.errorCode} - ${result.errorMessage}`));
          } else {
            resolve(result);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getParentAndStudent(db, studentId) {
  const [parentsSnap, studentSnap] = await Promise.all([
    db.collection('parents').where('studentId', '==', studentId).limit(1).get(),
    db.collection('students').doc(studentId).get(),
  ]);
  return {
    parent: parentsSnap.empty ? null : parentsSnap.docs[0].data(),
    student: studentSnap.exists() ? studentSnap.data() : null,
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

  // 등원 시간 = 학생이 출석 버튼을 누른 시각
  const arrivalTs = after.attendanceRequestedAt ?? after.attendanceConfirmedAt;
  const arrivalStr = formatKoreanDateTime(arrivalTs);

  await sendAlimTalk(parent.phone, 'cWR535CZIk', {
    '#{학생이름}': student.name,
    '#{등원날짜및시간}': arrivalStr,
  });

  console.log(`등원 알림 발송: ${student.name} / ${arrivalStr}`);
});

// 하원 보고: 선생님이 "부모님께 전송" 버튼을 클릭할 때 호출
exports.sendDailyReport = onCall(async (request) => {
  const { studentId, date } = request.data ?? {};
  if (!studentId || !date) throw new Error('studentId와 date는 필수입니다.');

  const db = getFirestore();
  const docRef = db.collection('dailyLogs').doc(`${studentId}_${date}`);

  const [logSnap, { parent, student }] = await Promise.all([
    docRef.get(),
    getParentAndStudent(db, studentId),
  ]);

  if (!logSnap.exists()) throw new Error('해당 날짜 기록이 없습니다.');
  if (!parent?.phone)   throw new Error('부모님 연락처가 없습니다.');
  if (!student?.name)   throw new Error('학생 정보가 없습니다.');

  const log = logSnap.data();
  if (!log.departureTime) throw new Error('하원 시간이 기록되지 않았습니다.');
  if (!log.comment)       throw new Error('선생님 피드백을 먼저 입력해주세요.');

  await sendAlimTalk(parent.phone, 'XoPPslsplZ', {
    '#{학생이름}':    student.name,
    '#{하원날짜시간}': formatKoreanDateTime(log.departureTime),
    '#{금일학습목표}': log.plan?.rawText  ?? '작성 내용 없음',
    '#{금일학습량}':  log.rawText         ?? '작성 내용 없음',
    '#{피드백}':      log.comment,
  });

  await docRef.update({ reportSentAt: FieldValue.serverTimestamp() });

  console.log(`하원 보고 발송: ${student.name} / ${date}`);
  return { success: true };
});
