import { QUESTIONS, REACTIONS } from "../shared/config.js";
import { subscribeActiveQuestion, subscribeIdeas } from "../shared/data.js";
import { ensureSignedIn } from "../shared/firebase-init.js";

const $ = (id) => document.getElementById(id);
const joinUrl = new URL("../join/", location.href).href;
$("qr").src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;

let unsub = null, current = -1;
const nodes = new Map(); // ideaId -> element (อัปเดตแทนสร้างใหม่ กันกระพริบ)

// anonymous login เงียบๆ เพื่อให้อ่าน Firestore ได้เหมือนทุกหน้า (rules อ่านเปิดอยู่ แต่เผื่อเข้มขึ้นภายหลัง)
ensureSignedIn().catch(() => {});

subscribeActiveQuestion((i) => {
  const q = Math.min(i, QUESTIONS.length - 1);
  if (q === current) return;
  current = q;
  $("qnum").textContent = `คำถามที่ ${q + 1} / ${QUESTIONS.length}`;
  $("question").textContent = QUESTIONS[q].text;
  nodes.forEach((n) => n.remove()); nodes.clear();
  unsub?.();
  unsub = subscribeIdeas(q, render);
});

const TOP_N = 40, NEWEST_N = 20; // ผู้ร่วมงาน ~150 คน: โชว์เฉพาะที่เด่น + ที่ใหม่ เพื่อให้อ่านออกจากไกลๆ
let lastIdeas = [];
let resizeTimer;
window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => render(lastIdeas), 200); });

function render(all) {
  lastIdeas = all;
  $("empty").classList.toggle("hide", all.length > 0);
  // all เรียงตามคะแนนอยู่แล้ว: เอา TOP_N แรก + NEWEST_N ที่ใหม่สุดจากที่เหลือ
  const top = all.slice(0, TOP_N);
  const rest = all.slice(TOP_N).sort((a, b) => b.createdMs - a.createdMs).slice(0, NEWEST_N);
  const ideas = [...top, ...rest];
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
  const apply = () => nodes.forEach((el) => el.style.setProperty("--s", (base * el.dataset.w).toFixed(2)));
  apply();
  while (base > 0.55 && cloud.scrollHeight > cloud.clientHeight + 1) { base -= 0.05; apply(); }
}
