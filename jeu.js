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
// Déclaration des variables globales nécessaires
let mainJoueur = [];
let mainOrdi = [];

function initialiserPartie() {
    genererDeck();
    
    // Vider les mains pour une nouvelle partie
    mainJoueur = [];
    mainOrdi = [];
    
    // Distribution : 6 tuiles pour le joueur, 6 pour l'ordinateur
    for(let i = 0; i < 6; i++) {
        mainJoueur.push(deck.pop());
        mainOrdi.push(deck.pop());
    }
    
    // Affichage des tuiles du joueur dans le DOM
    const conteneurJoueur = document.getElementById('main-joueur');
    conteneurJoueur.innerHTML = ''; // Nettoyage
    mainJoueur.forEach(t => conteneurJoueur.appendChild(creerElementTuile(t)));
    
    console.log("Partie initialisée. Main ordi :", mainOrdi);
}

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

function joueurPioche() {
    if (pioche.length > 0) {
        const tuile = pioche.pop();
        const mainJoueurDiv = document.getElementById('main-joueur');
        mainJoueurDiv.appendChild(creerElementTuile(tuile));
        
        // Une fois que le joueur a pioché, c'est au tour de l'ordi
        setTimeout(tourOrdinateur, 500); 
    } else {
        alert("La pioche est vide !");
    }
}

function tourOrdinateur() {
    console.log("L'ordinateur réfléchit...");
    
    const coup = trouverCombinaison(mainOrdi); // Scan la main de l'ordi
    
    if (coup) {
        const plateau = document.getElementById('plateau');
        
        coup.forEach(tuileTrouvee => {
            // 1. Déplacer visuellement
            const element = document.getElementById(tuileTrouvee.id);
            if (element) plateau.appendChild(element);
            
            // 2. Retirer de la mémoire de l'ordinateur
            mainOrdi = mainOrdi.filter(t => t.id !== tuileTrouvee.id);
        });
        
        console.log("L'IA a posé :", coup);
    } else {
        // L'IA pioche
        const tuilePiochee = deck.pop();
        if (tuilePiochee) {
            mainOrdi.push(tuilePiochee);
            console.log("L'IA n'a pas pu jouer et a pioché.");
        }
    }
}
