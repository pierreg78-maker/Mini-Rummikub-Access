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
let enTourJoueur = true; // verrou : empêche de piocher/valider pendant le tour de l'ordinateur

// Nombre minimum de tuiles pour qu'un groupe (paire/trio ou suite) soit
// valide. Réglable par le sélecteur "Min. Cartes" (2 = paires autorisées,
// 3 = triades/suites de 3 minimum).
let tailleMinGroupe = 2;

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
    div.addEventListener('pointerdown', (ev) => demarrerGlisser(ev, div, t.id));
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

// ---------- Réglage : taille minimale d'un groupe ----------

function definirTailleMinGroupe(taille) {
    tailleMinGroupe = taille;
    const btn2 = document.getElementById('btn-min-2');
    const btn3 = document.getElementById('btn-min-3');
    const curseur = document.getElementById('toggle-curseur');
    if (btn2) btn2.classList.toggle('actif', taille === 2);
    if (btn3) btn3.classList.toggle('actif', taille === 3);
    if (curseur) curseur.classList.toggle('droite', taille === 3);
    afficherMessage(taille === 2
        ? "Règle changée : les paires (2 tuiles) sont autorisées."
        : "Règle changée : chaque groupe doit avoir au moins 3 tuiles (triades/suites).");
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
    enTourJoueur = true;
    definirBoutonsActifs(true);
    afficherTour("À toi de jouer !");
}

// Active/désactive les boutons d'action pendant que l'ordinateur joue, pour
// empêcher les taps répétés (double-piocher, double-valider) qui faussaient
// la partie quand on cliquait plusieurs fois pendant le délai de l'IA.
function definirBoutonsActifs(actif) {
    const btnValider = document.querySelector('.btn-valider');
    const btnPiocher = document.querySelector('.btn-piocher');
    if (btnValider) btnValider.disabled = !actif;
    if (btnPiocher) btnPiocher.disabled = !actif;
}

// ---------- Validation des groupes ----------

function estGroupeValide(tuiles) {
    if (tuiles.length < tailleMinGroupe) return false;

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

// ---------- Tri automatique des groupes ----------

const ordreCouleur = { rouge: 0, vert: 1, bleu: 2 };

// Range les tuiles d'un groupe : par chiffre croissant si c'est une suite
// (même couleur), par couleur si c'est une paire/trio (même chiffre).
// Ainsi, ajouter une tuile à une suite ne la place plus systématiquement
// à droite : elle est réinsérée au bon endroit.
function trierGroupe(groupe) {
    const tuiles = groupe.tuiles.map(id => toutesTuiles[id]).filter(Boolean);
    if (tuiles.length < 2) return;

    const nombresDistincts = new Set(tuiles.map(t => t.nombre));
    if (nombresDistincts.size === 1) {
        tuiles.sort((a, b) => ordreCouleur[a.couleur] - ordreCouleur[b.couleur]);
    } else {
        tuiles.sort((a, b) => a.nombre - b.nombre);
    }
    groupe.tuiles = tuiles.map(t => t.id);
}

function trierTousLesGroupes() {
    plateauGroupes.forEach(trierGroupe);
}

// ---------- Rendu ----------

function renduComplet() {
    trierTousLesGroupes();

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
    zoneNouveauGroupe.innerText = '+Nouveau groupe';
    plateau.appendChild(zoneNouveauGroupe);

    majCompteurOrdi();
}

// ---------- Glisser-déposer (souris ET tactile via Pointer Events) ----------
//
// L'ancien système reposait sur l'API HTML5 Drag & Drop (dragstart/drop),
// qui ne fonctionne pas sur les écrans tactiles des téléphones. On utilise
// désormais les Pointer Events, qui unifient souris, stylet et doigt.
// Principe : au pointerdown sur une tuile, on crée un "fantôme" qui suit le
// doigt ; au pointerup, on regarde ce qu'il y a sous le doigt (élément
// groupe / nouveau groupe / main) pour savoir où ranger la tuile.

let fantomeActif = null;

function demarrerGlisser(evDepart, div, id) {
    // Ignore les clics droits/molette éventuels à la souris.
    if (evDepart.pointerType === 'mouse' && evDepart.button !== 0) return;
    evDepart.preventDefault();

    const rect = div.getBoundingClientRect();
    const decalageX = evDepart.clientX - rect.left;
    const decalageY = evDepart.clientY - rect.top;

    const fantome = div.cloneNode(true);
    fantome.classList.add('fantome');
    fantome.style.position = 'fixed';
    fantome.style.left = rect.left + 'px';
    fantome.style.top = rect.top + 'px';
    fantome.style.width = rect.width + 'px';
    fantome.style.height = rect.height + 'px';
    fantome.style.margin = '0';
    document.body.appendChild(fantome);
    fantomeActif = fantome;

    div.classList.add('dragging');
    div.setPointerCapture(evDepart.pointerId);

    function trouverCible(x, y) {
        fantome.style.display = 'none';
        const el = document.elementFromPoint(x, y);
        fantome.style.display = '';
        return el;
    }

    function surSurvol(cible) {
        document.querySelectorAll('.groupe, .nouveau-groupe, #main-joueur').forEach(el => el.classList.remove('survole'));
        if (cible) cible.classList.add('survole');
    }

    function deplacer(ev) {
        ev.preventDefault();
        fantome.style.left = (ev.clientX - decalageX) + 'px';
        fantome.style.top = (ev.clientY - decalageY) + 'px';
        const elSousDoigt = trouverCible(ev.clientX, ev.clientY);
        const cible = elSousDoigt ? elSousDoigt.closest('.groupe, .nouveau-groupe, #main-joueur') : null;
        surSurvol(cible);
    }

    function terminer(ev) {
        ev.preventDefault();
        const elSousDoigt = trouverCible(ev.clientX, ev.clientY);
        nettoyer();
        traiterDepot(id, elSousDoigt);
    }

    function annuler() {
        nettoyer();
    }

    function nettoyer() {
        fantome.remove();
        fantomeActif = null;
        div.classList.remove('dragging');
        document.querySelectorAll('.groupe, .nouveau-groupe, #main-joueur').forEach(el => el.classList.remove('survole'));
        div.removeEventListener('pointermove', deplacer);
        div.removeEventListener('pointerup', terminer);
        div.removeEventListener('pointercancel', annuler);
        try { div.releasePointerCapture(evDepart.pointerId); } catch (e) { /* déjà relâché */ }
    }

    div.addEventListener('pointermove', deplacer);
    div.addEventListener('pointerup', terminer);
    div.addEventListener('pointercancel', annuler);
}

// Détermine où ranger la tuile relâchée en fonction de l'élément survolé,
// puis met à jour l'état du jeu (équivalent de l'ancienne fonction drop()).
function traiterDepot(id, elSousDoigt) {
    const tuile = toutesTuiles[id];
    if (!tuile) return;

    retirerTuilePartout(id);

    const groupeCible = elSousDoigt ? elSousDoigt.closest('.groupe') : null;
    const nouveauGroupeCible = elSousDoigt ? elSousDoigt.closest('.nouveau-groupe') : null;
    const mainCible = elSousDoigt ? elSousDoigt.closest('#main-joueur') : null;
    const tuileCible = elSousDoigt ? elSousDoigt.closest('.tuile') : null;

    if (groupeCible) {
        let groupe = plateauGroupes.find(g => g.id === groupeCible.dataset.groupeId);
        if (!groupe) {
            groupe = { id: groupeCible.dataset.groupeId, tuiles: [] };
            plateauGroupes.push(groupe);
        }
        groupe.tuiles.push(id);
    } else if (nouveauGroupeCible) {
        plateauGroupes.push({ id: `g${compteurGroupe++}`, tuiles: [id] });
    } else if (mainCible || tuileCible) {
        // Insertion à la position visée (permet de réorganiser librement la main),
        // ou à la fin si on dépose sur un espace vide de la main.
        let indexInsertion = mainJoueur.length;
        if (tuileCible && tuileCible.id !== id) {
            const idx = mainJoueur.findIndex(t => t.id === tuileCible.id);
            if (idx !== -1) indexInsertion = idx;
        }
        mainJoueur.splice(indexInsertion, 0, tuile);
    } else {
        // Dépôt hors de toute zone connue : on rend la tuile au joueur
        // plutôt que de la perdre.
        mainJoueur.push(tuile);
    }

    fusionnerGroupesCompatibles();
    renduComplet();
}

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

// ---------- Tour du joueur ----------

function validerCoup() {
    if (!enTourJoueur) return;

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

    enTourJoueur = false;
    definirBoutonsActifs(false);

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
    if (!enTourJoueur) return;
    enTourJoueur = false;
    definirBoutonsActifs(false);

    annulerCoup();
    if (deck.length > 0) {
        mainJoueur.push(deck.pop());
        renduComplet();
        afficherMessage("Tu pioches une tuile et passes ton tour.");
        afficherTour("Tour de l'ordinateur...");
        setTimeout(tourOrdinateur, 500);
    } else {
        finManchePiocheVide();
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
    // Les combinaisons de 2 tuiles (paires, suites de 2) ne sont cherchées
    // que si le réglage "Min. Cartes" autorise les paires.
    if (tailleMinGroupe <= 2) {
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
        afficherMessage(`L'ordinateur pose une ${typeGroupe} (${coup.map(t => t.nombre + ' ' + t.couleur).join(', ')}). À toi de jouer !`);
        if (mainOrdi.length === 0) {
            finDeManche('ordinateur');
            return;
        }
    } else if (deck.length > 0) {
        mainOrdi.push(deck.pop());
        renduComplet();
        afficherMessage("L'ordinateur ne peut rien poser et pioche. À toi de jouer !");
    } else {
        afficherMessage("L'ordinateur ne peut rien poser (pioche vide). À toi de jouer !");
    }
    demarrerTourJoueur();
}

// ---------- Fin de manche par blocage (pioche vide) ----------

// Quand la pioche est vide et que le joueur ne peut plus rien poser ni
// piocher, la partie ne peut plus avancer : on arrête la manche ici même,
// sans bouton ni fenêtre d'alerte, juste un message dans le journal.
// Les points sont comptés sur la différence de valeur entre les deux mains :
// celui qui a le moins de tuiles en main gagne la différence.
function finManchePiocheVide() {
    const valeurJoueur = mainJoueur.reduce((s, t) => s + t.nombre, 0);
    const valeurOrdi = mainOrdi.reduce((s, t) => s + t.nombre, 0);

    let resultat;
    if (valeurJoueur < valeurOrdi) {
        const gain = valeurOrdi - valeurJoueur;
        score += gain;
        resultat = `tu gagnes ${gain} point${gain > 1 ? 's' : ''} (${valeurJoueur} en main contre ${valeurOrdi} pour l'ordinateur)`;
    } else if (valeurJoueur > valeurOrdi) {
        const perte = valeurJoueur - valeurOrdi;
        score -= perte;
        resultat = `tu perds ${perte} point${perte > 1 ? 's' : ''} (${valeurJoueur} en main contre ${valeurOrdi} pour l'ordinateur)`;
    } else {
        resultat = `égalité, aucun point n'est échangé (${valeurJoueur} tuiles en main de chaque côté)`;
    }

    document.getElementById('score').innerText = score;
    afficherMessage(`Pioche vide, plus aucun coup possible : la manche s'arrête ici et les points sont comptés — ${resultat}.`);

    setTimeout(demarrerNouvelleManche, 2500);
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

// ---------- Initialisation ----------
// Le glisser-déposer est entièrement géré via Pointer Events (voir plus haut),
// ce qui fonctionne aussi bien à la souris qu'au doigt sur un écran tactile.
// Aucun écouteur global de type "dragover"/"drop" n'est donc nécessaire ici.

initialiserPartie();
