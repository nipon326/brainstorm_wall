import { QUESTIONS, REACTIONS } from "../shared/config.js";
import { subscribeActiveQuestion, subscribeIdeas } from "../shared/data.js";
import { ensureSignedIn } from "../shared/firebase-init.js";

const $ = (id) => document.getElementById(id);
const joinUrl = new URL("../join/", location.href).href;
$("joinlink").href = joinUrl;
$("joinlink").textContent = joinUrl.replace(/^https?:\/\//, "");
$("qr").src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;

window.onListenError = (m) => { $("shown").textContent = "⚠️ " + m; };
let unsub = null, current = -1;
const nodes = new Map(); // ideaId -> element (อัปเดตแทนสร้างใหม่ กันกระพริบ)

// anonymous login เงียบๆ เพื่อให้อ่าน Firestore ได้เหมือนทุกหน้า (rules อ่านเปิดอยู่ แต่เผื่อเข้มขึ้นภายหลัง)
ensureSignedIn().catch(() => {});

// mode: "live" = ตามคำถามที่ทีมงานเลือกใน /control (ค่าเริ่มต้น, จอโปรเจคเตอร์) | ตัวเลข = ผู้ชมเลือกดูเองรายข้อ
let mode = "live", liveQ = 0;
const fromHash = parseInt(location.hash.slice(1), 10) - 1;
if (fromHash >= 0 && fromHash < QUESTIONS.length) mode = fromHash;

function buildTabs() {
  const tabs = $("tabs");
  tabs.innerHTML = "";
  const add = (label, value) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.classList.toggle("on", mode === value);
    b.onclick = () => {
      mode = value;
      history.replaceState(null, "", value === "live" ? location.pathname + location.search : `#${value + 1}`);
      buildTabs(); show(); $("cloud").scrollTop = 0;
    };
    tabs.appendChild(b);
  };
  add("📺 ตามจอหลัก", "live");
  QUESTIONS.forEach((q, i) => add(`ข้อ ${i + 1}: ${q.short || ""}`, i));
}

function show() {
  const q = Math.min(mode === "live" ? liveQ : mode, QUESTIONS.length - 1);
  if (q === current) { render(lastIdeas); return; }
  current = q;
  $("qnum").textContent = `คำถามที่ ${q + 1} / ${QUESTIONS.length}`;
  $("question").textContent = QUESTIONS[q].text;
  nodes.forEach((n) => n.remove()); nodes.clear();
  unsub?.();
  unsub = subscribeIdeas(q, render);
}

buildTabs();
subscribeActiveQuestion((i) => { liveQ = i; show(); });
if (mode !== "live") show();

const TOP_N = 40, NEWEST_N = 20; // ผู้ร่วมงาน ~150 คน: โชว์เฉพาะที่เด่น + ที่ใหม่ เพื่อให้อ่านออกจากไกลๆ
let lastIdeas = [];
let resizeTimer;
window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => render(lastIdeas), 200); });

function render(all) {
  lastIdeas = all;
  $("empty").classList.toggle("hide", all.length > 0);
  // all เรียงตามคะแนนอยู่แล้ว: เอา TOP_N แรก + NEWEST_N ที่ใหม่สุดจากที่เหลือ
  // โหมดเลือกดูเอง: แสดงครบทุกความเห็น เลื่อนดูได้ / โหมดจอหลัก: คัดเฉพาะเด่น+ใหม่ ให้พอดีจอ
  const browse = mode !== "live";
  $("cloud").classList.toggle("browse", browse);
  const top = all.slice(0, TOP_N);
  const rest = all.slice(TOP_N).sort((a, b) => b.createdMs - a.createdMs).slice(0, NEWEST_N);
  const ideas = browse ? all : [...top, ...rest];
  $("shown").textContent = all.length > ideas.length ? `แสดง ${ideas.length} จาก ${all.length} ความเห็น` : `${all.length} ความเห็น`;
  const max = Math.max(1, ...ideas.map((i) => i.total));
  const seen = new Set();
  ideas.forEach((idea, rank) => {
    seen.add(idea.id);
    let el = nodes.get(idea.id);
    if (!el) {
      el = document.createElement("div");
      el.className = "card";
      el.innerHTML = `<div class="t"></div><div class="by"></div><div class="stats"></div>`;
      el.querySelector(".t").textContent = idea.text;
      el.querySelector(".by").textContent = idea.name;
      $("cloud").appendChild(el);
      nodes.set(idea.id, el);
    }
    el.dataset.w = (1 + 1.2 * (idea.total / max) * (idea.total > 0 ? 1 : 0)).toFixed(2); // น้ำหนักตาม engagement
    el.style.order = rank;
    el.classList.toggle("hot", rank < 3 && idea.total > 0);
    el.querySelector(".stats").textContent = REACTIONS.filter((r) => idea.counts[r.key]).map((r) => `${r.emoji} ${idea.counts[r.key]}`).join("  ");
  });
  for (const [id, el] of nodes) if (!seen.has(id)) { el.remove(); nodes.delete(id); }
  fit();
}

// ย่อขนาดฐานลงเรื่อยๆ จนการ์ดทั้งหมดพอดีพื้นที่ (ไม่ล้นจอ) ต่ำสุด 0.55 เพื่อไม่ให้เล็กจนอ่านไม่ได้
function fit() {
  const cloud = $("cloud");
  let base = 1.1;
  if (cloud.classList.contains("browse")) base = 0.9;
  const apply = () => nodes.forEach((el) => el.style.setProperty("--s", (base * el.dataset.w).toFixed(2)));
  apply();
  while (!cloud.classList.contains("browse") && base > 0.55 && cloud.scrollHeight > cloud.clientHeight + 1) { base -= 0.05; apply(); }
}

// ลากเพื่อเลื่อน (เมาส์) — บนมือถือใช้การปัดนิ้วตามปกติ
(() => {
  const c = $("cloud"); let y0 = 0, t0 = 0, drag = false;
  c.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; drag = true; y0 = e.clientY; t0 = c.scrollTop; c.classList.add("dragging"); });
  window.addEventListener("pointermove", (e) => { if (drag) c.scrollTop = t0 - (e.clientY - y0); });
  window.addEventListener("pointerup", () => { drag = false; c.classList.remove("dragging"); });
})();
