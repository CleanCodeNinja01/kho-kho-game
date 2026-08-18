# Kho Kho — Complete Specification (v1)

**Status:** As-built. This document is the source of truth for the implemented web game.  
**Ruleset:** Traditional [KKFI](https://web.kheloindia.gov.in/download/file/fid/4396) test format (not Ultimate Kho Kho / fast format).  
**Related:** [GDD.md](GDD.md) is the design overview; this file lists every implemented rule, number, scene, and system.

---

## 1. Product

| Field | Value |
| :--- | :--- |
| Name | Kho Kho — Digital Edition |
| Genre | Sports / Strategy / Arcade |
| Perspective | Top-down 2D |
| Platform | Web (desktop keyboard) |
| Engine | Phaser 4.2 + Arcade physics (no gravity) |
| Bundler | Vite 8, port `5173`, `scale: FIT` + `CENTER_BOTH` |
| Canvas | `1080 × 640` px (true 27:16 court, not 16:9) |
| Player | Always **Team A**. Chase on Team A turns, defend on Team B turns. |
| License | ISC |

**v1 out of scope:** substitutions, yellow/red cards, follow-on, career mode, online multiplayer, touch / virtual stick, substitutions UI, referee animations, career / league, saved replays.

---

## 2. Scene graph

```text
BootScene
  └─ MenuScene
        ├─ TutorialScene  →  MenuScene
        └─ SetupScene
              └─ GameScene
                    ├─ BreakScene  →  GameScene  (turn break / inning interval / min-chase intro)
                    ├─ BreakScene  →  SummaryScene  (only if lastBreak.kind === 'summary')
                    └─ SummaryScene
                          ├─ SetupScene   (Play Again)
                          └─ MenuScene    (Main Menu)
```

| Scene | Key | Purpose |
| :--- | :--- | :--- |
| `BootScene` | `BootScene` | Generate circle textures (`chaser-sit`, `chaser-active`, `defender`), then start menu. |
| `MenuScene` | `MenuScene` | Title, Start Match, How to Play. Unlocks Web Audio on Start. |
| `TutorialScene` | `TutorialScene` | Static how-to copy. Back → menu. |
| `SetupScene` | `SetupScene` | Difficulty, turn length, toss. Kick Off constructs `MatchState` and starts the match. |
| `GameScene` | `GameScene` | Live turn. HUD visible. Ends → break or summary. |
| `BreakScene` | `BreakScene` | Skip-any-time interstitial. Continue / Start Minimum Chase / Quit to Menu. |
| `SummaryScene` | `SummaryScene` | Winner, score, outs / khos / fouls / dives, optional min-chase times. |

Match data lives on a module singleton `session` (`src/state/MatchState.js`): `{ config, match, lastBreak }`. No Redux / no Phaser registry objects beyond the scene list.

---

## 3. Match setup (defaults)

| Setting | Options | Default |
| :--- | :--- | :--- |
| Difficulty | easy / medium / hard | `medium` |
| Turn length | Practice `2:00` / Official `9:00` | Practice |
| Toss | Chase first / Defend first | Chase first (`playerChoosesChase: true`) |

Toss is not simulated: the player always “won” and picks chase or defend.

`MatchState` constructor fields:

- `difficulty`, `turnMs` (`120_000` or `540_000`), `playerChoosesChase`
- `chasingTeam` = `'A'` if player chose chase, else `'B'`
- scores `0`, `inning` `1`, `turnsPlayed` `0`, `phase` `'TURN'`
- `timeLeftMs` = `turnMs`
- batch: `batchIndex` `0`, `aliveInBatch` `3`, `mustKho` `false`
- `foul` `false`, `touchedSitterWarned` `[false, false, false]`
- counters: `outs`, `khos`, `fouls`, `dives`, `pointsThisTurn`
- `minChaseTimes` `{ A: null, B: null }`, `minChaseElapsed` `0`
- `done` `false`, `winner` `null`

---

## 4. Match structure

A match is **2 innings × 2 turns**. Each turn is one team chasing for the chosen clock.

```text
Toss (setup)
  → Turn 1 (first chasing team)
  → Break (“Turn break.”)
  → Turn 2 (other team)
  → Break (“Inning interval.”) + inning becomes 2
  → Turn 3
  → Break (“Turn break.”)
  → Turn 4
  → if scores equal: Minimum chase (A then B)
  → Summary
```

`turnsPlayed` increments when a normal turn ends. After turn 2, `inning` becomes `2`. After turn 4:

- Unequal scores → `done = true`, `winner = 'A' | 'B'`, scene → Summary.
- Equal scores → `phase = 'MIN_CHASE'`, `chasingTeam = 'A'`, clock = `min(turnMs, 90_000)`, scene → Break (`kind: 'minChase'`).

**Declaration:** player may end their own chase early (`Enter` or HUD **Declare**) when `canDeclare` is true:

- Inning 1, first chase of the match (`turnsPlayed <= 1 && inning === 1`): `pointsThisTurn > 9`.
- Inning 2: `pointsThisTurn > 0`.
- Only while `playerIsChaser` and `phase === 'TURN'`.

**Clock:** `tick(delta)` subtracts frame delta. At `timeLeftMs <= 0` the turn ends. Pause (Esc) freezes physics and does not advance the clock because `update` returns before `tick`.

**Breaks** are skippable (no real 3 / 6 minute timers). Copy:

- After turns 1 and 3: `Turn break. Inning N`
- After turn 2: `Inning interval. Inning 2`

---

## 5. Scoring, batches, outs

- **1 point** per defender out, credited to the chasing team.
- **12** players per team conceptually; **9** on field; **3** substitutes unused in v1.
- Defenders enter in **batches of 3**. `batchIndex` cycles `0 → 1 → 2 → 0`.
- When `aliveInBatch` hits 0: `mustKho = true`, next batch spawns, sitter-touch warnings reset.
- After all 9 of a cycle are out, batches continue until time expires (`batchIndex % 3`).
- HUD **Left** shows remaining in the current 9-cycle: `(9 - pointsThisTurn % 9) % 9 || 9` over 9. During min chase it shows `—`.

### Ways a defender is out

| Cause | Tag counts during foul / must-kho? |
| :--- | :--- |
| Tagged by the active attacker (distance < 18, or < 22 while diving) | **No** — `scoreOut()` returns false if `foul` or `mustKho` |
| Leaves the court (`x < 8` or `x > width-8` or `y < 8` or `y > height-8`) | **Yes** (`force: true`) |
| Touches a sitting chaser a second time this turn (per slot) | **Yes** (`force: true`) |

First sitter contact in a turn: warning banner `"Warning: do not touch sitters"`; `touchedSitterWarned[slot] = true`. Overlap radius with a sitter: **20 px**. Rising-edge only (`wasTouchingSitter`).

After a batch wipe: whistle SFX, new 3 spawn on a random half (`Math.random() < 0.5`), selection index resets to 0. Initial spawn of a turn is always the top half (`half = 0`).

The attacker who dismissed the last defender of a batch **must give a kho** before a *tag* scores. Forced outs (leave court / second sitter touch) still score.

---

## 6. Minimum chase (tie-break)

Triggered only when scores are equal after 4 turns.

1. Team A chases first. Clock `min(turnMs, 90s)`.
2. First scoring out records `minChaseTimes[chasingTeam] = minChaseElapsed` and ends that mini-turn.
3. If the clock expires with no out, time is stored as `minChaseElapsed || turnMs`.
4. Then Team B chases the same way.
5. Faster time wins. Equal times → `winner = 'DRAW'`.
6. `scoreOut` during min chase does **not** decrement the batch; it returns `{ minChasePoint: true }` and finishes the mini-turn immediately.

HUD inning stays at `2/2`. Role still follows `chasingTeam`.

---

## 7. Court geometry

Scale: **40 px per metre**. Court **27 m × 16 m** → **1080 × 640**.

| Feature | Metres | Pixels | Notes |
| :--- | :--- | :--- | :--- |
| Size | 27 × 16 | 1080 × 640 | Canvas = court |
| Centre lane Y | 8 m | 320 | Attackers cannot cross except in a free zone |
| Left pole | 1.5 m from left | x = 60 | On the lane |
| Right pole | 1.5 m from right | x = 1020 | On the lane |
| Pole radius | — | 10 | Drawn white |
| Free zone | 1.5 m behind each pole | `x ≤ 72` or `x ≥ 1008` (`pole ± 12`) | Receding and lane lock **do not** apply |
| Lane half-width (visual) | — | 6 | Line only |
| 8 sitting squares | spaced between poles | size 24 | xs from `poleLeft + 2.55m` to `poleRight - 2.55m`, gap `/ 7` |
| Facing | alternate | `[1,-1,1,-1,1,-1,1,-1]` | `1` = down (+Y), `-1` = up |
| Kho range | — | 52 | Max hypot distance to sitter |
| Kho X slack | — | 30 | Must be roughly in line with the square |
| World clamp (chasers) | — | 16 px inset | Soft stay-in-court |
| Defender out margin | — | 8 px inset | Leaving = out |

Defenders may cross the lane freely. Attackers change half only by rounding a pole through a free zone, or by giving kho to a sitter facing the other half.

**Spawn points** (`spawnPoint(slot, half)`):

- `x = 180 + (slot % 3) * 280 + (half === 1 ? 80 : 0)`
- Top half: `y = 90 + slot * 18`
- Bottom half: `y = 640 - 90 - slot * 18`

**Active attacker start:** Team A chase starts at left pole `(60, 272)` facing up (`-1`). Team B chase starts at right pole `(1020, 272)` facing up.

---

## 8. Kho

**Trigger:** Space (player chase only when `canKho`; AI chase when `wantKho` or `mustKho`).

**Validity** (`findKhoTarget`):

1. Active chaser is not sitting.
2. Distance to sitter ≤ `khoRange` (52).
3. `|active.x - sitter.x| ≤ khoXSlack` (30).
4. Attacker is **behind** the sitter:
   - Facing down (`1`): `active.y < sitter.y - 2`
   - Facing up (`-1`): `active.y > sitter.y + 2`
5. Closest valid sitter wins.

**Effect** (`applyKho`):

- Giver `makeSitting` in the target square (inherits that square’s facing).
- Receiver `makeActive(facing, fromKho=true)`: placed at `centerY + facing * 18`, must run the half they were facing.
- `mustKho = false`, `foul = false`, `khos += 1`.
- SFX: kho shout (two square tones).

HUD prompt: `"PRESS SPACE TO KHO!"` when in range (player chase). `"KHO REQUIRED — NEW BATCH"` while `mustKho`.

---

## 9. Receding, lane lock, fouls, dive

Implemented in `Chaser.drive`.

**Lane lock:** Outside a free zone, the attacker cannot cross the central lane. They are clamped:

- Facing down: `y = max(y, centerY + 8)`; crossing above `centerY - 4` is a **lane foul**.
- Facing up: `y = min(y, centerY - 8)`; crossing below `centerY + 4` is a **lane foul**.

In a free zone, facing updates from Y: `y > centerY + 10` → down, `y < centerY - 10` → up.

**Receding:** Once the attacker commits LEFT or RIGHT (`lockedDirection`) they cannot reverse until a free zone. Exception: still on the origin square (`|x - originLaneX| < 16`). Reverse input → **recede foul**. Free zone clears `lockedDirection`.

**Foul:**

- First foul of a streak: `fouls += 1`, SFX foul, attacker tint `#ff6666`.
- While `foul` is true, **tags do not score**.
- Cleared by: entering a free zone, **or** a valid kho.

**Dive** (Shift or E):

- Duration **280 ms**, cooldown **1400 ms**.
- Speed multiplier **1.85×** while diving.
- Tag radius **22** (else **18**).
- Does **not** ignore fouls.
- Player chase only increments `dives` on a successful `tryDive`. AI may dive when `dist < 70` and not `mustKho`.

Sitting chasers: immovable, physics body disabled, alpha 0.75, white facing arrow. Active: yellow, depth 7, yellow arrow.

---

## 10. Entities and physics

| Entity | Texture radius | Body circle | Colour |
| :--- | :--- | :--- | :--- |
| Sitting chaser | 12 | 12 | `0xc0392b` |
| Active attacker | 12 | 12 | `0xf1c40f` |
| Defender | 11 | 11 | `0x3498db` |
| Selected defender | same | same | tint `0xccffdd` + green ring r=16 |

`collideWorldBounds` is **off** for both; chasers clamp in `drive`, defenders go out if they leave.

Court grass: 8 horizontal stripes alternating `0x2d5a27` / `0x33662c`. Lines white. Poles `0xe8e8e8`.

---

## 11. Controls

Keyboard-first. Tab and Space are captured so the browser does not steal them.

| Action | Keys | When |
| :--- | :--- | :--- |
| Move | WASD or arrows | Chase: attacker. Defend: selected defender. |
| Kho | Space | Chase, when in range (or AI auto). |
| Dive | Shift or E | Chase. |
| Switch defender | Tab cycle; 1 / 2 / 3 pick slot | Defend. |
| Declare | Enter, or HUD button | Chase, when allowed. |
| Pause | Esc | GameScene. Toggles physics pause overlay `PAUSED / Esc to resume`. |

Touch / virtual stick: not in v1.

---

## 12. Roles in GameScene

### Player chases (`chasingTeam === 'A'`)

- Player drives the yellow attacker.
- All 3 defenders run `updateDefenderAI` at the match difficulty `evadeSkill`.
- Kho / dive / declare available as above.

### Player defends (`chasingTeam === 'B'`)

- Player drives the highlighted defender (`selectedIndex`).
- Other live defenders use `updateDefenderAI` at skill **0.55** (fixed).
- AI drives the attacker at `aiChaseSpeed` via `updateChaserAI`.
- If `mustKho`, AI steers behind `sitters[0]` and khoes when in range.

---

## 13. AI

Tick: defenders replan every **40 ms** (`aiCooldown`).

### Defender AI (`updateDefenderAI`)

1. Default: flee the attacker (normalized away vector × speed).
2. **Pole-cross:** if `skill > 0.3` and same half as chaser and `dist < 220 + skill * 120`, steer to the nearer pole; once in a free zone, run to the opposite half.
3. If `dist > 340`, damp the flee vector × 0.2 (idle-ish).
4. Jitter: `(1 - skill) * 0.45` random on both axes (easy = more wobble).
5. Soft bounce off 22 px court margins (does not prevent going out if already near the edge).

### Chaser AI (`updateChaserAI`)

1. Prefer a live defender on the same half (or any if the AI is in a free zone / near the lane).
2. If none on this half: walk behind a sitter facing the needed half and set `wantKho`.
3. Else steer at the nearest legal target; `wantDive` if `dist < 70` and dive is off cooldown.
4. Occasional kho: if a kho target exists and `dist > 160`, probability `skill * 0.02` per tick; also `0.01` if no same-half targets.

`skill` passed to chaser AI is currently `diff.evadeSkill` (same table as defender evade).

---

## 14. Difficulty table

From `src/config/constants.js` `DIFFICULTY`. Speeds are px/s.

| | Easy | Medium | Hard |
| :--- | ---: | ---: | ---: |
| Defender speed (when you chase) | 200 | 185 | 170 |
| Player chaser speed | 225 | 210 | 205 |
| AI chaser speed (when you defend) | 155 | 195 | 235 |
| Evade skill | 0.35 | 0.65 | 0.90 |
| Reaction ms (defined, unused in v1 loop) | 260 | 140 | 70 |

Design intent: Easy defenders are faster but worse at pole-cross; Hard defenders are slower but sharper. Easy AI chaser is slow; Hard AI chaser is fast.

---

## 15. HUD

HTML overlay `#hud` (`index.html` + `src/ui/hud.js` + `src/style.css`). Shown only in `GameScene`. `pointer-events: none` except the declare button and the bar.

| Element | id | Content |
| :--- | :--- | :--- |
| Team A score | `score-a` | integer |
| Team B score | `score-b` | integer |
| Clock | `timer` | `MM:SS` (`Math.ceil` seconds) |
| Inning | `inning` | `N/2` |
| Role | `role` | `You Chase` / `You Defend` |
| Batch alive | `batch` | `aliveInBatch/3` |
| Cycle remaining | `cycle` | `n/9` or `—` |
| Foul badge | `foul-flag` | `FOUL` when `match.foul` |
| Must-kho badge | `must-kho` | `KHO NEEDED` when `mustKho` |
| Declare | `declare-btn` | visible iff `canDeclare` |
| Kho prompt | `action-prompt` | gold pulse when `canKho` |
| Hint | `control-hint` | chase vs defend string |

On-canvas: role banner at turn start (fades); pause overlay; warning banner on first sitter touch.

---

## 16. Audio

Web Audio API beeps (`src/audio/sfx.js`). Context created / resumed on **Start Match**.

| Event | Shape |
| :--- | :--- |
| Kho | 392 Hz then 523 Hz squares |
| Out | 880 Hz then 1320 Hz squares |
| Foul | 160 Hz sawtooth 180 ms |
| Whistle | 1760 Hz square (turn end, batch wipe) |
| Click | 600 Hz square (menu buttons / choices) |

---

## 17. Menus and copy

**Menu:** `KHO KHO` / `Digital Edition  ·  Traditional rules  ·  Team A is you` / Start Match / How to Play.

**How to Play:** chase rules, defend rules, 2 innings × 2 turns, practice 2:00 / official 9:00 (see `TutorialScene` `LINES`).

**Setup:** Difficulty, Turn length, `Toss — you won. Choose:`, Kick Off, Back.

**Break:** title + body from `endTurn()`. Primary button `Continue` or `Start Minimum Chase`. Secondary `Quit to Menu`.

**Summary:** `match.summaryText()`:

- `Team A (You) win  A n  –  B m`
- `Team B win  A n  –  B m`
- `Draw  A n  –  B n`

Stats line: `Outs · Khos · Fouls · Dives`. If min chase ran: times in seconds to 1 decimal.

Menu chrome: background `#102416` / `#1a3d24`, gold titles Georgia, green buttons `#1f6b38` hover `#2d8a4c`, selected choice `#c9a227`.

---

## 18. Module map

```text
index.html                 Phaser parent + HUD DOM
src/main.js                Phaser.Game config
src/style.css              Page + HUD
src/config/constants.js    Court, colours, timings, difficulty, isFreeZone
src/state/MatchState.js    Rules engine + session singleton
src/scenes/*               Boot, Menu, Tutorial, Setup, Game, Break, Summary
src/entities/Chaser.js     Sitting / active, drive, dive, fouls
src/entities/Defender.js   Player / AI runner, out-of-court, selection ring
src/systems/court.js       Draw court, spawnPoint
src/systems/play.js        Kho, defender AI, chaser AI
src/ui/hud.js              HUD bind
src/ui/menu.js             Title / buttons / choice rows
src/audio/sfx.js           Beeps
```

Scripts: `npm run dev` | `npm run build` | `npm run preview`. Node 18+.

---

## 19. Acceptance (v1)

A build is complete when all of the following hold:

1. Menu → How to Play → back, and Menu → Setup → Kick Off loads a 1080×640 court with 8 sitters + 1 yellow attacker + 3 blue defenders.
2. Practice clock starts at `02:00` (official `09:00`) and ends the turn at 0.
3. Tagging a defender with no foul and no must-kho adds 1 to the chasing team; batch count drops; at 0/3 a kho is required and a new batch appears.
4. Illegal recede or lane cross tints the attacker, shows FOUL, and prevents tag scoring until a free zone or kho.
5. Space behind a sitter swaps attacker; receiver leaves toward their facing half.
6. Defend turn: Tab/1/2/3 switches the green-ring runner; leaving the court or a second sitter bump is out.
7. Four turns complete a match; a tie runs two min-chase legs and the summary shows times.
8. Declare appears only when the declare rule in §4 is met, and ends the chase immediately.
9. Esc pauses; Start Match does not throw if Web Audio is blocked.
10. No substitutions, cards, follow-on, touch stick, or multiplayer controls exist.

---

## 20. Non-goals (explicit)

Do not implement in v1 without a spec revision:

- Ultimate Kho Kho / 7-a-side / 5-minute innings
- Random coin toss animation (choice is enough)
- Real-time 3 / 6 minute breaks
- Yellow / red cards, warnings beyond sitter-touch
- Substitutions of the 3 bench players
- Follow-on after a large first-innings lead
- Touch controls
- Networked play
- Persistence / accounts
