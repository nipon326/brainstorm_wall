// ล็อกหน้าด้วย PIN แบบง่าย (ฝั่ง client เท่านั้น กันคนเดินผ่านเผลอกด ไม่ใช่ความปลอดภัยจริงจัง)
import { CONTROL_PIN } from "./config.js";

const SESSION_KEY = "ib_control_unlocked";

export function requirePin() {
  if (sessionStorage.getItem(SESSION_KEY) === "1") return;

  const overlay = document.createElement("div");
  overlay.className = "pin-gate-overlay";
  overlay.innerHTML = `
    <div class="pin-gate-box">
      <h2>ใส่ PIN สำหรับทีมงาน</h2>
      <input type="password" inputmode="numeric" id="pin-input" placeholder="PIN" autofocus />
      <button id="pin-submit">เข้าใช้งาน</button>
      <p id="pin-error" class="pin-error"></p>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.classList.add("pin-locked");

  const input = overlay.querySelector("#pin-input");
  const error = overlay.querySelector("#pin-error");
  const submit = () => {
    if (input.value === CONTROL_PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      overlay.remove();
      document.body.classList.remove("pin-locked");
    } else {
      error.textContent = "PIN ไม่ถูกต้อง";
      input.value = "";
      input.focus();
    }
  };
  overlay.querySelector("#pin-submit").addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}
