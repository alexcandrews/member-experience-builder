# Member Experience Builder

## Browser Review Workflow

After making UI changes, capture a live browser review using:

```bash
npm run review        # dev server already running on localhost:517x
npm run dev:review    # starts Vite + captures automatically
```

This uses **gsd-browser** (Chrome CDP automation) + **showboat** (executable demo docs) to:
1. Navigate to the running app
2. Snapshot all interactive DOM elements (stable refs like `@vN:eN`)
3. Screenshot the initial page, plan header, and milestone detail panel
4. Save a reproducible Markdown doc to `reviews/`

**Always run `npm run review` after significant UI changes** so there's a visual record and regression baseline.

To re-verify a past review:
```bash
showboat verify reviews/<review-file>.md
```

Reviews are in `reviews/` — do not delete them, they serve as regression baselines.

## Project Stack

- React 19 + TypeScript + Vite
- `@dnd-kit` for drag-and-drop milestone ordering
- CSS in `src/styles/builder.css` (class names mirror component names, e.g. `.milestone-pill`, `.plan-header`, `.milestone-detail`)
