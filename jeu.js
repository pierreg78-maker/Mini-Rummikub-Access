const couleurs = ['rouge', 'vert', 'bleu'];
const nombres = [1, 2, 3, 4, 5, 6];

let deck = [];
let mainJoueur = [];   // tableau de tuiles {nombre, couleur, id}
let mainOrdi = [];     // tableau de tuiles
let plateauGroupes = []; // tableau de {id, tuiles:[id,id,...]}
let toutesTuiles = {}; // registre id -> tuile
let compteurGroupe = 0;
let score = 0;

let baselineGroupes = [];
let baselineMainJoueurIds = [];

function cloneGroupes(g) {
    return g.map(groupe => ({ id: groupe.id, tuiles: [...groupe.tuiles] }));
}

function genererDeck() {
    deck = [];
    toutesTuiles = {};
    couleurs.forEach(couleur => {
        nombres.forEach(nombre => {
            for (let i = 0; i < 2; i++) {
                const t = { nombre, couleur, id: `t-${couleur}-${nombre}-${i}` };
                deck.push(t);
                toutesTuiles[t.id] = t;
            }
        });
    });
    deck.sort(() => Math.random() - 0.5);
}

function creerElementTuile(t) {
    const div = document.createElement('div');
    div.className = `tuile ${t.couleur}`;
    div.innerText = t.nombre;
    div.id = t.id;
    div.draggable = true;
    div.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', div.id);
        div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    return div;
}

// ---------- Journal / indicateurs ----------

function afficherMessage(txt) {
    const j = document.getElementById('journal');
    if (j) j.innerText = txt;
}

function afficherTour(txt) {
    const t = document.getElementById('tour-actuel');
    if (t) t.innerText = txt;
}

function majCompteurOrdi() {
    const el = document.getElementById('ordi-compte');
    if (el) el.innerText = mainOrdi.length;
}

// ---------- Partie / Manche ----------

function initialiserPartie() {
    score = 0;
    document.getElementById('score').innerText = score;
    demarrerNouvelleManche();
}

function demarrerNouvelleManche() {
    genererDeck();
    mainJoueur = [];
    mainOrdi = [];
    plateauGroupes = [];
    compteurGroupe = 0;
    for (let i = 0; i < 5; i++) {
        mainJoueur.push(deck.pop());
        mainOrdi.push(deck.pop());
    }
    renduComplet();
    afficherMessage("Nouvelle manche : à toi de jouer.");
    demarrerTourJoueur();
}

function demarrerTourJoueur() {
    baselineGroupes = cloneGroupes(plateauGroupes);
    baselineMainJoueurIds = mainJoueur.map(t => t.id);
    afficherTour("À toi de jouer !");
}

// ---------- Validation des groupes ----------

function estGroupeValide(tuiles) {
    if (tuiles.length < 2) return false;

    const nombresDistincts = new Set(tuiles.map(t => t.nombre));
    const couleursDistinctes = new Set(tuiles.map(t => t.couleur));

    if (nombresDistincts.size === 1) {
        return couleursDistinctes.size === tuiles.length && tuiles.length <= 3;
    }

    if (couleursDistinctes.size === 1) {
        const triees = [...tuiles].sort((a, b) => a.nombre - b.nombre);
        for (let i = 1; i < triees.length; i++) {
            if (triees[i].nombre !== triees[i - 1].nombre + 1) return false;
        }
        return true;
    }

    return false;
}

// ---------- Tri de la main ----------

function trierMainParCouleur() {
    const ordre = { rouge: 0, vert: 1, bleu: 2 };
    mainJoueur.sort((a, b) => ordre[a.couleur] - ordre[b.couleur] || a.nombre - b.nombre);
    renduComplet();
}

function trierMainParChiffre() {
    mainJoueur.sort((a, b) => a.nombre - b.nombre || a.couleur.localeCompare(b.couleur));
    renduComplet();
}

// ---------- Rendu ----------

function renduComplet() {
    const conteneurJoueur = document.getElementById('main-joueur');
    conteneurJoueur.innerHTML = '';
    mainJoueur.forEach(t => conteneurJoueur.appendChild(creerElementTuile(t)));

    const plateau = document.getElementById('plateau');
    plateau.innerHTML = '';
    plateauGroupes.forEach((groupe, index) => {
        const divGroupe = document.createElement('div');
        divGroupe.className = 'groupe';
        divGroupe.dataset.groupeId = groupe.id;
        divGroupe.dataset.numero = `Groupe ${index + 1}`;
        divGroupe.title = `Groupe ${index + 1}`;
        divGroupe.addEventListener('dragover', allowDrop);
        divGroupe.addEventListener('drop', (ev) => drop(ev, 'groupe', groupe.id));
        groupe.tuiles.forEach(id => {
            const t = toutesTuiles[id];
            if (t) divGroupe.appendChild(creerElementTuile(t));
        });
        plateau.appendChild(divGroupe);
    });

    // Zone toujours visible et bien délimitée pour démarrer un NOUVEAU groupe.
    // Évite qu'une tuile déposée "à côté" d'un groupe existant crée par erreur
    // un second groupe d'une seule tuile.
    const zoneNouveauGroupe = document.createElement('div');
    zoneNouveauGroupe.className = 'nouveau-groupe';
    zoneNouveauGroupe.innerText = '+ Nouveau groupe';
    zoneNouveauGroupe.addEventListener('dragover', allowDrop);
    zoneNouveauGroupe.addEventListener('drop', (ev) => drop(ev, 'nouveauGroupe'));
    plateau.appendChild(zoneNouveauGroupe);

    majCompteurOrdi();
}

// ---------- Drag & drop ----------

function allowDrop(ev) { ev.preventDefault(); }

function retirerTuilePartout(id) {
    mainJoueur = mainJoueur.filter(t => t.id !== id);
    plateauGroupes = plateauGroupes
        .map(g => ({ id: g.id, tuiles: g.tuiles.filter(tid => tid !== id) }))
        .filter(g => g.tuiles.length > 0);
}

// Fusionne automatiquement deux groupes du plateau si leur réunion forme une
// combinaison valide (paire/trio/suite). Évite d'avoir des tuiles isolées qui
// auraient dû rejoindre un groupe voisin mais ont atterri à côté par erreur.
function fusionnerGroupesCompatibles() {
    let fusionEffectuee = true;
    while (fusionEffectuee) {
        fusionEffectuee = false;
        for (let i = 0; i < plateauGroupes.length && !fusionEffectuee; i++) {
            for (let j = i + 1; j < plateauGroupes.length; j++) {
                const a = plateauGroupes[i];
                const b = plateauGroupes[j];
                const combinees = [...a.tuiles, ...b.tuiles].map(id => toutesTuiles[id]);
                if (estGroupeValide(combinees)) {
                    a.tuiles = [...a.tuiles, ...b.tuiles];
                    plateauGroupes.splice(j, 1);
                    fusionEffectuee = true;
                    break;
                }
            }
        }
    }
}

function drop(ev, targetType, targetGroupeId) {
    ev.preventDefault();
    ev.stopPropagation(); // empêche le drop de "remonter" et d'être traité une 2e fois par un parent
    const id = ev.dataTransfer.getData('text/plain');
    const tuile = toutesTuiles[id];
    if (!tuile) return;

    const cibleEl = ev.target; // capturé avant modification de l'état

    retirerTuilePartout(id);

    if (targetType === 'main') {
        // Insertion à la position visée (permet de réorganiser librement la main),
        // ou à la fin si on dépose sur un espace vide.
        let indexInsertion = mainJoueur.length;
        if (cibleEl && cibleEl.classList && cibleEl.classList.contains('tuile') && cibleEl.id !== id) {
            const idx = mainJoueur.findIndex(t => t.id === cibleEl.id);
            if (idx !== -1) indexInsertion = idx;
        }
        mainJoueur.splice(indexInsertion, 0, tuile);
    } else if (targetType === 'groupe') {
        let groupe = plateauGroupes.find(g => g.id === targetGroupeId);
        if (!groupe) {
            groupe = { id: targetGroupeId, tuiles: [] };
            plateauGroupes.push(groupe);
        }
        groupe.tuiles.push(id);
    } else if (targetType === 'nouveauGroupe') {
        plateauGroupes.push({ id: `g${compteurGroupe++}`, tuiles: [id] });
    }

    fusionnerGroupesCompatibles();
    renduComplet();
}

// ---------- Tour du joueur ----------

function validerCoup() {
    const toutesValides = plateauGroupes.every(g =>
        estGroupeValide(g.tuiles.map(id => toutesTuiles[id]))
    );

    if (!toutesValides) {
        alert("Un ou plusieurs groupes sur le plateau ne sont pas valides (paire/trio = même chiffre, couleurs différentes ; suite = même couleur, chiffres qui se suivent).");
        return;
    }

    const auMoinsUneJouee = baselineMainJoueurIds.some(id => !mainJoueur.some(t => t.id === id));
    if (!auMoinsUneJouee) {
        alert("Tu dois poser au moins une tuile de ta main ce tour-ci.");
        return;
    }

    if (mainJoueur.length === 0) {
        finDeManche('joueur');
        return;
    }

    afficherTour("Tour de l'ordinateur...");
    setTimeout(tourOrdinateur, 800);
}

function annulerCoup() {
    plateauGroupes = cloneGroupes(baselineGroupes);
    mainJoueur = baselineMainJoueurIds.map(id => toutesTuiles[id]);
    renduComplet();
}

function joueurPioche() {
    annulerCoup();
    if (deck.length > 0) {
        mainJoueur.push(deck.pop());
        renduComplet();
        afficherMessage("Tu piochés une tuile et passes ton tour.");
        afficherTour("Tour de l'ordinateur...");
        setTimeout(tourOrdinateur, 500);
    } else {
        alert('La pioche est vide !');
    }
}

// ---------- Tour de l'ordinateur ----------

function trouverCombinaisonIA(main) {
    for (let n of nombres) {
        const groupe = main.filter(t => t.nombre === n);
        const parCouleur = [...new Map(groupe.map(t => [t.couleur, t])).values()];
        if (parCouleur.length >= 3) return parCouleur.slice(0, 3);
    }
    for (let couleur of couleurs) {
        const tuiles = main.filter(t => t.couleur === couleur).sort((a, b) => a.nombre - b.nombre);
        for (let i = 0; i <= tuiles.length - 3; i++) {
            if (tuiles[i + 1].nombre === tuiles[i].nombre + 1 && tuiles[i + 2].nombre === tuiles[i + 1].nombre + 1) {
                return [tuiles[i], tuiles[i + 1], tuiles[i + 2]];
            }
        }
    }
    for (let couleur of couleurs) {
        const tuiles = main.filter(t => t.couleur === couleur).sort((a, b) => a.nombre - b.nombre);
        for (let i = 0; i <= tuiles.length - 2; i++) {
            if (tuiles[i + 1].nombre === tuiles[i].nombre + 1) return [tuiles[i], tuiles[i + 1]];
        }
    }
    for (let n of nombres) {
        const groupe = main.filter(t => t.nombre === n);
        const parCouleur = [...new Map(groupe.map(t => [t.couleur, t])).values()];
        if (parCouleur.length >= 2) return parCouleur.slice(0, 2);
    }
    return null;
}

function tourOrdinateur() {
    const coup = trouverCombinaisonIA(mainOrdi);
    if (coup) {
        const typeGroupe = new Set(coup.map(t => t.nombre)).size === 1
            ? (coup.length === 3 ? "trio" : "paire")
            : "suite";
        plateauGroupes.push({ id: `g${compteurGroupe++}`, tuiles: coup.map(t => t.id) });
        mainOrdi = mainOrdi.filter(t => !coup.some(c => c.id === t.id));
        fusionnerGroupesCompatibles();
        renduComplet();
        afficherMessage(`L'ordinateur pose une ${typeGroupe} (${coup.map(t => t.nombre + ' ' + t.couleur).join(', ')}).`);
        if (mainOrdi.length === 0) {
            finDeManche('ordinateur');
            return;
        }
    } else if (deck.length > 0) {
        mainOrdi.push(deck.pop());
        renduComplet();
        afficherMessage("L'ordinateur ne peut rien poser et pioche.");
    } else {
        afficherMessage("L'ordinateur ne peut rien poser (pioche vide).");
    }
    demarrerTourJoueur();
}

// ---------- Fin de manche ----------

function finDeManche(gagnant) {
    const valeurJoueur = mainJoueur.reduce((s, t) => s + t.nombre, 0);
    const valeurOrdi = mainOrdi.reduce((s, t) => s + t.nombre, 0);

    if (gagnant === 'joueur') {
        score += valeurOrdi;
        alert(`Manche gagnée ! L'ordinateur avait ${valeurOrdi} points de tuiles en main : +${valeurOrdi} points pour toi.`);
    } else {
        score -= valeurJoueur;
        alert(`Manche perdue. Il te restait ${valeurJoueur} points de tuiles en main : -${valeurJoueur} points.`);
    }

    document.getElementById('score').innerText = score;
    demarrerNouvelleManche();
}

// ---------- Initialisation des zones fixes ----------

document.getElementById('main-joueur').addEventListener('dragover', allowDrop);
document.getElementById('main-joueur').addEventListener('drop', (ev) => drop(ev, 'main'));
document.getElementById('plateau').addEventListener('dragover', allowDrop);

// Surligne en vert le groupe (ou la zone "Nouveau groupe") actuellement survolé
// pendant le glisser-déposer, pour savoir à l'avance où la tuile va atterrir.
document.getElementById('plateau').addEventListener('dragover', (ev) => {
    document.querySelectorAll('.groupe, .nouveau-groupe').forEach(el => el.classList.remove('survole'));
    const cible = ev.target.closest('.groupe, .nouveau-groupe');
    if (cible) cible.classList.add('survole');
});
document.addEventListener('dragend', () => {
    document.querySelectorAll('.groupe, .nouveau-groupe').forEach(el => el.classList.remove('survole'));
});
// Plus d'écouteur "drop" direct ici : chaque groupe et la zone "+ Nouveau groupe"
// gèrent leur propre dépôt (voir renduComplet). Cela évite qu'un dépôt sur un
// groupe existant "remonte" et soit repris par le plateau pour créer un doublon.

initialiserPartie();
