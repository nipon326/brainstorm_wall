// ===== ตั้งค่าทั้งหมดไว้ที่ไฟล์เดียว =====

// 1) Firebase project config (สร้าง project ใหม่ แล้วเอาค่าจาก Project settings > Your apps > Web)
export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.firebasestorage.app",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

// 2) PIN หน้า /control (กันกดผิด ไม่ใช่ความปลอดภัยจริงจัง)
export const CONTROL_PIN = "1234";

// 3) ข้อความของงาน
export const EVENT_TITLE = "🌱 Q1 Brainstorm";
export const EVENT_SUBTITLE = "ร่วมแชร์ไอเดีย แล้วกดโหวตให้ข้อความที่ใช่";

// 4) คำถาม (ใส่กี่ข้อก็ได้ เรียงตามลำดับ)
export const QUESTIONS = [
  { short: "Flagship Q1", text: "อะไรคือ 'Flagship' หรือผลงานชิ้นโบแดง (A+ Project) ของสายงานเราใน Q1?" },
  { short: "Ecology ที่อยากเห็น", text: "สำหรับทุกคนแล้ว Ecology แบบไหนที่เราอยากเห็นและอยากให้เกิดขึ้นจริงมากที่สุดใน Q1 นี้?" },
];

// 5) ปุ่ม reaction (key ต้องตรงกับ firestore.rules)
export const REACTIONS = [
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "like", emoji: "👍", label: "Like" },
  { key: "haha", emoji: "😂", label: "ขำ" },
];

export const MAX_TEXT = 200;
