// Viser en besked til brugeren i 4 sekunder
function visbesked (besked, type = "success") {
  const el = document.getElementById("besked");
  el.textContent = besked;
  el.className = type;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = ""; el.textContent = ""; }, 4000);
}

// Lytter efter klik på "Tilføj til liste" knappen
document.getElementById("tilføjKnap").addEventListener("click", async () => {
  // Henter inputfelterne fra HTML
  const navnEl      = document.getElementById("navnInput");
  const godVenEl    = document.getElementById("godeVennerInput");
  const dårligVenEl = document.getElementById("dårligeVennerInput");

  // Læser og renser værdierne fra inputfelterne
  const navn      = navnEl.value.trim();
  const godVen    = godVenEl.value.split(",").map(s => s.trim()).filter(Boolean);
  const dårligVen = dårligVenEl.value.split(",").map(s => s.trim()).filter(Boolean);

  // Idiottest: tjekker om elevnavnet er udfyldt
  if (!navn) {
    visbesked ("Indtast et navn.", "error");
    navnEl.focus();
    return;
  }

  // Idiottest: tjekker om en elev er sat som både god og dårlig ven
  if (godVen.some(v => dårligVen.includes(v))) {
    visbesked ("En elev kan ikke være både god ven og dårlig ven.", "error");
    return;
  }

  // Deaktiverer knappen mens eleven bliver tilføjet
  const knap = document.getElementById("tilføjKnap");
  knap.disabled = true;
  knap.textContent = "Tilføjer...";

  // Sender POST-request til serveren med elevdata
  const res = await fetch('/elever', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      navn,
      godeVenner: godVen.length ? godVen.join(", ") : null,
      dårligeVenner: dårligVen.length ? dårligVen.join(", ") : null,
    }),
  });

  // Aktiverer knappen igen efter request er afsluttet
  knap.disabled = false;
  knap.textContent = "Tilføj til liste";

  // Viser fejlbesked hvis serveren returnerer en fejl
  if (!res.ok) {
    visbesked ("Fejl: Kunne ikke oprette elev.", "error");
    return;
  }

  // Viser succesbesked og rydder inputfelterne
  visbesked (`"${navn}" blev tilføjet.`, "success");
  navnEl.value      = "";
  godVenEl.value    = "";
  dårligVenEl.value = "";

  // Opdaterer elevdata så WFC kan bruge det
  if (typeof window.init === "function") await window.init();
});

// Lytter efter Enter-tast i navnefeltet og simulerer klik på knappen
document.getElementById("navnInput").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("tilføjKnap").click();
});
