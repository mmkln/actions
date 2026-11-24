# Actions

A focused single-board canvas for three first-class card types:

- thoughts;
- goals;
- Majom tasks.

The project currently contains only the UI and domain scaffold. Persistence, canvas interactions, Majom integration, and card workflows will be added separately.

## Development

```bash
npm install
npm run dev
```

## Structure

- `src/domain` — shared card types and future domain rules;
- `src/ui` — reusable visual components;
- `src/app.js` — the single canvas screen composition;
- `src/main.js` — application bootstrap.

