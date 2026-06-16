# Theming Guide - Espace Citoyen Alerts

Ce guide définit une palette cohérente pour l'interface citoyen (sidebar, table, badges, boutons, cartes), inspirée des conventions Spartan UI.

## Objectifs visuels

- Priorité à la lisibilité des données (table paginable et statuts).
- Couleurs intuitives pour les actions critiques:
  - créer/primary = bleu
  - approuvé/résolu = vert
  - attention/en cours = ambre
  - suppression/rejet = rouge
- Contraste suffisant (texte lisible sur fonds clairs).

## Tokens de couleur recommandés

- `primary`: `#0284C7` (sky-600)
- `primary-hover`: `#0369A1` (sky-700)
- `secondary-surface`: `#F8FAFC` (slate-50)
- `neutral-border`: `#E2E8F0` (slate-200)
- `text-main`: `#0F172A` (slate-900)
- `text-muted`: `#64748B` (slate-500)

## Statuts Alert

- `NEW`:
  - badge bg `#F1F5F9`, text `#334155`
  - ligne: fond blanc
- `IN_PROGRESS`:
  - badge bg `#FEF3C7`, text `#B45309`
  - ligne: fond `#FFFBEB`
- `RESOLVED`:
  - badge bg `#D1FAE5`, text `#047857`
  - ligne: fond `#ECFDF5`
- `REJECTED`:
  - badge bg `#FFE4E6`, text `#BE123C`
  - ligne: fond `#FFF1F2`

## Actions et boutons

- CTA principal "Signale un incident urbain":
  - fond `primary`, texte blanc, hover `primary-hover`
- Bouton modify:
  - bordure/text ambre (`#FCD34D` / `#B45309`)
- Bouton details:
  - bordure neutre, fond blanc
- Bouton delete:
  - bordure/text rouge (`#FECACA` / `#BE123C`)

## Sidebar (cohérence rôle citoyen)

- Fond: blanc
- Item actif: fond `#E0F2FE`, texte `#0369A1`
- Item inactif: texte `#475569`, hover fond `#F8FAFC`
- Footer logout: rouge doux (`#FEE2E2`) au hover.

## Carte "Approved Alerts"

- Bloc visuel supérieur sans image:
  - fond vert doux `#DCFCE7`
  - texte `#166534`
- Icône détails:
  - style discret (bordure `slate-200`)
  - tooltip "details"

## Skeleton loading

- Fond skeleton: `#F1F5F9`
- Animation: pulse douce
- Nombre:
  - table: 8 lignes skeleton
  - cards: 3 skeleton cards

## Références Spartan UI

- [Reactive Forms](https://spartan.ng/forms/reactive-forms)
- [Table](https://spartan.ng/components/table)
- [Sidebar](https://spartan.ng/components/sidebar)
- [Skeleton](https://spartan.ng/components/skeleton)
- [Textarea](https://spartan.ng/components/textarea)
- [Badge](https://spartan.ng/components/badge)
- [Button](https://spartan.ng/components/button)

## Notes d'implémentation

- Le mapping couleur est centralisé par conventions utilitaires Tailwind.
- Les variations de statuts sont appliquées à la fois au badge et à la ligne.
- Garder les espacements constants (`rounded-lg`, `rounded-xl`, `shadow-sm`, `border-slate-200`) pour une UX uniforme.
