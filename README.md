# GlassKey — Clés USB virtuelles

Une application web qui transforme ton navigateur en trousseau de **clés USB virtuelles** :
crée un compte, ajoute des clés protégées par code, ranges-y des dossiers, sous-dossiers
et fichiers (images, PDF, vidéos, audio…), et retrouve tout **sur tous tes appareils** —
téléphone, tablette ou PC du collège.

## Fonctionnalités

- **Comptes** : nom d'utilisateur + mot de passe de 4 à 6 chiffres (haché en scrypt, session 30 jours).
- **Clés virtuelles illimitées**, chacune protégée par un **code unique** de 2 à 4 chiffres.
- **Explorateur type clé USB** : dossiers imbriqués sans limite, fil d'Ariane,
  import multi-fichiers (20 Mo max/fichier) par bouton ou glisser-déposer.
- **Aperçu intégré** : images, PDF, vidéos et audio directement dans l'app, téléchargement pour le reste.
- **Appui long / clic droit** sur tout élément → menu contextuel iOS : ouvrir, télécharger,
  renommer, déplacer, supprimer, et « **Nouveau dossier avec…** » qui regroupe des fichiers
  dans un dossier créé à la volée.
- **Multi-appareils** : interface adaptative mobile / PC + bascule manuelle, données
  synchronisées via PostgreSQL.
- **Design iOS glass** : verre dépoli, aurora animé, animations signature
  (le pop-up se condense en ligne, tourne sur lui-même, puis se dessine en encoche à deux traits).
- **PWA installable** : ajoute-la à l'écran d'accueil, elle se comporte comme une vraie app.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · PostgreSQL + Drizzle ORM · Lucide Icons.
Les fichiers sont stockés en base (`bytea`) et servis via `/api/files/[id]`.

## Lancer en local

```bash
npm install
cp .env .env.local        # DATABASE_URL=postgresql://...
npx drizzle-kit push      # crée les tables
npm run dev
```

## Déployer (production)

1. **Base** : crée un PostgreSQL managé (ex. Neon, Supabase, Railway) et récupère `DATABASE_URL`.
2. **Schéma** : `npx drizzle-kit push` avec cette URL pour créer les tables.
3. **App** : déploie sur Vercel / Railway / Render avec la variable d'environnement `DATABASE_URL`.
4. Ouvre l'URL → crée ton compte → installe la PWA sur ton téléphone.
