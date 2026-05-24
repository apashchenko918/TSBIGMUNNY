# THE TURRELLE SISTERS BIG MUNNY
## Game Design Manual — Authoritative Reference v1.2

> **This document is law.** Every rule, trigger, and design decision lives here.
> It is maintained alongside PHASE_PLAN.md. When a rule changes, BOTH documents update.
> Last updated: v6l114 (2026-05-21)
>
> ## ⚠️ PERMANENT RULES FOR ALL DEVELOPERS AND AI ASSISTANTS
> 1. **Update this document and PHASE_PLAN.md together** — they must never be out of sync
> 2. **Always check with the owner before changing any game design** — owner-confirmed decisions are logged here and are final
> 3. **Cross-reference this document** when making any code change that touches game logic, math, or bonus behaviour
> 4. **Never deliver a zip** where the code and this manual describe different behaviour

---

## 1. GAME OVERVIEW

| Field | Value |
|---|---|
| Game name | The Turrelle Sisters Big Munny |
| Type | Class III video slot (5-reel, 3-row, 20-line) |
| Platform | Mobile web (Samsung Galaxy S23, Android Chrome) |
| Future format | Android APK (Android Studio, no ads, owner-built) |
| Pay direction | Left to right only |
| Pay mechanic | Highest win per payline only (no multi-pay stacking on same line) |
| Wild behaviour | Josie and Sasha substitute for all standard symbols |
| Non-substitutable | Gold Coin, Lipstick, BONUS letters B/O/N/U/S |

---

## 2. SYMBOL REFERENCE

| ID | Symbol | Type | Wild | Notes |
|---|---|---|---|---|
| 0 | Sisters | Character | No | GRAND jackpot trigger (5-oak any payline) |
| 1 | Josie | Wild | Yes (×2) | Contributes ×2 to wild multiplier |
| 2 | Sasha | Wild | Yes (×1) | Contributes ×1 to wild multiplier |
| 3 | Seven | Standard | — | High-pay symbol |
| 4 | Triple Bar | Standard | — | |
| 5 | Double Bar | Standard | — | |
| 6 | Single Bar | Standard | — | |
| 7 | *(retired)* | — | — | Cherry — removed v6l13. ID 7 is unused. |
| 8 | Lipstick | Bonus | No | Pick & Choose trigger (5-oak center payline) |
| 9 | Gold Coin | Bonus | No | H&S trigger (6+ anywhere in 5×3 grid) |
| 10 | BONUS-B | Letter | No | Reel 1 only — cherry-style evaluation |
| 11 | BONUS-O | Letter | No | Reel 2 only |
| 12 | BONUS-N | Letter | No | Reel 3 only |
| 13 | BONUS-U | Letter | No | Reel 4 only |
| 14 | BONUS-S | Letter | No | Reel 5 only |
| 15 | Diamond | Standard | — | |
| 16 | StrayPup | Character | No | High-pay |
| 17 | DJ Maxine | Character | No | High-pay |

---

## 3. REEL STRUCTURE

- **Strips:** 5 reels × 80 stops each
- **Window:** 3 visible rows per reel (top/middle/bottom)
- **Gold Coin stops:** 15 per reel (MIN_GAP=1 — allows multiple in window simultaneously)
- **Lipstick stops:** 12 per reel
- **All strips sum to exactly 80 stops**

---

## 4. PAYLINES

- 20 active paylines, all left-to-right
- **Line 1 (index 0):** Middle row [1,1,1,1,1] — also the Lipstick trigger line
- Standard BIG MUNNY BIG MUNNY 20-line pattern set

---

## 5. WILD MULTIPLIER RULES

**Owner confirmed 2026-05-21 (v6l114)**

Josie (id:1) and Sasha (id:2) are wilds. Every Josie and Sasha anywhere in the matched run (leading or trailing the match symbol) contributes to the multiplier:
- **Josie:** contributes ×2
- **Sasha:** contributes ×1
- **Formula:** `multiplier = max(1, josie_count × 2 + sasha_count × 1)`
- **Scope:** All Josie/Sasha symbols within positions 0 through (matchCount − 1) of the payline

| Wilds in combo | Multiplier |
|---|---|
| No wilds | ×1 (base pay only) |
| 1× Sasha (any position) | ×1 |
| 1× Josie (any position) | ×2 |
| 1× Josie + 1× Sasha | ×3 |
| 2× Josie | ×4 |
| 2× Josie + 1× Sasha | ×5 |
| 2× Josie + 2× Sasha | ×6 |

**RULE:** Multiplier applies to regular payline pays ONLY. Jackpots always pay their fixed progressive seed regardless of wild count. Same rule applies in Red Spin bonus (uses same evaluateLine function).

**RULE:** Wilds do NOT substitute for: Gold Coin, Lipstick, BONUS letters.

---

## 6. LETTER (BONUS) RULES

- Letters B/O/N/U/S appear on their designated reel only (B=reel1, O=reel2, etc.)
- Evaluated cherry-style: all 3 rows simultaneously, each row independent
- Consecutive letters from reel 1 only — break at first non-letter
- Pays are additive across rows — all qualifying rows sum together
- Wilds do NOT substitute for letters

| Count | Multiplier (× bet/line) |
|---|---|
| 1 letter | ×1 |
| 2 letters | ×2 |
| 3 letters | ×4 |
| 4 letters | ×12 |
| 5 letters (bottom row) | → BONUS trigger (no cash pay for this row) |

**Bottom Row Trigger (M4):** If B-O-N-U-S all appear on row 2 (bottom row) simultaneously, BONUS Feature triggers. The 5-letter pay for that row is suppressed — the trigger replaces it.

---

## 7. MIXED BAR RULES

- Any mix of Single/Double/Triple Bar on a payline (3–5 consecutive from reel 1)
- Only fires on MIXED combos — pure same-bar 3/4/5-oak pays via regular paytable
- Wilds do NOT substitute

| Count | Pay (× bet/line) |
|---|---|
| 3 mixed bars | ×5 |
| 4 mixed bars | ×10 |
| 5 mixed bars | ×15 |

---

## 8. JACKPOT SYSTEM — UNIFIED (v6l96)

**Owner confirmed 2026-05-20. This is the single authoritative jackpot design.**

### Architecture

One jackpot check fires at the **moment each bonus triggers** (H&S, P&C, RS).
- Same probability table for all three bonuses
- One roll per bonus trigger — never per-spin, never per-tile-tap
- BONUS orb never directly awards jackpots — it routes to H&S/P&C/RS which each do their own entry check
- H&S or P&C triggered from inside Red Spin ARE eligible for jackpots (noJackpots suppression removed)

### Per-Bonus-Entry Probabilities

| Tier | P per bonus entry | Target spin rate | Frequency |
|---|---|---|---|
| MINI | 6.28% | ~1-in-200 spins | Most frequent |
| MINOR | 1.57% | ~1-in-800 spins | |
| MAJOR | 0.31% | ~1-in-4,000 spins | |
| GRAND | 0.06% | ~1-in-20,000 spins | Rarest |

### Must-Hit-By Caps

Each tier has a cap. When the progressive reaches the cap, the next bonus entry **forces** an award. 2% grace zone applies.

| Tier | Cap = seed × |
|---|---|
| MINI | × 3 |
| MINOR | × 4 |
| MAJOR | × 5 |
| GRAND | × 6 |

### How Each Bonus Awards Jackpots

**Hold & Spin (Option X):**
If the entry roll wins a jackpot, a jackpot coin of that tier is **guaranteed to appear on the board** during play. If it didn't land naturally during respins, it is injected by replacing one cash coin. The jackpot is awarded when that coin is collected at bonus end.

**Pick & Choose:**
Jackpots are **match-3 tiles** — exactly the same mechanic as cash, Red Spin, and H&S tiles. Player taps tiles one at a time until they match 3 of the same type. Matching 3 MINOR tiles = MINOR jackpot. Matching 3 GRAND tiles = GRAND jackpot. **No separate entry-check jackpot award.** The match-3 is the only jackpot mechanism in P&C.

**Red Spin:**
Jackpot check fires once at **each tier entry** (one roll at the moment the tier starts). 1–3 normal tier spins play first in the tier, then the jackpot spin plays as a **real RS spin** where jackpot-triggering symbols appear on the reels (processCharacterJackpots fires naturally on that spin).
- GRAND (0.06%) eligible at every tier entry
- T1 designated jackpot: MINI (6.28%)
- T2 designated jackpot: MINOR (1.57%)
- T3 designated jackpot: MAJOR (0.31%)
- T4: GRAND always eligible; MINOR/MAJOR eligible only if their current progressive > T3 ceiling (200× total bet); MINI not eligible in T4
- 60/40 continuance applies in T4 same as other tiers
- T4 uses the same ascending win engine as T1–T3 (finds real high-value wild combos on the reels)

### Progressive Seeds by Denomination

| Denom | MINI | MINOR | MAJOR | GRAND |
|---|---|---|---|---|
| 1¢ | $20 | $60 | $200 | $2,000 |
| 2¢ | $40 | $120 | $400 | $4,000 |
| 5¢ | $100 | $300 | $1,000 | $10,000 |
| 10¢ | $200 | $600 | $2,000 | $20,000 |
| 25¢ | $500 | $1,500 | $5,000 | $50,000 |
| 50¢ | $1,000 | $3,000 | $10,000 | $100,000 |
| $1 | $2,000 | $6,000 | $20,000 | $200,000 |
| $2 | $4,000 | $12,000 | $40,000 | $400,000 |
| $3 | $6,000 | $18,000 | $60,000 | $600,000 |
| $5 | $10,000 | $30,000 | $100,000 | $1,000,000 |

*$10 and $20 denominations permanently removed v6l94.*

### Character Symbol Jackpots (Base Game)

Jackpots also fire from character symbol combos on any active payline. These use the same progressive pool. Only the highest tier per spin is awarded.

| Level | Trigger |
|---|---|
| MINI | 3+ consecutive Sasha from reel 1 on any active payline |
| MINOR | 3+ consecutive Josie from reel 1 on any active payline |
| MAJOR | All 5 wilds (any mix Josie/Sasha) on any active payline |
| GRAND | 5-oak Sisters on any active payline |

---

## 9. BONUS TRIGGERS

### 9A. Hold & Spin
- **Trigger:** 6 or more Gold Coins visible anywhere in the 5×3 grid on a single spin
- **Natural rate:** ~1-in-95 spins (v7.0.5: 11 coins/reel, threshold 6 — fresh-shuffle sim verified)
- **Bet requirement:** Active winning spin not required — H&S fires independently
- **Priority:** Second after Red Spin. Suppressed if RS triggers in same spin.

### Hold & Spin Coin Value Tiers (v7.0.5 — recalibrated)
Target avg coin: 0.33× totalBet. Cash tier weights sum to 1.0 (100%).

| Tier | Weight | Range (% of totalBet) | Avg per coin |
|---|---|---|---|
| Tiny | 45% | 2–8% | 5% |
| Small | 28% | 8–25% | 16.5% |
| Medium | 16% | 25–70% | 47.5% |
| Large | 8% | 70–180% | 125% |
| Big | 3% | 180–400% | 290% ← rare |

### Hold & Spin Jackpot Layers (v7.0.5)
Two independent layers — both active per owner confirmed 2026-05-23:

**Layer 1 — Unified entry check** (fires once when H&S triggers): MINI 1.4%, MINOR 0.35%, MAJOR 0.07%, GRAND 0.014%. Total ~1.82% per session = ~1-in-55 H&S sessions have a jackpot.

**Layer 2 — Per-coin weights** (decorative rarity level): MINI 0.015%, MINOR 0.005%, MAJOR 0.002%, GRAND 0.0005%. Extremely rare bonus surprise — ~1-in-889 sessions for MINI.

### Conveyor Belt (v7.0.5 — dynamic 18-slot belt)
- 18 slots per pass × 2 passes = 36 scrollable items
- Per session composition: 6 cash coins + 2 JP coins (tier randomized, 25% each non-entry tier) + 10 blanks
- JP positions randomized each session — not fixed
- If jackpot WAS awarded at entry: that tier appears 3× instead of 1×
- JP coins on belt are decorative — only award via unified entry check (Layer 1)

### H&S RTP Target (v7.0.5)
~5.1%: cash 2.76% + entry JP 2.06% + per-coin JP 0.29%

### 9B. Pick & Choose
- **Trigger:** 5-oak Lipstick on Payline 1 (center row, Line index 0 = [1,1,1,1,1])
- **Natural rate:** ~1-in-1,734 spins (v6l108: Lipstick 18/reel — reduced from 22 to restore Diamond)
- **Priority:** Third. Suppressed if RS or H&S trigger in same spin.
- **Note:** Lipstick pays normally on other paylines (3-oak/4-oak = cash win). Only 5-oak on line 0 triggers P&C.

### 9C. Red Spin
- **Trigger:** Random roll on any WINNING spin only. `RS_FREQ = 0.120` × operator multiplier
- **PERMANENT RULE:** Red Spin must NEVER fire on a $0 (losing) spin — no exceptions. Not even chain RS.
- **Natural rate:** ~1-in-17 spins (MC verified v6l92, at 49.5% base win rate)
- **Priority:** First and highest. All other bonus triggers suppressed when RS fires in same spin.
- **Additional rounds (v6l97):** After RS ends, game returns to base. Player presses SPIN manually. If that spin is a winning combination and the RS_FREQ check passes, the red screen activates again and a fresh RS sequence starts with full tier rules and jackpot checks. No automatic chain — player must earn it.

### 9D. BONUS Feature (Orb Pick)
- **Trigger:** B-O-N-U-S on bottom row (row 2) simultaneously — natural reel trigger ONLY
- **PERMANENT RULE:** The orb pick screen must NEVER appear without B-O-N-U-S genuinely landing on the bottom row. No RNG shortcut. No probability-based random firing. (RNG shortcut removed v6l100 after bug report.)
- **Award:** Player picks one of 3 orbs — each hides a different sub-bonus (H&S, P&C, RS). The prize behind the orb the player taps is what they receive. All three prizes are randomly shuffled before the screen appears; the player's actual tap choice determines the award. (v6l114 — predetermined forced-win removed, owner confirmed 2026-05-21.)
- **Note:** BONUS orb does not directly award jackpots — the sub-bonus it routes to runs its own `_checkUnifiedJackpot()` entry check. H&S, P&C, and RS triggered via the BONUS orb are all fully jackpot-eligible (v6l114 — noJackpots suppression removed, owner confirmed 2026-05-21).

---

## 10. HOLD & SPIN RULES

### Board
- 5×3 grid (15 positions)
- Trigger coins lock immediately, showing their pre-generated values
- Starts with 3 respins

### Conveyor Belt (Luxury Vault design)
- Empty cells show a scrolling vertical strip of coins (blanks between them)
- Strip: 12 stops × 2 passes = 24 items (seamless loop)
- Strip composition: BLANK → CASH → BLANK → MINI → BLANK → CASH → BLANK → MINOR → MAJOR → BLANK → GRAND → BLANK
- Speed varies by state:
  - Normal: 2.4–3.2s/cycle (slow, dramatic)
  - Near-miss (counter=1): 4.5–6.0s/cycle (agonising crawl)
  - Anticipation (≤2 empty): 1.3–1.8s/cycle (urgent)
  - Last 3 cells: 3.2–4.2s/cycle with red border

### Coin Landing
- 2.2% land probability per empty cell per respin (HOLD_SPIN_LAND_PROBABILITY)
- Respin counter resets to 3 on every landing
- Bonus ends when counter exhausts (3 empty respins)
- Blackout (all 15 cells) = Grand Jackpot awarded in addition to board total

### Coin Value Caps (per total bet)

| Total Bet | Max coin value |
|---|---|
| < $1.00 | $3 |
| $1–$4.99 | $15 |
| $5–$9.99 | $30 |
| $10–$24.99 | $75 |
| $25–$99.99 | $200 |
| $100–$499 | $750 |
| $500+ | $2,500 |

### Cash Coin Value Tiers

| Tier | Weight | Range (% of total bet) |
|---|---|---|
| Tiny | 40% | 3–12% |
| Small | 25% | 12–35% |
| Medium | 14% | 35–85% |
| Large | 8% | 85–250% |
| Big | 4% | 250–600% |
| Huge | 1% | 600–1,500% (rare) |

---

## 11. RED SPIN RULES

### Architecture
Class III scripted volatility — real reel strips, real evaluateSpin, but wins are constrained to an ascending tier range.

**PERMANENT RULE:** RS must NEVER fire on a losing spin. Not even chain RS.

### Tier System (v7.0.4 — owner confirmed 2026-05-23)

| Tier | Win Range | Signature Symbols | JP Eligible |
|---|---|---|---|
| T1 Small | 0.5–4× total bet | Bars (all), mixed bars, bonus letter pays, low wild combos | MINI, GRAND |
| T2 Medium | 4–20× total bet | Sevens, Diamonds, character 3-oaks (Josie/Sasha/DJ Maxine), mid wild combos | MINI or MINOR (dynamic), GRAND |
| T3 Large | 20–50× total bet | DJ Maxine 4–5-oak, StrayPup 3–5-oak, Josie/Sasha 4-oak, heavy wild combos | MAJOR, GRAND |
| T4 Sisters | 50–100× total bet + GRAND | All five 4-oak all-wild combos ascending, then GRAND jackpot | GRAND |

- Each spin's win must be ≥ previous RS win (ascending rule — permanent)
- Continuance: 60% continue / 40% end every spin from spin 2 (owner confirmed 2026-05-18)
- Spin 1 of each tier: guaranteed (no continuance check)
- Tier advance (Option C — owner confirmed 2026-05-23): 20% T1→T2, 30% T2→T3, 50% T3→T4
- Wild multiplier (Josie ×2, Sasha ×1) applies to all RS payline wins — all other symbols pay normal base game pay
- Player sees no tier labels — the feature presents as a continuous free spin sequence

### T2 Jackpot Selection Rule (v7.0.4)
At T2 entry jackpot check:
- Award **MINOR** if current MINOR progressive ≥ 3× totalBet (progressive has built to meaningful value)
- Award **MINI** if MINOR progressive < 3× totalBet
- GRAND eligible at every tier entry regardless (0.06% per unified probs)

### T4 Design (v7.0.4)
T4 contains exactly five natural 4-oak all-wild combinations played in ascending order:

| Position | Wild Config | Win (× totalBet) |
|---|---|---|
| 1 | 4S + 0J | 50× |
| 2 | 3S + 1J | 62.5× |
| 3 | 2S + 2J | 75× |
| 4 | 1S + 3J | 87.5× |
| 5 | 0S + 4J | 100× |

After all five 4-oak combos play (or sequence ends via 60/40 continuance), GRAND jackpot check fires. T4 uses same ascending win engine and 60/40 continuance as T1–T3.

### RS Bonus Trigger Exclusions (v7.0.4 — owner confirmed 2026-05-23)
During RS, the grid acceptance loop rejects any stop combination that would trigger:
- **H&S** (6 or more Gold Coins anywhere on the grid)
- **P&C** (5× Lipstick on center payline)
- **BONUS orb** (all five B-O-N-U-S letters on the bottom row simultaneously)

Individual BONUS letters appearing on the bottom row (partial sequences 1–4) are NOT excluded — they still appear and pay the bonus letter pay table normally. Only a full 5-letter bottom row trigger is blocked.

This exclusion applies at every grid acceptance check in the RS loop including the random roll, the R1×R2 exhaustive scan, and the relaxed payline scan. T4 deterministic wild combos are not affected (those are constructed directly and cannot contain bonus triggers by construction).


After RS ends, game returns to base. Player presses SPIN manually. If that spin produces a winning combination AND the RNG RS frequency check passes, Red Spin activates again as a fresh sequence. No automatic chain — player must earn re-trigger naturally.

**The stale "Chain RS Option A (v6l93)" rule is SUPERSEDED by v6l97 and removed. Do not re-implement automatic chain RS.**

---

## 12. PICK & CHOOSE RULES

- **Grid:** 15 tiles, face-down
- **Mechanic:** Player taps tiles to reveal. First to match 3 of the same type wins.
- **Tile types:** Cash (multiple tiers), Red Spin, Hold & Spin, MINI, MINOR, MAJOR, GRAND
- **RULE:** Game ends immediately on match-3. Remaining tiles stay face-down.
- **RULE:** Decoy tiles of each type capped at 2 occurrences (prevents premature match from decoys)
- Jackpot: unified entry check at P&C trigger, awarded at end regardless of match-3 result

### Cash Prize Tiers
| Tier | Range (× total bet) |
|---|---|
| Small | 5–25× |
| Medium | 25–75× |
| Large | 75–150× |

---

## 13. DENOMINATIONS

Active: 1¢, 2¢, 5¢, 10¢, 25¢, 50¢, $1, $2, $3, $5
**Permanently removed:** $10, $20 (v6l94 — do not re-add)

Credits per line: 1, 2, 3, or 5
Lines: up to 20 active
Max bet: $5.00 denom × 5 credits × 20 lines = **$500/spin**

### Per-Denomination Pay Tables
`PAY_TABLE_BY_DENOM` in paytable.js allows denom-specific pay overrides.
Call `getPayTableForDenom(denom)` instead of `PAY_TABLE` directly.
Currently all denoms use the base PAY_TABLE (no overrides active yet).

---

## 14. RTP TARGETS (v7.0.4 — updated 2026-05-23)

| Component | Target RTP | Notes |
|---|---|---|
| Total game RTP | 94–96% | Per-denom targets to be set in future session |
| Base game | ~70% | Calibrated — reel strips confirmed accurate |
| Red Spin | ~15% | Revised up — reflects new tier design and frequency 0.018 |
| Hold & Spin | ~5% | Pending H&S calibration pass |
| Pick & Choose | ~2.5% | Pending P&C calibration pass |
| Jackpots (all) | ~1.5% | Pending JP calibration pass |

> RS RTP revised to 15% from original 4–6%. With new tier ranges (avg session ~22.5× totalBet) and frequency 0.018 per winning spin (~1-in-150 all spins, ~every 3.75 min), RS contributes ~15% RTP. Owner confirmed 2026-05-23.

---

## 15. OPERATOR CONTROLS

| Control | Function |
|---|---|
| Balance inject | Add test credits |
| Force H&S | Places 6–9 Gold Coins on grid, triggers H&S as real game |
| Force RS | Flags next winning spin to trigger RS |
| Force P&C | Places Lipstick on center payline, triggers P&C |
| Force BONUS | Places B-O-N-U-S on bottom row |
| Force Jackpot | Writes jackpot symbol combo to random active payline |
| Bonus Frequency Multiplier | Scales RS_FREQ (0.5×–5.0×) |
| Max Win Per Spin | Caps individual spin win (0 = no cap) |
| Disable H&S in RS | Prevents H&S from triggering inside Red Spin |

---

## 16. VERSION & CHANGE LOG

| Version | Change | Date |
|---|---|---| 
| v6l114 | Wild multiplier: all Josie/Sasha in matched run count (not leading-only). BONUS orb: player's real tap choice determines award (predetermined forced-win removed). All sub-bonuses via BONUS orb fully jackpot-eligible (noJackpots suppression removed). Reel strips: per-session crypto shuffle (LCG replaced). Script version tags bumped to ?v=6l114. | 2026-05-21 |
| v6l103 | RS per-tier JP: full unified check (GRAND any tier). BONUS orb RNG shortcut removed. H&S CSS orphaned keyframe fixed. MC rebuilt with correct JP architecture per each bonus type. GAME_DESIGN_MANUAL v1.2. | 2026-05-21 |
| v6l100 | Lipstick 32→22/reel (+10 paying symbols). P&C PRIZE_WEIGHTS rebalanced (H&S 14→8%, RS 12→6%). P&C rate: 1-in-636. MC: base 64%, total ~452%. | 2026-05-21 |
| v6l97 | RS per-tier jackpot (fires at tier entry, 1-3 spins before JP spin, real symbols on reels). T4 wild combos via ascending spin engine. MINOR/MAJOR eligible in T4 if progressive > T3 ceiling. pendingRedSpins queue removed — additional RS via natural base game trigger. Jackpot celebration redesigned: meter flash red + bell. MAJOR/GRAND keeps Cash Out screen. P&C jackpot entry award removed — match-3 tiles only. Game Design Manual v1.1 + Phase Plan permanent rules added. | 2026-05-20 |
| v6l96 | Wild multiplier redesign (additive Josie×2+Sasha×1). Unified jackpot system. _checkUnifiedJackpot at all bonus entries. H&S Option X (guaranteed jackpot coin). Must-hit-by caps. Game Design Manual created. | 2026-05-20 |
| v6l95 | game.js full ES5 rewrite. Dead generateCashCoinValue removed. MC evalLine wild multiplier fixed. | 2026-05-20 |
| v6l94 | $10/$20 denoms permanently removed | 2026-05-20 |
| v6l93 | Version badge on splash. Cache fix (sessionStorage version check). RS Option A chain (35%/20%). H&S 7-tier coin cap. | 2026-05-20 |
| v6l92 | PAY_TABLE_BY_DENOM scaffold. RS freq 0.240→0.120. HS_LAND 0.055→0.022. MC tool calibrated. | 2026-05-20 |
| v6l90 | Gold coins 10→15/reel. MIN_GAP exception for BONUS_ID (3→1). RS freq 0.286→0.240. | 2026-05-20 |
