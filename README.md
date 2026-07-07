# NutriPlan AI

A free, science-backed diet-planning app — no sign-up required. Built with React + Vite.

## What changed in this version
- Removed the light/dark mode toggle and replaced it with a **premium theme picker** (Sage Garden, Ocean Mist, Sunset Bloom, Orchid Luxe) — your choice is remembered on your device.
- Rebuilt the hero section with a gradient animated headline, floating stat chips, a softer ambient background, and a scroll cue.
- The diet-plan form now asks for **height in feet & inches** instead of centimetres.
- **Download PDF** now generates a real, multi-page PDF (via `jsPDF`) containing your full 7-day plan — not just the day you had open — and downloads it directly, with a loading state and error handling.
- Rewrote the responsive breakpoints (large desktop → small phones) so the app adapts cleanly at every screen size.

## Run it locally
```bash
npm install
npm run dev
```
Then open the URL Vite prints (usually `http://localhost:5173`).

## Build for production
```bash
npm run build
npm run preview   # optional: preview the production build locally
```

## Deploy to Vercel
See the step-by-step instructions provided in chat, or run:
```bash
npm install -g vercel
vercel
```
from the project root and follow the prompts.
