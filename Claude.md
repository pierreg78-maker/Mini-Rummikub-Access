# Claude.md – Mini-Rummikub

## 🎯 État du projet
**Déploiement** : `pierreg78-maker.github.io/Mini-Rummikub-Access`

✅ **Fonctionnalités stables**
- Tuiles draggables (drag-and-drop via pointer events)
- Groupes valides : paires (2 tuiles) ou trios (3+ tuiles)
- Tri auto-ascendant des groupes (toggle Facile/Normal)
- Scoring et fusion de groupes
- Interface accessible, fonts larges (Atelier Mémoire)

🔧 **En cours / Roadmap**
- Améliorer visibilité de l'IA (mode debug)
- Animations feedback (tuiles qui s'alignent, points gagnés)
- Historique des coups

---

## 💡 Patterns et conventions

### Architecture
```
Mini-Rummikub/
├── index.html          (DOM + styles inline)
├── script.js           (logique game + UI)
├── styles.css          (optionnel, séparé)
└── README.md
```

### Pointer Events (crucial pour mobiles 65+)
```javascript
// ✅ Fonctionne
element.addEventListener('pointerdown', startDrag);
element.addEventListener('pointermove', moveDrag);
element.addEventListener('pointerup', endDrag);

// ⚠️ Éviter
// - touch events purs (incomplet sur certains navigateurs)
// - z-index sans pointer-events: none sur dragged tiles
```

### Tuiles et couleurs
- **3 couleurs** : rouge (#c41e3a), jaune (#ffd700), bleu (#4169e1)
- **Numéros** : 1–6 uniquement
- **SVG icons** : chaque couleur + numéro pour clarté

### Dénomination des groupes
```javascript
// Format interne
groups = [
  { id: 'group-1', tiles: [t1, t2, t3], type: 'sequence', valid: true },
  { id: 'group-2', tiles: [t4, t4], type: 'pair', valid: true }
];
```

---

## 🐛 Pièges trouvés et solutions

| Problème | Cause | Solution |
|----------|-------|----------|
| Drag-drop ne marche qu'une fois | Pas de cleanup des listeners | Vider listeners en `pointerup` ou réattacher à chaque tour |
| Tuiles collent au curseur sur mobile | touchend pas déclenché | Ajouter counter pattern : `gen++` à chaque interaction |
| Z-index bug en drag | CSS pointer-events sur conteneur | Ajouter `pointer-events: none` au dragged tile PENDANT le drag |
| Groupes non triés après merge | Tri oublié | Appeler `sortGroupAscending(group)` après fusion |

---

## 📋 Comment relancer Claude

### Pour un bug
```
"Je vois [symptôme]. Voici le code pertinent [paste]. 
Le problème semble être [hypothèse]. Peux-tu [action]?"
```
**Exemple** : 
```
Je vois que les tuiles ne se déplacent plus après un clic. 
Voici mon script.js [...]. 
Je crois qu'il y a un pb pointer events. Peux-tu vérifier les listeners?
```

### Pour une feature
```
"Ajoute [feature] avec ces contraintes :
- Pas de dépendances externes
- Compatibilité mobile 65+
- Respecter les patterns existants
Voici le code actuel [...]"
```

### Pour du refactoring
```
"Restructure [fonction] pour améliorer [objectif] tout en gardant l'API.
Contexte : [où c'est utilisé]. Code actuel : [...]"
```

---

## 🎮 Contexte utilisateurs
- **Âge** : 65–90 ans (Atelier Mémoire)
- **Dextérité** : variée (adaptation tactile importante)
- **Connexion** : zones rurales (Périgord) → fichiers légers
- **Langue** : français
- **Objectif** : stimulation cognitive, pas frustration

**Conséquence** : CSS/UX généreuse (grosses tuiles, contraste, feedback clair)

---

## 🚀 Déploiement
```bash
git push origin main
# Auto-déploié vers GitHub Pages
# Vérifier : pierreg78-maker.github.io/Mini-Rummikub-Access
```

---

## 📚 Ressources internes
- **Portail** : `index.html` du hub Atelier Mémoire (card brown-gold)
- **Tests** : `/tests/` pour versions expérimentales
- **Styles partagés** : typographie Lora (footer), Opensans (UI)
