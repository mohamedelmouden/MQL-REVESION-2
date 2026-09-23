# Concours Blanc — Master MQL (FSDM Fès)

Simulation interactive du concours écrit du Master Qualité du Logiciel (React + Vite),
basée sur les matières annoncées dans la convocation : **C, POO, C++, Java, Web,
Connaissances Techniques Générales**. Banque de **202 questions à choix multiples**.

## Installation

```bash
npm install
npm run dev
```

Puis ouvrez l'URL affichée (en général http://localhost:5173).

Pour générer une version de production statique :

```bash
npm run build
npm run preview
```

## Fonctionnement

- Choisissez le nombre de questions et les matières sur l'écran d'accueil.
- Chronomètre de 60 minutes (comme l'examen réel du 24/09/2026).
- **2 tentatives** par question :
  - Bonne réponse dès la 1ʳᵉ tentative → réponse validée + justification.
  - 1ʳᵉ tentative fausse → l'erreur est expliquée, vous pouvez réessayer.
  - 2ᵉ tentative fausse → la bonne réponse est révélée avec une explication détaillée.
- Navigation libre entre les questions via la grille latérale.
- Écran de résultats avec score global et détail par matière.

## Structure

```
src/
  data/questions.json   → banque de 202 questions (générée par gen/build_questions.py)
  App.jsx                → logique de l'application
  App.css                → thème visuel
gen/build_questions.py   → script source des questions (modifiable/régénérable)
```

Pour régénérer `questions.json` après modification du script Python :

```bash
python3 gen/build_questions.py
```

## Avertissement

Les questions ont été élaborées à partir des matières indiquées dans la convocation
(C, POO, C++, Java, Web, connaissances techniques générales) à titre d'entraînement.
Elles ne proviennent pas du concours officiel et n'en garantissent pas le contenu exact.
