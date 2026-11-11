# Ember — PhD Game (React + Vite + Tailwind)

A local-first, autumn-themed quest map for personal goals, research projects, and PhD planning. Based on the original Ember prototype.

## Run locally

Requires Node.js 20.19+ (or 22+).

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

The built static site is in `dist/`. Deploy `dist/` to GitHub Pages, Netlify or similar static hosting. `base: './'` in `vite.config.js` supports subdirectory hosting.

## Tech

- React functional components and hooks
- Vite with React and Tailwind CSS 4 plugins
- Tailwind utilities + the original autumn design system in `src/legacy.css`
- Lucide React icons
- LocalStorage persistence (no backend)
- JSON-powered hierarchical workspaces

## Where to edit

| File | Purpose |
| --- | --- |
| `src/data/workspaces.json` | Starting hierarchy and page modules |
| `src/components/TreeCanvas.jsx` | Zoomable/pannable 2D map, node dragging and connecting edges |
| `src/pages/GoalPage.jsx` | Modular goal pages, checklists and notes |
| `src/components/EditorModal.jsx` | Create/edit nodes, modules and workspaces; JSON editor |
| `src/components/Hud.jsx` | Self-reported vitality, mood check-in and achievements |
| `src/pages/AchievementsPage.jsx` | Achievement gallery |
| `src/pages/SettingsPage.jsx` | Backup, import, duplicate, delete and reset |
| `src/lib/model.js` | Data utilities, JSON validation and XP rules |
| `src/index.css` and `src/legacy.css` | Tailwind and autumn theme |

## Data model

Each workspace has `id`, `title`, `subtitle` and `nodes`. Each node has an `id`, a `parentId` (`null` for a root), `title`, `kind`, `description`, `offsetX`, `offsetY`, and `modules`. Supported module types are `text`, `callout`, `checklist`, and `links`.

Node offsets allow you to rearrange the layout by dragging cards. To change parent-child relationships, use the node editor or JSON.

Progress is stored separately from the original hierarchy. For a full backup (including XP progress, notes and mood entries), use **Settings & data → Export full progress backup**.

## Notes

- Data is stored in the browser's localStorage, not synchronized between devices.
- Imported JSON is validated for duplicate IDs, missing parents, and cycles.
- Mood and vitality are voluntary observations, not medical metrics; achievements are not penalized for low energy or rest days.
- If your browser already contains data from the original HTML-only Ember prototype, the same storage key is read, so previous progress can be reused on the same origin.
