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

function render(ideas) {
  $("empty").classList.toggle("hide", ideas.length > 0);
  const max = Math.max(1, ...ideas.map((i) => i.total));
  // ขนาดการ์ดแปรตามจำนวน engagement (1.0 – 2.2) ; ลดขนาดฐานเมื่อมีเยอะเพื่อให้พอดีจอ
  const base = ideas.length > 40 ? 0.7 : ideas.length > 20 ? 0.85 : 1;
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
    const scale = base * (1 + 1.2 * (idea.total / max) * (idea.total > 0 ? 1 : 0));
    el.style.setProperty("--s", scale.toFixed(2));
    el.style.order = rank;
    el.classList.toggle("hot", rank < 3 && idea.total > 0);
    el.querySelector(".stats").textContent = REACTIONS.filter((r) => idea.counts[r.key]).map((r) => `${r.emoji} ${idea.counts[r.key]}`).join("  ");
  });
  for (const [id, el] of nodes) if (!seen.has(id)) { el.remove(); nodes.delete(id); }
}
