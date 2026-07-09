const couleurs = ['rouge', 'vert', 'bleu'];
const nombres = [1, 2, 3, 4, 5, 6];
let deck = [];
let mainJoueur = [];
let mainOrdi = [];
let score = 0;

function genererDeck() {
    deck = [];
    couleurs.forEach(couleur => {
        nombres.forEach(nombre => {
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

function initialiserPartie() {
    genererDeck();
    mainJoueur = [];
    mainOrdi = [];
    score = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('plateau').innerHTML = '';
    
    for(let i = 0; i < 6; i++) {
        mainJoueur.push(deck.pop());
        mainOrdi.push(deck.pop());
    }
    
    const conteneurJoueur = document.getElementById('main-joueur');
    conteneurJoueur.innerHTML = '';
    mainJoueur.forEach(t => conteneurJoueur.appendChild(creerElementTuile(t)));
}

function trouverCombinaison(main) {
    // Version simplifiée : cherche une suite de 3 pour l'IA
    for (let couleur of couleurs) {
        let tuiles = main.filter(t => t.couleur === couleur).sort((a,b) => a.nombre - b.nombre);
        for (let i = 0; i <= tuiles.length - 3; i++) {
            if (tuiles[i+1].nombre === tuiles[i].nombre + 1 && tuiles[i+2].nombre === tuiles[i].nombre + 2) {
                return [tuiles[i], tuiles[i+1], tuiles[i+2]];
            }
        }
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
    } else {
        if(deck.length > 0) mainOrdi.push(deck.pop());
    }
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    if (ev.target.id === 'plateau') {
        ev.target.appendChild(document.getElementById(data));
        score++;
        document.getElementById('score').innerText = score;
        setTimeout(tourOrdinateur, 1000);
    }
}

function allowDrop(ev) { ev.preventDefault(); }

function joueurPioche() {
    if (deck.length > 0) {
        const t = deck.pop();
        mainJoueur.push(t);
        document.getElementById('main-joueur').appendChild(creerElementTuile(t));
        setTimeout(tourOrdinateur, 500);
    }
}

// Lancement au démarrage
initialiserPartie();
