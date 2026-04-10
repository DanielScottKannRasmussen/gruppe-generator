//supabase klienten hentet fra globale objekt
const sb = window.supabase; 

function visBedsked(besked, type = "success") { 
  const el = document.getElementById("toast");
  el.textContent = besked;
  el.className = type;
  clearTimeout(el._timer);// nustiller tidlegere timer
  el._timer = setTimeout(() => { el.className = ""; el.textContent = ""; }, 4000);
}

//  Tilføj elev 
document.getElementById("tilføjKnap").addEventListener("click", async () => {
  // Hent og valider input fra DOM
  const navnEl      = document.getElementById("navnInput");
  const godVenEl    = document.getElementById("godeVennerInput");
  const dårligVenEl = document.getElementById("dårligeVennerInput");

  const navn      = navnEl.value.trim();
  const godVen    = godVenEl.value.split(",").map(s => s.trim()).filter(Boolean);
  const dårligVen = dårligVenEl.value.split(",").map(s => s.trim()).filter(Boolean);

  if (!navn) { //ser om der er et navn
    visBedsked("Indtast et navn.", "error");
    navnEl.focus();
    return;
  }

  if (godVen.some(v => dårligVen.includes(v))) { //tjekker om der er en ven som også er en uven
    visBedsked("En elev kan ikke være både god ven og dårlig ven.", "error");
    return;
  }

  const knap = document.getElementById("tilføjKnap");
  knap.disabled = true;
  knap.textContent = "Tilføjer...";

  //indsætter ny elev i supabase tabellen elev
  const { error } = await sb.from("elev").insert([{
    navn,
    "gode venner":    godVen.length    ? godVen.join(", ")    : null, // hvis der er nogen gode venner, sættes de til en streng, ellers sæt til null
    "dårlige venner": dårligVen.length ? dårligVen.join(", ") : null, // det samme for u ven
  }]);

  knap.disabled = false;
  knap.textContent = "Tilføj til liste";

  if (error) {
    console.error(error);
    visBedsked("Fejl: " + (error.message || "Kunne ikke oprette elev."), "error");
    return;
  }

  visBedsked(`"${navn}" blev tilføjet.`, "success"); //komfimations besked om at det virker
  navnEl.value      = "";
  godVenEl.value    = "";
  dårligVenEl.value = "";

  // Opdater elevdata så WFC kan bruge det
  if (typeof window.init === "function") await window.init();
});

// Enter-tast i navnefeltet 
document.getElementById("navnInput").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("tilføjKnap").click();
});
