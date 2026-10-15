import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
// สลับเป็น long-polling อัตโนมัติถ้าเครือข่าย (proxy/Wi-Fi องค์กร) บัฟเฟอร์การเชื่อมต่อ streaming ทำให้ข้อมูลสดมาช้า
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
export const auth = getAuth(app);

// รอจนมี user (anonymous) พร้อมใช้ — เรียกเมื่อกด "เข้าร่วม" / เปิดหน้า control
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const off = onAuthStateChanged(auth, (u) => {
      if (u) { off(); resolve(u); }
      else signInAnonymously(auth).catch(reject);
    });
  });
}
