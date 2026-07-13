const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const https = require('https');
const querystring = require('querystring');

initializeApp();

exports.sendAttendanceSms = onDocumentUpdated('dailyLogs/{docId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // attendanceConfirmed 가 false → true 로 바뀐 순간에만 실행
  if (before.attendanceConfirmed === true || after.attendanceConfirmed !== true) return;

  const { studentId, date } = after;

  const db = getFirestore();
  const parentsSnap = await db.collection('parents')
    .where('studentId', '==', studentId)
    .limit(1)
    .get();

  if (parentsSnap.empty) return;

  const parent = parentsSnap.docs[0].data();
  if (!parent.phone) return;

  const apiKey    = process.env.ALIGO_API_KEY;
  const userId    = process.env.ALIGO_USER_ID;
  const sender    = process.env.ALIGO_SENDER;

  const msg = `[화랑] ${parent.name} 학부모님, ${date} 학습 계획 출석이 확인되었습니다.`;

  const body = querystring.stringify({ key: apiKey, user_id: userId, sender, receiver: parent.phone, msg });

  await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'apis.aligo.in',
        path: '/send/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          const result = JSON.parse(raw);
          // result_code 가 1 이면 성공, 음수면 실패
          if (Number(result.result_code) < 1) {
            reject(new Error(`Aligo 오류: ${result.message}`));
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
});
