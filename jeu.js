const couleurs = ['rouge', 'vert', 'bleu'];
const nombres = [1, 2, 3, 4, 5, 6];
let deck = [], mainJoueur = [], mainOrdi = [], score = 0;
let toutesTuiles = {}; // registre id -> {nombre, couleur, id}, pour retrouver une tuile depuis le plateau

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
        ev.dataTransfer.setData('text', div.id);
        div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    return div;
}

function initialiserPartie() {
    genererDeck();
    mainJoueur = []; mainOrdi = []; score = 0;
    document.getElementById('score').innerText = score;
    // Distribution de 5 tuiles au lieu de 7
    for(let i = 0; i < 5; i++) {
        mainJoueur.push(deck.pop());
        mainOrdi.push(deck.pop());
    }
    const conteneurJoueur = document.getElementById('main-joueur');
    conteneurJoueur.innerHTML = '';
    mainJoueur.forEach(t => conteneurJoueur.appendChild(creerElementTuile(t)));

    const plateau = document.getElementById('plateau');
    plateau.innerHTML = '';
}

function trouverCombinaison(main) {
    // 1. Suites de 2
    for (let couleur of couleurs) {
        let tuiles = main.filter(t => t.couleur === couleur).sort((a,b) => a.nombre - b.nombre);
        for (let i = 0; i <= tuiles.length - 2; i++) {
            if (tuiles[i+1].nombre === tuiles[i].nombre + 1) return [tuiles[i], tuiles[i+1]];
        }
    }
    // 2. Paires
    for (let n of nombres) {
        let groupe = main.filter(t => t.nombre === n);
        if (groupe.length >= 2) return [groupe[0], groupe[1]];
    }
    return null;
}

function tourOrdinateur() {
    const coup = trouverCombinaison(mainOrdi);
    if (coup) {
        const plateau = document.getElementById('plateau');
        coup.forEach(t => {
            const el = document.getElementById(t.id);
            if (el) plateau.appendChild(el);
            mainOrdi = mainOrdi.filter(item => item.id !== t.id);
        });
    } else if (deck.length > 0) {
        mainOrdi.push(deck.pop());
    }
}

function allowDrop(ev) { ev.preventDefault(); }

// Recalcule le score en comptant uniquement les paires/suites valides réellement
// présentes sur le plateau (une tuile isolée ne rapporte rien).
function evaluerPlateau() {
    const plateauEl = document.getElementById('plateau');
    const tuilesPlateau = Array.from(plateauEl.children)
        .map(el => toutesTuiles[el.id])
        .filter(Boolean);

    const dejaUtilisees = new Set();
    let groupesValides = 0;

    for (let i = 0; i < tuilesPlateau.length; i++) {
        const a = tuilesPlateau[i];
        if (dejaUtilisees.has(a.id)) continue;

        for (let j = i + 1; j < tuilesPlateau.length; j++) {
            const b = tuilesPlateau[j];
            if (dejaUtilisees.has(b.id)) continue;

            const estPaire = a.nombre === b.nombre;
            const estSuite = a.couleur === b.couleur && Math.abs(a.nombre - b.nombre) === 1;

            if (estPaire || estSuite) {
                dejaUtilisees.add(a.id);
                dejaUtilisees.add(b.id);
                groupesValides++;
                break;
            }
        }
    }

    score = groupesValides;
    document.getElementById('score').innerText = score;
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    if (!draggedElement) return;

    let target = ev.target;

    // Si on lâche sur une tuile, on cible le parent
    if (target.classList.contains('tuile')) target = target.parentElement;

    // Vérifier si la zone est valide (plateau ou main)
    if (target.id === 'plateau' || target.id === 'main-joueur') {
        target.appendChild(draggedElement);
        if (target.id === 'plateau') {
            evaluerPlateau();
            setTimeout(tourOrdinateur, 1000);
        }
    }
}

function joueurPioche() {
    if (deck.length > 0) {
        const t = deck.pop();
        mainJoueur.push(t);
        document.getElementById('main-joueur').appendChild(creerElementTuile(t));
        setTimeout(tourOrdinateur, 500);
    }
}

initialiserPartie();
