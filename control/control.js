import { db, ensureSignedIn } from "../shared/firebase-init.js";
import { doc, setDoc, deleteDoc, getDocs, collection, onSnapshot, query, orderBy, writeBatch, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { requirePin } from "../shared/pin-gate.js";
import { QUESTIONS, REACTIONS } from "../shared/config.js";
import { subscribeActiveQuestion } from "../shared/data.js";

requirePin();
const $ = (id) => document.getElementById(id);
const ready = ensureSignedIn().catch((e) => alert("login ไม่สำเร็จ: " + (e.code || e.message)));

// ---- สลับคำถาม ----
const btns = QUESTIONS.map((q, i) => {
  const b = document.createElement("button");
  b.textContent = `${i + 1}. ${q.text}`;
  b.onclick = async () => {
    try { await ready; await setDoc(doc(db, "state", "session"), { activeQuestion: i }); }
    catch (e) { alert("เปลี่ยนคำถามไม่สำเร็จ: " + (e.code || e.message)); }
  };
  $("qbtns").appendChild(b);
  return b;
});
subscribeActiveQuestion((i) => btns.forEach((b, k) => b.classList.toggle("on", k === i)));

// ---- ดึงข้อมูลทั้งหมด (ใช้ทั้ง export และรายการลบ) ----
async function loadAll() {
  const [is, rs] = await Promise.all([getDocs(collection(db, "ideas")), getDocs(collection(db, "reactions"))]);
  const counts = {};
  rs.forEach((d) => { const r = d.data(); (counts[r.ideaId] ||= {})[r.type] = ((counts[r.ideaId] || {})[r.type] || 0) + 1; });
  return is.docs.map((d) => {
    const i = d.data(), c = counts[d.id] || {};
    const per = Object.fromEntries(REACTIONS.map((r) => [r.key, c[r.key] || 0]));
    return { id: d.id, ...i, createdMs: i.createdAt?.toMillis?.() ?? 0, ...per, total: Object.values(per).reduce((a, b) => a + b, 0) };
  }).sort((a, b) => a.q - b.q || b.total - a.total || a.createdMs - b.createdMs);
}

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

$("btn-export").onclick = async () => {
  $("export-status").textContent = "กำลังรวบรวม…";
  const rows = await loadAll();
  const head = ["คำถาม", "ข้อความ", "ผู้โพสต์", "เวลา", ...REACTIONS.map((r) => `${r.emoji} ${r.label}`), "รวม engagement"];
  const lines = [head, ...rows.map((r) => [
    QUESTIONS[r.q]?.short ?? r.q + 1, r.text, r.name,
    r.createdMs ? new Date(r.createdMs).toLocaleString("th-TH") : "",
    ...REACTIONS.map((x) => r[x.key]), r.total,
  ])].map((l) => l.map(csvCell).join(",")).join("\r\n");
  // BOM ให้ Excel เปิดภาษาไทยไม่เพี้ยน
  const url = URL.createObjectURL(new Blob(["﻿" + lines], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `brainstorm-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click(); URL.revokeObjectURL(url);
  $("export-status").textContent = `ส่งออก ${rows.length} ข้อความแล้ว`;
};

// ---- รายการ + ลบ ----
onSnapshot(query(collection(db, "ideas"), orderBy("createdAt", "desc")), (s) => {
  $("list").replaceChildren(...s.docs.map((d) => {
    const i = d.data();
    const row = document.createElement("div"); row.className = "item";
    const t = document.createElement("div"); t.className = "txt";
    t.append(`${i.text} `);
    const sm = document.createElement("small"); sm.textContent = `— ${i.name} (ข้อ ${i.q + 1})`; t.appendChild(sm);
    const del = document.createElement("button"); del.textContent = "ลบ";
    del.onclick = async () => {
      if (!confirm("ลบข้อความนี้?")) return;
      const rs = await getDocs(query(collection(db, "reactions"), where("ideaId", "==", d.id)));
      const b = writeBatch(db); rs.forEach((r) => b.delete(r.ref)); b.delete(d.ref); await b.commit();
    };
    row.append(t, del);
    return row;
  }));
});

// ---- QR ----
const joinUrl = new URL("../join/", location.href).href;
$("qr").src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;
$("join-link").href = $("join-link").textContent = joinUrl;
