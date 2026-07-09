const couleurs = ['rouge', 'vert', 'bleu'];
const nombres = [1, 2, 3, 4, 5, 6];
let deck = [];

function genererDeck() {
    deck = [];
    couleurs.forEach(couleur => {
        nombres.forEach(nombre => {
            // 2 exemplaires au lieu de 3 pour plus de lisibilité
            for (let i = 0; i < 2; i++) {
                deck.push({ nombre, couleur, id: `t-${couleur}-${nombre}-${i}` });
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
    div.ondragstart = (ev) => ev.dataTransfer.setData("text", ev.target.id);
    return div;
}

// Initialisation
genererDeck();
const mainJoueur = document.getElementById('main-joueur');
deck.slice(0, 12).forEach(t => mainJoueur.appendChild(creerElementTuile(t)));

function allowDrop(ev) { ev.preventDefault(); }
function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
}
let score = 0;

function reinitialiserPartie() {
    // Vider le plateau et la main
    document.getElementById('plateau').innerHTML = '';
    document.getElementById('main-joueur').innerHTML = '';
    score = 0;
    document.getElementById('score').innerText = score;
    
    // Relancer la distribution
    genererDeck();
    const mainJoueur = document.getElementById('main-joueur');
    deck.slice(0, 12).forEach(t => mainJoueur.appendChild(creerElementTuile(t)));
}

// Modifier la fonction drop pour compter les tuiles
function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const zone = ev.target;
    
    // Si on dépose sur le plateau, on incrémente le score
    if (zone.id === 'plateau') {
        zone.appendChild(document.getElementById(data));
        score++;
        document.getElementById('score').innerText = score;
    } else if (zone.id === 'main-joueur') {
        zone.appendChild(document.getElementById(data));
    }
}
