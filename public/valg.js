// Globalt objekt til at gemme bord-indstillinger (bruges på tværs af scripts)
window.BordValg = {
  eleverPerBord: 0,
  antalElever: 0,
};

// Henter gemte bord-indstillinger fra backend (Supabase via dit API)
async function loadBordValgFraSupabase() {
  const res = await fetch('/elever/bord'); // GET request til server
  const data = await res.json(); // Konverter svar til JSON

  // Hvis der findes data i databasen
  if (data?.length > 0) {
    const row = data[0];

    // Sikrer at værdier er tal ≥ 0 (fallback til 0 hvis ugyldig)
    const eleverPerBord = Math.max(0, Number(row.elever) || 0);
    const antalElever = Math.max(0, Number(row["antal pladser"]) || 0);

    // Opdater global state
    window.BordValg = { eleverPerBord, antalElever };
  }
}

// Gemmer bord-indstillinger til backend (Supabase via dit API)
async function gemBordValgISupabase(eleverPerBord, antalElever) {
  await fetch('/elever/bord', {
    method: 'POST', // Sender data til server
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eleverPerBord, antalElever }), // Konverter til JSON
  });
}

// Kører når HTML er loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Henter input felter og knap fra DOM
  const eleverPerBordInput = document.getElementById("eleverPerBordInput");
  const antalEleverInput = document.getElementById("antalEleverInput");
  const knap = document.getElementById("opdaterValgKnap");

  // Stop hvis noget mangler (sikkerhed)
  if (!eleverPerBordInput || !antalEleverInput || !knap) return;

  // Hent tidligere gemte værdier fra backend
  await loadBordValgFraSupabase();

  // Sæt inputfelter til de gemte værdier
  eleverPerBordInput.value = String(window.BordValg.eleverPerBord);
  antalEleverInput.value = String(window.BordValg.antalElever);

  // Når brugeren klikker på "Opdater borde"
  knap.addEventListener("click", async () => {
    // Læs input og sikre gyldige tal ≥ 0
    const eleverPerBord = Math.max(0, Number(eleverPerBordInput.value) || 0);
    const antalElever = Math.max(0, Number(antalEleverInput.value) || 0);

    // Opdater global state
    window.BordValg = { eleverPerBord, antalElever };

    // Gem værdier i databasen
    await gemBordValgISupabase(eleverPerBord, antalElever);

    // Opdater inputfelter (sikrer korrekt visning)
    eleverPerBordInput.value = String(eleverPerBord);
    antalEleverInput.value = String(antalElever);

    // Kør algoritmen (WFC = Wave Function Collapse)
    await window.runWfc();

    // Render den nye bordplan i UI
    window.renderBordeFromWFC();
  });
});
