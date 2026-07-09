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
    div.addEventListener('dragstart', () => div.classList.add('dragging'));
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    return div;
}

function initialiserPartie() {
    genererDeck();
    mainJoueur = [];
    mainOrdi = [];
    score = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('plateau').innerHTML = '';
    
    // Distribution de 7 tuiles
    for(let i = 0; i < 7; i++) {
        mainJoueur.push(deck.pop());
        mainOrdi.push(deck.pop());
    }
    
    const conteneurJoueur = document.getElementById('main-joueur');
    conteneurJoueur.innerHTML = '';
    mainJoueur.forEach(t => conteneurJoueur.appendChild(creerElementTuile(t)));
}

function trouverCombinaison(main) {
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
    } else if (deck.length > 0) {
        mainOrdi.push(deck.pop());
    }
}

// Logique de réorganisation dans la main
document.getElementById('main-joueur').addEventListener('dragover', (e) => {
    e.preventDefault();
    const container = document.getElementById('main-joueur');
    const afterElement = getDragAfterElement(container, e.clientX);
    const dragging = document.querySelector('.dragging');
    if (afterElement == null) {
        container.appendChild(dragging);
    } else {
        container.insertBefore(dragging, afterElement);
    }
});

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.tuile:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
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

// Démarrage
initialiserPartie();
