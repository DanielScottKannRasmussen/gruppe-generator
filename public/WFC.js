class wfc {
    constructor(elev, antalgrupper, eleverPerBord) {
        if (!elev || elev.length === 0) { //sammenligner elever og elever.length med 0 grunden til at de bliver sammenlignet er at sirker sig for at der er elever at arbejde med, og at det ikke er en tom array
            throw new Error("Elev array må ikke være tomt"); //kaste en fejl hvis elever er tomt eller ikke defineret
        }

        this.elev = elev;
        this.antalgrupper = antalgrupper;
        this.eleverPerBord = eleverPerBord;
        this.cells = [];

        this.elevMap = {}; 
        for (const e of elev) this.elevMap[e.navn] = e;

        this.muligt = {};
        this.grupper = []; //færdige grupper af elever efter wfc algoritmen er kørt
        this.igruppe = []; //array med elever der er i placeret i en gruppe

    }
   initCells() {
    const alleNavne = this.elev.map(e => e.navn); // lav en liste af alle elevnavne
    this.cells = []; // nulstil celler
    let elevTæller = 0; // tæller for hvor mange elever der er tildelt celler
    for (let g = 0; g < this.antalgrupper; g++) { // loop gennem alle grupper
        for (let p = 0; p < this.eleverPerBord; p++) { // loop gennem alle pladser i gruppen
            if (elevTæller >= this.elev.length) break; // stop når alle elever er tildelt celler
            this.cells.push({
                gruppeindex: g, // hvilken gruppe cellen tilhører
                pladsindex: p, // hvilken plads i gruppen cellen tilhører
                muligheder: [...alleNavne], // mulighederne for hver celle starter som alle elever (superposition)
                value: null, // værdi er null indtil en elev er valgt for cellen
                kollapsed: false // cellens kollaps status, false indtil en elev er valgt
            });
            elevTæller++; // øg tælleren for hver celle der er oprettet
        }
    }
}

    _placeret(navn) {
        return this.igruppe.includes(navn);
    }

    entropy(cell) {
        if (cell.kollapsed) return Infinity;
        return cell.muligheder.length; //antallet af mulige elever der kan placeres i cellen, jo færre muligheder, jo lavere entropi 
    }

    _vægt(elevnavn, cell) {
        if (this.igruppe.includes(elevnavn)) return -Infinity; //hvis eleven allerede er i en gruppe, er vægten minus uendelig 
        const elev = this.elevMap[elevnavn];
        let score = 0;

        //find naboer i samme gruppe der er kollapste
        const naboer = this._naboer(cell);
        for (let nabo of naboer) {
            if (!nabo.kollapsed) continue; //hvis naboen ikke er kollapset, spring den over
            const naboElev = this.elevMap[nabo.value];

            if (elev.ven.includes(naboElev.navn)) score += 2; //hvis eleven er ven med naboen, øg score
            if (elev.ikkeVen.includes(naboElev.navn)) score -= 4; //hvis eleven ikke er ven med naboen, sænk score)

            const naboObj = this.elevMap[naboElev.navn];
            if (naboObj.ven && naboObj.ven.includes(elev.navn)) score += 2; //hvis naboen er ven med eleven, øg score
            if (naboObj.ikkeVen && naboObj.ikkeVen.includes(elev.navn)) score -= 4; //hvis naboen ikke er ven med eleven, sænk score
        }
        return score;
    }

    _naboer(cell) {
        return this.cells.filter(
            c => c.gruppeindex === cell.gruppeindex && c !== cell
        );//find celler i samme gruppe og pladsindex +/- 1, altså nabo celler i samme gruppe
    }


    findlavestEntropy() {
        let min = Infinity; //satrter med at sætte minimum entropi til uendelig, så alle celler vil have lavere entropi end det 
        let index = -1;

        for (const cell of this.cells) {
            if (!cell.kollapsed) { //kun kollapsede celler er relevante for at finde lavest entropi
                const e = this.entropy(cell);

                const e_støj = e + Math.random() * 0.01; //tilføj en lille tilfældig støj for at bryde entropi ties, så algoritmen ikke altid vælger den samme celle når der er flere med samme entropi
                if (e_støj < min) { //hvis den støjede entropi er lavere end det nuværende minimum, opdater minimum og index
                    min = e_støj;
                    index = cell;
                };
            };
        };
        return index; //returner cellen med lavest entropi

    };


    kollaps(cell) {
        cell.muligheder = cell.muligheder.filter(n => !this._placeret(n));
        if (cell.muligheder.length === 0) {
            throw new Error("Ingen mulige elever for denne celle");
        }
        const vægt = cell.muligheder.map(n => {
            const v = this._vægt(n, cell); // Konverter til positiv sandsynlighed: e^(score) 
            return Math.exp(Math.max(v, -10)); //begræns vægten for at undgå overflow i exp, negative scores vil have meget lav vægt, så de næsten aldrig vælges
        });
        const total = vægt.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total; //vælg en tilfældig værdi mellem 0 og total vægt
        let valgtNavn = cell.muligheder[cell.muligheder.length - 1]; //default til sidste mulighed hvis noget går galt

        for (let i = 0; i < cell.muligheder.length; i++) {
            rand -= vægt[i]; //træk vægten fra den tilfældige værdi
            if (rand <= 0) { valgtNavn = cell.muligheder[i]; break; } //når rand er mindre eller lig med 0, har vi fundet den valgte elev 
        }

        cell.value = valgtNavn; //sæt cellens værdi til den valgte elev
        cell.kollapsed = true; //marker cellen som kollapset
        cell.muligheder = [valgtNavn]; //mulighederne for cellen er nu kun den valgte elev
        this.igruppe.push(valgtNavn); //tilføj den valgte elev til listen over elever der er i grupper
    };


   propagate(cell) {
    const kø = [cell];
    while (kø.length > 0) {
        const current = kø.shift();
        const naboer = this._naboer(current);

        for (const nabo of naboer) {
            if (nabo.kollapsed) continue;

            const førMuligheder = nabo.muligheder.length;
            // Fjern kun elever der allerede er placeret
            nabo.muligheder = nabo.muligheder.filter(n => !this._placeret(n));

            if (nabo.muligheder.length < førMuligheder) {
                if (nabo.muligheder.length === 0) {
                    throw new Error("Ingen mulige elever for denne celle efter propagering, konflikt opstået");
                }
                kø.push(nabo);
            }
        }
    }
}

    beregnScore() {
        let total = 0;
        for (const gruppe of this.grupper) {
            for (let i = 0; i < gruppe.length; i++) {
                const elev = this.elevMap[gruppe[i]];
                for (let j = i + 1; j < gruppe.length; j++) {
                    const bNavn = gruppe[j];
                    if (elev.ven && elev.ven.includes(bNavn)) total += 2; //venner i samme gruppe øger score
                    if (elev.ikkeVen && elev.ikkeVen.includes(bNavn)) total -= 4; //uvenner i samme gruppe sænker score
                }
            }
        }
        return total;
    }
    printGrupper() {
        console.log("Grupper:");
        this.grupper.forEach((g, i) => {
            console.log(`Gruppe ${i + 1}: ${g.join(", ")}`);
        });
    }

    run() {
        this.initCells()
        while (this.cells.some(c => !c.kollapsed)) {
            const cell = this.findlavestEntropy();
            this.kollaps(cell);
            this.propagate(cell);
        }
        // Saml grupper
        for (let g = 0; g < this.antalgrupper; g++) {
            const gruppe = this.cells
                .filter(c => c.gruppeindex === g)
                .map(c => c.value);
            this.grupper.push(gruppe);
        }
    }
};
