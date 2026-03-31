const sb = window.supabase;

// ── Vis toast ──
function visToast(besked, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = besked;
  el.className = type;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = ""; el.textContent = ""; }, 4000);
}

// ── Tilføj elev ──
document.getElementById("tilføjKnap").addEventListener("click", async () => {
  const navnEl      = document.getElementById("navnInput");
  const godVenEl    = document.getElementById("godeVennerInput");
  const dårligVenEl = document.getElementById("dårligeVennerInput");

  const navn      = navnEl.value.trim();
  const godVen    = godVenEl.value.split(",").map(s => s.trim()).filter(Boolean);
  const dårligVen = dårligVenEl.value.split(",").map(s => s.trim()).filter(Boolean);

  if (!navn) {
    visToast("Indtast et navn.", "error");
    navnEl.focus();
    return;
  }

  if (godVen.some(v => dårligVen.includes(v))) {
    visToast("En elev kan ikke være både god ven og dårlig ven.", "error");
    return;
  }

  const knap = document.getElementById("tilføjKnap");
  knap.disabled = true;
  knap.textContent = "Tilføjer...";

  const { error } = await sb.from("elev").insert([{
    navn,
    "gode venner":    godVen.length    ? godVen.join(", ")    : null,
    "dårlige venner": dårligVen.length ? dårligVen.join(", ") : null,
  }]);

  knap.disabled = false;
  knap.textContent = "Tilføj til liste";

  if (error) {
    console.error(error);
    visToast("Fejl: " + (error.message || "Kunne ikke oprette elev."), "error");
    return;
  }

  visToast(`"${navn}" blev tilføjet.`, "success");
  navnEl.value      = "";
  godVenEl.value    = "";
  dårligVenEl.value = "";

  // Opdater elevdata så WFC kan bruge det
  if (typeof window.init === "function") await window.init();
});

// ── Enter-tast i navnefeltet ──
document.getElementById("navnInput").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("tilføjKnap").click();
});