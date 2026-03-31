const Størelse = 10;
const BordDybte = 5;
const PladsStørelse = 10;
const PersonNavn = "Navn";

async function fetchElevNavne() {
  if (!window.supabase) return [];

  const { data, error } = await window.supabase
    .from("elev")
    .select("navn")
    .order("navn", { ascending: true });

  if (error) {
    console.error("Hent elevnavne fra Supabase fejlede", error);
    return [];
  }

  return (data || []).map((row) => String(row.navn || "").trim()).filter(Boolean);
}

async function fetchElevData() {
  if (!window.supabase) return [];

  const { data, error } = await window.supabase
    .from("elev")
    .select("navn, \"gode venner\", \"dårlige venner\"")

  if (error) {
    console.error("Hent elevdata fra Supabase fejlede", error);
    return [];
  }

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

function getValg() {
  const valg = window.BordValg || {};
  return {
    pladsStoerrelse: PladsStørelse,
    eleverPerBord: Math.max(0, Number(valg.eleverPerBord) || 0),
    antalElever: Math.max(0, Number(valg.antalElever) || 0),
  };
}

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

function convertgruppesToTables(grupper) {
  const { pladsStoerrelse } = getValg();
  const tables = [];

  grupper.forEach((gruppe) => {
    const eleverVedBord = gruppe.length;
    const topCount = Math.ceil(eleverVedBord / 2);
    const bottomCount = Math.floor(eleverVedBord / 2);
    const maxPerSide = Math.max(topCount, bottomCount, 1);

    const topNames = gruppe.slice(0, topCount);
    const bottomNames = gruppe.slice(topCount, topCount + bottomCount);

    tables.push({
      width: maxPerSide * pladsStoerrelse * Størelse,
      topNames: topNames.length ? topNames : [PersonNavn],
      bottomNames: bottomNames.length ? bottomNames : [PersonNavn],
    });
  });

  return tables;
}

function buildTables() {
  const { pladsStoerrelse, eleverPerBord, antalElever } = getValg();
  const totalBorde = Math.ceil(antalElever / eleverPerBord);
  const tables = [];

  const elevNavne = window.ElevNavne || [];

  const elever = [];
  for (let i = 0; i < antalElever; i += 1) {
    elever.push(elevNavne[i % elevNavne.length] || "Tom plads");
  }

  for (let i = 0; i < totalBorde; i += 1) {
    const startIndex = i * eleverPerBord;
    const eleverVedBord = Math.min(eleverPerBord, antalElever - startIndex);
    const topCount = Math.ceil(eleverVedBord / 2);
    const bottomCount = Math.floor(eleverVedBord / 2);
    const maxPerSide = Math.max(topCount, bottomCount, 1);

    const seatNames = elever.slice(startIndex, startIndex + eleverVedBord);
    const topNames = seatNames.slice(0, topCount);
    const bottomNames = seatNames.slice(topCount, topCount + bottomCount);

    tables.push({
      width: maxPerSide * pladsStoerrelse * Størelse,
      topNames: topNames.length ? topNames : [PersonNavn],
      bottomNames: bottomNames.length ? bottomNames : [PersonNavn],
    });
  }

  return tables;
}

function renderBorde() {
  const app = document.getElementById("app");
  if (!app) throw new Error("rootEl mangler.");
  app.innerHTML = "";
  buildTables().forEach((table) => renderTable(table, app));
}

function renderBordeFromWFC() {
  const app = document.getElementById("app");
  if (!app) throw new Error("rootEl mangler.");
  app.innerHTML = "";

  let tables;
  if (window.WFCResult && window.WFCResult.grupper) {
    tables = convertgruppesToTables(window.WFCResult.grupper);
    const scoreEl = document.createElement("p");
    scoreEl.textContent = `Score: ${window.WFCResult.score}`;
    scoreEl.style.margin = "0 0 16px";
    app.appendChild(scoreEl);
  } else {
    tables = buildTables();
  }

  tables.forEach((table) => renderTable(table, app));
}

async function runWfc() {
  const elever = window.ElevData || [];
  if (elever.length === 0) {
    console.error("Ingen elevdata tilgængelig");
    return false;
  }
  const { eleverPerBord, antalElever } = getValg();
  const antalgrupper = Math.ceil(antalElever / eleverPerBord);

  try {
    let bedsteScore = -Infinity;
    let bedsteResultat = [];

    for (let i = 0; i < 20; i++) {
      const wfcInstance = new wfc(elever, antalgrupper, eleverPerBord);
      wfcInstance.run();
      const score = wfcInstance.beregnScore();

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
async function init() {
  window.ElevNavne = await fetchElevNavne();
  window.ElevData = await fetchElevData();
}

init();