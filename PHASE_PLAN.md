# The Turrelle Sisters Big Munny$ — Development Phase Plan

> ## ⚠️ MANDATORY INSTRUCTIONS FOR ALL DEVELOPERS AND AI ASSISTANTS
> 
> **This file is the single source of truth for this project.**
> 
> ### Rules that MUST be followed on every change:
> 1. **Read this file first** before making any code changes
> 2. **Update this file immediately** after every change — no exceptions
> 3. **Every phase, fix, bug, and design decision** must be logged here
> 4. **Build history** must be updated with every new zip/release
> 5. **Testing results** must be recorded here as they come in
> 6. **Do not rely on memory** — if it happened, it must be in this file
> 7. **Symbol table, math, and RTP targets** in this file are authoritative
> 8. **Before asking the user** — check this file first, the answer may already be here
> 9. **Never mark a phase complete** without user confirmation of testing
> 10. **Never change math/RTP** without running Monte Carlo verification and logging results here
> 11. **Update PHASE_PLAN.md BEFORE making any code changes** — log what you are about to do, why, and what files will be affected
> 12. **Always check the KNOWN ISSUES and entire PHASE_PLAN for newly found bugs before starting work** — a bug may have been discovered and documented since your last session. Never assume the plan is unchanged. If a bug is found during analysis that is not yet in this file, add it to KNOWN ISSUES immediately before touching any code.
> 13. **Always test the game fully before delivering a zip to the owner** — open the game, trigger every feature that was touched (base game spin, Red Spin, Hold & Spin, Pick & Choose, BONUS letters, operator menu), confirm no crashes or regressions, and log the test result in the Testing Log before packaging. Never hand over a zip that has not been tested in this session.
14. **`deadfiles.zip` is included in every build package** — if the game ever shows missing file errors, broken images, missing audio, or any asset-not-found issue, check `deadfiles.zip` first before assuming files were never created. These files were confirmed unused as of v6j5 (2026-05-15) but are preserved in case a future feature needs them or a reference was missed. Do NOT delete `deadfiles.zip` from the package. Contents: `ching.mp3`, `lipstick_bonus.mp3`, `splash_music.mp3`, `josie_title.png`, `sasha_title.png`, `sisters_title.png`, `sisters_celebrate.webp`, `sasha_solo_celebrate.webp`, `icons/splash.png`.
15. **`PHASE_PLAN.md` is always included in every build zip** — the phase plan must travel with the game files at all times. Never deliver a zip without it. Always update the phase plan before zipping.
>
> ### This file is used by:
> - Developers continuing this project
> - AI assistants resuming the conversation
> - The operator for audit and compliance reference
> - Future phases as a design reference

---

> ## 🌐 CROSS-PLATFORM COMPATIBILITY — MANDATORY REQUIREMENT
>
> **The game MUST work on ALL of the following without exception:**
>
> ### Platforms:
> - Android (all versions Chrome 55+, Samsung Browser, WebView)
> - iOS / iPadOS (Safari, Chrome, Firefox)
> - Windows / Mac / Linux desktop browsers
> - Custom launchers (kiosk mode, embedded WebView, WPS-compatible)
> - PWA (installed as app on Android and iOS home screen)
>
> ### Browsers:
> - Chrome / Chromium (Android + Desktop)
> - Safari (iOS + macOS) — strictest — must test here
> - Samsung Internet Browser
> - Firefox (Android + Desktop)
> - Edge (Desktop)
> - Opera / Opera Mini
> - Any embedded WebView or custom launcher browser
>
> ### WPS / Custom Launcher Compatibility Rules:
> - NO features that require a specific browser engine
> - NO ES6+ syntax in inline HTML scripts (no const/let, no arrow functions, no ?., no template literals, no destructuring, no spread operator)
> - External .js files MAY use modern syntax IF minified/transpiled, otherwise also use ES5
> - NO Web Bluetooth, Web USB, or other non-standard APIs
> - Touch events must use both `touchstart`/`touchend` AND `click` fallbacks
> - All audio must use Web Audio API with HTML5 Audio fallback
> - Service Worker must degrade gracefully if not supported
> - Game must be fully playable with SW disabled (no SW = no crash)
> - All assets must load over HTTP (not HTTPS-only)
> - No external CDN dependencies — all assets bundled in zip
> - CSS must include -webkit- prefixes for animations and transforms
> - No CSS Grid features unsupported before 2018
>
> ### Code Standards for Compatibility:
> - **Inline HTML `<script>` blocks**: ES5 only — var, function(){}, no arrows, no ?., no backticks
> - **External .js files**: ES5 preferred; if ES6 used, must be tested on Samsung Browser and iOS Safari
> - **CSS animations**: Always include `@-webkit-keyframes` alongside `@keyframes`
> - **CSS transforms**: Always include `-webkit-transform` alongside `transform`
> - **Touch handling**: `preventDefault()` on touchend to avoid double-fire with click
> - **Audio**: Check `AudioContext || webkitAudioContext` — always include webkit prefix
> - **requestAnimationFrame**: Check `window.requestAnimationFrame || window.webkitRequestAnimationFrame`
>
> ### Testing Checklist (must pass on ALL platforms before release):
> - [ ] Android Chrome — full gameplay
> - [ ] Android Samsung Browser — full gameplay
> - [ ] iOS Safari — full gameplay including audio
> - [ ] Desktop Chrome — full gameplay
> - [ ] Desktop Firefox — full gameplay
> - [ ] PWA install and launch — Android and iOS
> - [ ] Custom launcher / kiosk WebView — full gameplay
> - [ ] Offline mode (SW cache) — game loads without network

---

**Game Version:** v6j6 (current)
**Last Updated:** Full game design rules added + priorities re-evaluated (2026-05-15)
**Target RTP:** 94%  
**Reel Structure:** 5 reels × 3 rows × 80 stops × 20 paylines (MLMC Aristocrat VGT style)

---

## 🎮 FULL GAME DESIGN & RULES — AUTHORITATIVE REFERENCE

> This section is the complete, authoritative design specification for The Turrelle Sisters Big Munny$.
> All code must conform to these rules. If code contradicts this section, the code is wrong.
> Update this section when the owner confirms a design change — never update it to match broken code.

---

### GAME OVERVIEW

**Title:** The Turrelle Sisters Big Munny$
**Spin/Play Button:** These refer to the same button — the primary action button the player presses to start a spin. "Spin button", "play button", and "spin/play button" are interchangeable throughout this document and all code.  
**Style:** MLMC (Multi-Line Multi-Credit) — Aristocrat VGT style (Hunt for Neptune's Gold / Aztec Sun)  
**Platform:** Mobile-first HTML5/PWA, wrappable as Android APK  
**Reel layout:** 5 reels × 3 visible rows = 15 symbol positions  
**Paylines:** 20 fixed paylines (always active — player selects lines 1–20)  
**RTP target:** 94% total (base ~74–80% + bonuses ~14–20%)

---

### BET STRUCTURE (MLMC)

| Parameter | Options | Default |
|---|---|---|
| Denomination | 1¢, 2¢, 5¢, 10¢, 25¢, 50¢, $1 | 5¢ |
| Credits per line | 1, 2, 3, 5, 10 | 1 |
| Lines active | 1, 5, 10, 15, 20 | 20 |
| **Total bet** | denom × credits/line × lines | — |
| **Cash win** | credits won × credits/line × denom | — |

**Examples at 5¢ / 1 credit / 20 lines:** Total bet = $1.00. A 100-credit win = $5.00.  
**Max bet at $1 denom / 10 credits / 20 lines:** Total bet = $200.00.

---

### PAYLINES

All 20 paylines are always evaluated. Player can select 1, 5, 10, 15, or 20 lines. Wins only pay on active lines. Paylines are left-to-right consecutive from reel 1 — partial pays begin from reel 1.

```
Payline layout (row index per reel — 0=top, 1=center, 2=bottom):
 0: [1,1,1,1,1]  — center straight
 1: [0,0,0,0,0]  — top straight
 2: [2,2,2,2,2]  — bottom straight
 3: [0,1,2,1,0]  — V-shape down
 4: [2,1,0,1,2]  — V-shape up
 5: [0,0,1,2,2]  — diagonal down-right
 6: [2,2,1,0,0]  — diagonal up-right
 7: [1,0,0,0,1]  — top arch
 8: [1,2,2,2,1]  — bottom arch
 9: [0,1,1,1,0]  — center-top arch
10: [2,1,1,1,2]  — center-bottom arch
11: [1,0,1,0,1]  — zigzag top
12: [1,2,1,2,1]  — zigzag bottom
13: [0,0,1,0,0]  — top-center spike
14: [2,2,1,2,2]  — bottom-center spike
15: [0,1,0,1,0]  — top zigzag
16: [2,1,2,1,2]  — bottom zigzag
17: [1,1,0,1,1]  — center-top dip
18: [1,1,2,1,1]  — center-bottom dip
19: [0,2,0,2,0]  — outer zigzag
```

---

### SYMBOL RULES

#### Standard payline symbols (consecutive from reel 1, left-to-right, on active payline)
All standard symbols pay on the active payline the combination lands on. Minimum 2-of-a-kind for most symbols (except Lipstick which has special rules). Pay = credits × credits-per-line × denom.

| Symbol | ID | Count/reel | Pays (5/4/3/2-oak) | Notes |
|---|---|---|---|---|
| Sisters | 0 | 1/reel | 5000/750/150/0 | Triggers GRAND jackpot on 5-oak |
| Josie | 1 | 3(R1), 2(R2-R4), 1(R5) | 2000/400/75/0 | **Wild ×4** — triggers MINOR jackpot on 5-oak |
| Sasha | 2 | 1(R1), 2(R2-R4), 3(R5) | 2000/400/75/0 | **Wild ×2** — triggers MINI jackpot on 5-oak |
| Seven | 3 | 6/reel | 500/100/25/0 | — |
| Triple Bar | 4 | 6/reel | 150/30/8/0 | — |
| Double Bar | 5 | 8/reel | 60/15/5/0 | — |
| Single Bar | 6 | 6/reel | 25/8/2/0 | — |
| Cherry | 7 | 4/reel | 10/4/2/1 | **Special** — see Cherry Rules below |
| Lipstick | 8 | 14/reel | 0/20/5/0 | **Special** — see Lipstick Rules below |
| Gold Coin | 9 | 14/reel | No payline pay | **Special** — see Hold & Spin Rules below |
| Diamond | 15 | 3/reel | 100/25/8/0 | — |
| DJ Maxine | 16 | 2/reel | 700/150/35/0 | — |
| Stray Pup | 17 | 2/reel | 1000/200/50/0 | — |

#### BONUS Letter symbols (Special — not standard payline symbols)
| Symbol | ID | Reel | Notes |
|---|---|---|---|
| Letter B | 10 | Reel 1 only | — |
| Letter O | 11 | Reel 2 only | — |
| Letter N | 12 | Reel 3 only | — |
| Letter U | 13 | Reel 4 only | — |
| Letter S | 14 | Reel 5 only | — |

Each BONUS letter only appears on its designated reel. B can only land on reel 1, O on reel 2, etc.

#### Mixed Bar (virtual combination — not a symbol)
3, 4, or 5 any-bar mix (Single/Double/Triple Bar in any combination) on an active payline. Only counts if it is NOT a pure same-type bar combo (those pay via regular paytable).  
Pays: 3-bar mix = 5× bet/line | 4-bar mix = 15× bet/line | 5-bar mix = 35× bet/line

---

### WILD MULTIPLIER RULES

Josie (id:1) and Sasha (id:2) are both wilds. They substitute for any standard payline symbol except Gold Coin, Lipstick, and BONUS letters (non-substitutable). Wild multipliers apply based on **which** wild(s) appear in the winning combo:

| Wild combination | Multiplier |
|---|---|
| Sasha only (any count) | ×2 |
| Josie only (any count) | ×4 |
| Sasha + Josie together | ×6 |
| No wilds | ×1 |

Minimum qualifying combo is 3-of-a-kind total (wild + matching symbols combined). A wild alone in a 2-symbol combo does not qualify unless the symbol has a 2-oak pay.

---

### CHERRY RULES

- Cherry pays on **any row**, not just active paylines
- **All 3 rows are checked simultaneously** — every row that qualifies pays independently
- Minimum: 1 consecutive cherry from reel 1
- Pays scale: 1=1cr, 2=2cr, 3=2cr×, 4=4cr, 5=10cr (× bet/line)
- Cherry pays are **additive across rows** — all qualifying rows sum together
- Wilds do NOT substitute for Cherry

---

### LIPSTICK RULES

- Lipstick is a payline symbol (not scatter)
- 3-oak on active payline = 5 credits
- 4-oak on active payline = 20 credits
- **5-oak on any active payline = Pick & Choose trigger** (no cash pay for the 5-oak itself)
- Wilds do NOT substitute for Lipstick

---

### JACKPOT RULES

Jackpots fire when 5 of the jackpot symbol land on any active payline.

| Jackpot | Symbol | Trigger | Seed ($0.10 denom) |
|---|---|---|---|
| MINI | Sasha (5-oak) | Any active payline | $50 |
| MINOR | Josie (5-oak) | Any active payline | $150 |
| MAJOR | — | Reserved (no base symbol trigger at present) | $500 |
| GRAND | Sisters (5-oak) | Any active payline | $5,000 |

- Only the **highest tier** jackpot pays per spin (not multiple jackpots in one base spin)
- Jackpot seeds scale by denomination — see `JACKPOT_SEEDS_BY_DENOM` in `paytable.js`
- On MAJOR or GRAND hit: player sees a lock screen with Cash Out / Continue options

---

### BONUS LETTER FEATURE RULES

> **Design:** Each BONUS letter (B, O, N, U, S) only appears on its designated reel. A "BONUS combination" means the correct letter lands in the same row across consecutive reels — B in row X on reel 1, O in row X on reel 2, N in row X on reel 3, etc.

#### Detection Rule
`evaluateBonusLetters()` scans all 3 rows. For each row, it counts how many consecutive correct letters land starting from reel 1 (B on reel 1, O on reel 2, N on reel 3, U on reel 4, S on reel 5). The **best row** (highest count) is used. Only one BONUS result per spin (best row wins).

#### Partial Pays (credit multipliers × bet-per-line)
| Letters in a row | Pay |
|---|---|
| 1 (B only) | 2× bet/line |
| 2 (B-O) | 5× bet/line |
| 3 (B-O-N) | 15× bet/line |
| 4 (B-O-N-U) | 50× bet/line |
| 5 (B-O-N-U-S) | **BONUS Feature triggered** (no cash pay) |

#### Full BONUS Feature (5 letters same row)
Triggers the Mystery Bonus Orb selection screen:
1. Player is presented with 3 orbs to choose from
2. One orb contains the predetermined prize; two are decoys
3. Prize options: Hold & Spin, Pick & Choose, or Red Spin
4. Sub-bonus runs after orb selection
5. **Jackpots are suppressed inside the BONUS orb sub-bonuses** (cannot win jackpot inside orb feature)

#### What CAN happen inside Red Spin for BONUS letters:
- Partial BONUS letter pays (1–4 letters) — pay out via normal evaluateSpin
- Full BONUS (5 letters same row) — triggers orb selection mid-Red Spin

---

### RED SPIN RULES

Triggered randomly in base game (not by a symbol combination). Triggers approximately 1-in-X spins (RNG-based).

| Rule | Detail |
|---|---|
| Spin 1 | Always guaranteed — continuance check starts from spin 2 |
| Continuance | 65% chance to continue after each spin from spin 2 onward |
| Stop condition | 35% RNG stop, OR Grand Jackpot lands and beats previous win |
| Win rule | Each spin's total win must exceed the previous spin's win (ascending) |
| Re-roll | If a spin fails the ascending rule, it re-rolls until it beats last win |
| Reel evaluation | Full `evaluateSpin()` — identical rules to base game |
| Paylines | Same active paylines as base game — same bet settings |
| CAN trigger inside | H&S (6+ coins), P&C (5-oak Lipstick), BONUS letters (partial + full), jackpots |
| CANNOT trigger | Jackpots inside BONUS orb feature |
| End screen | Shows total bonus win + spin count before returning to base game |

---

### HOLD & SPIN RULES

Triggered when 6 or more Gold Coin symbols land anywhere on the 15-position grid.

| Rule | Detail |
|---|---|
| Trigger | 6+ Gold Coins anywhere in 5×3 grid |
| Starting respins | 3 |
| Respin reset | Reset to 3 every time a new coin lands on an empty cell |
| End condition | Respin counter reaches 0, OR all 15 positions filled (blackout) |
| Locked coins | All triggering coins stay locked in their positions throughout |
| Coin values | Each new coin has a random value (cash or jackpot) assigned on landing |
| Payout | Sequential collection animation — each coin's value added one by one |
| Blackout bonus | All 15 positions filled = Grand Jackpot awarded IN ADDITION to all coin totals |

#### Coin Value Tiers
Cash coins are fraction-based (scaled to total bet):

| Tier | Weight | Range (at $20 total bet) |
|---|---|---|
| Tiny | 42% | $0.40 – $2.00 (2–10% of bet) |
| Small | 25% | $2.00 – $6.00 (10–30% of bet) |
| Medium | 13% | $6.00 – $15.00 (30–75% of bet) |
| Large | 7% | $15.00 – $40.00 (75–200% of bet) |
| Big | 3% | $40.00 – $100.00 (200–500% of bet) |

Jackpot coins (replace top cash tiers — all 4 levels achievable):

| Level | Weight | Hit rate | Seed ($0.10 denom) |
|---|---|---|---|
| MINI | 0.3333% | ~1-in-50 H&S bonuses | $50 |
| MINOR | 0.0833% | ~1-in-200 H&S bonuses | $150 |
| MAJOR | 0.0167% | ~1-in-1000 H&S bonuses | $500 |
| GRAND | 0.0033% | ~1-in-5000 H&S bonuses | $5,000 |

**All jackpot levels that land during a single H&S bonus ALL pay at bonus end** (not just highest).  
Land probability per cell per respin: 5.5% (avg ~6 coins per trigger).  
Target H&S RTP contribution: 8–10% across all trigger contexts.

---

### PICK & CHOOSE RULES

Triggered by 5-oak Lipstick on any active payline.

| Rule | Detail |
|---|---|
| Trigger | 5 Lipstick on any active payline |
| Board | 15 tiles (3 rows × 5 columns) |
| Win tiles | 3 tiles contain the predetermined prize type |
| Decoy tiles | 12 tiles — no decoy type appears more than 2× (prevents false match-3) |
| Win condition | Player taps tiles until they find 3 matching tiles (match-3 guaranteed) |
| Prizes | Cash award, Hold & Spin, or Red Spin |
| Jackpots | Can be awarded as part of the H&S or Red Spin sub-bonus |

**Guarantee:** The 3 predetermined winning tiles are always findable before any decoy type reaches match-3, because each decoy type is capped at max 2 occurrences across the 12 decoy positions.

---

### OPERATOR MENU

Access: PIN-protected (default PIN: owner-set). Not accessible to players.

| Feature | Description |
|---|---|
| Force Red Spin | Triggers Red Spin on next spin |
| Force P&C | Forces 5-oak Lipstick on center row |
| Force H&S | Forces 6 Gold Coins to grid |
| Force BONUS | Forces BONUS letters to center row |
| Force Jackpot | Forces MINI/MINOR/MAJOR/GRAND on specified context |
| Event log | Full spin history with date/time, bet, win, symbol combos |
| Export | CSV/JSON export of event log |
| Replay | Full replay of last game with animations |
| Auto-play | Auto-spin (operator only — not player-accessible) |
| Disable P&C in Red Spin | Toggle |
| Disable H&S in Red Spin | Toggle |
| Max win per spin cap | Configurable |
| Reset lifetime RTP | Clears lifetime stats |

---

### AUDIO EVENTS

| Event | Sound | Key |
|---|---|---|
| Theme music | Continuous loop | `theme_music` |
| Spin | — | — |
| Win | Credit rollup | `coin_drop` |
| Bonus trigger (any) | Bell ring(s) | `playBellsForBonus()` |
| Red Spin entry | Red spin music | `red_spin_entry` |
| Hold & Spin trigger | Hold spin trigger | `hold_spin_trigger` |
| H&S end | Hold spin end | `hold_spin_end` |
| Pick music | Pick & Choose music | `pick_music` |
| Pick reveal | Orb reveal | `pick_reveal` |
| BONUS letter trigger | *(missing — needs implementing)* | `bonus_trigger` |
| Credit rollup | Credits adding | `coin_drop` (NOT `credits_addup`) |

#### Bell Ring Logic
| Win amount | Rings |
|---|---|
| $10 – $49.99 | 1 ring |
| $50 – $99.99 | 2 rings |
| $100 – $999.99 | 3 rings |
| $1,000+ | 10 rings |
| Any bonus trigger | 1 ring (via `playBellsForBonus()`) |
| Bonus + big win | Higher rule only — no stacking |

---

### RTP TARGETS & CURRENT STATUS

| Component | Target | Current (broken state) |
|---|---|---|
| Base game | 74–80% | ~91% (over — multiple bugs) |
| Hold & Spin | 8–10% | ✅ Fixed (8.58–8.66% verified) |
| Red Spin | ~4–6% | Unknown (broken) |
| Pick & Choose | ~2–3% | Unknown (broken) |
| BONUS letters | ~1–2% | ~6% (review after RTP fix) |
| **Total target** | **94%** | **Unknown — blocked by bugs** |

---

### PLATFORM & PERSISTENCE

- **Testing device:** Samsung Galaxy S23 (Android Chrome)
- **Served via:** Simple HTTPS Server app during testing
- **Future deployment:** Android APK via Android Studio (no ads, owner-built)
- **Balance:** Persists in `localStorage` across sessions
- **RTP stats:** Must be lifetime of machine — persist across all sessions, reset only via operator menu
- **Service Worker:** Cache-first offline support — bump `CACHE_NAME` on every build

---

## PHASE A — Quick Fixes (Low Risk) ✅ COMPLETE
**Files:** paytable.js, game.js, service-worker.js

| # | Fix | Detail | Status |
|---|---|---|---|
| A1 | Service worker cache name | Bump from `turrelle-p3r` → `turrelle-v6a` | ✅ |
| A2 | SW cache missing files | Add TSistsersBigMunnyTitle.png, diamond.svg, sisters_title.png | ✅ |
| A3 | Cherry single pay | Single cherry pays + payline animation shows winning row | ✅ |
| A4 | Hold & Spin trigger | Confirmed 6 coins (user reverted from 5) | ✅ |
| A5 | Wild multiplier | Fixed to {1:2, 2:6} — Sasha×2, Josie×4, both×6 | ✅ |
| A6 | Version references | All updated to v6a3 | ✅ |

---

## PHASE B — UI / Code Cleanup (Low Risk) ✅ COMPLETE
**Files:** index.html, ui.js

| # | Fix | Detail | Status |
|---|---|---|---|
| B1 | Remove auto-btn from main UI | Removed from controls HTML — JS null-guarded | ✅ |
| B2 | Fix optional chaining `?.` in inline HTML | All 20 instances replaced with null checks — zero remaining | ✅ |
| B3 | Dead code removal | Already clean in v6 baseline — no changes needed | ✅ |
| B4 | Paytable — add new symbols | Already present in v6 baseline | ✅ |
| B5 | Mixed bar + 1 Cherry in paytable | Mixed Bar (35×) and 1 Cherry added. Scroll fixed. Back btn locked. | ✅ |

---

## PHASE C — Character Art Integration (Medium Risk) ✅ COMPLETE
**Files:** assets/, paytable.js, ui.js

| # | Fix | Detail | Status |
|---|---|---|---|
| C1 | Josie high-res reel symbol | Cropped from JosieCartoon.png (740×1406) → 300×239px | ✅ |
| C2 | Sasha high-res reel symbol | Cropped from SashaCartoon.png (811×1418) → 300×210px | ✅ |
| C3 | DJ Maxine reel symbol | maxine.png already in place | ✅ |
| C4 | Stray Pup reel symbol | scott.png already in place | ✅ |
| C5 | Title banner | TSistsersBigMunnyTitle.png in place | ✅ |
| C6 | Celebration images | sisters_celebrate.png + sasha_solo_celebrate.png alternating randomly on jackpot screen. GIF animation deferred to Phase G (place .gif files directly in assets/ folder on server) | ✅ |

---

## PHASE D — Jackpot Redesign (Medium Risk) ✅ COMPLETE
**Files:** game.js, bonuses.js, ui.js

| # | Fix | Detail | Status |
|---|---|---|---|
| D1 | Jackpots on any active payline | checkCharacterJackpots scans all active paylines | ✅ |
| D2 | Highest tier only per spin | One jackpot per spin — highest tier across all active paylines | ✅ |
| D3 | GRAND any active payline | GRAND fires on any active payline — confirmed VGT Aristocrat style | ✅ |
| D4 | Highest jackpot rule | tierOrder comparison — highest tier wins across all lines | ✅ |
| D5 | Operator force jackpot | Force writes to random active payline row (not always center) | ✅ |
| D6 | Jackpot lock screen | Major/Grand Cash Out / Continue confirmed working | ✅ |
| D7 | Red Spin jackpot odds | Base game per-spin odds confirmed — no guarantee | ✅ |

---

## PHASE E — Math Rewrite / Asymmetric Reels (Complex) ✅ COMPLETE
**Files:** paytable.js, game.js

| # | Fix | Detail | Status |
|---|---|---|---|
| E1 | Asymmetric reel strips | R1 more Josie, R5 more Sasha — confirmed design | ✅ |
| E2 | Target RTP 94% | Base 74%, bonuses ~20% = 94% confirmed via 2M spin MC | ✅ |
| E3 | Pay table values | Pup/Maxine reduced 30%, all others confirmed | ✅ |
| E4 | Cherry pay structure | All rows pay simultaneously, 1+ consecutive from R1 | ✅ |
| E5 | Wild multiplier RTP impact | Confirmed ×2/×4/×6, min 3-oak total, coded | ✅ |
| E6 | Lipstick redesign | Lipstick now payline symbol. 5-oak any active payline = P&C trigger. 4-oak=20cr, 3-oak=5cr. 14/reel. Reel strip: singlebar 10→15, lipstick 19→14. Red Spin reactive check updated to 5-oak payline scan. | ✅ |
| E7 | BONUS letter frequency | Increased 1→10/reel. Singlebar 15→6 to make room. Full BONUS ~1in11k, 3-ltr partial ~1in223. forceBonusFeature writes 5 letters to center row. | ✅ |
| E8 | RTP calculator output | MC results logged in PHASE_PLAN.md | ✅ |

---

## PHASE F — Operator Menu Overhaul (Complex) 🔄 NEXT
**Files:** operator.js, state.js, bonuses.js

| # | Fix | Detail | Status |
|---|---|---|---|
| F0 | Operator panel self-close bug | history.pushState in openPanel() fired immediate popstate on Android — fixed in v6h4 | ✅ |
| F1 | Force Red Spin | Shows base game win first, then triggers Red Spin | ⏳ |
| F2 | Force Pick & Choose | Writes 5 lipstick symbols to center row (payline 0) before animation | ⏳ |
| F3 | Force Hold & Spin | Writes 5 gold coins to grid before animation | ⏳ |
| F4 | Force BONUS mid-Red Spin | Triggers on very next individual spin | ⏳ |
| F5 | Force Jackpot (any context) | BASE / BONUS / ANY context modes all working | ⏳ |
| F6 | Auto Test Suite | Single button exercises all features, generates pass/fail .txt report | ⏳ |
| F7 | Event log detail | Date/time, serial, bet, win, balance before/after, symbol combos | ⏳ |
| F8 | Replay function | Full replay of last game — reels animate, bonuses play through | ⏳ |
| F9 | Auto-play in operator only | Auto-play accessible only via operator menu | ⏳ |

---


---

## PHASE J — Denom Expansion + Jackpot Seed Rebalance ⏳ PENDING
**Files:** `paytable.js`, `index.html` (denom selector UI), `operator.js` (denom display)
**Must do:** Run Monte Carlo after changes. Max bet at $20 denom = $4,000/spin — verify RTP holds.

### J1 — Add new denominations to DENOMINATIONS array

Current list: `[0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1.00]`
New list (append): `[0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1.00, 2.00, 3.00, 5.00, 10.00, 20.00]`

New labels: add `'$2', '$3', '$5', '$10', '$20'` to `DENOM_LABELS`

**Max bet implications at new denoms (10 credits × 20 lines):**

| Denom | Max total bet |
|---|---|
| $2 | $400 |
| $3 | $600 |
| $5 | $1,000 |
| $10 | $2,000 |
| $20 | $4,000 |

### J2 — Full confirmed jackpot seed table (all values owner-approved 2026-05-15)

**Rules confirmed by owner:**
- All denoms 1¢–$1: same jackpot seeds as $1 denom (flat floor — jackpots feel meaningful at any denom)
- $2+ denoms: scale up from $1 using ×2,000 of denom for GRAND
- $3 denom GRAND = $5,000 (round number — no $4 denom, so $3 bridges to $5)
- MINI ≈ 1% / MINOR ≈ 3% / MAJOR ≈ 10% of GRAND
- Max credits/line = 5 (not 10) so max bet = denom × 5 × 20 lines = denom × 100

**Full confirmed table:**

| Denom | Min Bet | Max Bet | MINI | MINOR | MAJOR | GRAND |
|---|---|---|---|---|---|---|
| 1¢ | $0.20 | $1.00 | $20 | $60 | $200 | $2,000 |
| 2¢ | $0.40 | $2.00 | $20 | $60 | $200 | $2,000 |
| 5¢ | $1.00 | $5.00 | $20 | $60 | $200 | $2,000 |
| 10¢ | $2.00 | $10.00 | $20 | $60 | $200 | $2,000 |
| 25¢ | $5.00 | $25.00 | $20 | $60 | $200 | $2,000 |
| 50¢ | $10.00 | $50.00 | $20 | $60 | $200 | $2,000 |
| $1 | $20.00 | $100.00 | $20 | $60 | $200 | $2,000 |
| $2 | $40.00 | $200.00 | $40 | $120 | $400 | $4,000 |
| $3 | $60.00 | $300.00 | $50 | $150 | $500 | $5,000 |
| $5 | $100.00 | $500.00 | $100 | $300 | $1,000 | $10,000 |
| $10 | $200.00 | $1,000.00 | $200 | $600 | $2,000 | $20,000 |
| $20 | $400.00 | $2,000.00 | $400 | $1,200 | $4,000 | $40,000 |

**JavaScript — ready to copy into paytable.js:**
```javascript
const JACKPOT_SEEDS_BY_DENOM = {
  0.01: { MINI:   20, MINOR:    60, MAJOR:    200, GRAND:   2000 },  // 1¢  — max bet $1.00
  0.02: { MINI:   20, MINOR:    60, MAJOR:    200, GRAND:   2000 },  // 2¢  — max bet $2.00
  0.05: { MINI:   20, MINOR:    60, MAJOR:    200, GRAND:   2000 },  // 5¢  — max bet $5.00
  0.10: { MINI:   20, MINOR:    60, MAJOR:    200, GRAND:   2000 },  // 10¢ — max bet $10.00
  0.25: { MINI:   20, MINOR:    60, MAJOR:    200, GRAND:   2000 },  // 25¢ — max bet $25.00
  0.50: { MINI:   20, MINOR:    60, MAJOR:    200, GRAND:   2000 },  // 50¢ — max bet $50.00
  1.00: { MINI:   20, MINOR:    60, MAJOR:    200, GRAND:   2000 },  // $1  — max bet $100.00
  2.00: { MINI:   40, MINOR:   120, MAJOR:    400, GRAND:   4000 },  // $2  — max bet $200.00
  3.00: { MINI:   50, MINOR:   150, MAJOR:    500, GRAND:   5000 },  // $3  — max bet $300.00
  5.00: { MINI:  100, MINOR:   300, MAJOR:   1000, GRAND:  10000 },  // $5  — max bet $500.00
 10.00: { MINI:  200, MINOR:   600, MAJOR:   2000, GRAND:  20000 },  // $10 — max bet $1,000.00
 20.00: { MINI:  400, MINOR:  1200, MAJOR:   4000, GRAND:  40000 },  // $20 — max bet $2,000.00
};
```

**⚠️ RTP impact warning — run Monte Carlo after implementation:**
- Lower denoms (1¢–50¢): GRAND increases significantly (e.g. 1¢ $500→$2,000, 4× larger)
- Jackpot RTP contribution will be higher at low denoms than current baseline
- Total RTP may exceed 94% target at low denoms until base game is recalibrated
- Log Monte Carlo results here before marking J2 complete

### J3 — Credits/line cap change ✅ CONFIRMED (2026-05-15)
- `CREDITS_PER_LINE_OPTIONS`: `[1, 2, 3, 5, 10]` → `[1, 2, 3, 5]` (remove 10)
- Max credits/line = 5 — ensures max bet = denom × 100 at every denom
- All paylines continue to evaluate identically — only the bet ceiling changes
- Total bet display must show correct value at all credits/line settings
- **File:** `paytable.js` (CREDITS_PER_LINE_OPTIONS), `index.html` / `ui.js` (BET MAX button)
- **Status:** ⏳ Implement alongside J1 and J2

### J3b — Bet structure UI restructure ⏳ DEFERRED — LOWEST PRIORITY
> **Owner note (2026-05-15):** Still deciding on approach. Do not implement until owner returns to this topic.

Possible interpretations (to be confirmed by owner):
- Replace separate credits-per-line + lines selectors with a single total-bet selector
- Simplify UI to show only total bet rather than full MLMC breakdown
- Change internal bet representation

**⚠️ REMINDER: Owner to revisit and confirm scope before any work begins.**

### J4 — UI denom selector
- Denom picker must scroll or paginate for 12 options — current picker may clip on mobile
- New high denoms should be visually distinct (e.g. gold border on $5+) to signal premium play
- Max bet warning: at $5+ denom, show a confirmation prompt before first spin ("Max bet is $X — continue?")

---

## PHASE K — Operator Menu Full Overhaul ⏳ PENDING
**Files:** `operator.js`, `game.js`, `bonuses.js`, `state.js`
**Priority:** Fix all wiring issues, then add combined triggers. Test every function personally before marking complete.

> ### Owner requirements (confirmed 2026-05-15):
> - All existing operator functions must be properly wired and working
> - Jackpot triggers: all 4 levels individually testable from operator menu
> - Bonus triggers: all 4 bonus types individually triggerable
> - Combined triggers: bonus type + jackpot level triggerable together in one arm
> - Purpose: QA testing without waiting for natural RNG hits

### K1 — Audit and wire all existing Phase F items

| Item | Current state | Action needed |
|---|---|---|
| F1 Force Red Spin | `forceRedSpin` flag set but game.js `checkRedSpinTrigger()` reads it — verify works end-to-end | Test and confirm |
| F2 Force Pick & Choose | `forceFreeSpins` flag — name mismatch with actual feature name; verify `evaluateSpin` reads it and fires P&C | Audit + rename flag to `forcePickChoose` for clarity |
| F3 Force Hold & Spin | `forceBonusGame` flag — verify `evaluateSpin` triggers 6-coin H&S board correctly | Audit + confirm |
| F4 Force BONUS Letters | `forceBonusFeature` flag — verify writes B-O-N-U-S to center row before spin | Audit + confirm |
| F5 Force Jackpot | `forceJackpot` + `forceJackpotContext` — ARM button exists; verify fires at correct point | Audit + confirm all 3 contexts (base/bonus/any) |
| F6 Auto Test Suite | Not built | Future sub-phase |
| F7 Event log detail | Panel buttons exist; log data exists; verify display renders correctly | Audit |
| F8 Replay function | `replayGame()` exists in bonuses.js; verify operator panel wires to it | Audit |
| F9 Auto-play | Input + apply button exist; verify auto-spin loop runs and respects limits | Audit |

### K2 — Combined Bonus + Jackpot triggers (new — owner confirmed 2026-05-15)

> Design: operator selects a bonus type AND a jackpot level. On next spin, the bonus triggers, and
> the specified jackpot fires INSIDE that bonus. Allows testing any bonus/jackpot combination.

**Combinations to support:**

| Bonus context | Jackpot levels |
|---|---|
| Base game (payline) | MINI / MINOR / MAJOR / GRAND |
| Red Spin (during spin sequence) | MINI / MINOR / MAJOR / GRAND |
| Hold & Spin (coin during board) | MINI / MINOR / MAJOR / GRAND |
| Pick & Choose (tile reveal) | MINI / MINOR / MAJOR / GRAND |
| BONUS orb → H&S sub-bonus | MINI / MINOR / MAJOR / GRAND (note: noJackpots suppresses these — operator override needed) |

**UI design (operator panel):**
```
⚡ COMBINED FORCE TRIGGER
[ Force Bonus: RED SPIN ▼ ]  [ Force Jackpot: GRAND ▼ ]
[ 🚀 ARM COMBO ]
```
- Combo arm sets both `forceRedSpin` (or whichever bonus) AND `forceJackpot` + correct context
- Fires on next spin — both the bonus trigger and the jackpot within it
- Clear button disarms both

### K3 — Operator menu UX improvements

- **Section collapse** — each section (RTP, Bonus Controls, Force Triggers, etc.) should be collapsible with a tap on the section header. Currently everything is always expanded, making the panel very long.
- **Active ARM indicators** — when any force trigger is armed, show a persistent banner at top of panel: "⚡ ARMED: Red Spin + GRAND" so operator always knows what's queued
- **One-tap disarm all** — single button clears all force triggers at once
- **Denom display** — show current denom and total bet in the panel header for context

### K4 — Event log and export (Phase F7)
- Last 10 games: show spin number, bet, win, bonus triggered, balance delta
- Full log: all events with timestamps, filterable by type
- Export CSV: opens share sheet / downloads file
- Export JSON: same
- **All 4 must work before Phase K is marked complete**

### K5 — Replay function (Phase F8)
- Operator taps "REPLAY" on any game record in the event log
- Reels animate the exact stops from that spin
- Any bonus that triggered plays through with its recorded outcome
- Must not affect balance or RTP stats (replay mode flag already exists in GameState)

---


---

## PHASE L — Game History & Audit Log 🔴 HIGH PRIORITY — DO BEFORE MORE GAME CODING
**Files:** `state.js`, `game.js`, `bonuses.js`, `ui.js`, `index.html`, `operator.js`
**Owner priority:** Must be completed before any further gameplay feature development.

> ### Owner requirement (confirmed 2026-05-15):
> A comprehensive game history file that records every spin and all details — winning combinations,
> symbols, patterns, bet amount, win amounts, bonus wins. To be used as an audit trail.
> Should be combined with or integrate the existing operator event log.

---

### L1 — Data Architecture: What to record per spin

Every spin must log a complete record containing:

**Spin metadata:**
- Spin number (lifetime sequential — never resets unless full reset)
- Timestamp (ISO format)
- Denomination, credits/line, lines active, total bet

**Reel result:**
- All 5 reel stop positions
- Full 5×3 symbol grid (symbol IDs and names)

**Base game wins:**
- For each winning payline: payline index, pattern (row per reel), symbols, count, wild count, multiplier, base pay, total win amount
- Cherry wins: per-row results (row, count, amount)
- Mixed bar wins: payline, count, amount
- BONUS letter result: count, row, partial pay amount (if any)
- Total base game win

**Bonus triggers:**
- Which bonuses triggered this spin (Red Spin / H&S / P&C / BONUS letters)

**Bonus results (one record per bonus):**

| Bonus | Data to capture |
|---|---|
| Red Spin | Spin count, each spin's win, running total, final total |
| Hold & Spin | All coin positions and values, respin rounds, isBlackout, jackpots landed, total won |
| Pick & Choose | Prize type won, tile positions tapped, match counts, total won |
| BONUS Feature | Orb prize type, chosen index, sub-bonus result |

**Jackpots:**
- Type (MINI/MINOR/MAJOR/GRAND), amount, context (base/red spin/H&S/P&C), spin number

**Balance:**
- Balance before spin, balance after spin, net result

---

### L2 — Persistent Storage

- Game history stored in `localStorage` under key `turrelle_game_history`
- Append-only — new spins added to front (newest first)
- Cap at configurable max records (default 10,000 spins) to prevent localStorage overflow
- Never cleared by session end — persists until operator resets
- Operator "Full Reset" clears history
- Separate "Clear History" button in operator menu (does not reset balance or RTP)

**Data format:** Array of spin records (JSON), stored as compressed string if needed.

---

### L3 — UI: Combined History Screen

**Access points:**
- From operator menu: "📋 GAME HISTORY" button → opens history screen
- History screen is operator-only (requires PIN to access from main game)

**History screen layout:**

```
[ GAME HISTORY ]                    [ EXPORT CSV ] [ EXPORT JSON ] [ CLEAR ] [ ✕ ]

LIFETIME: 1,247 spins | Wagered: $1,247.00 | Paid: $1,189.12 | RTP: 95.4%

──────────────────────────────────────────────────────────
SPIN #1247  |  2026-05-15 14:32:11  |  5¢ / 1cr / 20L  |  Bet: $1.00
  Result:   WIN $2.50
  Paylines: Line 0 (center): 3× Single Bar → $2.50
  Balance:  $498.50 → $501.00

──────────────────────────────────────────────────────────
SPIN #1246  |  2026-05-15 14:32:08  |  5¢ / 1cr / 20L  |  Bet: $1.00
  Result:   BONUS WIN $28.00
  🔴 RED SPIN (4 spins): $3.50 → $7.00 → $8.50 → $9.00  Total: $28.00
  Balance:  $470.50 → $498.50
```

**Filters (tap to toggle):**
- All | Wins only | Losses only | Bonuses only | Jackpots only

---

### L4 — Export Formats

**CSV export** — one row per spin, bonus details in separate columns:
```
spin_num,timestamp,denom,credits_line,lines,total_bet,base_win,bonus_type,bonus_win,jackpot_type,jackpot_amount,balance_before,balance_after,net
```

**JSON export** — full nested record including all payline detail, reel stops, symbol grid.

Both exports: open OS share sheet so owner can save to files app, email, etc.

---

### L5 — Integration with Existing Operator Event Log

The existing `GameState.eventLog` and `logEvent()` system already captures some events. Phase L replaces it with a unified system:

- `logEvent()` continues to work exactly as-is (no breaking changes)
- Game history records are written separately via a new `recordSpin()` enhanced function
- Both the operator "FULL LOG" view and the new "GAME HISTORY" view draw from the same persistent store
- Old in-memory event log (`GameState.eventLog.currentGame`) still used for replay, kept as-is

---

### L6 — Implementation Order

1. **L2 first** — persistent storage schema, `recordSpinHistory()` function in state.js
2. **L1** — expand spin record data captured in game.js/bonuses.js
3. **L4** — export functions (CSV + JSON)
4. **L3** — UI screen (history viewer with filters)
5. **L5** — wire into existing operator menu, replace current event log tab

**Status:** ⏳ PENDING — implement before Phase I (H&S visuals), Phase J (denom expansion), or Phase K (operator menu) coding

---

## PHASE G — Final Audit & Polish (Pre-Release) ⏳ PENDING
**Files:** All

| # | Fix | Detail | Status |
|---|---|---|---|
| G1 | Full bug check | Syntax check all JS, verify all assets exist, SW cache complete | ⏳ |
| G2 | Cross-browser test | Chrome, Opera, Android WebView, PWA | ⏳ |
| G3 | PWA manifest | Correct icons, splash, start_url, display mode | ⏳ |
| G4 | Performance | Reel animation smooth on low-end Android | ⏳ |
| G5 | State persistence | Balance, settings survive exit/return on all browsers | ⏳ |
| G6 | Audio final check | All sounds play correctly, no loops where not intended | ⏳ |

---

## SYMBOL REFERENCE TABLE
| ID | Symbol | Reel Count | Pay (5/4/3/2) | Special |
|---|---|---|---|---|
| 0 | Sisters | 1/reel | 5000/750/150/0 | GRAND jackpot trigger |
| 1 | Josie | 3/reel (R1), 2/reel (R2-R4), 1/reel (R5) | 2000/400/75/0 | Wild ×4 — MINOR jackpot trigger |
| 2 | Sasha | 1/reel (R1), 2/reel (R2-R4), 3/reel (R5) | 2000/400/75/0 | Wild ×2 — MINI jackpot trigger |
| 3 | Seven | 6/reel | 500/100/25/0 | — |
| 4 | Triple Bar | 6/reel | 150/30/8/0 | — |
| 5 | Double Bar | 8/reel | 60/15/5/0 | — |
| 6 | Single Bar | 6/reel | 25/8/2/0 | — |
| 7 | Cherry | 4/reel | 10/4/2/1 | Any row, 1+ consecutive from R1 pays |
| 8 | Lipstick | 14/reel | 0/20/5/0 | 5-oak any active payline = Pick & Choose trigger |
| 9 | Gold Coin | 14/reel | No pay | 6+ anywhere = Hold & Spin trigger |
| 10-14 | B-O-N-U-S | 10/reel | 2×/5×/15×/50×/BONUS | 5 same-row consecutive = mystery bonus orb |
| 15 | Diamond | 3/reel | 100/25/8/0 | — |
| 16 | DJ Maxine | 2/reel | 700/150/35/0 | — |
| 17 | Stray Pup | 2/reel | 1000/200/50/0 | — |
| — | Mixed Bar | — | 5×/15×/35× bet/line | 3/4/5 any bar mix on payline |

## WILD MULTIPLIER RULES
- Sasha alone = ×2
- Josie alone = ×4  
- Sasha + Josie together = ×6

## JACKPOT SEEDS
- MINI: $50 | MINOR: $150 | MAJOR: $500 | GRAND: $5,000

---

## WORKFLOW RULE — ALWAYS CLARIFY BEFORE CHANGES
Before making **any** code change, always:
1. Summarize the requested change back to the user
2. Ask any clarifying questions needed
3. Wait for explicit confirmation
4. Only then proceed with the edit

---

## ⚠️ MANDATORY INSTRUCTIONS FOR ALL AI ASSISTANTS & DEVELOPERS

> These rules are set by the project owner and must be followed without exception.

### Before Every Work Session:
1. **Read this entire file first** — do not rely on memory or conversation history
2. **Check the Known Issues section** — understand what is broken before touching anything
3. **Check the Build History** — know what version you are working on
4. **Check the Symbol Reference Table** — this is the authoritative source for all math

### During Every Work Session:
1. **Always clarify with the owner before applying any changes** — no exceptions
2. **Summarize what you are about to change** and wait for explicit confirmation
3. **Ask clarifying questions** before writing a single line of code
4. **Update this file BEFORE making code changes** — log what you plan to do, why, and which files will be affected
5. **Update this file IMMEDIATELY AFTER making changes** — log exactly what was changed
6. **Never mark a phase or item complete** without owner confirmation that it has been tested

### This File Is The Law:
- If it is not in this file, it did not happen
- If you are unsure about a design decision — check this file first, then ask the owner
- Never change math, RTP, reel strips, or pay tables without running Monte Carlo verification and logging results here
- Never assume — always clarify

### For New AI Assistants Joining This Project:
- You are continuing work on a mobile slot machine game called **The Turrelle Sisters Big Munny**
- The owner tests on a **Samsung Galaxy S23** running **Android Chrome**
- The game is served via **Simple HTTPS Server** app on the phone during testing
- The game will eventually be wrapped as an **Android APK** using **Android Studio** (no ads, owner-built)
- The owner also plans to build a **QA Companion app** for bug tracking — not started yet
- A **Game Launcher** HTML file exists as a dev testing console — it is being redesigned
- Read every section of this file before asking the owner anything — the answer is likely already here

---

## 🏷️ FIX TIER CLASSIFICATION (2026-05-15)

> All known bugs classified by effort level. Tier 1 and Tier 2 applied in v6j9.

### Tier 1 — True 1-liners ✅ APPLIED v6j9
| ID | Fix | File | Status |
|---|---|---|---|
| A | `Audio.play('credits_addup')` → `Audio.play('coin_drop')` in ui.js — coin land sound was silently failing | ui.js | ✅ Fixed v6j9 |
| B | P&C base game trigger used Red Spin operator flag (`disablePickChooseInRedSpin`) — suppressed base game P&C if operator toggled Red Spin setting | game.js | ✅ Fixed v6j9 |
| C | Wrong nesting guard key in `runPickChoose`: `callerContext.hold_spin` → `callerContext.from === 'HOLD_SPIN'` — guard never fired, dead code | bonuses.js | ✅ Fixed v6j9 |
| D | Duplicate STEP 5 label in `runHoldSpin` | bonuses.js | ✅ Already fixed v6j5 |

### Tier 2 — Small self-contained fixes ✅ APPLIED v6j9
| ID | Fix | File | Status |
|---|---|---|---|
| E | `runRedSpin` returned no `events`/`outcome` — every Red Spin game record had `undefined` fields, breaking event log and replay | bonuses.js | ✅ Fixed v6j9 |
| F | **BONUS orb prize never dispatched** — `runBonusFeature()` returned award flags but `runRedSpin` never checked them. Player tapped orb, saw reveal, then $0 and nothing happened | bonuses.js | ✅ Fixed v6j9 |
| G | **Pick & Choose decoy cap** — 97.4% of boards allowed a decoy type to hit match-3 before the 3 guaranteed winning tiles were found. Each decoy type now capped at max 2 occurrences | bonuses.js | ✅ Fixed v6j9 |

### Tier 3 — Medium effort ⏳ PENDING
| ID | Fix | File | Notes |
|---|---|---|---|
| H | **Josie wild ×4 multiplier** — currently gives ×2 same as Sasha. Fix requires identity-based wild check in `evaluateLine()` | game.js | Will increase base RTP — run Monte Carlo after |
| I | **Red Spin end celebration screen** — bonus ends silently with no total shown to player | bonuses.js + ui.js | Needs new UI function |

---

## 🔧 RECOMMENDED FIX ORDER (Updated 2026-05-15 — re-prioritized after full design review)

> This is the authoritative order of work going forward.
> Do not skip steps or reorder without explicit owner approval.
> Do not begin any priority until the previous one is confirmed tested by the owner.

### Priority 1 — 🔴 Fix Hold & Spin Math (CRITICAL — Game Breaking)
**Why first:** H&S alone produces ~1,256% RTP across all trigger contexts. Game is unplayable for real testing until this is fixed.
**Target:** H&S should contribute ~8-10% to total RTP across ALL trigger contexts.
**Files:** `paytable.js`, `game.js` (coin tiers + land probability + generateCashCoinValue rewrite)
**Must do:** Run Monte Carlo after fix and log results here before marking complete.
**Status:** ✅ CONFIRMED WORKING by owner (2026-05-15) — additional testing pending later

#### 🔍 Full Diagnosis (completed 2026-05-15)

**Three root causes identified:**

1. **Coin multipliers catastrophically too high**
   - Top tier pays 300–800× total bet PER COIN
   - With avg 11.8 coins, potential = 9,600× total bet per bonus
   - Even at "small" tier (50% weight) math compounds badly at high denoms

2. **Land probability too high (12%)**
   - Produces avg 11.8 out of 15 coins per trigger
   - Real Aristocrat VGT: avg 6-9 coins per trigger
   - Fix: reduce to 5.5%

3. **Multipliers scale infinitely with denom — no cap**
   - MAX_TOTAL_BET = $200 ($1 denom × 10 credits × 20 lines)
   - At max bet: "rare" 5× coin = $1,000 PER COIN
   - Max theoretical win from H&S alone at max bet = $3,920+

#### 📊 H&S Trigger Contexts — All Must Be Counted

H&S fires in 4 places, all using the same coin tiers:

| Context | Trigger Rate | Notes |
|---|---|---|
| Base game | 3.45% of spins | 6+ gold coins on grid |
| Inside Red Spin | 0.37% of spins | 22% chance mid-sequence |
| Inside Pick & Choose | 0.026% of spins | 8% of P&C prize pool |
| Inside BONUS orbs | 0.003% of spins | 1 of 3 orb prizes |
| **Total** | **3.85% of spins** | Fixing coin tiers fixes ALL contexts |

#### ✅ Owner Decisions (confirmed 2026-05-15)

1. **Jackpot coins ARE achievable during H&S** — all 4 jackpot levels (MINI/MINOR/MAJOR/GRAND) can land as coins during the bonus
2. **Jackpots accumulate independently** — every jackpot coin that lands is counted; ALL landed jackpot levels pay their seed value at bonus end (not just the highest)
3. **Jackpot coins replace top cash tiers** — not additive; total coin weight still sums to 1.0
4. **Jackpots available at all bet sizes** — every denom has scaled seeds (already in JACKPOT_SEEDS_BY_DENOM), math accounts for this
5. **No hard dollar cap** — fraction-based tiers self-limit at 5× total bet max; cap was only needed for old multiplier system

#### 🔧 Approved Fix — Changes to `paytable.js` and `game.js`

**Change 1 — Land probability: `0.12` → `0.055`**
Reduces avg coins from 11.8 → ~6 per trigger. Matches real VGT feel.

**Change 2 — Replace `HOLD_SPIN_COIN_TIERS` with 5 cash tiers + 4 jackpot tiers**

```javascript
// Cash tiers — fraction of totalBet (no hard cap; 5× max self-limits)
const HOLD_SPIN_CASH_TIERS = [
  { weight:0.42, minFrac:0.02, maxFrac:0.10 }, // 42% — tiny   ($0.40–$2 on $20 bet)
  { weight:0.25, minFrac:0.10, maxFrac:0.30 }, // 25% — small  ($2–$6)
  { weight:0.13, minFrac:0.30, maxFrac:0.75 }, // 13% — medium ($6–$15)
  { weight:0.07, minFrac:0.75, maxFrac:2.00 }, //  7% — large  ($15–$40)
  { weight:0.03, minFrac:2.00, maxFrac:5.00 }, //  3% — big    ($40–$100)
];
// Jackpot tiers — pay denom-scaled seed value, ALL landed levels pay at bonus end
const HOLD_SPIN_JACKPOT_TIERS = [
  { level:'MINI',  weight:0.003333 }, // ~1-in-50  H&S bonuses
  { level:'MINOR', weight:0.000833 }, // ~1-in-200 H&S bonuses
  { level:'MAJOR', weight:0.000167 }, // ~1-in-1000 H&S bonuses
  { level:'GRAND', weight:0.000033 }, // ~1-in-5000 H&S bonuses
];
// Total weight: 0.42+0.25+0.13+0.07+0.03+0.003333+0.000833+0.000167+0.000033 = 1.000 ✓
```

**Change 3 — Rewrite `generateCashCoinValue()` in `game.js`**
Returns `{ type:'cash', value:N }` for cash coins or `{ type:'jackpot', level:'MINI'/'MINOR'/'MAJOR'/'GRAND' }` for jackpot coins. H&S engine accumulates all jackpot coins and pays ALL hit levels at bonus end using `getJackpotSeedsForDenom(denom)`.

#### 📊 Monte Carlo Results — Current vs Approved Fix (500k triggers per denom)

**Current (broken):**
| Total Bet | Avg Coins | Avg Win | Avg Mult | H&S RTP (all contexts) |
|---|---|---|---|---|
| $20.00 | 11.8 | $6,527 | 326× | 1,125% |
| $1.00 | 11.8 | $329 | 329× | 1,133% |
| **All contexts combined** | — | — | — | **1,256%** |

**Approved fix — verified via Monte Carlo (2026-05-15):**
| Denom | Total Bet | Avg Coins | Avg Win | Avg Mult | H&S RTP contribution |
|---|---|---|---|---|---|
| $0.01 | $2.00 | 5.99 | $4.48 | 2.24× | 8.62% ✅ |
| $0.05 | $10.00 | 5.98 | $22.40 | 2.24× | 8.62% ✅ |
| $0.10 | $20.00 | 5.99 | $44.87 | 2.24× | 8.64% ✅ |
| $0.25 | $50.00 | 5.99 | $112.02 | 2.24× | 8.63% ✅ |
| $0.50 | $100.00 | 5.99 | $222.79 | 2.23× | 8.58% ✅ |
| $1.00 | $200.00 | 5.99 | $449.78 | 2.25× | 8.66% ✅ |

All denoms land at **8.58–8.66%** — within 8–10% target across all 6 denominations. ✅

**Jackpot coin hit rates inside H&S (at $0.10 denom / $20 total bet):**
| Level | Seed | Hit rate | Avg win/trigger |
|---|---|---|---|
| MINI | $50 | 1-in-49 bonuses | $1.025 |
| MINOR | $150 | 1-in-204 bonuses | $0.737 |
| MAJOR | $500 | 1-in-996 bonuses | $0.502 |
| GRAND | $5,000 | 1-in-5,556 bonuses | $0.900 |

### Priority 2 — 🔴 Fix BONUS Letter Feature — Orb Dispatch + Full Feature Verification
**Why second:** Owner-reported issue. The BONUS feature appears to trigger but the sub-bonus (H&S/P&C/Red Spin) never runs and $0 is awarded. This is the most visible player-facing bug after H&S. Fixing the orb dispatch bug (already fully diagnosed) will resolve the owner's report.
**What to fix:**
1. Fix BONUS orb prize dispatch in `runBonusFeature()` / `runRedSpin()` — check `awardHoldSpin`, `awardRedSpin`, `awardPickChoose` flags and dispatch accordingly
2. Verify `evaluateBonusLetters()` is returning correct best-row result in all cases
3. Verify partial BONUS letter pays are using correct `betPerLine` value
4. Verify reel strips have no cross-reel letter contamination
5. Add `bonus_trigger` audio handler to `audio.js` (currently silent on BONUS trigger)
**Files:** `bonuses.js` (`runBonusFeature`, `runRedSpin`), `game.js` (`evaluateBonusLetters`, `evaluateSpin`), `audio.js`
**Status:** ⏳ Pending (blocked by Priority 1 confirmation)

### Priority 3 — 🔴 Audit & Fix Red Spin Logic
**Why third:** Suspected broken payline rules, wrong win calculations, no end celebration screen, and several confirmed code bugs. Must follow identical rules to base game.
**What to fix:** Full code audit of `runRedSpin()` vs base game `evaluateSpin()` logic. Fix all confirmed bugs (see Known Issues).
**Files:** `bonuses.js`, `game.js`
**Must do:** Confirm Lipstick trigger rule enforced inside Red Spin. Confirm end celebration screen works.
**Status:** 🔄 IN PROGRESS (2026-05-15) — v6j6 built (freeze fix applied), awaiting test results

#### Red Spin Rewrite — Confirmed Design (2026-05-15)
- **No predetermined spin count** — pure RNG, no sequence pre-generation
- **Spin 1: always fires guaranteed** — continuance starts from spin 2
- **Each spin generates a real reel grid** via evaluateSpin() — identical rules to base game
- **Ascending rule** — each spin's total win must exceed previous spin's win (re-roll until it does)
- **65% continuance per spin** starting from spin 2 — 35% chance ends the sequence
- **Grand Jackpot = natural ceiling** — if it lands and beats last win, sequence ends there (or continues if 65% fires again)
- **Back-to-back Red Spins** = base game RNG fires naturally, no special handling
- **CAN happen inside Red Spin:** H&S (6+ coins), P&C (Lipstick 5-oak on active payline), BONUS letters full B-O-N-U-S → orb bonus, partial BONUS letter pays, jackpots landing on payline
- **CANNOT happen:** Jackpots inside BONUS orb feature
- **Files changed:** bonuses.js (full runRedSpin() rewrite)

### Priority 4 — 🔴 Fix Operator Menu Crash
**Why fourth:** `renderPanel()` crashes after opening. Event log, export, and replay are completely untested. Phase F cannot be completed until this is fixed. Root cause already identified (malformed HTML — unclosed divs).
**What to fix:** Remove two orphan unclosed `<div>` lines in `renderPanel()` in `operator.js` (lines 152–155). This is almost certainly the root cause.
**Files:** `operator.js`
**Status:** ⏳ Pending

### Priority 5 — 🔴 Recalibrate Base Game RTP
**Why fifth:** Must wait until H&S, BONUS letters, and Red Spin are fixed — their broken state skews all numbers. Base game is currently 91% before bonuses (target: 74–80%).
**Root causes identified:**
- Seven symbol alone = 26.7% RTP contribution (too high)
- Lipstick payline wins = 18.5% RTP contribution (too high)
- BONUS letters = 6% RTP contribution (review after feature is fixed)
- Wild multiplier bug (Josie ×2 instead of ×4) — fixing will increase RTP further
- PAY_TABLE key fix (v6j4) — increased base game RTP (bars and DJ Maxine now paying)
**What to fix:** Recalibrate reel strips and/or pay table values. Fix Josie ×4 wild multiplier bug. Fix RTP double-count in stats.
**Files:** `paytable.js`, `game.js`
**Must do:** Run Monte Carlo after all fixes. Target: base 74–80% + bonuses 14–20% = 94% total.
**Status:** ⏳ Pending

### Priority 6 — 🟡 Fix Lifetime RTP Persistence
**Why sixth:** RTP currently resets every session. Must be lifetime of machine, persist across all sessions, reset only via operator menu.
**What to fix:** Architectural change to `state.js` — move RTP tracking to `localStorage` with lifetime accumulation. Operator menu reset clears lifetime stats.
**Files:** `state.js`, `operator.js`
**Status:** ⏳ Pending

### Priority 7 — 🟡 Complete Phase F — Operator Menu Features
Once Priority 4 (crash fix) is confirmed working, complete all remaining Phase F items:
- F1: Force Red Spin
- F2: Force Pick & Choose
- F3: Force Hold & Spin
- F4: Force BONUS mid-Red Spin
- F5: Force Jackpot (any context)
- F6: Auto Test Suite
- F7: Event log detail
- F8: Replay function
- F9: Auto-play (operator only)
**Status:** ⏳ Pending (blocked by Priority 4)

### Priority 8 — 🟡 Fix Win Display Lag on Android
**Why eighth:** Performance optimization — slow calculating wins/losses/bets on Samsung Galaxy S23.
**Files:** `ui.js`, `game.js`
**Status:** ⏳ Pending

### Priority 9 — ⏳ Phase G — Final Audit & Release Prep
**Only begin after Priorities 1–8 are confirmed tested and complete by owner.**
Full bug check, cross-browser testing, PWA manifest, performance, state persistence, audio final check.
**Status:** ⏳ Pending

---

---

## PHASE H — Post-Release Tweaks ✅ COMPLETE
**Files:** audio.js

| # | Fix | Detail | Status |
|---|---|---|---|
| H1 | Bell ring logic rewrite | Replaced old "+1 per $20" formula with fixed tiers (all denoms, cash value): $10–$49.99=1 ring, $50–$99.99=2 rings, $100–$999.99=3 rings, $1000+=10 rings. Any bonus triggered=1 ring via new `playBellsForBonus()`. Bonus+big win: higher rule only, no stacking. All rings back-to-back. | ✅ |

---

## BUILD HISTORY
| Build | Phase | Date | Notes |
|---|---|---|---|
| turrelle_v6_fixed.zip | Baseline | 2026-05-14 | User-provided starting point |
| turrelle_v6a3.zip | Phase A | 2026-05-14 | Cherry pay, wild mult ×6, payline animations, SW cache, zip structure fixed |
| turrelle_v6b3.zip | Phase B | 2026-05-14 | Optional chaining fixed, paytable scrollable+full screen, back btn locked, Mixed Bar added |
| turrelle_v6c2.zip | Phase C | 2026-05-14 | Josie/Sasha high-res crops, celebration images on jackpot screen, random alternation |
| turrelle_v6d2.zip | Phase D | 2026-05-14 | Jackpots on any active payline, highest tier only, paytable updated, force random row |
| turrelle_v6e.zip | Phase E | 2026-05-14 | New reels, correct RTP math, cherry all rows, scatter R1+R3+R5, mixed bar 3/4/5, BET ONE/MAX panel |
| turrelle_v6f.zip | Post-E | 2026-05-14 | Lipstick redesigned: payline symbol (was scatter). 5-oak any payline = P&C trigger. 4-oak=20cr, 3-oak=5cr. 14/reel. Singlebar 10→15. Red Spin updated. SCATTER_PAYS removed. |
| turrelle_v6g.zip | Post-E | 2026-05-14 | BONUS letters: 10/reel (was 1). Singlebar 15→6. Full BONUS ~1in11k, 3-ltr ~1in223, 2-ltr ~1in32. |
| turrelle_v6h.zip | Phase H | 2026-05-14 | Bell ring logic: tiered by cash value (1/2/3/10 rings). New playBellsForBonus() for bonus triggers. |

---

## TESTING LOG — v6h2 (2026-05-15)

### Results from player testing:

**✅ CONFIRMED WORKING:**
- Item 1 (operator PIN): YES — PIN accepted, panel opens
- Item 2 (panel goes back to base game): POSSIBLY operator menu phase issue — investigate

**🔴 CRITICAL — Hold & Spin math:**
- On max bet ($1 denom, 20 lines = $20/spin) + Red Spin:
  - $500 cash-in paid back $18,277.75 across Red Spin and Hold & Spin
  - Confirmed H&S math is broken — paying far too much
  - Coin multipliers up to 800× total bet = game-breaking overpay

**🔴 Operator menu still failing:**
- Items 6,7,8 (event log, export, replay) could not be tested
- Panel failing after opening — need to investigate renderPanel crash

**🟡 Balance/RTP clarifications (confirmed design):**
- Win display lag — slow calculating wins/losses/bets (performance issue)
- RTP calculation should include Cash In / Cash Out transactions
- RTP is lifetime of machine unless manually reset in operator menu
- Not session-only — persists across all sessions

**❓ Item 4 (credits/line display) — user unclear, need to clarify**

**⏳ Untested (operator menu needed):**
- Items 6,7,8: event log, export CSV/JSON, replay function
- Bells $10+ rule
- Paytable scroll
- BET ONE cycling
- Jackpot denom scaling
- Exit → splash screen
- Scatter center-row trigger
- Mixed bar 3/4/5 pay

---

## KNOWN ISSUES — Pending Investigation (2026-05-15)

### 🔴 Red Spin Bonus — suspected problems:
- May not be following base game payline rules during spin sequence
- Suspected: scatter (Lipstick) trigger rule not being enforced correctly inside Red Spin
- Suspected: wins calculated differently than base game (wrong RTP contribution)
- Suspected: additional Red Spins not handled correctly (no celebration screen)
- Suspected: payline win animations not showing during Red Spin spins
- **Needs full code audit of runRedSpin() vs base game evaluateSpin() logic**
- Player confirmed: "RTP is wrong or Red Spin is not following base game rules"

### 🔄 Hold & Spin math — fix approved and coding in progress (2026-05-15):
- **Root cause 1:** Coin multipliers too high — top tier 300-800× per coin
- **Root cause 2:** Land probability 12% — avg 11.8/15 coins per trigger (should be ~6)
- **Root cause 3:** Multipliers scale infinitely with denom — no cap
- Combined H&S RTP across all contexts: **1,256%** (target: 8-10%)
- **Fix approved by owner — see Priority 1 section for full spec and MC results**
- Fix: `paytable.js` (land prob 0.12→0.055, replace coin tiers with fraction-based cash+jackpot tiers) + `game.js` (rewrite generateCashCoinValue)
- Jackpot coins confirmed: all 4 levels achievable, accumulate independently, ALL pay at bonus end

### 🔴 Base game RTP — 91% before bonuses:
- Target: 75-80% base, bonuses add 14-19% = 94% total
- Current: 91% base + broken bonuses = massively over
- Root causes: Seven (26.7% RTP), Lipstick payline wins (18.5%), Letters (6%)
- Fix: recalibrate reel strips and pay values after H&S is fixed

### 🟡 Balance/win display lag:
- Slow calculating wins/losses/bets on Android
- Performance optimization needed

### 🟡 RTP is lifetime metric:
- Must include Cash In / Cash Out transactions
- Must persist across sessions (life of machine)
- Reset only via operator menu
- Currently session-only — needs architectural fix

### ✅ PAY_TABLE Key Mismatch — Bar symbols and DJ Maxine pay ZERO on all wins (FIXED — v6j4 — 2026-05-15):
- `SYMBOLS` uses underscore keys (`TRIPLE_BAR`, `DOUBLE_BAR`, `SINGLE_BAR`, `DJ_MAXINE`)
- `PAY_TABLE` was using squashed keys (`TRIPLEBAR`, `DOUBLEBAR`, `SINGLEBAR`, `DJMAXINE`)
- `evaluateLine()` resolves the winning symbol via `Object.keys(SYMBOLS).find(...)` → returns e.g. `"TRIPLE_BAR"` → looks up `PAY_TABLE["TRIPLE_BAR"]` → `undefined` → pays zero
- **All four symbols silently paid nothing on any winning combination**
- Bar symbols are 6–8 stops/reel — this was a significant RTP hole contributing to incorrect base game RTP readings
- **Fix applied:** Renamed the four PAY_TABLE keys to match SYMBOLS exactly: `TRIPLEBAR→TRIPLE_BAR`, `DOUBLEBAR→DOUBLE_BAR`, `SINGLEBAR→SINGLE_BAR`, `DJMAXINE→DJ_MAXINE`
- **File:** `paytable.js`
- **Status:** ✅ FIXED in v6j4 — awaiting owner test confirmation. Note: fixing this will INCREASE base game RTP — Priority 4 Monte Carlo must account for this correction.

### ✅ Red Spin — Continuance fires on Spin 1 (FIXED — v6j4 — 2026-05-15):
- Design says: "Spin 1 ALWAYS fires guaranteed — continuance starts from spin 2"
- Code had: `if (spinNum >= 1)` — but `spinNum` is 1 on the very first spin (incremented before the check)
- Result: the 35% stop chance was firing after Spin 1, making the "guaranteed first spin" rule impossible
- **Fix applied:** Changed `if (spinNum >= 1)` to `if (spinNum >= 2)` in `runRedSpin()` continuance block
- **File:** `bonuses.js`
- **Status:** ✅ FIXED in v6j4 — awaiting owner test confirmation

### 🔴 Red Spin — `runHoldSpin()` called with wrong argument signature (found 2026-05-15):
- Inside `runRedSpin`, H&S triggered as: `this.runHoldSpin(betPerLine, linesActive, { from:'RED_SPIN' })`
- Actual `runHoldSpin` signature: `(betPerLine, linesActive, triggerStops, triggerGrid, callerContext={})`
- `{ from:'RED_SPIN' }` lands on the `triggerStops` parameter — `triggerGrid` receives `undefined`
- `_generateFullHoldSpinOutcome(triggerGrid)` gets `undefined` → trigger coins not locked at bonus start
- Result: H&S board starts completely empty instead of with the 6 triggering gold coins already locked
- **Fix:** Update the call to `this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN' })` — pass the current `grid` as `triggerGrid`
- **File:** `bonuses.js` (`runRedSpin` H&S trigger block)
- **Status:** ⏳ Confirmed bug — not yet fixed

### ✅ Red Spin — `noJackpots` flag now enforced throughout BONUS orb feature sub-bonuses (FIXED — v6k — 2026-05-15):
- Design: "CANNOT happen: Jackpots inside BONUS orb feature"
- Code passes `{ from:'RED_SPIN', noJackpots:true }` to `runBonusFeature()` as `callerContext`
- `runBonusFeature()` never reads `callerContext.noJackpots` — no guard exists anywhere in the function
- The orb prizes are H&S, P&C, and Red Spin — both H&S and P&C can award jackpots internally
- When those sub-bonuses run after an orb pick, jackpots are not suppressed
- **Fix:** After orb prize is resolved, pass a `noJackpots` flag down into `runHoldSpin` and `runPickChoose` calls dispatched as a result of the orb win. Add `callerContext.noJackpots` guard inside `runBonusFeature` — document the enforcement path in Phase Plan before coding.
- **File:** `bonuses.js` (`runBonusFeature`, and any downstream dispatch)
- **Status:** ⏳ Confirmed bug — design enforcement spec needed before fix

### ✅ Red Spin — BONUS orb prize never dispatched (FIXED — v6j9 — 2026-05-15):
- `runBonusFeature()` returns `{ totalWon:0, awardHoldSpin, awardRedSpin, awardPickChoose }`
- Inside `runRedSpin`: `bonusTotal += bResult.totalWon || 0` — always adds zero
- `bResult.awardHoldSpin`, `bResult.awardRedSpin`, `bResult.awardPickChoose` are **never checked**
- Player taps an orb, sees it revealed, then nothing happens — sub-bonus never runs, $0 awarded
- **Fix:** After `runBonusFeature()` returns, check its award flags and dispatch accordingly:
  ```javascript
  if (bResult.awardHoldSpin) {
    const hsResult = await this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN_BONUS' });
    bonusTotal += hsResult.totalWon || 0;
  } else if (bResult.awardRedSpin) {
    bonusTotal += bResult.totalWon || 0;
  } else if (bResult.awardPickChoose) {
    const pcResult = await this.runPickChoose(betPerLine, linesActive, { from:'RED_SPIN_BONUS' });
    bonusTotal += pcResult.totalWon || 0;
  }
  ```
- **File:** `bonuses.js` (BONUS trigger block inside `runRedSpin`)
- **Status:** ⏳ Confirmed bug — not yet fixed

### ✅ Red Spin — `stops` and `grid` variables out of scope for `animateReelsStop` (FIXED — v6j6 — 2026-05-15):
- `stops` and `grid` were declared with `const` inside the `do/while` block
- `UI.animateReelsStop(stops, grid, ...)` is called **outside** that block — both variables were out of scope
- This threw a `ReferenceError` on every Red Spin spin, crashing the async function immediately after the RNG pass
- `GameState.activeBonus` stayed locked as `'RED_SPIN'` — game became completely unresponsive (screen red, audio playing, no reels, no controls)
- **Fix applied:** Declared `let stops, grid, result, spinWin` before the `do/while` loop; assign inside it without `const`
- **File:** `bonuses.js` (`runRedSpin` spin loop)
- **Status:** ✅ FIXED in v6j6 — awaiting owner test confirmation

### ✅ Red Spin — `runRedSpin()` crashes after Spin 1 — `delay` not defined (FIXED — v6j8 — 2026-05-15):
- `runRedSpin()` called `await delay(400)` at the bottom of the spin loop (line 151)
- `delay` is a **private** function inside `ui.js`'s IIFE — not exported, not globally accessible
- Threw `ReferenceError: delay is not defined` after every Spin 1 (after the continuance check was skipped for spin 1)
- Async function crashed before reaching `deactivateRedScreen()` or clearing `GameState.activeBonus`
- Red screen stayed active permanently, controls never re-enabled — game frozen after exactly 1 spin
- **Fix:** Changed `await delay(400)` → `await this._delay(400)` — uses Bonuses object's own private delay method
- **File:** `bonuses.js` (spin loop, line 151)
- **Status:** ✅ FIXED in v6j8

### ✅ Red Spin — `updateRedSpinWin` called with wrong argument order (FIXED — v6j8 — 2026-05-15):
- Called as `UI.updateRedSpinWin(bonusTotal, spinNum)` — 2 args
- Function signature: `updateRedSpinWin(winAmount, bonusTotal, spinNum)` — 3 args
- Result: spin number (1, 2, 3...) was displayed as the bonus total dollar amount ("$1.00", "$2.00")
- **Fix:** Changed to `UI.updateRedSpinWin(spinWin, bonusTotal, spinNum)` — all 3 args correct
- **File:** `bonuses.js` (line 92)
- **Status:** ✅ FIXED in v6j8
- Design requires a celebration/results screen when the Red Spin sequence ends
- `runRedSpin()` calls `UI.deactivateRedScreen()` and immediately returns — no celebration shown
- Total bonus win is logged but never presented to the player
- **Fix:** Add a `UI.showRedSpinEndCelebration(bonusTotal, spinNum)` call (or equivalent) before deactivating the red screen. UI function needs implementing if not already present.
- **File:** `bonuses.js` (end of `runRedSpin`), `ui.js` (add `showRedSpinEndCelebration` if missing)
- **Status:** ⏳ Confirmed missing — not yet implemented

### ✅ Red Spin — `processJackpotCheckRedSpin` defined but never called (FIXED — v6j7 — 2026-05-15):
- Dead function with wrong escalation rule — deleted from bonuses.js
- Red Spin jackpots correctly use `processCharacterJackpots()` — highest tier only per spin, same as base game
- **Confirmed design:** Red Spin jackpots = highest tier only per spin (same as base game). Hold & Spin = all levels accumulate and all pay at end.
- **Status:** ✅ FIXED in v6j7

### ✅ Duplicate STEP 5 label in `runHoldSpin` (FIXED — v6j5 — 2026-05-15):
- Two consecutive sections are both labelled `// ── STEP 5`
  - "STEP 5: Blackout bonus — Grand Jackpot again"
  - "STEP 5: End bonus" (should be STEP 6)
- Cosmetic but causes confusion when reading or auditing the function flow
- **Fix:** Relabel the end-bonus block as `STEP 6`
- **File:** `bonuses.js`
- **Status:** ⏳ Minor — fix alongside next bonuses.js edit

### 🔴 Wild Multiplier Does Not Distinguish Josie vs Sasha (found 2026-05-15 — payline audit):
- `evaluateLine()` uses `WILD_MULTIPLIERS = { 1: 2, 2: 6 }` — any single wild gives ×2 regardless of whether it's Josie or Sasha
- **Expected behaviour (from Phase A5 and Symbol Reference Table):**
  - Sasha alone (any count) = ×2
  - Josie alone (any count) = ×4
  - Sasha + Josie together (mixed) = ×6
- **Impact:** Josie wild substitutions are underpaying — giving ×2 instead of ×4. Affects every payline in every mode.
- **Root cause:** `WILD_MULTIPLIERS` stores counts, not identities. The evaluator counts total wilds but doesn't check which wild type they are.
- **Fix required (game.js — `evaluateLine()`):** Collect wild IDs in combo, check `hasJosie`/`hasSasha`, apply correct multiplier.
- **Files to change:** `game.js` (evaluateLine function)
- **Priority:** Fix alongside Priority 4 (Base Game RTP Recalibration) — fixing Josie ×4 will INCREASE base game RTP, so run Monte Carlo after fixing.
- **Status:** ✅ FIXED in v6k3 — identity-based wild check in evaluateLine(); scans full combo window for Josie/Sasha IDs. Will increase base RTP — run Monte Carlo at Priority 5 recalibration.

### 🔴 BONUS Letter Feature — Potential reel combination and feature dispatch issues (found 2026-05-15):

Owner-reported: "BONUS letters bonus not paying out consistently across all paylines. If any BONUS combination happens in order payline should pay. If a reel combination or payline spells out BONUS then that activates BONUS letter feature."

**Clarification confirmed:** The current design is correct — BONUS letters check rows, not paylines. Each letter only appears on its designated reel (B only on reel 1, O only on reel 2, etc.), so a BONUS combination means the correct letter in the same row across all 5 reels. This is NOT a payline scan. The concern is that the feature may not be paying or triggering correctly in practice.

**Areas to investigate:**

1. **`evaluateBonusLetters()` best-row-only logic** — only the single best row result is returned. If two rows both have partial letter counts, only the higher one pays. This is correct design but worth verifying it returns the right row.

2. **Partial pay amounts** — `BONUS_LETTER_PAYS[count]` returns a credit multiplier × `betPerLine`. Verify `betPerLine` is the correct value being passed and that the pay is being added to `result.totalWin` correctly.

3. **Full BONUS trigger** — when `letterResult.count >= 5`, `result.triggerBonusFeature = true` is set. Verify `runBonusFeature()` is being called from `executeSpin()` and that the orb selection screen actually appears and dispatches a sub-bonus.

4. **BONUS orb prize never dispatched (confirmed bug — see existing entry below)** — this is likely what the owner is experiencing. The orb is revealed but the sub-bonus (H&S, P&C, or Red Spin) never runs, awarding $0.

5. **Reel strip verification** — each letter has exactly 10 stops per reel and only appears on its designated reel. Verify no cross-reel contamination (e.g. a letter_b.svg appearing on reel 2).

**Most likely root cause of owner's report:** The BONUS orb prize dispatch bug (already documented) means tapping an orb does nothing — player sees the feature trigger and orb screen but wins $0 and nothing happens. This would make it appear as if BONUS is "not paying out."

**Files:** `game.js` (`evaluateBonusLetters`, `evaluateSpin`), `bonuses.js` (`runBonusFeature`, orb dispatch)  
**Status:** ⏳ Under investigation — fix the BONUS orb dispatch bug first (already documented), then retest

---

### ✅ Operator menu — history.pushState self-close bug fixed in v6h4

---

## FULL CODE AUDIT — v6j4 (2026-05-15)

> Full read of all JS files: `bonuses.js`, `game.js`, `paytable.js`, `state.js`, `operator.js`, `cashout.js`, `audio.js`, `service-worker.js`, `index.html`. Performed after v6j4 delivery. 10 new bugs found — none previously documented. Listed below by severity.

---

### ✅ Operator Panel — Malformed HTML in `renderPanel()` — LIKELY ROOT CAUSE OF PRIORITY 3 CRASH (FIXED — v6j8 — 2026-05-15):
- `renderPanel()` in `operator.js` has a copy-paste error on the "Disable P&C" and "Disable H&S" rows (lines 152–155)
- Each row opens a `<div class="op-row">` label-only element that is **never closed**, immediately followed by a second complete row div
- Result: two unclosed `<div>` elements that swallow all subsequent panel HTML (jackpot controls, reel stops, balance, auto-play, stats, event log, reset) as deeply nested children
- Browser rendering of broken HTML produces unpredictable layout — buttons may be invisible, unreachable, or fire events for the wrong elements
- **This is almost certainly the root cause of the Priority 3 "renderPanel() crashes after opening" bug**
- **Fix:** Remove the two orphan label-only lines. Each control needs exactly one complete row:
  ```javascript
  // REMOVE these two orphan lines:
  h += '<div class="op-row"><span class="op-label">Disable P&amp;C in Red Spin</span>';
  h += '<div class="op-row"><span class="op-label">Disable H&amp;S in Red Spin</span>';
  // KEEP only the complete rows (already present on the next lines):
  h += '<div class="op-row"><span class="op-label">Disable P&C in Red Spin</span><button ...>...</button></div>';
  h += '<div class="op-row"><span class="op-label">Disable H&S in Red Spin</span><button ...>...</button></div>';
  ```
- **File:** `operator.js` (`renderPanel`, lines 152–155)
- **Status:** ⏳ Confirmed bug — not yet fixed — fix this first when tackling Priority 3

### 🔴 Hold & Spin — Coin display and landing animation (multiple confirmed issues — 2026-05-15):

**Issue A — Raw SVG showing ("BONUS / BIG MUNNY") instead of coin value:**
- All coin positions display unchanged `gold_coin.svg` — no dollar value, no jackpot label
- All coins look identical regardless of type
- Root cause: `_fillHoldCell()` chip overlay not wired or CSS missing

**Issue B — Coins spin in place instead of tumbling down (confirmed by owner testing):**
- Current: coin appears/spins in cell
- Required: coin falls from TOP of cell spinning/rotating downward, lands at bottom with impact — like a physical coin dropping
- Applies to both cash coins and jackpot coins

**Issue C — Empty cells show no preview animation during bonus (confirmed by owner):**
- Empty cells are static/blank during respins
- Required: subtle looping animation on empty cells — ghost coin shimmer, glow pulse, or faded spinning silhouette — so every respin feels live with anticipation

**Issue D — Jackpot coins must use same tumble animation:**
- MINI / MINOR / MAJOR jackpot coins fall from top spinning, same as cash coins
- On landing: brief highlight flash showing level label (MINI / MAJOR etc.)

**Files:** `ui.js` (`animateCoinLand`, `showHoldSpinBoard`, `_fillHoldCell`), `style.css` (coin animation keyframes)
**Status:** ⏳ All four issues confirmed — fix together in H&S UI overhaul session

### 🔴 Hold & Spin — Respin counter always shows 3, never updates (confirmed — 2026-05-15):
- Counter remains permanently at 3 throughout the entire bonus
- Should: count down 3→2→1→0 when no coin lands; reset to 3 every time a new coin lands
- **Root cause (suspected):** `_generateFullHoldSpinOutcome()` only emits events for coin landings — empty respins (where no coin lands) produce no sequence entries and are never animated. The round-loop in `runHoldSpin()` only decrements `respinDisplay` in a branch that requires an empty round in the events array, which never exists. Counter update fires after every round but the value never changes because the decrement path is never reached.
- **Fix:** Emit explicit empty-respin events from `_generateFullHoldSpinOutcome()` so the animation loop can decrement the counter. Or: track respin state separately from the sequence and animate the countdown explicitly between coin-landing rounds.
- **Files:** `bonuses.js` (`_generateFullHoldSpinOutcome`, `runHoldSpin` round loop), `ui.js` (`updateRespinCounter`)
- **Status:** ⏳ Confirmed bug — fix in next H&S UI pass alongside coin display fix

### 🔴 Hold & Spin — No sequential coin collection animation at bonus end (confirmed — 2026-05-15):
- Wins are summed and displayed instantly at bonus end — no coin-by-coin sequential collection animation
- Player should see each coin "collected" one at a time with a running total ticking up — the key celebration moment
- **Root cause:** Phase I item I4a not yet implemented — `UI.endHoldSpin()` likely sums total instantly
- **Files:** `ui.js` (`endHoldSpin`)
- **Status:** ⏳ Confirmed missing — Phase I item I4a — fix in next H&S UI pass

### 📋 Hold & Spin — FULL VISUAL DESIGN SPEC from video analysis (confirmed 2026-05-15):

> Video: Aztec Sun — Hold and Win (McLuck app, Samsung Galaxy S23, 2:10 duration)
> This is the authoritative visual reference for the H&S bonus implementation.

#### A. JACKPOT METER BAR (top of board — always visible during bonus)
- Three jackpot labels displayed horizontally above the 5×3 grid: **GRAND | MAJOR | MINI**
- Each shows its current denom-scaled seed value (e.g. SC 500.00 | SC 75.00 | SC 15.00)
- GRAND: red background | MAJOR: blue/teal background | MINI: green background
- These meters are always visible during the entire H&S sequence
- When a jackpot coin lands, the corresponding meter highlights/pulses
- Currently missing entirely from our game — must be added to H&S board UI

#### B. COIN APPEARANCE — Two visual states
**State 1: Locked/active coin (during respins)**
- Large glowing GOLDEN SUN coin — bright radiant glow/halo around entire coin
- Dollar value displayed prominently in large bold text dead-center of coin (e.g. "2.50", "0.50", "3.00")
- NO "BONUS" label, NO "BIG MUNNY" text — just the dollar value
- Bright warm yellow-orange glow, looks alive and glowing
- For MINI/MAJOR jackpot coins: show level label (e.g. "MAJOR") instead of dollar value

**State 2: Collected coin (during collection animation)**
- Same coin shifts to a more muted GEAR/COG appearance — still gold but dimmer, mechanical
- The glow fades as each coin is "collected" — goes from bright sun to dark gear
- This visual state change signals to the player that the value has been banked

#### C. EMPTY CELL ANIMATION (coin about to land)
- Empty cells that are about to receive a coin show a brief ORANGE/AMBER GLOW pulse
- The glow appears for ~0.5s before the coin materialises in that cell
- Seen in frames: orange square indicator precedes coin landing

#### D. RESPIN COUNTER — Shown in TWO places simultaneously
1. **Banner text** below the grid: "3 respins remaining" / "2 respins remaining" / "1 respin remaining" / "0 respins remaining"
2. **Control button** (center bottom): Large number (3/2/1/0) with "RESPINS" label below, pink/red border when active
- Counter counts down: 3→2→1→0 when no coin lands on a respin
- On new coin landing: counter RESETS to 3 with a visible SPIN/ROTATION animation on the button (seen in frame 2 — circular arrow animation)
- Both displays update simultaneously

#### E. COLLECTION ANIMATION (triggered when counter hits 0)
- Sequence starts immediately when 0 respins remain
- Each coin is collected ONE BY ONE sequentially (left-to-right, top-to-bottom order)
- On collection, a **gold sparkle/particle trail** shoots from the coin toward a running total
- The coin dims from glowing sun → dark gear as it's collected
- A **running total banner** appears below the grid showing the accumulating value (e.g. "11.00" → "21.50" → "28.00")
- **"Total win (SC)"** field in bottom-left updates in real time as each coin is collected
- Balance also updates with each coin
- Approximately 0.5–0.8s per coin collection

#### F. BONUS WIN SCREEN (after all coins collected)
- Full-screen celebration overlay
- Large bold text: **"BONUS WIN"** in orange-red with yellow outline
- Total amount beneath in large yellow numerals (e.g. "28.00")
- **Gold coin rain** — dozens of gold coins tumble and fall across the entire screen
- The H&S grid is faintly visible in background (faded)
- Jackpot meter bar fades in background
- Player taps to dismiss and return to base game

#### G. WHAT HAPPENS AFTER BONUS
- Returns to base game (or Free Spins if triggered — future phase)
- Jackpot meters reset to showing their seed values

#### H. WHAT IS NOT NEEDED (scope clarification)
- Free Spins feature (frame 19 — "4 FREE SPINS") — **future phase only, NOT in current scope**
- Sun symbols remaining on base game reels with values (frame 19) — part of Free Spins feature, future

### 🔴 Operator Menu — Force triggers firing in wrong order / bonus letters overriding Red Spin (found 2026-05-15):
- When Force Red Spin is armed via operator menu and triggered, BONUS letters appear on the reels BEFORE the Red Spin sequence starts
- Root cause suspected: force trigger flags are not being consumed in the correct priority order in `executeSpin()`. If `forceBonusFeature` or BONUS letter evaluation fires before the Red Spin trigger check, the bonus letter screen shows first and may swallow the Red Spin trigger
- Also possible: operator force flags are being set incorrectly or multiple flags are armed simultaneously
- **Cannot reliably test Red Spin multi-spin behaviour until operator menu force triggers are working correctly**
- **Action:** Full audit of force trigger flag read order in `executeSpin()` — Red Spin trigger check must happen before bonus letter evaluation when `forceRedSpin` is armed. All other force flags must be mutually exclusive (arming one disarms others).
- **Files:** `operator.js` (flag setting), `game.js` (`executeSpin` trigger order)
- **Status:** ⏳ Save for operator menu overhaul session (Phase K1). Do not test Red Spin via operator menu until fixed.

### 🔴 Base game — Double win display / pop-up flashing in wrong position (confirmed — 2026-05-15):
- Two win displays visible simultaneously during base game wins
- **Bug A — Duplicate `#win-line-label` in index.html:** Two elements with the same ID exist in the HTML. The second one renders in an unexpected position. `$('win-line-label')` in JS always finds the first one, but the second renders visually in the wrong place and may flash when adjacent elements update.
- **Bug B — Double pop animation in `updateRedSpinWin()`:** Calls `updateWinDisplay(winAmount)` (which already adds `.pop` class to `#win-amount`), then manually removes and re-adds `.pop` again — triggering the scale animation twice, causing a double-flash.
- **Fix A:** Remove the duplicate `#win-line-label` from `index.html` — keep only the one inside `#win-section` or adjacent to `#win-box`.
- **Fix B:** Remove the redundant manual `.pop` trigger from `updateRedSpinWin()` — `updateWinDisplay()` already handles it.
- **Files:** `index.html` (duplicate element), `ui.js` (`updateRedSpinWin` lines 377–378)
- **Status:** ✅ FIXED in v6k1 — win-line-label moved to directly after #win-section; redundant double-pop removed from updateRedSpinWin()

### ✅ Pick & Choose — Decoy tiles cap applied — max 2 per decoy type (FIXED — v6j9 — 2026-05-15):
- `_generatePickTiles()` builds a 15-tile board: 3 predetermined winning tiles + 12 random decoy tiles from 7 types
- Each of the 12 decoy slots picks independently from 7 types — statistically, at least one decoy type will appear 3+ times in **97.4% of boards** (confirmed via 100k simulation)
- `runPickChoose()` awards whatever type reaches match-3 first — it does NOT verify the winning type
- A player tapping tiles in any order will almost always hit a decoy match-3 before finding the 3 predetermined winning tiles
- The comment "Player ALWAYS finds 3 of the winning type if they keep tapping — guaranteed" is FALSE
- **Impact:** The Pick & Choose outcome is effectively random every game, ignoring the predetermined prize. Players can receive unintended bonus prizes (Hold & Spin or Red Spin) from decoys — or receive a lower cash award than intended. RTP for P&C is unpredictable.
- **Fix:** After building the 12 decoy tiles, cap each decoy type at max 2 occurrences. With 12 decoys across 7 types (≤2 each), no decoy type can reach match-3 before the 3 guaranteed winning tiles are found:
  ```javascript
  // In the decoy-building loop, track counts per type:
  var decoyCounts = {};
  for (let i = 3; i < PICK_CHOOSE_GRID_SIZE; i++) {
    var dt, attempts = 0;
    do {
      dt = decoyTypes[rng.nextInt(0, decoyTypes.length - 1)];
      attempts++;
    } while ((decoyCounts[dt] || 0) >= 2 && attempts < 20);
    decoyCounts[dt] = (decoyCounts[dt] || 0) + 1;
    // ... rest of tile build
  }
  ```
- **File:** `bonuses.js` (`_generatePickTiles`)
- **Status:** ⏳ Confirmed bug — not yet fixed

### ✅ `runRedSpin()` returns no `events` or `outcome` — game record silently corrupted every Red Spin (FIXED — v6j9 — 2026-05-15):
- `runRedSpin` returns `{ totalWon: bonusTotal, spins: spinNum }` — no `events` array, no `outcome` object
- `game.js` line 702 pushes `{ type:'RED_SPIN', events: redResult.events, outcome: redResult.outcome }` into the game record
- Both `redResult.events` and `redResult.outcome` are `undefined`
- Every Red Spin game record in the event log has `events: undefined, outcome: undefined` — replay and export are broken for any spin that triggered Red Spin
- **Fix:** Add `events` and `outcome` to the return value:
  ```javascript
  return {
    totalWon: bonusTotal,
    spins:    spinNum,
    events:   [],  // Red Spin does not currently build per-spin events — placeholder for future
    outcome:  { totalSpins: spinNum, totalWon: bonusTotal },
  };
  ```
- **File:** `bonuses.js` (line 179, end of `runRedSpin`)
- **Status:** ⏳ Confirmed bug — not yet fixed

### ✅ Jackpot wins double-counted in RTP stats — live RTP display inflated (FIXED — v6k — 2026-05-15):
- `awardJackpot()` in `state.js` (line 237) adds the jackpot amount to `GameState.stats.totalWon`
- In `executeSpin()`, `charJackpots.totalAwarded` (base game jackpot) is included in the local `totalWon` variable
- `recordSpin(totalBet, totalWon)` then adds `totalWon` — which already includes the jackpot — to `stats.totalWon` again
- Result: every jackpot hit is counted twice in `stats.totalWon`, inflating the live RTP reading shown in the operator panel
- Same double-count applies to H&S and P&C jackpots: `awardJackpot()` runs inside the bonus, then `holdResult.totalWon` / `pickResult.totalWon` (which include jackpot amounts) are added to the outer `totalWon` passed to `recordSpin`
- **Fix option A:** Remove `GameState.stats.totalWon += amount` from `awardJackpot()` — let `recordSpin` be the single point of truth for all wins
- **Fix option B:** Exclude jackpot amounts from the `totalWon` passed to `recordSpin` by tracking jackpot totals separately
- Recommend Fix A — simpler and consistent
- **Files:** `state.js` (`awardJackpot`, line 237), `game.js` (`executeSpin`)
- **Priority:** Fix alongside Priority 4 (Base Game RTP Recalibration) — correct stats needed for accurate Monte Carlo comparison
- **Status:** ⏳ Confirmed bug — not yet fixed

### 🟡 Service Worker cache name not bumped — offline play serves stale code (found 2026-05-15):
- `service-worker.js` line 7: `CACHE_NAME = 'turrelle-v6j3'`
- v6j4 and v6j5 fixes to `bonuses.js` and `paytable.js` will never be served from cache on devices that already cached v6j3
- Network-first strategy means online play is unaffected, but offline / kiosk / PWA installs run old broken code
- **Rule:** Bump `CACHE_NAME` on every build that changes any cached file. Match the build version exactly.
- **Fix:** Change to `'turrelle-v6j5'` for the current build
- **File:** `service-worker.js` (line 7)
- **Status:** ⏳ Must fix on every build — not currently being maintained

### ✅ Pick & Choose triggered from base game uses the Red Spin disable flag (FIXED — v6j9 — 2026-05-15):
- `game.js` line 650: `const pickEnabled = !GameState.operator.disablePickChooseInRedSpin;`
- This is the operator flag for disabling P&C *during Red Spin* — not a base game flag
- If an operator disables P&C in Red Spin for testing purposes, P&C triggered by a legitimate 5-oak Lipstick in the base game is also silently suppressed — player earns the trigger and gets nothing
- **Fix:** Add a separate `disablePickChooseInBase` operator flag, or simply remove the guard — P&C should always be enabled in base game
- **File:** `game.js` (line 650, inside `executeSpin`)
- **Status:** ⏳ Confirmed bug — not yet fixed

### ✅ `runPickChoose` nesting guard uses wrong `callerContext` key — dead code (FIXED — v6j9 — 2026-05-15):
- `bonuses.js` line 449: `if (callerContext.hold_spin) return { totalWon:0, events:[], outcome:null };`
- No caller ever passes `{ hold_spin: true }`. Base game passes `{ base_game: true }`, Red Spin passes `{ from: 'RED_SPIN' }`
- The guard intended to prevent P&C launching inside H&S never fires — the protection does not exist
- **Fix:** Change the guard to check `callerContext.from === 'HOLD_SPIN'` and update all H&S dispatch calls to pass `{ from: 'HOLD_SPIN' }` if nesting prevention is desired. Or remove the guard if P&C-inside-H&S is acceptable (currently no code path creates this anyway)
- **File:** `bonuses.js` (line 449)
- **Status:** ⏳ Confirmed dead code — clarify intent before fixing

### ✅ Dead code: `generateRedSpinWin()` and `generatePickChooseTiles()` in `game.js` (FIXED — v6j7 — 2026-05-15):
- Both functions deleted from game.js — superseded by live implementations in bonuses.js

### ✅ Dead code: `_redSpinTierHelper()` in `bonuses.js` (FIXED — v6j7 — 2026-05-15):
- Deleted from bonuses.js — never called since Red Spin rewrite

### ✅ `assets/sasha.png` listed twice in service worker cache (FIXED — v6j7 — 2026-05-15):
- Duplicate entry removed. CACHE_NAME also bumped to `turrelle-v6j6`.

### ✅ `paytable.js` — `WILD_MULTIPLIERS` comment contradicts actual values (FIXED — v6j7 — 2026-05-15):
- Comment updated to accurately describe current behaviour and flag the pending Josie ×4 bug fix.

---

### ✅ `Audio.play('bonus_trigger')` has no registered sound handler (FIXED — v6j7 — 2026-05-15):
- Added `bonus_trigger()` handler to audio.js — ring + ascending 5-note chime (one note per BONUS letter).

### ✅ `Audio.play('credits_addup')` silently fails — FIXED v6j9 — call site changed to `Audio.play('coin_drop')` — correct key is `coin_drop` (found 2026-05-15):
- `game.js` calls `Audio.play('credits_addup')` in at least one location
- The registered handler key in `audio.js` is `coin_drop` (which internally plays `credits_addup.wav`) — there is no `credits_addup` key
- The call silently fails; the credit rollup sound does not play from that call site
- **Fix:** Either rename the handler from `coin_drop` to `credits_addup` in `audio.js`, or update the call site in `game.js` to use `Audio.play('coin_drop')`
- **File:** `audio.js` or `game.js`
- **Status:** ⏳ Minor — fix alongside next audio edit

---

| turrelle_v6h5_updated_plan.zip | Phase Plan Update | 2026-05-15 | Full H&S math diagnosis added. Trigger contexts mapped (base/red spin/P&C/BONUS). Monte Carlo results logged. Proposed fix documented. Denom scaling issue identified. Awaiting owner approval before code changes. No game code changed. |
| turrelle_v6i.zip | Priority 1 H&S Fix | 2026-05-15 | H&S land prob 0.12→0.055, fraction-based cash tiers, jackpot tiers, all 4 JP levels pay at bonus end. MC verified 8.58-8.66% RTP. Owner confirmed working. |
| turrelle_v6j.zip | Priority 2 Red Spin | 2026-05-15 | Full runRedSpin() rewrite — pure RNG ascending system, real reel grids, 65% continuance from spin 2, spin 1 guaranteed. |
| turrelle_v6h5_plan_v2.zip | Phase Plan Update | 2026-05-15 | Owner approved H&S fix. Jackpot coins during H&S confirmed: all 4 levels, accumulate independently, all pay at bonus end, no hard dollar cap, fraction-based tiers. Final MC results logged (8.58–8.66% across all denoms). Coding Priority 1 in progress. |

## TESTING LOG — v6k2 (2026-05-15)

### Owner report — v6k1 testing findings:

**Items confirmed by owner:**
- Insert Cash: ✅ CONFIRMED WORKING
- Red Spin multi-spin: ✅ CONFIRMED WORKING (from prior session)
- Pick & Choose match-3: ✅ CONFIRMED WORKING (from prior session)
- Hold & Spin logic: ✅ CONFIRMED WORKING (from prior session)

**New items to fix (logged as v6k2):**
1. Balance not deducting visually on button press — fixed v6k2
2. RTP paying out too much — Priority 5 (base game RTP recalibration) confirmed needed
3. BONUS letter partial wins showing "$0.10" pop-up over spin button — fixed v6k2 (removed toast, kept yellow highlight)
4. Paytable text-only, no symbol images — fixed v6k2 (live images + live pay values from PAY_TABLE)
5. Force Red Spin in operator test mode — confirmed wired; continuance slider not wired to spin loop (fixed v6k2); cap raised to 99% with reset button
6. Win display consistency base game vs Red Spin — deferred, logged for future session
7. Live RTP high — expected during broken RTP phase; will normalize after Priority 5 recalibration
8. Spin button / Play button — same thing — definition added to GAME OVERVIEW

**Known mismatches found during v6k1 audit:**
- Paytable hardcoded pay values did not match PAY_TABLE (e.g. Seven showed 750/150/40, actual 500/100/25) — fixed v6k2
- Jackpot descriptions in paytable were wrong (MINI/MINOR said "3+ Sasha/Josie" — correct is 5-oak) — fixed v6k2

## TESTING LOG — v6k (2026-05-15)

### Results from owner testing:

**1. Red Spin multi-spin — ✅ CONFIRMED WORKING:**
- Red Spin triggered naturally multiple times
- Multi-spin sequence fired correctly (2+ spins per session)
- Ascending win rule, 65% continuance, and overall flow all working as designed
- ✅ Fix from v6j8 (`await this._delay(400)`) confirmed resolved

**2. Pick & Choose match-3 guarantee — ✅ CONFIRMED WORKING:**
- Decoy cap fix (v6j9) confirmed — player always finds the 3 matching winning tiles
- No premature decoy match-3 observed

**3. Base game win display — ⚠️ DOUBLE WIN DISPLAY BUG:**
- Two win displays visible simultaneously
- Main WIN meter (correct position): working ✅
- Second pop-up display: flashing in wrong position on screen, then disappearing ❌
- Root cause identified (code audit): two issues combined:
  a. Two `#win-line-label` elements in `index.html` — duplicate ID causes second element to render in wrong position
  b. `updateRedSpinWin()` in `ui.js` triggers the `winPop` animation TWICE on `#win-amount` — once inside `updateWinDisplay()` and again manually — causing double-flash
- **See Known Issues below**

**4. Hold & Spin — ✅ CONFIRMED WORKING (logic):**
- Bonus triggers, runs, and completes correctly
- Returns to base game cleanly
- Coin value amounts: noted for future adjustment (Phase I)
- Visual issues: coin tumble/fall animation and empty cell preview still needed (Phase I)**

## TESTING LOG — v6j (2026-05-15)

### 🔴 CRITICAL — Hold & Spin locks up entire game:
- Player triggered H&S with 6 coins in base game
- Game locked up completely — controls unresponsive, bonus never completed
- Red Spin test (item 1) inconclusive — game locked before testing
- **Root cause: under investigation in runHoldSpin() / UI.showHoldSpinBoard()**
- **Files to check:** bonuses.js (runHoldSpin), ui.js (showHoldSpinBoard, animateCoinLand), game.js (H&S trigger flow)

## TESTING LOG — v6j2 (2026-05-15)

### 🔴 H&S Lockup — ROOT CAUSE FOUND AND FIXED:
- `runHoldSpin()` called `this._generateFullHoldSpinOutcome()` which didn't exist anywhere
- TypeError crashed the async function immediately after setting `GameState.activeBonus = 'HOLD_SPIN'`
- Active bonus flag never cleared → game permanently frozen
- **Fix 1:** Implemented `_generateFullHoldSpinOutcome()` in bonuses.js (generates all coin positions/values in one RNG pass)
- **Fix 2:** Implemented `_generateCoin()` in bonuses.js (returns cash or jackpot coin using new fraction-based tiers)
- **Fix 3:** Added try/catch in game.js around `Bonuses.runHoldSpin()` — if anything fails, clears activeBonus and re-enables controls so game is never permanently frozen
- **Files changed:** bonuses.js, game.js

### v6j2 Red Spin — Screen turns red but blank cells, no reel animation:
- Red screen activates correctly
- Reels not animating — blank cells shown during spin sequence
- Root cause: under investigation in new runRedSpin() / UI.animateReelsStop() call

---

## PHASE I — Hold & Spin Bonus Redesign (Owner-Directed 2026-05-15)
**Status:** 📋 PLANNED — Awaiting coding  
**Files:** `bonuses.js`, `game.js`, `ui.js`, `paytable.js`

> ### 🎯 Owner Design Brief
> Redesign the Hold & Spin bonus to work like the Aztec Sun / Hunt for Neptune's Gold style.
> Use the **existing Gold Coin symbol** — no new symbols needed.
> The Gold Coin SVG (assets/symbols/gold_coin.svg) will display a cash value on top of it during the bonus.

---

### I1 — Trigger Rule (NO CHANGE NEEDED)
The bonus already triggers correctly at **6 or more Gold Coin symbols** anywhere on the 15-position grid (5 reels × 3 rows). This was confirmed in Phase A4.

When triggered:
- All other symbols disappear from the grid
- Only the Gold Coins that triggered the bonus remain locked in their positions
- The board transitions to Hold & Spin mode

**Code location:** `evaluateSpin()` in `game.js` — `if (coinCount >= 6) result.triggerHoldSpin = true;` ✅ Already correct.

---

### I2 — Respin Mechanic

| Rule | Value | Notes |
|---|---|---|
| Starting respins | 3 | Counter shown on screen at all times |
| New coin lands | Reset to 3 | Counter resets every time a new coin lands on an empty cell |
| Bonus ends | When counter hits 0 OR all 15 positions filled | Whichever comes first |
| Counter animation | Counts down visually after each empty respin | Must be visible and prominent |

**How this maps to the existing code:**
- `_generateFullHoldSpinOutcome()` simulates the respin mechanic via RNG before animation
- The `respinRound` counter in sequence events tracks which respin each coin lands on
- Visual respin counter update is handled by `UI.updateRespinCounter()`
- **Current code uses a while loop that resets `respinRound=1` on any new landing — this is correct**

---

### I3 — Symbol Values & Display

Each Gold Coin that lands during the bonus must display **one of the following** on its face:

#### Cash Values
- Standard cash amounts displayed as dollar values
- Scaled by total bet (fraction-based, already implemented via `HOLD_SPIN_CASH_TIERS`)
- Examples: 0.50, 1.00, 3.50, etc. depending on current bet
- The gold_coin.svg already has space for overlay text — UI must render the value on top

#### Mini Jackpot Coin
- Displays "MINI" label on the coin face
- Worth the current MINI jackpot seed for the active denomination
- Does NOT pay immediately — accumulates for payout at bonus end

#### Major Jackpot Coin
- Displays "MAJOR" label on the coin face
- Worth the current MAJOR jackpot seed for the active denomination
- Example: SC 75.00 at 10¢ denom (seed = $75 at that denom? — confirm with JACKPOT_SEEDS_BY_DENOM)
- Does NOT pay immediately — accumulates for payout at bonus end

> **Note:** The description mentions Mini and Major specifically. The existing code supports all four levels (MINI/MINOR/MAJOR/GRAND) via `HOLD_SPIN_JACKPOT_TIERS`. **Keep all four levels** — the design brief just uses Mini and Major as examples.

#### Grand Jackpot — Blackout Bonus
- **If all 15 positions are filled**, the player wins the Grand Jackpot IN ADDITION to all coin values already collected
- Grand Jackpot amount example: SC 500.00 (at 10¢ denom, GRAND seed = $5,000 — confirm denom scaling)
- This is the `isBlackout` logic already in `runHoldSpin()` — **already implemented correctly**

---

### I4 — Payout Calculation & Collection Animation

When respins run out (or blackout):
1. The bonus ends and "collection" begins
2. An animation plays where each coin's value is added **sequentially** to the running total
3. Each coin flips/highlights as its value is added with a running counter
4. All accumulated jackpot coins pay their denom-scaled seed value at this point (MINI/MINOR/MAJOR/GRAND)
5. If blackout occurred: Grand Jackpot also pays on top of the collected total

**UI requirement:** `UI.endHoldSpin()` must implement a sequential coin-by-coin collection animation. Currently this function exists — verify it animates sequentially rather than summing instantly.

**The final "Bonus Win" total is displayed as a celebration screen before returning to base game.**

---

### I5 — Transition to Free Spins (Future Phase)

> **Note from owner:** The description references a Free Spins round triggered by 3 Scatter symbols at the end of the H&S sequence. This is a **separate feature** and is NOT part of the current Hold & Spin redesign.

Current game uses **Pick & Choose** triggered by 5-oak Lipstick on any active payline. Free Spins are a future phase.

| Feature | Current Status |
|---|---|
| Hold & Spin | In progress — this phase |
| Free Spins (Scatter-triggered) | ⏳ Future phase — not yet designed |
| Free Spins removing low-paying symbols | ⏳ Future phase |

---

### I6 — Implementation Checklist

| # | Task | File | Status |
|---|---|---|---|
| I1 | Confirm trigger rule (6+ coins) | game.js | ✅ Already correct |
| I2 | Confirm respin counter resets on new coin | bonuses.js | ✅ Already correct in `_generateFullHoldSpinOutcome()` |
| I3a | Cash coin values display on Gold Coin face | ui.js | ⏳ Needs UI implementation |
| I3b | MINI/MAJOR/MINOR/GRAND label display on coin face | ui.js | ⏳ Needs UI implementation |
| I3c | Grand Jackpot on blackout (all 15 filled) | bonuses.js | ✅ Already in runHoldSpin() step 5 |
| I4a | Sequential coin collection animation | ui.js (`endHoldSpin`) | ⏳ Verify/implement |
| I4b | Running total counter during collection | ui.js | ⏳ Verify/implement |
| I4c | Celebration screen with final "Bonus Win" amount | ui.js | ⏳ Verify/implement |
| I5 | Free Spins feature | All | ⏳ Future phase — not started |

---

### I7 — Coin Display Notes (Gold Coin SVG)
The existing `gold_coin.svg` has a "BONUS" label at the top and "BIG MUNNY" text on the coin face. During the Hold & Spin bonus, the UI layer must **overlay the coin value** on top of the SVG.

**Implementation approach (ui.js):**
- Render each grid cell as a Gold Coin image
- Overlay a `<div>` or `<span>` on top with the value (e.g. "$1.40" or "MAJOR")
- Use large bold text, contrasting colour (white or black depending on coin background)
- For jackpot coins: show level label with gold/highlighted styling
- The coin itself does not need to be modified — the SVG stays as-is ✅

---

## PAYLINE AUDIT — v6j3 (2026-05-15)

> Performed during Phase I planning session. Full code audit of `evaluateLine()`, `evaluateCherryWin()`, `evaluateMixedBars()`, and `evaluateSpin()`.

### ✅ Correct Payline Behaviour (Confirmed)

| Rule | Status | Notes |
|---|---|---|
| Consecutive from reel 1 only | ✅ Correct | `evaluateLine()` breaks on first non-match |
| Cherry: 1+ any row, all rows pay simultaneously | ✅ Correct | `evaluateCherryWin()` handles separately |
| Cherry: 1-oak pays 1 credit | ✅ Correct | `evaluateCherryWin()` uses cherry pays array |
| Mixed Bar: 3/4/5 any bar combo on active payline | ✅ Correct | `evaluateMixedBars()` — skips pure same-bar (handled by regular eval) |
| Gold Coins: never pay on paylines | ✅ Correct | `evaluateLine()` returns 0 for BONUS_ID |
| 5-oak Lipstick triggers Pick & Choose (no cash) | ✅ Correct | `evaluateSpin()` sets `scatterTriggered` |
| 6+ Gold Coins anywhere = H&S trigger | ✅ Correct | Grid scan in `evaluateSpin()` |
| Wild mid-combo (not at start) | ✅ Correct | `extraWilds` branch in loop |
| No pay for 1-oak non-cherry | ✅ Correct | `matchCount < 2` returns 0 |
| Letter partial pays (1/2/3/4) | ✅ Correct | `evaluateBonusLetters()` + `BONUS_LETTER_PAYS` |

### 🔴 PAYLINE BUG FOUND — Wild Multiplier Does Not Distinguish Josie vs Sasha

**Bug:** `evaluateLine()` uses `WILD_MULTIPLIERS = { 1: 2, 2: 6 }` — any single wild gives ×2 regardless of whether it's Josie or Sasha.

**Expected behaviour (from Phase A5 and Symbol Reference Table):**
- Sasha alone (any count) = ×2
- Josie alone (any count) = ×4
- Sasha + Josie together (mixed) = ×6

**Impact:** Josie wild substitutions are **underpaying** — giving ×2 instead of ×4. This affects every payline in every mode (base game, Red Spin, any context using `evaluateLine()`).

**Root cause:** `WILD_MULTIPLIERS` stores counts, not identities. The evaluator counts total wilds but doesn't check which wild type they are.

**Fix required (game.js — `evaluateLine()`):**

```javascript
// CURRENT (WRONG):
const totalWildsInCombo = wildCount + extraWilds;
let multiplier = 1;
if (totalWildsInCombo >= 2) multiplier = WILD_MULTIPLIERS[2];
else if (totalWildsInCombo === 1) multiplier = WILD_MULTIPLIERS[1];

// CORRECT — check wild identities, not just count:
// Collect all wild IDs in the combo
var wildIdsInCombo = [];
for (var wi = 0; wi < lineSymbols.length; wi++) {
  if (WILD_IDS.indexOf(lineSymbols[wi]) >= 0) wildIdsInCombo.push(lineSymbols[wi]);
}
var hasJosie = wildIdsInCombo.indexOf(SYMBOLS.JOSIE.id) >= 0;
var hasSasha = wildIdsInCombo.indexOf(SYMBOLS.SASHA.id) >= 0;
var multiplier = 1;
if (wildIdsInCombo.length === 0) {
  multiplier = 1;
} else if (hasJosie && hasSasha) {
  multiplier = 6; // both wilds = ×6
} else if (hasJosie) {
  multiplier = 4; // Josie alone = ×4
} else {
  multiplier = 2; // Sasha alone = ×2
}
```

**Files to change:** `game.js` (evaluateLine function)  
**Priority:** Add to Priority 4 (Base Game RTP Recalibration) since this bug means Josie wins are underpaying — but fixing it will INCREASE base game RTP, so run Monte Carlo after fixing.  
**Status:** ⏳ Confirmed bug — not yet fixed — must be logged before coding begins

---

## BUILD HISTORY (continued)

| Build | Phase | Date | Notes |
|---|---|---|---|
| turrelle_v6j3.zip | Plan Update | 2026-05-15 | Phase I (H&S redesign per Aztec Sun spec) written to PHASE_PLAN. Payline audit completed. Wild multiplier bug found (Josie ×4 not applied). No code changes this build. |
| PHASE_PLAN_v6j3_updated.md | Plan Update | 2026-05-15 | Two new mandatory rules added (rules 12 & 13): always check KNOWN ISSUES for newly found bugs before coding; always test game before delivering zip. PAY_TABLE key mismatch bug added to KNOWN ISSUES (TRIPLE_BAR/DOUBLE_BAR/SINGLE_BAR/DJ_MAXINE paying zero). No code changes. |
| PHASE_PLAN_v6j3_audit.md | Plan Update | 2026-05-15 | Red Spin code audit completed. 6 bugs confirmed in bonuses.js: (1) continuance on spin 1; (2) runHoldSpin wrong arg signature; (3) noJackpots flag never checked; (4) BONUS orb prize flags never dispatched; (5) stops/grid out of scope for animateReelsStop; (6) missing Red Spin end celebration. Also: processJackpotCheckRedSpin dead code (needs owner clarification). Duplicate STEP 5 label. Wild multiplier Josie ×4 bug confirmed. No code changes this update. |
| turrelle_v6j4.zip | Bug Fixes | 2026-05-15 | Fix 1: PAY_TABLE key mismatch — renamed TRIPLEBAR→TRIPLE_BAR, DOUBLEBAR→DOUBLE_BAR, SINGLEBAR→SINGLE_BAR, DJMAXINE→DJ_MAXINE in paytable.js. Fix 2: Red Spin continuance bug — changed `spinNum >= 1` to `spinNum >= 2` in bonuses.js so Spin 1 is always guaranteed. Both fixes confirmed owner-approved. Awaiting test results. Note: Fix 1 will increase base game RTP — Priority 4 Monte Carlo must account for this. |
| turrelle_v6j5.zip | Bug Fixes | 2026-05-15 | Fix 3: runHoldSpin wrong arg signature when called from Red Spin — changed `runHoldSpin(betPerLine, linesActive, { from:'RED_SPIN' })` to `runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN' })` so triggerGrid is correctly passed and H&S board starts with the 6 triggering coins locked. Fix 4: Duplicate STEP 5 label in runHoldSpin — relabelled end-bonus block as STEP 6. Full code audit completed — 10 new bugs documented in KNOWN ISSUES (v6j4 audit section). Awaiting owner test confirmation. |
| turrelle_v6j5_final.zip | Cleanup | 2026-05-15 | Asset audit completed. 9 unused files (1.6 MB) moved to `deadfiles.zip` and removed from active assets. PHASE_PLAN updated with Rule 14 (deadfiles instructions). Dead files: ching.mp3, lipstick_bonus.mp3, splash_music.mp3, josie_title.png, sasha_title.png, sisters_title.png, sisters_celebrate.webp, sasha_solo_celebrate.webp, icons/splash.png. Two audio gaps also found: Audio.play('bonus_trigger') has no registered handler; Audio.play('credits_addup') silently fails (correct key is 'coin_drop'). Both logged in KNOWN ISSUES. |
| turrelle_v6j6.zip | Bug Fix | 2026-05-15 | Fix 5: Red Spin complete freeze — `stops` and `grid` declared with `const` inside `do/while` block but used outside it, throwing ReferenceError on every spin, locking activeBonus='RED_SPIN' permanently. Fixed by hoisting to `let stops, grid, result, spinWin` before the loop. Owner-reported symptom: screen turns red, audio plays, reels don't spin, game completely unresponsive. |
| PHASE_PLAN_v6j6_updated.md | Plan Update | 2026-05-15 | Full game design & rules section added (MLMC bet structure, all 20 paylines, all symbol rules, wild multiplier rules, Cherry/Lipstick/Jackpot/BONUS letter/Red Spin/Hold & Spin/Pick & Choose rules, operator menu, audio events, RTP targets). BONUS letter inconsistency issue logged as new Known Issue (Priority 2) — most likely root cause is the existing BONUS orb dispatch bug. Priorities re-ordered: P1=H&S math (done), P2=BONUS letters, P3=Red Spin, P4=Operator crash, P5=RTP recalibration, P6=Lifetime RTP, P7=Operator features, P8=Win lag, P9=Phase G. No code changes this update. |
| turrelle_v6j7.zip | Dead Code Cleanup + Audio Fix | 2026-05-15 | Fix 6: Deleted `processJackpotCheckRedSpin()` from bonuses.js — dead code with wrong escalation rule; Red Spin jackpots correctly use `processCharacterJackpots()` (highest tier only per spin, same as base game — confirmed design). Fix 7: Deleted `_redSpinTierHelper()` from bonuses.js — old tier-based helper, never called since Red Spin rewrite. Fix 8: Deleted `generatePickChooseTiles()` from game.js — superseded by `_generatePickTiles()` in bonuses.js. Fix 9: Deleted `generateRedSpinWin()` from game.js — superseded by real-grid rewrite in runRedSpin(). Fix 10: Removed duplicate `./assets/sasha.png` entry from service-worker.js cache list. Fix 11: Bumped CACHE_NAME from `turrelle-v6j3` → `turrelle-v6j6` in service-worker.js. Fix 12: Fixed misleading `WILD_MULTIPLIERS` comment in paytable.js — now accurately describes current code behaviour and flags the Josie ×4 bug. Fix 13: Added `bonus_trigger` sound handler to audio.js — ring + ascending 5-note chime; previously silent when BONUS letters fired. No math or game logic changed. |
| turrelle_v6k3.zip | Wild Multiplier Fix | 2026-05-15 | Fix 1: Josie wild now correctly gives ×4 (was ×2 same as Sasha). evaluateLine() now uses identity-based wild check — scans full combo window for Josie/Sasha IDs, applies ×2/×4/×6 per design. Fix 2: Operator panel orphan divs — confirmed already fixed in v6j8, no regression. Fix 3: H&S wrong arg from Red Spin — confirmed already fixed in v6j5, no regression. SW cache bumped to turrelle-v6k3. Files: game.js, service-worker.js, PHASE_PLAN.md. Note: Josie ×4 fix will increase base game RTP — account for this in Priority 5 Monte Carlo. |
| turrelle_v6k2.zip | v6k1 Testing Fixes | 2026-05-15 | Fix 1: Balance deducted from display immediately on spin/play button press (added updateBalance call in onSpinStart). Fix 2: BONUS letter partial pays (1-4 letters) now silent — toast removed, yellow cell highlight kept. Full BONUS (5 letters) still triggers orb screen. Fix 3: Red Spin continuance operator slider cap raised 95%→99%, wired to actual spin loop (was reading hardcoded constant), reset button added. Fix 4: Paytable now shows actual symbol images from reels + reads pay values live from PAY_TABLE (no more hardcoded stale values). Fix 5: SW cache bumped to turrelle-v6k2. Files: ui.js, operator.js, bonuses.js, index.html, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6k1.zip | Win Display Fix | 2026-05-15 | Fix 1: `#win-line-label` moved from after `#info-bar` to immediately after `#win-section` in index.html — was rendering in wrong position between info bar and controls, causing a second win flash in wrong location. Fix 2: Removed redundant manual `.pop` animation trigger from `updateRedSpinWin()` in ui.js — `updateWinDisplay()` already handles the pop, double-firing caused double-flash. CACHE_NAME bumped to turrelle-v6k1. Files: index.html, ui.js, service-worker.js. |
| turrelle_v6k.zip | RTP Stats Fix + noJackpots Enforcement | 2026-05-15 | Fix 1: Removed `GameState.stats.totalWon += amount` from `awardJackpot()` in state.js — jackpot wins were being counted twice (once in awardJackpot, once via recordSpin), inflating live RTP display in operator panel. recordSpin is now the single point of truth. Fix 2: `noJackpots` flag now fully enforced — `runBonusFeature` reads `callerContext.noJackpots`, passes it down to `runHoldSpin` and `runPickChoose` dispatch calls with `noJackpots:true`; `runHoldSpin` skips jackpot payout in STEP 4 when flag set; `runPickChoose` skips `processJackpotCheck` when flag set. Jackpots inside BONUS orb feature now correctly suppressed as per design. CACHE_NAME bumped to turrelle-v6k. Files changed: state.js, bonuses.js, service-worker.js. |
| turrelle_v6j9.zip | Tier 1 + Tier 2 Bug Fixes | 2026-05-15 | Fix A: `Audio.play('credits_addup')` → `Audio.play('coin_drop')` in ui.js — coin land sound was silently failing (wrong key). Fix B: Removed incorrect `disablePickChooseInRedSpin` guard from base game P&C trigger in game.js — Red Spin operator flag was suppressing base game Pick & Choose. Fix C: `runPickChoose` nesting guard `callerContext.hold_spin` → `callerContext.from === 'HOLD_SPIN'` — dead code guard never fired. Fix E: Added `events:[]` and `outcome:{totalSpins,totalWon}` to `runRedSpin` return value — event log and replay had undefined fields on every Red Spin. Fix F: BONUS orb sub-bonus now dispatched after `runBonusFeature()` in `runRedSpin` — checks `bResult.awardHoldSpin` and `bResult.awardPickChoose` and runs the appropriate sub-bonus; previously orb was revealed but nothing happened and $0 was awarded. Fix G: `_generatePickTiles` decoy cap — each decoy type now capped at max 2 occurrences (was uncapped; 97.4% of boards had a decoy type reach match-3 before guaranteed winning tiles). Fix (cache): CACHE_NAME bumped to `turrelle-v6j9`. Files changed: ui.js, game.js, bonuses.js, service-worker.js. |
| turrelle_v6j8.zip | Red Spin Lockup Fix + Operator Panel Fix | 2026-05-15 | Fix 14: `await delay(400)` → `await this._delay(400)` in `runRedSpin()` — `delay` was private to ui.js IIFE, caused ReferenceError after Spin 1, permanently froze game with red screen. Fix 15: `UI.updateRedSpinWin(bonusTotal, spinNum)` → `UI.updateRedSpinWin(spinWin, bonusTotal, spinNum)` — correct 3-arg call, bonus total display was showing spin number. Fix 16: CACHE_NAME bumped to turrelle-v6j8. Fix 17: Removed 2 orphan unclosed `<div class="op-row">` label-only lines in renderPanel() (lines 152, 154) that were duplicating the Disable P&C and Disable H&S toggle labels and corrupting panel HTML. Fix 18: Tightened operator panel CSS — reduced padding, font sizes, margins for mobile fit; added overflow-x:hidden and box-sizing:border-box to prevent horizontal stretch on Samsung Galaxy S23. Files changed: bonuses.js, service-worker.js, operator.js, style.css. |
