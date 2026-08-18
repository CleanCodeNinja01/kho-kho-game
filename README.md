# Kho Kho — Digital Edition

A top-down 2D web game based on the traditional Indian sport **Kho Kho**, using [KKFI](https://web.kheloindia.gov.in/download/file/fid/4396) (test format) rules rather than Ultimate Kho Kho / fast format.

You play as **Team A**: chase on your turns, defend on theirs. Eight chasers sit on the central lane facing alternate sides; you are the active attacker until you give a **Kho**.

**Play:** [kho-kho-game.vercel.app](https://kho-kho-game.vercel.app/) · [GitHub Pages](https://cleancodeninja01.github.io/kho-kho-game/)

![Phaser](https://img.shields.io/badge/Phaser-4.2-yellow) ![Vite](https://img.shields.io/badge/Vite-8-646cff) ![License](https://img.shields.io/badge/license-ISC-lightgrey)

## Play locally

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)).

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |

Keyboard is required in v1 (no touch controls yet).

## How a match works

A match is **2 innings**, each with **2 turns** (one chase per team).

1. Setup: difficulty, turn length, and whether you chase or defend first
2. Team A chase → break → Team B chase → interval
3. Repeat for inning 2
4. Higher score wins. A tie goes to **minimum chase** (first out; faster team wins)

**Turn length:** Practice **2:00** or Official **9:00**.

**Scoring:** 1 point per defender out. Defenders enter in **batches of 3**. After a batch is wiped, you must give a Kho before tagging the next 3. After all 9 are out, batches cycle until time expires.

You may **declare** (end your chase early) after scoring more than 9 in your first chase, or after any score greater than 0 in inning 2.

Full design notes live in [GDD.md](GDD.md). The as-built rules, numbers, scenes, and acceptance checklist are in [SPEC.md](SPEC.md).

## Controls

| Action | Keys |
| --- | --- |
| Move | WASD or arrow keys |
| Give Kho | Space (when prompted, from behind a sitter) |
| Dive | Shift or E |
| Switch defender | Tab or 1 / 2 / 3 |
| Declare | Enter (when the HUD shows it) |
| Pause | Esc |

### Chase (you are yellow)

- Tag blue defenders for a point
- You cannot cross the central lane except in a **free zone** (around the poles)
- Once you commit left or right, you cannot recede until a pole or a Kho
- Stand behind a sitting teammate and press Space to Kho — they take over and must run the half they were facing
- Illegal recede or lane cross is a **foul**: tags do not count until you reach a free zone or Kho

### Defend (you are a highlighted blue runner)

- Stay inside the court — leaving is out
- Do not bump sitting chasers twice (first touch is a warning)

## Difficulty

| | Easy | Medium | Hard |
| --- | --- | --- | --- |
| Defenders (when you chase) | Faster, weaker evade | Balanced | Slower, sharper pole-cross |
| AI chaser (when you defend) | Slow | Mid | Fast |

## Project layout

```text
src/
  main.js                 Phaser game bootstrap (1080×640 court)
  config/constants.js     Court scale (40 px/m), timings, difficulty
  state/MatchState.js     Innings, batches, score, fouls, min chase
  scenes/                 Menu, tutorial, setup, match, break, summary
  entities/               Chaser, Defender
  systems/                Court drawing, Kho, defender/chaser AI
  ui/                     HTML HUD + menu helpers
  audio/sfx.js            Web Audio beeps (kho, out, foul, whistle)
```

The playfield maps a **27 m × 16 m** court at 40 pixels per metre.

## Tech

- [Phaser 4](https://phaser.io/) — 2D engine and Arcade physics
- [Vite](https://vite.dev/) — bundler and dev server

v1 does not include substitutions, cards, follow-on, career mode, touch controls, or online multiplayer.

## License

ISC. See [package.json](package.json).
