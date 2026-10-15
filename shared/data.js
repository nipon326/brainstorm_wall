// logic ที่ใช้ร่วมกันทุกหน้า: subscribe ข้อมูล + คำนวณคะแนน
import { db } from "./firebase-init.js";
import { collection, doc, onSnapshot, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { REACTIONS } from "./config.js";

export function subscribeActiveQuestion(cb) {
  return onSnapshot(doc(db, "state", "session"), (s) => cb(s.exists() ? s.data().activeQuestion : 0));
}

// ideas ของคำถามข้อ q พร้อมนับ reaction -> cb(array เรียงตามคะแนนมากไปน้อย)
export function subscribeIdeas(q, cb) {
  let ideas = [], reactions = [];
  const emit = () => {
    const by = {};
    for (const r of reactions) (by[r.ideaId] ||= []).push(r);
    cb(ideas.map((i) => {
      const counts = Object.fromEntries(REACTIONS.map((x) => [x.key, 0]));
      for (const r of by[i.id] || []) if (r.type in counts) counts[r.type]++;
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { ...i, counts, total, mine: by[i.id] || [] };
    }).sort((a, b) => b.total - a.total || (a.createdMs - b.createdMs)));
  };
  const u1 = onSnapshot(query(collection(db, "ideas"), where("q", "==", q)), (s) => {
    ideas = s.docs.map((d) => ({ id: d.id, ...d.data(), createdMs: d.data().createdAt?.toMillis?.() ?? Date.now() }));
    emit();
  });
  const u2 = onSnapshot(query(collection(db, "reactions"), where("q", "==", q)), (s) => {
    reactions = s.docs.map((d) => d.data());
    emit();
  });
  return () => { u1(); u2(); };
}
