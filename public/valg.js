window.BordValg = {
  eleverPerBord: 0,
  antalElever: 0,
};

async function loadBordValgFraSupabase() {
  if (!window.supabase) return;

  const { data, error } = await window.supabase
    .from("bord")
    .select("elever, \"antal pladser\"")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.warn("Kunne ikke hente bordvalg fra Supabase", error);
    return;
  }

  if (data?.length > 0) {
    const row = data[0];
    const eleverPerBord = Math.max(0, Number(row.elever) || window.BordValg.eleverPerBord);
    const antalElever = Math.max(0, Number(row["antal pladser"]) || window.BordValg.antalElever);

    window.BordValg = { eleverPerBord, antalElever };
  }
}

async function gemBordValgISupabase(eleverPerBord, antalElever) {
  if (!window.supabase) return;

  const { error } = await window.supabase.from("bord").insert([
    {
      elever: eleverPerBord,
      "antal pladser": antalElever,
    },
  ]);

  if (error) console.warn("Kunne ikke gemme bordvalg til Supabase", error);
}

document.addEventListener("DOMContentLoaded", async () => {
  const eleverPerBordInput = document.getElementById("eleverPerBordInput");
  const antalEleverInput = document.getElementById("antalEleverInput");
  const knap = document.getElementById("opdaterValgKnap");

  if (!eleverPerBordInput || !antalEleverInput || !knap) return;

  await loadBordValgFraSupabase();

  eleverPerBordInput.value = String(window.BordValg.eleverPerBord);
  antalEleverInput.value = String(window.BordValg.antalElever);

  knap.addEventListener("click", async () => {
    const eleverPerBord = Math.max(0, Number(eleverPerBordInput.value) || 0);
    const antalElever = Math.max(0, Number(antalEleverInput.value) || 0);

    window.BordValg = { eleverPerBord, antalElever };

    await gemBordValgISupabase(eleverPerBord, antalElever);

    eleverPerBordInput.value = String(eleverPerBord);
    antalEleverInput.value = String(antalElever);

    // Prøv at køre WFC hvis elevdata er tilgængelig
    const wfcSuccess = typeof window.runWfc === "function"  // Tjek om runWfc er defineret
      ? await window.runWfc() // Antag at runWfc returnerer en promise der indikerer succes eller fejl
      : false; // Hvis WFC ikke er tilgængelig eller fejler, fortsæt med at tegne borde

    // Tegn borde baseret på WFC-resultat eller fallback
    if (typeof window.renderBordeFromWFC === "function") {
      window.renderBordeFromWFC();
    } else if (typeof window.renderBorde === "function") {
      window.renderBorde();
    }
  });
});
