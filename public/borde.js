// Konstanter til beregning af bordstørrelse og pladsplacering
const Størelse = 10;
const BordDybte = 5;
const PladsStørelse = 10;

// Henter alle elevnavne fra serveren
async function fetchElevNavne() {
  const res = await fetch('/elever');
  const data = await res.json();
  return (data || []).map((row) => String(row.navn || "").trim()).filter(Boolean);
}

// Henter alle elevdata (gode og dårlige venner) fra serveren
async function fetchElevData() {
  const res = await fetch('/elever');
  const data = await res.json();
  return (data || []).map((row) => {
    const godVen = String(row["gode venner"] || "").trim();
    const dårligVen = String(row["dårlige venner"] || "").trim();
    return {
      navn: String(row.navn || "").trim(),
      ven: godVen ? [godVen] : [],
      ikkeVen: dårligVen ? [dårligVen] : [],
    };
  }).filter(e => e.navn);
}

// Henter de aktuelle bordindstillinger fra window.BordValg
function getValg() {
  const valg = window.BordValg || {};
  return {
    pladsStoerrelse: PladsStørelse,
    eleverPerBord: Math.max(0, Number(valg.eleverPerBord) || 0),
    antalElever: Math.max(0, Number(valg.antalElever) || 0),
  };
}

// Opretter en række af pladser med elevnavne, placeret øverst eller nederst ved bordet
function makeSeatRow(position, names) {
  const row = document.createElement("div");
  row.className = `seat-row ${position}`;
  names.forEach((name) => {
    const seat = document.createElement("div");
    seat.className = "seat";
    seat.textContent = name;
    row.appendChild(seat);
  });
  return row;
}

// Bygger html-strukturen for ét bord med pladsrækker øverst og nederst
function renderTable(table, root) {
  const card = document.createElement("article");
  card.className = "table-card";

  const layout = document.createElement("div");
  layout.className = "table-layout";
  layout.style.width = `${table.width + 16}px`;

  const rect = document.createElement("div");
  rect.className = "table-rect";
  rect.style.width = `${table.width}px`;
  rect.style.height = `${BordDybte * Størelse}px`;

  layout.append(makeSeatRow("top", table.topNames), rect, makeSeatRow("bottom", table.bottomNames));
  card.appendChild(layout);
  root.appendChild(card);
}

// Beregner bordenes bredde og fordeler elever øverst og nederst ud fra WFC-grupperne
function buildTables(grupper) {
  const { pladsStoerrelse } = getValg();
  const tables = [];

  grupper.forEach((gruppe) => {
    const topCount = Math.ceil(gruppe.length / 2);
    const bottomCount = Math.floor(gruppe.length / 2);
    const maxPerSide = Math.max(topCount, bottomCount, 1);

    tables.push({
      width: maxPerSide * pladsStoerrelse * Størelse,
      topNames: gruppe.slice(0, topCount),
      bottomNames: gruppe.slice(topCount, topCount + bottomCount),
    });
  });

  return tables;
}

// Renderer alle borde i #app baseret på WFC-algoritmens resultat
function renderBordeFromWFC() {
  const app = document.getElementById("app");
  if (!app) throw new Error("rootEl mangler.");
  app.innerHTML = "";

  const tables = buildTables(window.WFCResult.grupper);
  tables.forEach((table) => renderTable(table, app));
}

// Kører WFC-algoritmen 20 gange og gemmer det bedste resultat
async function runWfc() {
  const elever = window.ElevData || [];
  if (elever.length === 0) {
    console.error("Ingen elevdata tilgængelig");
    return false;
  }
  const { eleverPerBord, antalElever } = getValg();
  // Begrænser elevlisten til det valgte antal elever
  const begrænsedElever = elever.slice(0, antalElever);
  const antalgrupper = Math.ceil(antalElever / eleverPerBord);

  try {
    let bedsteScore = -Infinity;
    let bedsteResultat = [];

    for (let i = 0; i < 20; i++) {
      const wfcInstance = new wfc(begrænsedElever, antalgrupper, eleverPerBord);
      wfcInstance.run();
      const score = wfcInstance.beregnScore();

      // Gemmer resultatet hvis scoren er bedre end den hidtil bedste
      if (score > bedsteScore) {
        bedsteScore = score;
        bedsteResultat = wfcInstance.grupper;
      }
    }

    window.WFCResult = {
      grupper: bedsteResultat,
      score: bedsteScore,
    };

    return true;
  } catch (error) {
    console.error("WFC algoritme fejl:", error);
    return false;
  }
}

// Henter elevnavne og elevdata fra serveren og gemmer dem globalt
async function init() {
  window.ElevNavne = await fetchElevNavne();
  window.ElevData = await fetchElevData();
}

init();
