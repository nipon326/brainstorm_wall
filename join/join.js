import { db, ensureSignedIn } from "../shared/firebase-init.js";
import { doc, setDoc, deleteDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { EVENT_TITLE, EVENT_SUBTITLE, QUESTIONS, REACTIONS, MAX_TEXT } from "../shared/config.js";
import { subscribeIdeasMine } from "../shared/data.js";

const $ = (id) => document.getElementById(id);
const NAME_KEY = "bw_name";
let user = null, q = 0, unsub = null;

document.title = EVENT_TITLE;
$("event-title").textContent = EVENT_TITLE;
$("event-subtitle").textContent = EVENT_SUBTITLE;
$("text").maxLength = MAX_TEXT;

const getName = () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } };
const setName = (v) => { try { v ? localStorage.setItem(NAME_KEY, v) : localStorage.removeItem(NAME_KEY); } catch {} };

function showError(e) {
  console.error(e);
  $("login-error").textContent = `เข้าสู่ระบบไม่สำเร็จ: ${e.code || ""} ${e.message || e}`;
  $("btn-login").disabled = false;
}

async function enter(name) {
  $("login-error").textContent = "";
  $("btn-login").disabled = true;
  try { user = await ensureSignedIn(); } catch (e) { return showError(e); }
  $("who-name").textContent = name;
  $("login").hidden = true;
  $("app").hidden = false;
  selectQuestion(0);
}

$("btn-login").onclick = () => {
  const name = $("name").value.trim();
  if (!name) return $("name").focus();
  setName(name);
  enter(name);
};
$("btn-logout").onclick = (e) => { e.preventDefault(); setName(""); location.reload(); };
if (getName()) enter(getName());

QUESTIONS.forEach((qq, i) => {
  const b = document.createElement("button");
  b.className = "tab"; b.textContent = qq.short; b.onclick = () => selectQuestion(i);
  $("tabs").appendChild(b);
});

function selectQuestion(i) {
  q = i;
  [...$("tabs").children].forEach((b, k) => b.classList.toggle("on", k === i));
  $("question").textContent = QUESTIONS[i].text;
  unsub?.();
  unsub = subscribeIdeasMine(i, user.uid, render);
}

$("text").oninput = () => ($("count").textContent = `${$("text").value.length}/${MAX_TEXT}`);

$("btn-post").onclick = async () => {
  const text = $("text").value.trim();
  if (!text) return;
  $("btn-post").disabled = true;
  try {
    await addDoc(collection(db, "ideas"), { q, text, name: getName(), uid: user.uid, createdAt: serverTimestamp() });
    $("text").value = ""; $("count").textContent = "";
  } catch (e) { alert("โพสต์ไม่สำเร็จ: " + e.message); }
  $("btn-post").disabled = false;
};

async function react(idea, key) {
  const ref = doc(db, "reactions", `${idea.id}_${user.uid}`);
  const mine = idea.mine.find((r) => r.uid === user.uid);
  if (mine?.type === key) await deleteDoc(ref);           // กดซ้ำ = ยกเลิก
  else await setDoc(ref, { ideaId: idea.id, q: idea.q, uid: user.uid, type: key });
}

function render(ideas) {
  ideas = [...ideas].sort((a, b) => b.createdMs - a.createdMs); // บนมือถือเรียงใหม่สุดก่อน ไม่ให้การ์ดกระโดดตอนกดโหวต
  $("n").textContent = ideas.length;
  const list = $("list");
  list.replaceChildren(...ideas.map((idea) => {
    const mineType = idea.mine.find((r) => r.uid === user.uid)?.type;
    const el = document.createElement("div");
    el.className = "idea";
    const t = document.createElement("div"); t.className = "t"; t.textContent = idea.text;
    const by = document.createElement("div"); by.className = "by"; by.textContent = idea.name;
    const rs = document.createElement("div"); rs.className = "reacts";
    for (const r of REACTIONS) {
      const b = document.createElement("button");
      b.className = "react" + (mineType === r.key ? " on" : "");
      b.textContent = `${r.emoji} ${r.label}`; // ตัวเลขรวมดูได้บนจอ ไม่ฟังข้อมูลทุกคนบนมือถือ (ลด read)
      b.title = r.label;
      b.onclick = () => react(idea, r.key);
      rs.appendChild(b);
    }
    el.append(t, by, rs);
    return el;
  }));
}
