# Whispers — Frontend

React + Vite + TypeScript + Tailwind v4 + shadcn/ui

## Stack

- **React 18** + **TypeScript**
- **Vite 6** (dev server + bundler)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **shadcn/ui** (composants Radix primitives)
- **React Router v6** (navigation)
- **Axios** (client HTTP)
- **lucide-react** (icônes)
- **react-hot-toast** (notifications)

## Structure

```
src/
├── App.tsx              # Router racine
├── main.tsx             # Point d'entrée
├── components/
│   ├── ui/              # shadcn/ui (48 composants)
│   └── shared/          # Composants partagés (ImageWithFallback)
├── pages/
│   ├── LandingPage.tsx  # Route /
│   ├── SendPage.tsx     # Route /:username (public)
│   └── InboxPage.tsx    # Route /inbox (protégé côté client)
├── hooks/
│   └── useMessages.ts   # State messages (prêt pour API)
├── lib/
│   ├── api.ts           # Client Axios
│   └── utils.ts         # cn() helper
├── types/
│   └── index.ts         # Interfaces partagées
└── styles/
    ├── index.css        # Entry CSS
    ├── fonts.css        # Google Fonts
    ├── theme.css        # Design tokens CSS variables
    └── globals.css      # Resets globaux
```

## Scripts

```bash
npm run dev      # Démarre le serveur de dev
npm run build    # Build production
npm run preview  # Preview du build
npm run lint     # ESLint
```
