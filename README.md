# Brainstorm Wall

กำแพงระดมสมองสดสำหรับการประชุม: ทุกคน login (ใส่ชื่อ) โพสต์ได้หลายข้อความ กด ❤️ 👍 😂 ให้ข้อความของคนอื่น ทุกอย่างขึ้นจอรวมกัน การ์ดที่ engagement สูงจะใหญ่ขึ้น แล้ว export CSV ได้

หน้า: `/join` (ผู้ร่วมประชุมสแกน QR) · `/backdrop` (จอโปรเจคเตอร์) · `/control` (ทีมงาน ใส่ PIN)

## Setup
1. Firebase: สร้าง project ใหม่ → เปิด **Firestore** → เปิด **Authentication > Sign-in method > Anonymous**
2. Firestore > Rules: วางเนื้อหา [`firestore.rules`](./firestore.rules) แล้ว Publish
3. Project settings > Your apps > Web: คัดลอก `firebaseConfig` ใส่ [`shared/config.js`](./shared/config.js) พร้อมตั้ง `CONTROL_PIN`, ชื่องาน, และ `QUESTIONS`
4. Authentication > Settings > Authorized domains: เพิ่มโดเมน `<user>.github.io`
5. Deploy GitHub Pages (`gh repo create ... --push` แล้วเปิด Pages จาก main /)

## วันงาน
- เปิด `/backdrop/` เต็มจอ, เปิด `/control/` บนมือถือทีมงาน กดเลือกคำถามข้อ 1 / 2
- จบแล้วกด "ดาวน์โหลด CSV" ใน `/control`

## หมายเหตุ
- ใช้ Anonymous Auth + ชื่อที่กรอกเอง: รู้ว่า "บัญชีเดียวกัน" โหวตซ้ำไม่ได้ แต่ชื่อไม่ได้ยืนยันตัวตนจริง
- PIN ของ /control ป้องกันฝั่ง client เท่านั้น อย่าแชร์ลิงก์
- ถ้า Firestore ขึ้น error "requires an index" ตอนทดสอบ ให้กดลิงก์สร้าง index (ทดสอบก่อนวันจริง)
