(function () {
  const vscode = acquireVsCodeApi();
  const pet = document.getElementById("pet");
  const bubble = document.getElementById("bubble");
  const affectionEl = document.getElementById("affection");
  const companionshipEl = document.getElementById("companionship");
  const stage = document.getElementById("stage");

  const saved = vscode.getState() || {};
  if (saved.left != null) {
    pet.style.left = saved.left;
  }
  if (saved.top != null) {
    pet.style.top = saved.top;
  }

  let dragging = false;
  let ox = 0;
  let oy = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function snap(leftPct, topPct) {
    const edge = 4;
    if (leftPct < edge) leftPct = 0;
    if (leftPct > 100 - edge - 18) leftPct = 100 - 18;
    if (topPct < edge) topPct = 0;
    if (topPct > 100 - edge - 28) topPct = 100 - 28;
    return { leftPct, topPct };
  }

  pet.addEventListener("pointerdown", (e) => {
    dragging = true;
    pet.classList.add("press");
    pet.setPointerCapture(e.pointerId);
    const rect = pet.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
  });

  pet.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const s = stage.getBoundingClientRect();
    let leftPct = ((e.clientX - s.left - ox) / s.width) * 100;
    let topPct = ((e.clientY - s.top - oy) / s.height) * 100;
    leftPct = clamp(leftPct, 0, 82);
    topPct = clamp(topPct, 0, 72);
    const snapped = snap(leftPct, topPct);
    pet.style.left = snapped.leftPct + "%";
    pet.style.top = snapped.topPct + "%";
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    pet.classList.remove("press");
    try {
      pet.releasePointerCapture(e.pointerId);
    } catch (_) {}
    vscode.setState({ left: pet.style.left, top: pet.style.top });
  }

  pet.addEventListener("pointerup", endDrag);
  pet.addEventListener("pointercancel", endDrag);

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || msg.type !== "state" || !msg.state) return;
    const st = msg.state;
    affectionEl.textContent = "好感 " + st.affection;
    companionshipEl.textContent =
      "陪伴 Lv" + st.companionshipLevel + " · " + st.companionship + "/100";
    bubble.textContent = st.bubbleText || "";
    pet.classList.remove("mood-idle", "mood-happy", "mood-sad", "mood-sleep");
    pet.classList.add("mood-" + (st.mood || "idle"));
  });
})();
