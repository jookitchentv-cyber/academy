import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';

const DEFAULT_SETTINGS = {
  feePerDay: 0,
  bankInfo: '신한은행 110-553-424930 화랑',
};

export async function getPaymentSettings() {
  const snap = await getDoc(doc(db, 'paymentSettings', 'global'));
  return snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : { ...DEFAULT_SETTINGS };
}

export async function savePaymentSettings(settings) {
  await setDoc(doc(db, 'paymentSettings', 'global'), settings);
}

export function callSendPaymentAlim(params) {
  return httpsCallable(functions, 'sendPaymentAlim')(params);
}
