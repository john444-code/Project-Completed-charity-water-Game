# Project-Completed-charity-water-Game

This project contains the finished "Water Drop Collector" mini-game built for charity: water.

How to run locally

1. Start a simple HTTP server from the project folder (required for module loading/requests in some browsers):

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

2. Open [index.html](index.html#L1) in your browser (recommended via the local server above).

What’s included

- [index.html](index.html#L1) — main game page
- [style.css](style.css#L1) — styles and brand-like font
- [script.js](script.js#L1) — game logic (difficulty modes, spawn/remove drops, timer, scoring)

Notes

- The footer includes direct links to charity: water's site and donation page.
- The UI uses the Poppins web font for a clean, friendly look that pairs well with charity: water branding.

Sound & Milestones

- The game uses lightweight synthesized sounds (WebAudio) for: collect, miss, button click, milestones, and win.
- Milestone messages appear during play (e.g. "Halfway there!") when you reach key score thresholds.

If you prefer to use real audio clips, place them in an `assets/sounds/` folder and modify `playSound()` in `script.js` to load/play those files.

Using real audio files

- If you want custom sounds instead of synthesized tones, add audio files under `assets/sounds/` with these exact filenames (one of these extensions):
	- `collect.mp3` / `collect.wav` / `collect.ogg`
	- `miss.mp3` / `miss.wav` / `miss.ogg`
	- `click.mp3` / `click.wav` / `click.ogg`
	- `win.mp3` / `win.wav` / `win.ogg`
	- `milestone.mp3` / `milestone.wav` / `milestone.ogg`

- The game will try to use those files automatically if present in `assets/sounds/`.

Volume control

- Use the speaker icon and slider in the header to mute or adjust volume. The value is saved in your browser so your choice persists across sessions.
