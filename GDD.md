# Game Design Document: Kho Kho (Digital Edition)

**Ruleset:** Traditional KKFI (not Ultimate Kho Kho / fast format).  
**Player role:** Team A. You chase on Team A turns and defend on Team B turns.

## 1. Game Overview

Kho Kho is a high-intensity tag sport. Nine chasers take the field: eight sit in a central line facing alternate sidelines, and one active attacker pursues defenders. To switch the attacker, they touch a sitting teammate from behind and shout **Kho**. Defenders dodge, using poles and the far half of the court to force a kho.

- **Genre:** Sports / Strategy / Arcade
- **Perspective:** Top-down 2D
- **Platform:** Web (Phaser 4)
- **v1 out of scope:** substitutions, cards, follow-on, career mode, online multiplayer

## 2. Match Structure

A match is **2 innings**. Each inning has **2 turns** of 9 minutes (one chase per team).

1. Coin toss — winner chooses Chase or Defend.
2. Turn A chase (9:00) → 3-minute break (skippable in the digital edition).
3. Turn B chase (9:00) → 6-minute interval after the inning (skippable).
4. Repeat for inning 2.
5. Higher score wins. Tie → **minimum chase** (each team chases until first out; faster team wins).

**Declaration:** On your chase, you may end the turn early after scoring more than 9 points in your first chase of the match; in inning 2, after any score greater than 0.

Web option: **Practice (2:00)** or **Official (9:00)** turn length.

```text
Toss → A chase → B chase → interval → A chase → B chase → [min chase if tied] → Summary
```

## 3. Teams, Batches, Scoring

- **12** players per team, **9** on the field, **3** substitutes (unused in v1).
- **Chasers:** 8 sitting + 1 active attacker. Attacker starts in a **free zone**.
- **Defenders:** enter in **batches of 3**. When a batch is out, the next 3 enter. After all 9, batches cycle until time ends.
- The attacker who dismissed the last defender of a batch **must give a kho** before tagging the new batch.
- **1 point** per defender out.
- Out if tagged by the active attacker (no foul, and not during a mandatory kho) **or** if a defender leaves the court.
- Defender who touches a sitting chaser: **warn once** per turn, **out on repeat**.

## 4. Court (27 m × 16 m)

Virtual grid at **40 px/m** → canvas **1080 × 640** (true 27:16, not 16:9).

| Feature | Spec |
| :--- | :--- |
| Poles | 1.5 m from each end (x = 60 and 1020), on the central lane |
| Free zones | 1.5 m behind each pole; receding / lane lock do **not** apply |
| Central lane | y = 320; attackers cannot cross except in a free zone |
| 8 squares | Alternate facing: down, up, down, up… |
| Facing sign | `1` = down (positive Y), `-1` = up |

Defenders may cross the lane freely. Attackers change half only by rounding a pole through a free zone, or by giving kho to a sitter facing the other half.

## 5. Kho, Receding, Fouls

**Kho (Space, when prompted):** from **behind** the sitter, near their square. Giver sits in that square and inherits its facing. Receiver becomes attacker and must enter the half they were facing.

**Receding:** once the attacker leaves the square / commits left or right, they cannot reverse until a free zone or a kho.

**Foul** (illegal lane cross or recede): tag does not count. Cleared by reaching a free zone or giving a valid kho.

**Dive (Shift / E):** short forward lunge, cooldown. Tag still requires no foul.

## 6. Controls

| Action | Keyboard | Touch (v1: keyboard-first) |
| :--- | :--- | :--- |
| Move | WASD / Arrows | Virtual stick (future) |
| Kho | Space | — |
| Dive | Shift or E | — |
| Switch defender | Tab or 1 / 2 / 3 | — |
| Declare | Enter (when allowed) | — |
| Pause | Esc | — |

## 7. Scenes

`Menu` → `How to Play` → `Match Setup` (difficulty, practice/official, toss) → `Game` → `Turn Break` → `Summary`.

Match state lives on a `MatchState` object (Phaser registry / session module). No Redux.

## 8. AI (difficulty)

Defenders: Idle / Evade / Cross-lane via poles.  
AI attacker (when you defend): chase nearest legal defender; kho to switch halves.

| | Easy | Medium | Hard |
| :--- | :--- | :--- | :--- |
| Defender speed | Fast | Mid | Slow |
| Evade / pole-cross | Weak | Normal | Sharp |
| AI chaser speed | Slow | Mid | Fast |

## 9. HUD & Audio

HUD: Team A / B scores, clock, inning, turn role, batch remaining (n/3), 9-cycle remaining, foul, kho prompt.

SFX: kho shout, whistle on out, foul, turn end (Web Audio beeps in v1).

## 10. Tech

- **Phaser 4** + Vite
- Arcade physics, circular bodies
- HTML/CSS HUD over the canvas
