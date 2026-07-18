/* Patch Mini-Rummikub 2.1
   - Remplace alert() par une fenêtre Atelier Mémo
   - Replace la zone "nouveau groupe" en bas au centre du plateau
*/
(() => {
    "use strict";

    function creerModale() {
        if (document.getElementById("atelier-modal")) return;

        const modale = document.createElement("div");
        modale.id = "atelier-modal";
        modale.className = "atelier-modal";
        modale.setAttribute("aria-hidden", "true");

        modale.innerHTML = `
            <div class="atelier-modal__fond"></div>
            <div class="atelier-modal__boite" role="dialog" aria-modal="true"
                 aria-labelledby="atelier-modal-titre"
                 aria-describedby="atelier-modal-message">
                <div class="atelier-modal__icone">🧠</div>
                <h2 id="atelier-modal-titre">L’Atelier Mémo</h2>
                <p id="atelier-modal-message"></p>
                <button type="button" id="atelier-modal-ok">OK</button>
            </div>
        `;

        document.body.appendChild(modale);

        const fermer = () => {
            modale.classList.remove("visible");
            modale.setAttribute("aria-hidden", "true");
        };

        modale.querySelector("#atelier-modal-ok").addEventListener("click", fermer);
        modale.querySelector(".atelier-modal__fond").addEventListener("click", fermer);
    }

    function afficherAnnonce(message) {
        creerModale();

        const modale = document.getElementById("atelier-modal");
        const texte = document.getElementById("atelier-modal-message");

        texte.textContent = String(message ?? "");
        modale.classList.add("visible");
        modale.setAttribute("aria-hidden", "false");

        requestAnimationFrame(() => {
            document.getElementById("atelier-modal-ok")?.focus();
        });
    }

    // Remplace les alertes natives du navigateur.
    window.alert = afficherAnnonce;

    function placerNouveauGroupeEnBas() {
        const plateau = document.getElementById("plateau");
        if (!plateau) return;

        const zone = plateau.querySelector(".nouveau-groupe");
        if (!zone) return;

        // En flexbox, order:999 place l'élément après tous les groupes.
        zone.style.order = "999";
        zone.style.flexBasis = "100%";
        zone.style.marginLeft = "auto";
        zone.style.marginRight = "auto";

        // Le texte devient volontairement très simple.
        zone.innerHTML = '<span class="nouveau-groupe-plus" aria-hidden="true">+</span>';
        zone.setAttribute("aria-label", "Former un nouveau groupe");
        zone.title = "Former un nouveau groupe";
    }

    function surveillerPlateau() {
        const plateau = document.getElementById("plateau");
        if (!plateau) return;

        placerNouveauGroupeEnBas();

        const observateur = new MutationObserver(() => {
            placerNouveauGroupeEnBas();
        });

        observateur.observe(plateau, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", surveillerPlateau);
    } else {
        surveillerPlateau();
    }
})();
