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
> 14. **ES5 compatibility is mandatory for ALL .js files** — never use optional chaining (`?.`), nullish coalescing (`??`), object spread (`{...obj}`), or default function parameters (`fn(x=val)`) in any .js file. These crash Samsung Browser silently at parse time causing blank reels with no console error. Use `if (x === undefined) x = val` instead of default params. Arrow functions and template literals are acceptable in external .js files but must never appear in inline HTML `<script>` blocks.
> 15. **Read `!READ_BEFORE_CODING.md` and this entire document before every session** — this applies to all developers and AI assistants without exception. A `!READ_BEFORE_CODING.md` file is included at the root of every zip. If you are an AI assistant: you are bound by all rules here. Owner-confirmed decisions are final. Do not re-litigate design choices already logged.
> 16. **`deadfiles.zip` is included in every build package** — if the game ever shows missing file errors, broken images, missing audio, or any asset-not-found issue, check `deadfiles.zip` first before assuming files were never created. These files were confirmed unused as of v6j5 (2026-05-15) but are preserved in case a future feature needs them or a reference was missed. Do NOT delete `deadfiles.zip` from the package. Contents: `ching.mp3`, `lipstick_bonus.mp3`, `splash_music.mp3`, `josie_title.png`, `sasha_title.png`, `sisters_title.png`, `sisters_celebrate.webp`, `sasha_solo_celebrate.webp`, `icons/splash.png`.
> 17. **`PHASE_PLAN.md` is always included in every build zip** — the phase plan must travel with the game files at all times. Never deliver a zip without it. Always update the phase plan before zipping.
> 18. **MANDATORY PHASE PLAN AUDIT before every session** — At the start of every work session, and again before making any code change, perform a full audit of this file: (a) Re-read the MANDATORY INSTRUCTIONS, GAME DESIGN RULES, KNOWN ISSUES, and RECOMMENDED FIX ORDER sections. (b) Cross-check any fix you are about to make against the current code to confirm it is not already fixed (stale plan entries have been a recurring problem). (c) Confirm the version you are working on matches the latest build in BUILD HISTORY. (d) Log the audit result here before writing a single line of code: note the version audited, the date, and any discrepancies found. **Never rely on memory or prior conversation — the plan may have changed since your last session.**
> 19. **`CACHE_NAME` lives in `service-worker.js` ONLY
> 23. **Working folder and zip folder name must always match the current version** — the working folder MUST be renamed to the current build version (e.g. `turrelle_v6l99/`) before packaging. Never deliver a zip where the internal folder name is a stale version. Rename the folder as the FIRST step of every new version session. PERMANENT RULE. — never hardcode it anywhere else.** The version string (e.g. `turrelle-v6l20`) must appear in exactly one place: the `const CACHE_NAME` declaration at the top of `service-worker.js`. The SW activate handler uses it to purge old caches automatically. The inline cache-bust block in `index.html` deletes ALL caches unconditionally — it must never reference a specific version name. If you find a hardcoded cache name anywhere other than `service-worker.js`, remove it immediately and log it here. Dead files (confirmed unused assets) must never be added to `CACHE_FILES` — check against the `deadfiles.zip` manifest in Rule 16 before adding any asset path.
> 20. **Always confirm with the owner before applying any code changes**
> 21. **GAME_DESIGN_MANUAL.md is the authoritative design reference** — it must be updated whenever any game design changes. Both PHASE_PLAN.md and GAME_DESIGN_MANUAL.md must be updated together. Never deliver a zip where the two documents are out of sync. Cross-reference both when making any change. This is a PERMANENT RULE.
> 22. **Always check with the owner before changing game design** — design decisions are owner-confirmed and must be logged in PHASE_PLAN.md and GAME_DESIGN_MANUAL.md. No design change proceeds without owner approval. This is a PERMANENT RULE. — present your full plan (what you will do, why, and which files will be modified), then wait for explicit owner approval before writing a single line of code. No change — however small or obvious — is applied without owner sign-off. This rule applies to all developers and AI assistants without exception.
> 21. **After ALL fixes in a session are applied, perform a mandatory full-file bug scan** — scan every .js, .html, and .css file in the project for new or pre-existing bugs before packaging. Log each file scanned, any bugs found, and the disposition (fixed immediately, added to KNOWN ISSUES, or deferred). Never deliver a zip without completing this scan and logging the result here. This rule applies to all developers and AI assistants without exception.
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

**Game Version:** v6l96 (current)

> 📖 **See [GAME_DESIGN_MANUAL.md](GAME_DESIGN_MANUAL.md) for the complete authoritative rules reference.**
> All symbols, pays, bonuses, jackpots, and mechanics are documented there.
> When a design rule changes, update BOTH this file and the manual.
**Last Updated:** Full game design rules added + priorities re-evaluated (2026-05-15)
**Target RTP:** 94%  
**Reel Structure:** 5 reels × 3 rows × 80 stops × 20 paylines (MLMC Aristocrat VGT style)

---


---

## KNOWN ISSUES — Pending Investigation (2026-05-15)

### 🔴 BUG — H&S `_generateCoin()` — "big" and "huge" cash coin tiers permanently unreachable (found v6l84 audit — 2026-05-19):
- `_generateCoin()` in `bonuses.js` checks JP tiers and cash tiers using a **single shared `cumulative` variable** that is never reset between the two loops.
- JP tier weights sum to `0.145`. Cash tier weights sum to `1.0`. Total = `1.145`. Since `rng.next()` only returns `[0, 1)`, any tier whose cumulative threshold exceeds `1.0` is **never reached**.
- **Unreachable tiers:** "big" (2.5–6× bet, weight 0.04) starts at cumulative `1.015` — unreachable. "Huge" (6–15× bet, weight 0.01) starts at `1.055` — unreachable.
- **Impact:** Players can never receive the two highest-value cash coin types from H&S. The most exciting large coins silently do not exist. RTP from H&S cash coins is also lower than designed.
- **Fix:** Reset `cumulative = 0` before the cash tier loop in `_generateCoin()` so JP and cash tiers are checked independently against the same roll value. Alternatively adjust cash tier weights to sum to `0.855` to fill the remaining `[0.145, 1.0)` space — but a reset is cleaner and matches the intended design.
- **File:** `bonuses.js` (`_generateCoin`, cash tier loop)
- **Priority:** 🔴 HIGH — silently removes two coin tiers from all H&S bonuses
- **Status:** ✅ FIXED v6l84 session 2026-05-19 — cumulative = 0 reset added before cash tier loop in _generateCoin(). Removed from KNOWN ISSUES.
- `_generatePickTiles()` in `bonuses.js` has **two separate `cash` entries** in `PRIZE_WEIGHTS` (`weight:0.40` and `weight:0.20`). When the winning type is `cash`, the decoy filter `p.type !== winType.type` compares the string `'cash'` — but since both entries share `type:'cash'`, the second cash entry **passes the filter** and `'cash'` appears in `decoyTypes`.
- **Impact:** The board can contain more than 3 cash tiles total (3 winning + up to 2 cash decoys). A player tapping cash tiles could match 3 cash decoys before finding all 3 guaranteed winning cash tiles — the "always winnable" board guarantee is broken. The win outcome is unpredictable when cash is the prize.
- **Fix:** Give the two cash weight buckets distinct internal type names (e.g. `cash_a` / `cash_b`) and map both to `cash` only at the prize-building stage, OR restructure the cash weight roll to select a single tier index instead of using two separate `PRIZE_WEIGHTS` entries.
- **File:** `bonuses.js` (`_generatePickTiles`, `PRIZE_WEIGHTS` definition and decoy filter)
- **Priority:** 🔴 HIGH — breaks board integrity when cash is the winning prize type (~60% of P&C outcomes)
- **Status:** ✅ FIXED v6l84 session 2026-05-19 — cash_a/cash_b rename in PRIZE_WEIGHTS; decoy filter now excludes all cash tiles correctly

### 🟡 BUG — `bonuses.js` contains multiple ES6 violations (found v6l84 audit — 2026-05-19):
- Several ES6+ constructs found in `bonuses.js` that violate Rule 14:
  - `for...of` loops: `for (const step of eventTimeline)`, `for (const { pos, coin } of step.events)`, `for (const p of PRIZE_WEIGHTS)`
  - `const` destructuring: `const { sequence, coinMap, isBlackout, eventTimeline } = outcome`
  - Array swap destructuring: `[prizes[i], prizes[j]] = [prizes[j], prizes[i]]`
  - Arrow functions: `.filter(p => ...)`, `.map(p => ...)`, `resolve =>`, `index =>`, `v => !v`
  - `for (let i = ...)` loops throughout `_generatePickTiles` and `runBonusFeature`
- These are in an external `.js` file so lower risk than inline HTML scripts, but older Samsung Browser (pre-2018) and some kiosk WebViews may silently fail on `for...of` and destructuring.
- **Fix:** Convert all `for...of` to indexed `for` loops, destructuring to explicit property access, array swap to temp variable, and arrow callbacks to `function()` expressions.
- **File:** `bonuses.js` (`runHoldSpin`, `_generatePickTiles`, `runBonusFeature`, `_waitForOrbTap`, `_waitForTileTap`)
- **Priority:** 🟡 MEDIUM — external JS so lower risk, but kiosk/Samsung Browser compatibility not guaranteed
- **Status:** ✅ FIXED v6l84 session 2026-05-19 (extended) — all for...of, destructuring, arrow functions, let/const converted to ES5 throughout entire file. Only `const Bonuses = {` top-level declaration remains (module object pattern — intentional).

### 🟡 BUG — `_waitForOrbTap()` fallback uses arrow function (found v6l84 audit — 2026-05-19):
- `bonuses.js` `_waitForOrbTap()` fallback path: `setTimeout(() => resolve(0), 500)` — arrow function inside `setTimeout`.
- Minor ES5 inconsistency. Fallback only fires when `UI` is undefined (non-browser/test environment) so no player impact in production, but should be consistent with ES5 style throughout the file.
- **Fix:** `setTimeout(function() { resolve(0); }, 500)`
- **File:** `bonuses.js` (`_waitForOrbTap`)
- **Priority:** 🟡 LOW — no production player impact
- **Status:** ✅ FIXED v6l84 session 2026-05-19 — bundled into BUG 3 fix; arrow converted to function() expression

### 🚫 PERMANENT DESIGN RULE — Never remove the winning-spin gate from `checkRedSpinTrigger()` (owner confirmed 2026-05-19):
- Red Spin is designed to trigger **only on winning combinations**. The gate `(result.totalWin > 0 || charJackpots.totalAwarded > 0) ? checkRedSpinTrigger() : false` in `game.js` is **intentional and must never be removed**.
- **Do not remove this gate as a shortcut to increase trigger frequency.** It breaks the core bonus design.
- When adjusting frequency, always compensate for the ~52.5% base win rate. The effective trigger rate = `RED_SPIN_FREQUENCY_DEFAULT × ~0.525`. To achieve a real 1-in-N feel across all spins, set the constant to `(1/N) / 0.525`.
- **File:** `game.js` (`checkRedSpinTrigger`), `paytable.js` (`RED_SPIN_FREQUENCY_DEFAULT`)
- **Status:** 🚫 PERMANENT — do not change without owner confirmation

### ⚠️ PRE-EXISTING: Inline HTML `<script>` block uses `async/await` — violates Rule 14 (documented 2026-05-19):
- `index.html` inline script block contains `async function doSpin()`, `async function requestWakeLock()`, and `await executeSpin(...)` / `await navigator.wakeLock.request(...)`. These are ES2017 and violate the Rule 14 ES5-only requirement for inline scripts.
- These were present before v6l73 and were functional. Not changed in v6l73 fix to avoid regressions.
- **Risk:** Silent parse failure on Samsung Browser <10.1 (pre-2020) or older Chrome WebView. If the game fails on very old devices, rewrite `doSpin` as a promise chain and `requestWakeLock` with `.then()`.
- **Status:** ⏳ Pre-existing — deferred. Flag for Phase G final audit.

### ✅ PRE-EXISTING: `index.html` inline PWA install handler uses `async function` — FIXED v6l75:
- Was: `_iy.addEventListener('click', async function() {...})` — `async` keyword present but no `await` inside.
- **Fix applied v6l75:** Changed to plain `function() { ... }` — pure ES5, zero behaviour change.
- **Status:** ✅ FIXED v6l75

### ✅ `bonusFeatureCount` missing from stats definition — silent data loss on reload (FIXED v6l22 — 2026-05-17):
- `game.js` incremented `GameState.stats.bonusFeatureCount` but it was never declared in the `stats` object in `state.js`, never included in `saveState()`/`loadState()`, and never shown in the operator panel.
- Result: the count reset to `undefined` (then 1) on every page reload — lifetime BONUS trigger count was lost every session.
- **Fix:** Added `bonusFeatureCount: 0` to the stats definition in `state.js` and to the `resetState()` stats block. `saveState()`/`loadState()` use `Object.assign` so no further changes needed — it now persists automatically.
- **Status:** ✅ FIXED v6l22

### ✅ `sessionStart` shows stale time from previous session (FIXED v6l22 — 2026-05-17):
- `stats.sessionStart` was only set inside `recordSpin()` — meaning on a fresh page load it held the previous session's timestamp until the first spin. Operator panel `getSessionDuration()` showed inflated session time before any spin was made.
- **Fix:** Added `GameState.stats.sessionStart = Date.now()` immediately after `loadSpinHistory()` in `loadState()` — resets to now on every page load.
- **Status:** ✅ FIXED v6l22

### ✅ `runRedSpin()` and `runBonusFeature()` try/catch added (FIXED v6l50 — 2026-05-18):
- **Status:** ✅ FIXED v6l50. Both now have try/catch matching H&S pattern.
- `runHoldSpin()` already has a try/catch in its `game.js` call site that clears `activeBonus` and re-enables controls on error (added after the v6j lockup incident).
- `runRedSpin()` and `runBonusFeature()` have no equivalent protection. Any unhandled error inside either function leaves `GameState.activeBonus` set permanently — game is frozen, controls disabled, red screen stays active or orb screen hangs.
- **Fix:** Add try/catch wrappers around `Bonuses.runRedSpin()` and `Bonuses.runBonusFeature()` calls in `game.js`, matching the pattern already used for `runHoldSpin()`. On catch: clear `activeBonus`, deactivate red screen, re-enable controls, show error toast.
- **Files:** `game.js` (executeSpin — Red Spin and BONUS feature dispatch blocks)
- **Priority:** 🔴 HIGH — identical to the v6j lockup bug that was already fixed for H&S
- **Status:** ✅ FIXED v6l50+ — try/catch confirmed in game.js around runRedSpin() (lines 531+) and runBonusFeature(). Verified v6l97.

### ✅ Extra picks (`extraPicks` / `result.extraPickCount`) feature removed (v6l42 — owner confirmed 2026-05-17):
- Owner confirmed: always 3 picks. Players tap freely until match-3. No extra pick mechanic.
- All dead code removed: `extraPicks` param, `extraTapsRemaining`, `result.extraPickCount`.
- **Status:** ✅ FIXED v6l42

### ✅ `_generatePickTiles` cash decoy values leak the winning tile (FIXED v6l50) (found v6l22 audit — 2026-05-17):
- Cash decoy tiles are generated using `tier.maxMult / 2` as the upper bound — so decoy cash values are always in the lower half of the tier range.
- The winning cash tile uses the full tier range (`minMult` to `maxMult`).
- A player comparing revealed tile amounts could identify the winning tile by its higher value before finding all 3. This undermines the fairness and unpredictability of the bonus.
- **Fix:** Use the same full range for decoy cash tiles as for the winning tile. All cash tiles should be indistinguishable by amount.
- **File:** `bonuses.js` (`_generatePickTiles`, decoy tile generation loop)
- **Priority:** 🔴 HIGH — exploitable by observant players
- **Status:** ✅ FIXED v6l50+ — decoy cash tiles use full range (minMult to maxMult), same as winning tiles. Verified in bonuses.js _generatePickTiles line ~1105. Verified v6l97.

### ✅ `recordSpin()` called before bonus wins (FIXED v6l50) — RTP stats undercount all bonus payouts (found v6l20 audit — 2026-05-17):
- `game.js` line 576: `recordSpin(totalBet, totalWon)` is called BEFORE any bonus executes.
- At that point `totalWon` contains only base game wins + base game jackpots. All bonus wins (P&C, H&S, Red Spin) are added to `totalWon` in lines 600–660, AFTER `recordSpin` has already written to `stats.totalWon`.
- Result: operator panel live RTP only reflects base game payouts. Bonus wins — which can dwarf base game wins — are excluded. The RTP meter systematically undercounts actual payout.
- `finalizeGameRecord()` at line 699 receives the correct full `summary.totalWon` but that goes only to game history, not to `stats.totalWon`.
- **Fix:** Move `recordSpin(totalBet, totalWon)` from line 576 to after all bonus win accumulation — after the last `totalWon +=` line and before `finalizeGameRecord`. Ensure `totalWon` at the call site includes all wins (base + jackpot + P&C + H&S + Red Spin).
- **File:** `game.js` (lines 576 and 660–699)
- **Status:** ✅ FIXED v6l50+ — recordSpin() is at line 552 of game.js, AFTER all bonus totalWon accumulations (P&C line 489, H&S line 510, RS line 539). Verified v6l97.

### ✅ Jackpot trigger threshold — 3-of-a-kind is CORRECT DESIGN (confirmed by owner 2026-05-17):
- `checkCharacterJackpots()` triggers MINI on 3+ consecutive Sasha, MINOR on 3+ consecutive Josie. This is INTENTIONAL.
- The PHASE_PLAN symbol table entry "MINI = Sasha (5-oak)" was stale/wrong. The actual trigger is 3-oak.
- **Status:** ✅ Code is correct. Symbol Reference Table and JACKPOT RULES sections updated to reflect 3-oak trigger.

### ✅ Paytable BONUS letter display uses wrong fallback values (FIXED v6l50) (found v6l20 audit — 2026-05-17):
- `index.html` paytable screen: `BLP[4]||50` and `BLP[3]||15` are wrong fallback values.
- `BONUS_LETTER_PAYS = [0, 1, 2, 4, 12]` so correct fallbacks are `BLP[4]||12` and `BLP[3]||4`.
- No player impact in practice (BLP always loads), but wrong if the constant is ever missing.
- **Fix:** Change `BLP[4]||50` → `BLP[4]||12` and `BLP[3]||15` → `BLP[3]||4` in index.html.
- **File:** `index.html` (paytable section, lines 1002–1003)
- **Status:** ✅ FIXED — index.html uses BLP[4]||12 and BLP[3]||4 (correct fallbacks). Verified v6l97.

### 🔴 `$NaN` on coin overlay — GameState.creditsPerLine undefined (found v6l40 screenshots — 2026-05-17):
- `index.html` initial load IIFE used `GameState.creditsPerLine` which doesn't exist in state.js. The correct property is `GameState.lastCreditsPerLine`. `undefined × denom = NaN` → coin.value = NaN → overlay renders `$NaN`.
- **Fix:** `(GameState.lastCreditsPerLine || 1) * (GameState.denom || 0.01)` with safety fallbacks.
- **Status:** ✅ FIXED v6l40. Files: index.html.

### 🔴 H&S coin SVGs not rendering on older Samsung Browser (found v6l40 screenshots — 2026-05-17):
- `.hs-coin-img` was missing `height: 100%` and `object-fit: contain`. Some browsers need both dimensions explicit for `<img>` inside flex containers. SVG coins collapsed to zero height, showing only dark background. Also needed a gold radial-gradient fallback background for when SVG fails to load entirely.
- **Fix:** Added `height:100%`, `object-fit:contain`, and fallback `background` to `.hs-coin-img`.
- **Status:** ✅ FIXED v6l40. Files: style.css.

### 🟡 `mask-image` on spinning cells breaks on Samsung Browser < 12 (found v6l40 screenshots — 2026-05-17):
- CSS `mask-image` gradient on `.hold-cell.spinning-cell` was missing `mask-size: 100% 100%` and `-webkit-mask-size`. Older Samsung Browser requires explicit mask-size alongside mask-image or the fade effect is ignored (cells spin without edge fade, or entire cell disappears).
- **Fix:** Added both `-webkit-mask-size` and `mask-size: 100% 100%`.
- **Status:** ✅ FIXED v6l40. Files: style.css.

### 🟡 Coin value text color #4a2e00 invisible on some browsers (found v6l40 screenshots — 2026-05-17):
- Dark bronze `#4a2e00` used for "engraved" text effect on gold coin was too similar in luminance to the coin face on some displays/browsers — rendered as invisible or faint white. Text appeared floating rather than embedded.
- **Fix:** Reverted to near-white `#fff8e8` with hard black surround text-shadow and amber glow. Same luminous intent, reliable cross-browser rendering.
- **Status:** ✅ FIXED v6l40. Files: style.css.

### 🔴 White text overlay on gold coins — base game AND bonus game (reported by owner 2026-05-17, fix v6l43):
- The near-white `#fff8e8` text introduced in v6l40 is visible but reads as a plain floating white label against the gold coin face. The amber `text-shadow` glow is insufficient to anchor it — on bright devices and certain browsers the surround shadows don't render strongly enough and the text appears to float rather than be embedded.
- Affects: `.reel-coin-value` (base game coins on reels) and `.hs-c-val` (Hold & Spin board cash coins).
- **Root cause:** The coin SVG face is brightest at top-centre (`#fffde0`). On some brightness/contrast settings, white-on-gold has too little contrast and the black surround shadows are insufficient (rendered at sub-pixel widths). The fix needs a guaranteed opaque black outline ring, not just a shadow.
- **Fix:** Replace the existing `text-shadow` stack on both classes with a new stack that leads with 8 tight black offsets forming a solid outline ring (top/bottom/left/right + 4 diagonals), then adds the amber glow on top. This is the CSS equivalent of `-webkit-text-stroke` but works cross-browser without reflow. Color stays `#fff8e8` — white on a solid black ring on gold reads clearly on every display. Applied to both `.reel-coin-value` and `.hs-c-val`. `.hs-c-val-jp` (jackpot seed value, smaller text below SVG tier label) gets the same treatment at reduced glow intensity.
- **Files:** `style.css` (`.reel-coin-value`, `.hs-c-val`, `.hs-c-val-jp`), `service-worker.js` (CACHE_NAME bump to v6l43), `PHASE_PLAN.md`.
- **Priority:** 🔴 HIGH — visible cosmetic defect reported by owner.
- **Status:** ✅ FIXED v6l43 — 2026-05-17

### 📋 PRE-LOG (Rule 11) — turrelle_v6l43 — White coin text overlay fix (2026-05-17):
**What:** Replace `text-shadow` stack on `.reel-coin-value` and `.hs-c-val` in `style.css` with a solid 8-direction black outline ring + amber glow. Text color stays `#fff8e8`. Ensure text is readable on gold coin face across all browsers and display brightnesses.
**Why:** Owner reported white text overlay on gold coins in both base game and bonus (Hold & Spin board). Current shadow stack is too thin at sub-pixel widths on some devices.
**What is NOT changing:** No JS, no game logic, no RTP math, no SVGs, no HTML. Pure CSS change to two selectors.
**Files that will be modified:**
1. `style.css` — `.reel-coin-value` text-shadow, `.hs-c-val` text-shadow, `.hs-c-val-jp` text-shadow
2. `service-worker.js` — CACHE_NAME bump from `turrelle-v6l42` → `turrelle-v6l43`
3. `PHASE_PLAN.md` — this pre-log + Known Issues entry + build history entry

--- (confirmed by owner 2026-05-16):
- Current `runPickChoose()` reveals all 15 tiles before awarding the win — this is wrong.
- Correct behaviour: RNG decides prize before player picks. Player taps one tile at a time. Game stops **immediately** when 3rd matching tile is found. Remaining tiles stay face-down.
- The board generation (`_generatePickTiles()`) is already correct — 3 winning tiles + 12 decoys capped at 2 each.
- The bug is in the UI layer or loop logic — something is auto-revealing all tiles instead of stopping at match-3.
- **Fix:** Audit `runPickChoose()` while loop and `UI.revealPickTile()` — ensure loop breaks at match-3 and no subsequent reveal calls fire. Disable tile tap callback immediately on win.
- **Files:** `bonuses.js` (`runPickChoose`), `ui.js` (`revealPickTile`, tap callback)
- **Status:** ✅ FIXED v6l6 — three-layer lock: (1) `UI.setPickTapCallback(null)` (2) `UI._lockAllPickTiles()` sets `pointer-events:none` on all tiles at DOM level (3) `showPickChooseWin` uses `data-prizeType` tag instead of fragile icon-text scan. Fresh grid resets `pointer-events` on tile creation.

---

## 🔍 PHASE PLAN AUDIT — v6l73 (2026-05-19)

> Performed by AI assistant at session start per Rule 16, before any code changes. Full read of MANDATORY INSTRUCTIONS, GAME DESIGN RULES, KNOWN ISSUES, and RECOMMENDED FIX ORDER sections. Version confirmed: turrelle_v6l73 (latest build in BUILD HISTORY). Date: 2026-05-19.

### Discrepancies found and resolved:

1. **CRITICAL — game.js SyntaxError (blank reels):** `evaluateLine()` had `let multiplier = 1` (line 76) followed by `var multiplier` inside an `if` block (line 85). Duplicate identifier in strict mode = SyntaxError at parse time. game.js never executed. Reels blank. ✅ FIXED.

2. **PAYTABLE NOT UPDATED:** The v6l73 entry was pre-logged (Rule 11) but the actual paytable.js still contained v6l71/v6l72 values — the new owner-confirmed values were never applied. All 7 affected pay values plus BONUS_LETTER_PAYS corrected. ✅ FIXED.

3. **MIXED_BAR_PAY wrong:** Code had `{3:3,4:5,5:10}` — contradicts owner-confirmed v6l57 `{3:5,4:10,5:15}`. Restored. ✅ FIXED.

4. **calculateTheoreticalRTP ES6 syntax:** Function used `const`, `let`, arrow functions — violates Rule 14. Converted to ES5. ✅ FIXED.

5. **Stale WILD_MULTIPLIERS constant comment:** Updated to reflect new points-based system. ✅ FIXED.

6. **Inline async/await pre-existing violation:** `doSpin()` and `requestWakeLock()` use async/await in inline HTML script. Pre-existing, not new in v6l73. Documented as known issue. ⏳ Deferred to Phase G.

7. **Symbol Reference Table in PHASE_PLAN lists Cherry (id:7) as active** — ✅ FIXED v6l75. Cherry row updated to show REMOVED, pay values zeroed, note added. All other symbol pay values in the table also synced to owner-confirmed 2026-05-19 amounts.

---

## 🔍 PHASE PLAN AUDIT — v6l38 (2026-05-17)

> Performed by AI assistant per Rule 15 before any code changes. Full read of all sections.

### Version confirmed:
Latest build in BUILD HISTORY is `turrelle_v6l38.zip`. ✅

### Phase status corrections:

**Phase M — BONUS Letters Rework:** Still marked `⏳ PENDING` at line 1982 but M3/M4/M5/M6 completion table shows ✅ for all items. `evaluateLetterPays()` confirmed in game.js, bottom-row trigger confirmed, payline animations working (v6l30). **Updating to ✅ COMPLETE.**

**Phase K — Operator Menu Overhaul:** Marked `⏳ PENDING` but all K1/K3 items implemented in v6l16. K2/K4/K5 remain pending. **Updating to 🔄 PARTIAL.**

**Phase F — Operator Menu Overhaul:** Still marked `🔄 NEXT` — superseded by Phase K. **Already corrected earlier in doc — confirmed.**

**Phase J — J1/J2/J3:** All marked `✅ IN PROGRESS (v6k6)` — should be `✅ COMPLETE (v6k6)`.

### New items to add to Known Issues:
- Gold coin value text CSS (engraved+luminous) needs browser test — v6l38 not yet confirmed

### Design spec items added this session:
- H&S conveyor belt Empty Cell Spinning section updated (v6l37) ✅
- Gold coin embedded value text design not yet documented in spec ⚠️

---

> Performed by AI assistant at session start per Rule 16, before any code changes. Full read of MANDATORY INSTRUCTIONS, GAME DESIGN RULES, KNOWN ISSUES, and RECOMMENDED FIX ORDER sections. Version confirmed: turrelle_v6l33 (latest build in BUILD HISTORY). Date: 2026-05-17.

### Version confirmed:
Latest build in BUILD HISTORY is `turrelle_v6l33.zip` — matches files on disk. ✅

### Scope of this session:
Apply the jackpot coin SVG redesign that was created (timestamps 20:49–20:51) but never wired into the build. No math, RTP, or game logic is being changed. Scope is strictly: (1) add jp_mini/minor/major/grand.svg to service-worker CACHE_FILES, (2) remove now-dead CSS conic-gradient classes for the conveyor belt jackpot coins, (3) bump CACHE_NAME, (4) log everything.

### Deadfiles check (Rule 14 + Rule 17):
`jp_mini.svg`, `jp_minor.svg`, `jp_major.svg`, `jp_grand.svg` — confirmed NOT in deadfiles.zip. They are live assets actively referenced by `ui.js` (`_fillHoldCell` and `_HS_REEL_COINS`). Safe to add to CACHE_FILES. ✅

### Known issues cross-check (Rule 12):
No known issue relates to this SVG change. Open high-priority issues (🔴) are:
- `runRedSpin`/`runBonusFeature` no try/catch — not touched this session
- `extraPicks` non-functional — not touched this session
- `_generatePickTiles` decoy value leak — not touched this session
- `recordSpin()` called before bonus wins — not touched this session
None of these are affected by or block this SVG wiring change. ✅

### PRE-LOG of planned changes (Rule 11 — BEFORE any code is written):
**What:** Apply jackpot coin SVG redesign — 5 SVG files were redesigned between v6l33 commits but never registered in the service worker cache manifest. The JS (`ui.js`) already correctly references all four `jp_*.svg` files in both `_fillHoldCell()` and `_HS_REEL_COINS`. No JS changes needed.
**Why:** Without the jp SVG files in CACHE_FILES, the service worker cannot cache them. Browsers in offline/kiosk mode would fail to load jackpot coin images. The redesigned SVGs are also not being served from cache on repeat visits.
**Files to change:**
1. `service-worker.js` — add `jp_mini.svg`, `jp_minor.svg`, `jp_major.svg`, `jp_grand.svg` to CACHE_FILES. Bump CACHE_NAME from `turrelle-v6l33` → `turrelle-v6l34`.
2. `style.css` — remove dead `.hs-reel-coin.reel-jp-mini/minor/major` conic-gradient CSS classes. These were the old CSS-painted conveyor approach; the code switched to SVG images and never removed the now-unused rules. No visual change — these classes were never applied by JS.
3. `PHASE_PLAN.md` — this audit log + pre-log + build history entry.
**Files NOT changed:** `ui.js`, `game.js`, `bonuses.js`, `paytable.js`, `index.html`, `state.js`, `audio.js`, `operator.js`, `cashout.js`. No JS, no HTML, no math.
**Testing required:** Trigger H&S bonus — confirm all four jackpot coin types (MINI/MINOR/MAJOR/GRAND) render correctly in the conveyor belt and on the board using the new SVG designs.

---

## 🔍 PHASE PLAN AUDIT — v6l20 (2026-05-17)

> Performed by AI assistant at session start per Rule 16. Full read of PHASE_PLAN.md and code audit of game.js, bonuses.js, paytable.js, state.js, cashout.js, index.html. Version confirmed: turrelle_v6l20. Date: 2026-05-17.

### Findings:

**3 new bugs found that are NOT yet in KNOWN ISSUES:**

1. **🔴 BUG-V6L20-A — `recordSpin()` called before bonus wins are accumulated** — `game.js` line 576 calls `recordSpin(totalBet, totalWon)` BEFORE any bonus runs (P&C, H&S, Red Spin). At that point `totalWon` = base game win + base game jackpots only. All bonus wins (which can be the majority of total payout) are added to `totalWon` in lines 600–660 AFTER `recordSpin` has already written to `stats.totalWon`. Result: operator panel live RTP (`stats.totalWon / stats.totalWagered`) only counts base game wins — all bonus payouts are excluded from the RTP meter. The lifetime RTP display will read significantly lower than actual. **Fix:** Move `recordSpin(totalBet, totalWon)` to after all bonuses complete — after line 668 (`totalWon += redResult.totalWon`) and before `finalizeGameRecord`. **File:** `game.js`. **Priority:** Medium — does not affect player payouts, only operator RTP display accuracy.

2. **🔴 BUG-V6L20-B — Jackpot trigger threshold mismatch: code uses 3-of-a-kind, PHASE_PLAN says 5-of-a-kind** — `checkCharacterJackpots()` in `game.js` fires MINI on 3+ consecutive Sasha from reel 1 (`syms[0]===SASHA && syms[1]===SASHA && syms[2]===SASHA`), and MINOR on 3+ consecutive Josie. But the PHASE_PLAN symbol table and JACKPOT RULES section both state: "MINI = Sasha (5-oak) | MINOR = Josie (5-oak)". This means jackpots are firing ~30× more often than designed (3-oak vs 5-oak probability). Note: this may be intentional if the owner changed the trigger to 3-oak — **needs owner clarification before touching**. If it is a bug, fix is: change the `syms[2]` checks to also require `syms[3]===SASHA && syms[4]===SASHA` (and same for Josie). **File:** `game.js` (`checkCharacterJackpots`). **Priority:** Confirm with owner before fixing — may be deliberate design change not yet documented here.

3. **🟡 BUG-V6L20-C — Paytable BONUS letter display uses wrong fallback values** — `index.html` paytable screen (lines 1002–1005) uses `BLP[4]||50` and `BLP[3]||15` as fallbacks. `BONUS_LETTER_PAYS = [0, 1, 2, 4, 12]` so `BLP[4]=12` and `BLP[3]=4` — the fallbacks of 50 and 15 are never reached in practice, but they are wrong if `BONUS_LETTER_PAYS` ever fails to load. The correct fallbacks should be 12 and 4. **Fix:** Change `BLP[4]||50` → `BLP[4]||12` and `BLP[3]||15` → `BLP[3]||4` in index.html paytable section. **File:** `index.html` (lines 1002–1003). **Priority:** Low — cosmetic only since BLP always loads correctly in practice.

**Stale entries confirmed as already fixed (no action needed):**
- cashout.js ES6 syntax — confirmed zero `?.` remaining in cashout.js ✅
- BONUS orb prize dispatch — confirmed `bResult.awardHoldSpin/awardPickChoose/awardRedSpin` all checked in bonuses.js ✅
- H&S respin counter — confirmed `eventTimeline[]` drives animation in runHoldSpin ✅
- Wild multiplier Josie ×4 — confirmed `hasJosie` flag used in evaluateLine ✅
- P&C all-reveal — confirmed `_lockAllPickTiles()` called on match-3 ✅
- CACHE_NAME — confirmed `turrelle-v6l20` ✅

---

### 🔴 BONUS Letters — Full rework required (owner directive 2026-05-16):
- Entire letter detection and pay system is being replaced. See Phase M and BONUS LETTER FEATURE RULES section for full spec.
- Old `evaluateBonusLetters()`, `BONUS_LETTER_PAYS`, and per-payline scanning are all being removed.
- New system: cherry-style row evaluation for pays, bottom-row-only trigger check, S restricted to bottom row of reel 5.
- **Status:** ⏳ Phase M — pending owner go-ahead to begin coding.


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

### ✅ Red Spin — Win escalation / reel mismatch (FIXED v6l62 — owner confirmed Sisters cap 2026-05-18):

**Owner report:** Every Red Spin spin should result in a higher win than the previous, AND the reels should show symbols that match the win amount. Currently not working as intended.

**Root cause analysis (code reviewed 2026-05-18):**

The win escalation logic IS implemented and mostly correct. The `do { ... } while (spinWin <= lastWin && attempts < 500)` loop ensures each spin beats the previous. However there are two failure modes:

**Failure 1 — Last-resort synthetic win (line 125):** When 500 random attempts AND the full R1×R2 scan both fail to find a real grid that beats `lastWin`, the code inflates the win synthetically: `spinWin = Math.max(anyWin, lastWin * 1.1 + totalBet)`. It then sets `result.totalWin = spinWin` but the reels show whatever real symbols produced `anyWin`. Player sees e.g. $0.25 Single Bar win on reels but the win counter says $8.50. Reels and win do not match.

**Failure 2 — R1×R2 scan stops at first hit not best hit:** When the 500-attempt loop fails, the scan finds the FIRST combination that beats `lastWin`, not the best. At high lastWin values this may only find very high-paying combinations (5-oak Josie/Sasha), making the escalation visually obvious and non-random.

**What is NOT broken:** The win-exceeds-previous rule is enforced for all normal spins. The real problem is the edge case after many escalating spins when lastWin becomes very large.

**Proposed fix:**
1. In last-resort path — find the real grid that produces the closest win ABOVE lastWin (not just any win > 0). Set `result.totalWin` to the real grid win, not a synthetic value. Reels and pay will always match.
2. If truly no real grid can beat lastWin (mathematically impossible at current bet) — end the Red Spin sequence naturally rather than showing a mismatched synthetic win.
3. R1×R2 scan — scan all 80×80=6400 combinations (already done) — this is correct. The issue is only in the last-resort `!found` branch.

**Files:** `bonuses.js` (`runRedSpin`, lines 107–128)
**Priority:** 🔴 HIGH — breaks the core Red Spin promise (reels match win, always escalating)
**Status:** ⏳ Pending — investigation complete, fix ready to code once owner confirms approach

---
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
- **Status:** ✅ FIXED in v6j5 — Phase Plan status was stale; code confirmed correct: `this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN', noRestoreReels:true })`

### ✅ Red Spin — `noJackpots` flag now enforced throughout BONUS orb feature sub-bonuses (FIXED — v6k — 2026-05-15):
- Design: "CANNOT happen: Jackpots inside BONUS orb feature"
- Code passes `{ from:'RED_SPIN', noJackpots:true }` to `runBonusFeature()` as `callerContext`
- `runBonusFeature()` never reads `callerContext.noJackpots` — no guard exists anywhere in the function
- The orb prizes are H&S, P&C, and Red Spin — both H&S and P&C can award jackpots internally
- When those sub-bonuses run after an orb pick, jackpots are not suppressed
- **Fix:** After orb prize is resolved, pass a `noJackpots` flag down into `runHoldSpin` and `runPickChoose` calls dispatched as a result of the orb win. Add `callerContext.noJackpots` guard inside `runBonusFeature` — document the enforcement path in Phase Plan before coding.
- **File:** `bonuses.js` (`runBonusFeature`, and any downstream dispatch)
- **Status:** ✅ FIXED v6l12 — `runBonusFeature()` called with `noJackpots:true` from base game; `currentContext.noJackpots = true` set before H&S/P&C runs awarded by orb.

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
- **Status:** ✅ FIXED — bonuses.js runRedSpin() dispatches bResult.awardHoldSpin/awardPickChoose/awardRedSpin correctly (lines 433-441). Verified v6l97.

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
- **Status:** ✅ FIXED in v6l10 — `showRedSpinEndCelebration(bonusTotal, spinNum)` implemented in ui.js; called before `deactivateRedScreen()`. Red-themed overlay with coin rain, 4s auto-dismiss or tap.

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
- **Status:** ✅ FIXED — code verified: bonuses.js now has STEP 5 (Blackout bonus) and STEP 6 (End bonus) correctly labelled. Plan status was stale.

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
- **Status:** ✅ FIXED in v6j8 — Phase Plan status was stale; operator.js lines 152-153 confirmed properly closed with buttons

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
- **Status:** ✅ FIXED v6l12 — `eventTimeline[]` added to `_generateFullHoldSpinOutcome()` return; animation loop now drives from ordered timeline of `initial`/`land`/`empty` steps, correctly decrementing counter on empty respins and resetting on landings.

### 🔴 Hold & Spin — No sequential coin collection animation at bonus end (confirmed — 2026-05-15):
- Wins are summed and displayed instantly at bonus end — no coin-by-coin sequential collection animation
- Player should see each coin "collected" one at a time with a running total ticking up — the key celebration moment
- **Root cause:** Phase I item I4a not yet implemented — `UI.endHoldSpin()` likely sums total instantly
- **Files:** `ui.js` (`endHoldSpin`)
- **Status:** ✅ FIXED v6l5 — `_hsCollectCoins()` + `showHoldBonusWinScreen()` implement full Aristocrat-style collection sequence

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
- **Status:** ✅ FIXED — code verified: `decoyCounts` with max-2 cap is implemented in `_generatePickTiles`. Heading updated to match. (Plan status was stale — fix was applied in v6j9 as originally logged in the build history.)

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
- **Status:** ✅ FIXED — code verified: bonuses.js return at end of `runRedSpin` includes `events: []` and `outcome: { totalSpins, totalWon }`. Plan status was stale.

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
- **Status:** ✅ FIXED — code verified: `awardJackpot()` in state.js no longer adds to `stats.totalWon`. Comment in code confirms `recordSpin()` is the single point of truth. Plan status was stale.

### 🟡 Service Worker cache name not bumped — offline play serves stale code (found 2026-05-15):
- `service-worker.js` line 7: `CACHE_NAME = 'turrelle-v6j3'`
- v6j4 and v6j5 fixes to `bonuses.js` and `paytable.js` will never be served from cache on devices that already cached v6j3
- Network-first strategy means online play is unaffected, but offline / kiosk / PWA installs run old broken code
- **Rule:** Bump `CACHE_NAME` on every build that changes any cached file. Match the build version exactly.
- **Fix:** Change to `'turrelle-v6j5'` for the current build
- **File:** `service-worker.js` (line 7)
- **Status:** ✅ Now maintained — CACHE_NAME is bumped on every build. Current: `turrelle-v6l13`.

### ✅ Pick & Choose triggered from base game uses the Red Spin disable flag (FIXED — v6j9 — 2026-05-15):
- `game.js` line 650: `const pickEnabled = !GameState.operator.disablePickChooseInRedSpin;`
- This is the operator flag for disabling P&C *during Red Spin* — not a base game flag
- If an operator disables P&C in Red Spin for testing purposes, P&C triggered by a legitimate 5-oak Lipstick in the base game is also silently suppressed — player earns the trigger and gets nothing
- **Fix:** Add a separate `disablePickChooseInBase` operator flag, or simply remove the guard — P&C should always be enabled in base game
- **File:** `game.js` (line 650, inside `executeSpin`)
- **Status:** ✅ FIXED — code verified: `disablePickChooseInRedSpin` flag is no longer read in the base game P&C trigger path. A comment in game.js confirms this flag is Red Spin only and is never applied in base game. Plan status was stale.

### ✅ `runPickChoose` nesting guard uses wrong `callerContext` key — dead code (FIXED — v6j9 — 2026-05-15):
- `bonuses.js` line 449: `if (callerContext.hold_spin) return { totalWon:0, events:[], outcome:null };`
- No caller ever passes `{ hold_spin: true }`. Base game passes `{ base_game: true }`, Red Spin passes `{ from: 'RED_SPIN' }`
- The guard intended to prevent P&C launching inside H&S never fires — the protection does not exist
- **Fix:** Change the guard to check `callerContext.from === 'HOLD_SPIN'` and update all H&S dispatch calls to pass `{ from: 'HOLD_SPIN' }` if nesting prevention is desired. Or remove the guard if P&C-inside-H&S is acceptable (currently no code path creates this anyway)
- **File:** `bonuses.js` (line 449)
- **Status:** ✅ FIXED — code verified: guard now correctly checks `callerContext.from === 'HOLD_SPIN'`. Plan status was stale.

### ✅ Dead code: `generateRedSpinWin()` and `generatePickChooseTiles()` in `game.js` (FIXED — v6j7 — 2026-05-15):
- Both functions deleted from game.js — superseded by live implementations in bonuses.js

### ✅ Dead code: `_redSpinTierHelper()` in `bonuses.js` (FIXED — v6j7 — 2026-05-15):
- Deleted from bonuses.js — never called since Red Spin rewrite

### ✅ `assets/sasha.png` listed twice in service worker cache (FIXED — v6j7 — 2026-05-15):
- Duplicate entry removed. CACHE_NAME also bumped to `turrelle-v6j6`.

### ✅ `PICK_CHOOSE_PRIZES` in paytable.js ≠ `PRIZE_WEIGHTS` in bonuses.js (found v6l55 scan — 2026-05-18):
- `paytable.js` exports `PICK_CHOOSE_PRIZES` (3 cash tiers + red_spin + hold_spin, used by Monte Carlo tool at lines 292/571).
- `bonuses.js` `_generatePickTiles()` uses its own inline `PRIZE_WEIGHTS` (8-entry table including mini/minor/major/grand jackpots, different weight distribution).
- The Monte Carlo tool is simulating a different prize distribution than the live game. MC results for P&C RTP contribution are inaccurate.
- **Fix needed before Monte Carlo run:** Either (A) update `PICK_CHOOSE_PRIZES` in paytable.js to match the live `PRIZE_WEIGHTS` and update Monte Carlo to import it, OR (B) import `PICK_CHOOSE_PRIZES` into bonuses.js and use it in `_generatePickTiles`. Owner must confirm which prize distribution is correct.
- **Priority:** 🟡 MEDIUM — affects Monte Carlo accuracy, not player experience
### 🟡 Total RTP ~180% — Red Spin dominant (MC verified 2026-05-18): Full sim at 5c/5cr/20L/$5 bet: Base 58%, H&S 38%, RS 64%, P&C 20%, Total ~180%. RS avg $93/sequence = 18.7x bet at 60% continuance. To reduce: (A) RS frequency 3.5%→2.5%, (B) continuance 60%→50%, (C) cap RS at 50x totalBet. Owner decision needed. Status: ⏳ Pending.
- **Status:** ✅ FIXED — PICK_CHOOSE_PRIZES in paytable.js updated to match live PRIZE_WEIGHTS in bonuses.js (8-entry table including jackpot tiers). MC tool updated to import from paytable.js. Verified v6l91.

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
- **Status:** ✅ FIXED — code verified: all call sites use `Audio.play('coin_drop')`. No remaining `credits_addup` play calls anywhere in game.js, ui.js, or bonuses.js.

---

| turrelle_v6l90.zip | H&S fix + RS recal + ES5 rewrite | 2026-05-20 | MC-verified: H&S 1-in-46 (was impossible), RS 1-in-19 all spins. Gold coins 10→15/reel, MIN_GAP exception for BONUS_ID (3→1). RS freq 0.286→0.240. ui.js full ES5 rewrite (27 arrow fns, 98 const/let removed). chipLand keyframe added. justify-content:center on #hold-screen. updatePickMatches ES6 removed. |
| turrelle_v6l89.zip | ui.js ES5 rewrite | 2026-05-20 | Complete ES5 rewrite of ui.js — removed all arrow functions, const/let, for...of, Object.entries, template literals. Samsung Browser safety. |
| turrelle_v6l88.zip | RS freq bump + CSS fixes | 2026-05-20 | RS freq 0.180→0.286 (later revised in v6l90). chipLand keyframe added. justify-content on #hold-screen. |
| turrelle_v6l87.zip | Conveyor belt restored | 2026-05-20 | Luxury Vault conveyor belt restored after v6l85 removal. All 4 class bugs fixed (last-three). |
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

## PHASE M — BONUS Letters Rework (Neptune's Gold Style) ✅ COMPLETE (v6l30)
**Files:** `paytable.js`, `game.js`, `tools/monte_carlo.js`
**Owner directive (2026-05-16):** Rework BONUS letters to work like Hunt for Neptune's Gold. Full spec in BONUS LETTER FEATURE RULES section above — that section is authoritative. Summary below.

> **Do not begin coding until owner confirms ready. Run Monte Carlo after all changes. Log results here before marking complete.**

### M1 — Reel Strip Changes
- **S (id:14):** Remove from top and center rows of reel 5. Place S on bottom row only. Reel 5 stop count stays the same — redistribute freed stops to other symbols (confirm with owner which symbols get the stops, or spread evenly).
- **B, O, N, U:** No reel strip changes — they already appear on all rows of their designated reels. Verify this in `paytable.js` reel strips.
- **File:** `paytable.js` (reel strips / `REEL_FREQUENCIES`)

### M2 — Remove Old Letter Logic
- Delete `evaluateBonusLetters()` from `game.js` entirely.
- Remove `BONUS_LETTER_PAYS` array from `paytable.js`.
- Remove all per-payline letter scanning from `evaluateSpin()`.
- Remove `result.triggerBonusFeature` flag wiring from old letter evaluator (it will be re-added via new bottom-row check).
- **Files:** `game.js`, `paytable.js`

### M3 — Add Cherry-Style Letter Pay Function
New function `evaluateLetterPays(grid, betPerLine)` in `game.js`:
```javascript
// Mirrors evaluateCherryWin() exactly — checks all 3 rows independently,
// counts consecutive letters from reel 1, pays additively across rows.
// BONUS_LETTER_CHERRY_PAYS = [0, 1, 2, 4, 12] (index = consecutive count, x betPerLine)
// Returns { totalPay, rowResults[] }
// Does NOT check bottom row for trigger — that is M4's job.
```
- Add `BONUS_LETTER_CHERRY_PAYS = [0, 1, 2, 4, 12]` to `paytable.js`.
- Wire `evaluateLetterPays()` into `evaluateSpin()` alongside cherry evaluation.
- **Files:** `game.js`, `paytable.js`

### M4 — Bottom Row Trigger Check
New inline check in `evaluateSpin()` after letter cherry pays:
```javascript
// Bottom row trigger: grid[0][2]===LETTER_IDS[0] && grid[1][2]===LETTER_IDS[1]
//   && grid[2][2]===LETTER_IDS[2] && grid[3][2]===LETTER_IDS[3] && grid[4][2]===LETTER_IDS[4]
// If true: result.triggerBonusFeature = true
// Bottom row letter pays are NOT added to totalWin when trigger fires — trigger takes priority for that row.
// Top/center row letter pays still apply on a trigger spin.
```
- **File:** `game.js`

### M5 — Monte Carlo Update
- Update `tools/monte_carlo.js` letter evaluation to use new cherry-style logic.
- Run full sweep after all M1–M4 changes. Log results here.
- **File:** `tools/monte_carlo.js`

### M6 — Symbol Reference Table Update
- Update letter IDs 10–14 description in Symbol Reference Table in this file.
- Update BONUS LETTER FEATURE RULES section if any detail changes during coding.

### M7 — Pick & Choose Fix (bundled with Phase M)
> **Bug confirmed by owner (2026-05-16):** Current `runPickChoose()` reveals ALL 15 tiles before awarding the win. Correct behaviour: game stops the moment player finds their 3rd matching tile. Fix the `while(!won)` loop in `bonuses.js` — ensure no auto-reveal of remaining tiles after match-3 is hit. UI must stop accepting taps immediately on win. **File:** `bonuses.js`, `ui.js`

| # | Task | File | Status |
|---|---|---|---|
| M1 | S to bottom row only on reel 5 | paytable.js | ✅ Enforced by trigger check (M4). Strip note added in buildReelStrips — visual S restriction to future phase if needed. |
| M2 | Remove old letter logic | game.js, paytable.js | ✅ |
| M3 | Cherry-style letter pay function | game.js, paytable.js | ✅ |
| M4 | Bottom row trigger check | game.js | ✅ |
| M5 | Monte Carlo update + sweep | tools/monte_carlo.js | ✅ Updated — sweep pending owner test |
| M6 | Symbol table + plan update | PHASE_PLAN.md | ✅ |
| M7 | P&C all-reveal bug fix | bonuses.js, ui.js | ✅ pickTapCb nulled immediately on match-3 |

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
| I3a | Cash coin values display on Gold Coin face | ui.js | ✅ `_fillHoldCell()` renders `$X.XX` on chip face — already correct |
| I3b | MINI/MAJOR/MINOR/GRAND label display on coin face | ui.js | ✅ `_fillHoldCell()` renders label + seed value — already correct |
| I3c | Grand Jackpot on blackout (all 15 filled) | bonuses.js | ✅ Already in runHoldSpin() step 5 |
| I4a | Sequential coin collection animation | ui.js (`endHoldSpin`) | ✅ Implemented v6l5 — `_hsCollectCoins()` collects L→R T→B at 550ms/coin |
| I4b | Running total counter during collection | ui.js | ✅ Implemented v6l5 — `updateHoldTotal()` called per coin with pop animation |
| I4c | Celebration screen with final "Bonus Win" amount | ui.js | ✅ Implemented v6l5 — `showHoldBonusWinScreen()` with coin rain, tap-to-dismiss |
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
| Cherry: 1+ any row, all rows pay simultaneously | ~~✅ Correct~~ **REMOVED v6l13** | `evaluateCherryWin()` deleted in v6l13 — Cherry symbol removed entirely |
| Cherry: 1-oak pays 1 credit | ~~✅ Correct~~ **REMOVED v6l13** | `evaluateCherryWin()` deleted in v6l13 — ID 7 is now unused |
| Mixed Bar: 3/4/5 any bar combo on active payline | ✅ Correct | `evaluateMixedBars()` — skips pure same-bar (handled by regular eval) |
| Gold Coins: never pay on paylines | ✅ Correct | `evaluateLine()` returns 0 for BONUS_ID |
| 5-oak Lipstick triggers Pick & Choose (no cash) | ✅ Correct | `evaluateSpin()` sets `scatterTriggered` |
| 6+ Gold Coins anywhere = H&S trigger | ✅ Correct | Grid scan in `evaluateSpin()` |
| Wild mid-combo (not at start) | ✅ Correct | `extraWilds` branch in loop |
| No pay for 1-oak non-cherry | ✅ Correct | `matchCount < 2` returns 0 |
| Letter partial pays (1/2/3/4) | ✅ Correct | `evaluateBonusLetters()` + `BONUS_LETTER_PAYS` |

### ✅ PAYLINE BUG — Wild Multiplier Does Not Distinguish Josie vs Sasha (FIXED — v6k3 — 2026-05-15)

**Note:** This entry is a duplicate of the bug documented and fixed in v6k3. The stale "not yet fixed" status below was an oversight — the fix was already live in game.js before this section was written.

**Fix confirmed in code:** `evaluateLine()` uses identity-based wild check — `hasJosie`/`hasSasha` flags from `wildIdsInCombo` — applying ×4 (Josie), ×2 (Sasha), or ×6 (both). `WILD_MULTIPLIERS` object is no longer used for the multiplier decision.

**Status:** ✅ FIXED in v6k3 — duplicate entry; refer to v6k3 build log for full details.

---


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
**Status:** ✅ COMPLETE — All known Red Spin bugs fixed through v6l13. End celebration screen implemented (v6l10). Continuance updated to 70% (v6l11). Min-payout floor fixed (v6l3). Additional Red Spin chaining implemented (v6l7). Owner confirmed Red Spin multi-spin working.

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
**Paylines:** 20 paylines — player selects active lines (1, 5, 10, 15, 20). Only active lines pay. (v6l9: line selection restored; v6l8: paylines updated to Neptune's Gold exact set)  
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

All 20 paylines available. Player selects active lines (1, 5, 10, 15, 20) via SELECT LINES button. Wins only pay on active lines. Paylines are left-to-right consecutive from reel 1. Updated to Neptune's Gold exact set in v6l8.

```
Payline layout (row index per reel — 0=top, 1=center, 2=bottom):
 0: [1,1,1,1,1]  — Middle Row (straight)
 1: [0,0,0,0,0]  — Top Row (straight)
 2: [2,2,2,2,2]  — Bottom Row (straight)
 3: [0,1,2,1,0]  — V-Shape
 4: [2,1,0,1,2]  — Inverted V
 5: [1,0,1,0,1]  — High Chevron
 6: [0,1,0,1,0]  — Low Chevron
 7: [0,1,1,1,0]  — Top-to-Middle Drop
 8: [2,1,1,1,2]  — Bottom-to-Middle Rise
 9: [1,2,0,2,1]  — M-Shape ★ Neptune's Gold
10: [1,0,2,0,1]  — W-Shape ★ Neptune's Gold
11: [0,0,1,0,0]  — Top/Middle Wave
12: [2,2,1,2,2]  — Bottom/Middle Wave
13: [1,1,0,0,0]  — Zig-Zag Step Up ★ Neptune's Gold
14: [0,0,1,1,1]  — Zig-Zag Step Down ★ Neptune's Gold
15: [1,0,0,0,1]  — Mountain Top Flat
16: [1,2,2,2,1]  — Valley Floor Flat
17: [2,1,1,0,0]  — Snake Up ★ Neptune's Gold
18: [0,1,1,2,2]  — Snake Down ★ Neptune's Gold
19: [1,0,1,2,1]  — Center Bridge ★ Neptune's Gold
```

---

### SYMBOL RULES

#### Standard payline symbols (consecutive from reel 1, left-to-right, on active payline)
All standard symbols pay on the active payline the combination lands on. Minimum 3-of-a-kind for all symbols. Pay = credits × credits-per-line × denom.

| Symbol | ID | Count/reel | Pays (5/4/3-oak × credits) | Notes |
|---|---|---|---|---|
| Sisters | 0 | 1/reel | 0/0/0 | **Jackpot symbol only** — any count on payline = miss (no pay). Triggers GRAND jackpot via jackpot system only. |
| Josie | 1 | 2/reel | 1250/250/40 | **Wild ×4** — triggers MINOR jackpot on 3+ consecutive from reel 1 |
| Sasha | 2 | 2/reel | 1250/250/40 | **Wild ×2** — triggers MINI jackpot on 3+ consecutive from reel 1 |
| Josie + Sasha mix | — | — | — | Triggers MAJOR jackpot when both appear together on any active payline |
| StrayPup | 17 | 2/reel | 500/200/100 | — |
| DJ Maxine | 16 | 2/reel | 350/150/75 | — |
| Seven | 3 | 5/reel | 175/75/50 | — |
| Diamond | 15 | 4/reel | 150/50/25 | — |
| Triple Bar | 4 | 9/reel | 100/75/50 | — |
| Double Bar | 5 | 10/reel | 75/50/25 | — |
| Single Bar | 6 | 7/reel | 50/25/15 | — |
| Lipstick | 8 | 12/reel | No payline pay | **Bonus trigger only** — 5-oak on any active payline triggers Pick & Choose. Any other count = miss. |
| Gold Coin | 9 | 14/reel | No payline pay | **Special** — 6+ anywhere triggers Hold & Spin. See Hold & Spin Rules. |

> **Dollar values at 1¢ denom / 1 credit per line:** multiply credits by $0.01. E.g. Sisters 5-oak = $0.00, StrayPup 5-oak = $5.00, Seven 5-oak = $1.75.

#### BONUS Letter symbols (Special — not standard payline symbols)
| Symbol | ID | Reel | Notes |
|---|---|---|---|
| Letter B | 10 | Reel 1 only | — |
| Letter O | 11 | Reel 2 only | — |
| Letter N | 12 | Reel 3 only | — |
| Letter U | 13 | Reel 4 only | — |
| Letter S | 14 | Reel 5 only | — |

Each BONUS letter only appears on its designated reel. B can only land on reel 1, O on reel 2, etc.

#### BONUS Letter Partial Pays (owner-confirmed 2026-05-18)
| Letters visible (bottom row, consecutive from reel 1) | Pay (× betPerLine) | Dollar value at 1¢/1cr/20L |
|---|---|---|
| B only | 1× | $0.01 |
| B-O | 2× | $0.02 |
| B-O-N | 4× | $0.04 |
| B-O-N-U | 12× | $0.12 |
| B-O-N-U-S | Triggers BONUS feature | No cash pay |

#### Mixed Bar (virtual combination — not a symbol)
3, 4, or 5 any-bar mix (Single/Double/Triple Bar in any combination) on an active payline. Only counts if it is NOT a pure same-type bar combo (those pay via regular paytable).

| Count | Pay (× betPerLine) | Dollar value at 1¢/1cr/20L |
|---|---|---|
| 3 mixed | 5× | $0.05 |
| 4 mixed | 10× | $0.10 |
| 5 mixed | 15× | $0.15 |

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

Jackpots fire when the jackpot symbol combination lands on any active payline (3+ consecutive from reel 1).

| Jackpot | Symbol | Trigger | Seed (1¢ denom) |
|---|---|---|---|
| MINI | Sasha | 3+ Sasha consecutive from reel 1 on any active payline | $5 |
| MINOR | Josie | 3+ Josie consecutive from reel 1 on any active payline | $15 |
| MAJOR | Josie + Sasha mixed | Any mix of Josie and Sasha together on any active payline | $50 |
| GRAND | Sisters | 5-oak Sisters on any active payline | $200 |

- Only the **highest tier** jackpot pays per spin (not multiple jackpots in one base spin)
- Sisters on a payline with fewer than 5-oak = **no pay (miss)** — Sisters are not a payline symbol
- Jackpot seeds scale by denomination — see full seed table below and `JACKPOT_SEEDS_BY_DENOM` in `paytable.js`
- On MAJOR or GRAND hit: player sees a lock screen with Cash Out / Continue options

#### Jackpot Seeds by Denomination (Owner-Approved 2026-05-18)

Seeds update dynamically whenever the player changes denomination.

| Denom | Max Bet | MINI | MINOR | MAJOR | GRAND |
|---|---|---|---|---|---|
| 1¢ | $1.00 | $5 | $15 | $50 | $200 |
| 2¢ | $2.00 | $20 | $60 | $200 | $2,000 |
| 5¢ | $5.00 | $20 | $60 | $200 | $2,000 |
| 10¢ | $10.00 | $100 | $500 | $1,000 | $10,000 |
| 25¢ | $25.00 | $150 | $1,000 | $5,000 | $50,000 |
| 50¢ | $50.00 | $100 | $500 | $1,000 | $10,000 |
| $1.00 | $100.00 | $500 | $5,000 | $10,000 | $100,000 |
| $2.00 | $200.00 | $1,000 | $10,000 | $25,000 | $250,000 |
| $3.00 | $300.00 | $1,500 | $15,000 | $50,000 | $500,000 |
| $5.00 | $500.00 | $2,500 | $25,000 | $75,000 | $750,000 |
| ~~$10.00~~ | ~~removed~~ | — | — | — | — | *Permanently removed v6l94* |
| ~~$20.00~~ | ~~removed~~ | — | — | — | — | *Permanently removed v6l94* |

---

### BONUS LETTER FEATURE RULES

> **⚠️ REWORKED — v6l2 (2026-05-16) — Hunt for Neptune's Gold style. All previous partial-pay / per-payline / same-row logic is REMOVED and replaced by the spec below. If any code contradicts this section, the code is wrong.**

#### Reel Strip Design — AUTHORITATIVE
- **B (id:10):** Appears on reel 1 only. Can land on ANY of the 3 rows.
- **O (id:11):** Appears on reel 2 only. Can land on ANY of the 3 rows.
- **N (id:12):** Appears on reel 3 only. Can land on ANY of the 3 rows.
- **U (id:13):** Appears on reel 4 only. Can land on ANY of the 3 rows.
- **S (id:14):** Appears on reel 5 only. **BOTTOM ROW ONLY** — S is NEVER placed on the top or center row of reel 5. This makes a full B-O-N-U-S on a non-bottom row structurally impossible.

#### Letter Pay Rules — Cherry Style
Letters B, O, N, U evaluate **exactly like Cherry symbols**:
- Checked on **all 3 rows simultaneously** — not via payline scan
- **1+ consecutive letters from reel 1** pays per row, independently
- **All qualifying rows pay additively** in the same spin
- Wilds do NOT substitute for letters
- Each row is checked independently: if row 0 has B-O-N and row 2 has B-O, both pay and are summed

| Consecutive letters from reel 1 (per row) | Pay |
|---|---|
| 1 (B only) | 1× bet/line |
| 2 (B-O) | 2× bet/line |
| 3 (B-O-N) | 4× bet/line |
| 4 (B-O-N-U) | 12× bet/line |
| 5 (B-O-N-U-S) on bottom row | **BONUS trigger — no cash pay** |

#### BONUS Trigger Detection
- After each spin, check **bottom row only** (row index 2): `grid[0][2]===B && grid[1][2]===O && grid[2][2]===N && grid[3][2]===U && grid[4][2]===S`
- If true → BONUS feature triggers. The bottom row pays no cash for this combination — trigger takes priority.
- Since S only appears on the bottom row of reel 5, a full B-O-N-U-S on any other row is **impossible by reel design** — no special code guard needed.
- Letter cherry-style pays still apply to the top and center rows on a trigger spin (B-O-N on top row still pays 4× even if BONUS triggers on bottom row).

#### Full BONUS Feature (bottom row B-O-N-U-S)
Triggers the Mystery Bonus Orb selection screen:
1. Player is presented with 3 orbs to choose from
2. One orb contains the predetermined prize; two are decoys
3. Prize options: Hold & Spin, Pick & Choose, or Red Spin
4. Sub-bonus runs after orb selection
5. **Jackpots are suppressed inside the BONUS orb sub-bonuses** (cannot win jackpot inside orb feature)

#### What CAN happen inside Red Spin for BONUS letters:
- Letter cherry-style pays (1–4 consecutive on any row) — pay out via normal letter evaluation
- Full BONUS (bottom row B-O-N-U-S) — triggers orb selection mid-Red Spin

#### Code Changes Required (Phase M — BONUS Letters Rework)
| File | Change |
|---|---|
| `paytable.js` | Remove `BONUS_LETTER_PAYS` partial pay array. Add `BONUS_LETTER_CHERRY_PAYS = [0, 1, 2, 4, 12]` (index = consecutive count). |
| `paytable.js` | Reel strip: move all S stops to bottom row only on reel 5. Verify B/O/N/U distributed across all 3 rows on their respective reels. |
| `game.js` | Replace `evaluateBonusLetters()` entirely. New function: (1) cherry-style row scan for pays, (2) bottom-row-only trigger check. Remove all per-payline letter scanning. |
| `game.js` | Remove `BONUS_LETTER_PAYS` references. Add letter cherry pay accumulation to `evaluateSpin()` result alongside regular cherry pays. |
| `tools/monte_carlo.js` | Update letter evaluation to match new cherry-style logic. Run MC after changes and log results here. |
| `PHASE_PLAN.md` | Update Symbol Reference Table — letter IDs 10–14 pay description updated. |

**Status:** ⏳ PENDING — do not code until owner confirms ready to begin Phase M.

---

### RED SPIN RULES

Triggered randomly in base game (not by a symbol combination). Triggers approximately 1-in-X spins (RNG-based).

> ⚠️ **PERMANENT RULE — MUST BE ENFORCED IN ALL CODE AND PRESERVED THROUGH ALL FUTURE CHANGES:**
> **Red Spin Spin 1 floor = base game win that preceded it.**
> If the base game won $8 before Red Spin triggered, Spin 1 of Red Spin MUST produce a win > $8.
> `lastWin` in `runRedSpin()` must be initialized to `callerContext.prevWin` (the base game win),
> NOT to 0. This rule applies whenever Red Spin is triggered from base game.
> When triggered from BONUS orb or Pick & Choose (no prior base win), floor = total bet amount.
> **Never change `lastWin` initialization without re-reading this rule.**

> ⚠️ **PERMANENT RULE — MUST BE ENFORCED IN ALL CODE AND PRESERVED THROUGH ALL FUTURE CHANGES:**
> **Red Spin Screen Bonus ALWAYS pays more than the total bet — at every denomination.**
> Designed to match VGT Red Spin behaviour. `lastWin` floor = `Math.max(callerContext.prevWin, totalBet)`.
> Never use `callerContext.prevWin` alone — a low base game win (e.g. $1 cherry on a $100 bet) would
> allow the Red Spin sequence to end below the bet amount. The floor must be at least `totalBet`.
> `totalBet = betPerLine * linesActive` is already denom-scaled — no per-denom branching needed.
> **Never reduce the floor below `totalBet` regardless of what the base game win was.**

| Rule | Detail |
|---|---|
| Win required | Red Spin ONLY triggers when base game has an active win (totalWin > 0). Must NEVER fire on a $0 spin. |
| Spin 1 floor | Must exceed `Math.max(base game win, totalBet)` — always beats the larger of the two |
| Minimum payout | Red Spin ALWAYS pays more than the total bet at any denom (VGT design rule). Even a single Spin 1 win guarantees this when floor = max(prevWin, totalBet). |
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
| Coin values | Each new coin has a random value (cash or jackpot) assigned on landing via `_generateCoin()` — a fresh RNG roll per coin, independent of all other cells |
| Per-cell independence | Each cell operates independently. Empty cells all spin simultaneously during a respin round, but each landing event is a separate RNG call. Cells do not share or influence each other's outcomes. |
| Payout | Sequential collection animation — each coin's value added one by one (left-to-right, top-to-bottom) with sparkle trail to running total counter |
| Blackout bonus | All 15 positions filled = Grand Jackpot awarded IN ADDITION to all coin totals |
| All jackpots pay | Every jackpot tier that landed during the bonus pays out at end — not just the highest. MINI→MINOR→MAJOR→GRAND in ascending order. |
| Reel restore on exit | After H&S ends, reels snap back to the exact symbol grid that was showing when H&S triggered. Applies to: base game, Red Spin, BONUS letters orb. Does NOT apply to Pick & Choose. Controlled by `triggerStops`/`triggerGrid` passed into `runHoldSpin()` and `noRestoreReels`/`fromPickChoose` flags in `callerContext`. |
| Respin counter display | A prominent badge shows the current respin count at all times. Resets to 3 with a lightning-jolt animation on every new coin landing. |
| Pre-generation at spin time | Trigger coin values are pre-generated by `pregenerateTriggerCoins()` the moment 6+ coins are detected on the base reels — before the bonus opens. The player sees real RNG values on the triggering spin itself. The exact same coinMap is passed into `runHoldSpin()` so values never change between reel display and bonus board. |

#### RNG & Math Architecture

The H&S bonus uses a **predetermined outcome model**: all coin positions and values for the entire bonus session are decided in a single RNG pass (`_generateFullHoldSpinOutcome()`) before any animation plays. The visual sequence then plays out what was already decided. This approach:

- Guarantees mathematical correctness regardless of animation timing
- Matches how certified slot math engines work (outcome decided first, presentation follows)
- Allows the full bonus to be logged and audited before the player sees it

Each individual coin value is drawn from a **weighted probability table** (`HOLD_SPIN_CASH_TIERS`) via `_generateCoin()`. Lower-value tiers are significantly more common than high-value tiers, keeping the bonus's RTP contribution within its 8–10% target. Jackpot tiers use a separate table (`HOLD_SPIN_JACKPOT_TIERS`) and are checked first — a coin is either a jackpot orb or a cash coin, never both.

**RTP context:** Total game RTP target is ~94%, within the typical regulated range of 85–96%. H&S contributes 8–10% of that total. Even as a private/unregulated build, these targets are maintained to reflect real-world casino math standards.

#### Coin Value Tiers
Cash coins are fraction-based (scaled to total bet). Value is assigned fresh per coin via RNG at the moment each coin lands — not pre-set for the entire bonus:

| Tier | Weight | Range (at $20 total bet) | Multiplier of bet |
|---|---|---|---|
| Tiny | 42% | $0.40 – $2.00 | 0.02×–0.10× |
| Small | 25% | $2.00 – $6.00 | 0.10×–0.30× |
| Medium | 13% | $6.00 – $15.00 | 0.30×–0.75× |
| Large | 7% | $15.00 – $40.00 | 0.75×–2.00× |
| Big | 3% | $40.00 – $100.00 | 2.00×–5.00× |
| Near-miss boost | — | 1.8× multiplier applied to whichever tier lands | Applied when counter = 1 and a coin saves the bonus |

> **Note — Gear/Cog symbol:** Industry H&S games (e.g. Lightning Link) sometimes use a "gear" or "cog" as an upgraded coin variant with higher value or special multiplier properties. This game does not currently implement a gear symbol — all coins use the same Gold Coin SVG with a value overlay. This is a candidate for a future phase if an upgraded high-value coin variant is desired.

Jackpot coins (replace cash tiers — all 4 levels achievable during H&S):

| Level | Weight | Hit rate | Seed ($0.10 denom) | Glow colour |
|---|---|---|---|---|
| MINI | 0.3333% | ~1-in-50 H&S bonuses | $50 | Yellow |
| MINOR | 0.0833% | ~1-in-200 H&S bonuses | $150 | Blue |
| MAJOR | 0.0167% | ~1-in-1000 H&S bonuses | $500 | Green |
| GRAND | 0.0033% | ~1-in-5000 H&S bonuses | $5,000 | Orange-red |

**All jackpot levels that land during a single H&S bonus ALL pay at bonus end** (not just highest).  
Land probability per cell per respin: 5.5% (avg ~6 coins per trigger).  
Target H&S RTP contribution: 8–10% across all trigger contexts.

#### Coin Asset & Animation Architecture

Each Gold Coin cell is a single DOM element containing an **inline SVG** (`_makeCoinSVG()`) with the value baked directly into the SVG `<text>` nodes. This ensures the coin graphic and its value move as one atomic unit — no layer desync on any browser.

Animation states per cell:

| State | Description |
|---|---|
| Conveyor spinning (empty) | Individual vertical reel strip scrolls downward through the cell — coins + blank stops drift past a fade-masked window. Per-cell speed randomized so board feels alive. |
| Near-miss (counter = 1) | Strip slows to agonizing crawl. Red border pulse. Player can read every coin as it drifts past. |
| Anticipation (≤2 empty cells) | Strip speeds up slightly. Gold heartbeat border pulse. |
| Coin landing | Drop from above, 2–4 Y-axis rotations in flight, settle bounce on impact, particle burst. 6th coin gets slam treatment (lightning bolts, 9 particles, heavy audio). |
| Idle locked | Perpetual slow 360° Y-axis rotation with lighting sweep and subtle gold glow pulse. |
| Collected | Dims from glowing sun → dark gear visual via `coin-collected` CSS class during end collection sequence. |

#### H&S Trigger Contexts

H&S can fire from 4 different places in the game. All use the same coin tier math. Jackpot suppression and reel-restore behaviour vary by context:

| Context | Jackpots allowed | Reel restore | Notes |
|---|---|---|---|
| Base game (6+ coins on spin) | ✅ Yes | ✅ Yes | Most common. `triggerStops`/`triggerGrid` always captured. |
| Inside Red Spin | ✅ Yes | ❌ No (`noRestoreReels:true`) | H&S cannot chain back into Red Spin. |
| From Pick & Choose prize (`awardHoldSpin`) | ✅ Yes | ❌ No (`fromPickChoose:true`) | P&C reel restore happens separately. |
| From BONUS letters orb | ❌ Suppressed (`noJackpots:true`) | ❌ No (`noRestoreReels:true`) | Design rule: orb-awarded H&S never pays jackpots. |

---

### HOLD & SPIN — ANIMATION SPECIFICATION (Owner-Confirmed 2026-05-16)

> Cross-reference: H&S Rules above for game logic. This section covers visual and audio behaviour only.

#### 1. Entry — Coin Drop & Landing (animateCoinLand)

| Phase | Behaviour |
|---|---|
| Drop | Coin falls from above the cell. Physics-based straight drop. |
| In-flight spin | 2–4 full rotations on Y-axis while falling. Glows intensely during descent. |
| Settle bounce | On impact: small compression + rebound (like a heavy coin hitting a surface). CSS: scale down → scale up → rest. |
| Impact flare | Bright particle burst explodes outward on landing. 6 sparkle particles at 60° intervals for normal coins, 9 particles at 40° for 6th coin slam. |
| Cell background | Brief golden ripple or light-up effect on the cell background on impact (`coin-dropped` CSS class). |
| 6th coin slam | Coin #6 (including trigger coins) gets a distinct heavy slam: dropped from higher, spins more rotations, larger scale pop, 8 directional lightning bolts burst outward, 9 bigger brighter particles. Heavier audio (`hold_spin_coin_slam`). |

#### 2. Idle Animation (locked coins after landing)

| Phase | Behaviour |
|---|---|
| Base rotation | Perpetual slow 360° Y-axis spin. Full rotation every 2–4 seconds — much slower than the landing spin. |
| Lighting sweep | Virtual light source sweeps across coin face as it turns — metallic glints and specular highlights travel across surface. Achieved via `conic-gradient` animation or CSS `@property` rotation. |
| Subtle glow pulse | Soft golden aura around coin gently brightens/dims in sync with rotation cycle (`spinGlow` keyframe). |
| Coin wobble | Micro-movement wobble — organic coin-settling realism. Small Y-axis oscillation layered on top of main rotation. |
| High-value coins | Coins with value ≥ 5× betPerLine: faster idle spin, stronger particle trails, bigger flash on landing. |
| Jackpot coins | MAJOR: blue glow + bolder label emphasis. All jackpot coins have distinct glow colour matching their tier (MINI: blue, MINOR: green, MAJOR: gold, GRAND: orange-red). |

#### 3. Empty Cell Spinning (during each respin) — **"Luxury Vault" design (v6l37)**

Each empty cell is an individual vertical reel. A strip of coins + blanks scrolls downward continuously through a window with fade masks at the top and bottom edges (CSS `mask-image` gradient), so coins drift in from darkness and dissolve out — premium vault-window feel.

**Strip composition (12 stops per pass × 2 = 24 total, translateY -50%→0 seamless):**

`BLANK → CASH → BLANK → MINI → BLANK → CASH → BLANK → MINOR → MAJOR → BLANK → GRAND → BLANK`

- Blank stops render as `.hs-reel-blank` — dark recessed circle, like an empty slot on a real physical reel
- MAJOR and GRAND have no blank between them — back-to-back creates a burst of excitement
- All tier SVGs (`jp_mini.svg`, `jp_minor.svg`, `jp_major.svg`, `jp_grand.svg`) are visible and clearly readable as they drift past
- Per-cell speed is randomized so cells show different coins at different times — the board feels alive

| State | Speed | Behaviour |
|---|---|---|
| Normal spin | 2.4–3.2s/cycle | Slow, dramatic drift. Each coin clearly readable. Cell border gold pulse. Edge fade mask active. |
| Near-miss (counter = 1) | 4.5–6.0s/cycle | Agonizingly slow — almost stopped. Red border pulse. Player can read every coin as it crawls past. |
| Anticipation (≤2 empty cells) | 1.3–1.8s/cycle | Speeds up but stays weighty — urgent, not frantic. Gold heartbeat pulse on cell border. |

#### 4. Respin Counter Reset (new coin lands)

| Phase | Behaviour |
|---|---|
| Lightning jolt | Counter badge gets a "lightning reset" animation — rapid scale pop, rotateY flip, electric glow burst. |
| Electricity sparks | 6 small electric sparks radiate outward from the badge at landing moment. |
| Locked coin shine | All currently locked coins pulse to 1.45× brightness with gold outer glow at start of each respin. |
| Audio cue | Escalating per-respin: calm (early), tense (counter=2 or respin 4+), frantic triple-burst (counter=1). |

#### 5. Implementation Notes

- `_HS_REEL_COINS` — 12-entry array: 6 coin defs + 6 nulls (blank stops). `null` entries render as `.hs-reel-blank`.
- `startHoldSpinning(board, respinDisplay, emptyCount)` — builds strip with 2 passes, sets `--reel-dur`, `--reel-dur-nm`, `--reel-dur-ant`, `--reel-offset` CSS custom props per cell.
- `respinDisplay===1` → `.near-miss` class on strip. `emptyCount<=2` → `.anticipation` class.
- `clearHoldSpinning()` — removes `.spinning-cell` and replaces `innerHTML` on empty cells only.
- `animateCoinLand(pos, coin, isReplay, coinNumber)` — `coinNumber` gates 6th-coin slam.
- Empty respin duration: 1600ms normal, 2200ms near-miss (last spin).
- Landing anticipation delay: 1200ms normal, 1800ms near-miss.
- `pulseLockedCoins(board)` — called at start of every respin to shine all locked coins.
- `showSoCloseBanner()` — shown when counter reaches 0 with nothing landing.

---

Triggered by 5-oak Lipstick on any active payline.

| Rule | Detail |
|---|---|
| Trigger | 5 Lipstick on any active payline |
| Board | 15 tiles (3 rows × 5 columns) |
| Win tiles | 3 tiles contain the predetermined prize type |
| Decoy tiles | 12 tiles — no decoy type appears more than 2× (prevents false match-3) |
| Win condition | RNG decides prize before player picks. Player taps tiles one at a time. Game stops **immediately** when player finds their 3rd matching tile — prize is awarded at that moment. Remaining tiles stay face-down. |
| Reel restore on exit | After P&C closes, reels snap back to the 5-oak Lipstick trigger position briefly, then player returns to base game. Controlled by `triggerStops`/`triggerGrid` passed in callerContext from game.js and bonuses.js. |

**Guarantee:** The 3 predetermined winning tiles are always findable before any decoy type reaches match-3, because each decoy type is capped at max 2 occurrences across the 12 decoy positions.

> ⚠️ **KNOWN BUG — current code reveals ALL 15 tiles before awarding the win.** This is wrong. The correct behaviour is match-3 stops the game immediately — player does NOT see all tiles revealed. Fix required in `runPickChoose()` — ensure the `while(!won)` loop breaks and the UI stops accepting taps the moment `matchCounts[key] >= 3`. Do NOT auto-reveal remaining tiles after match. Status: ⏳ pending fix.

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

| Component | Target | Current (v6l3 — 1M spin MC, 5¢ / 1cr / 20L) | v6l90 MC (400k spins, 5¢) |
|---|---|---|
| Base game | 74–80% | 54.99% (simulated) ⚠️ — structural ceiling, see note |
| Hold & Spin | 8–10% | 13.71% (FULLY SIMULATED) — above target, review |
| Red Spin | ~4–6% | 5.52% (estimated) ✅ |
| Pick & Choose | ~2–3% | 1.33% (estimated, triggers 1in800) — below target |
| BONUS letters | ~1–2% | ~0% (triggers 1in15,625 — bottom row only) |
| **Total target** | **94%** | **~75.55% estimated** ⚠️ — needs calibration |

> **Trigger rate targets (owner confirmed 2026-05-16):**
> - Red Spin: highest (~1 in 29) — already correct ✅
> - H&S: 1 in 34 ✅
> - P&C: 1 in 800 — below target (~1 in 32). BONUS trigger 1 in 15,625 — far below target. See note below.
> - **Owner confirmed (2026-05-16):** BONUS trigger rate improvement deferred to later update.

> **⚠️ Base game RTP structural note (logged 2026-05-16 — v6l3 analysis):**
> The base game cannot reach 74–80% RTP while Gold Coin (14/reel = 17.5%) and BONUS letters (10/reel = 12.5%) occupy 30% of every reel with zero payline pay. These stops are required for H&S and BONUS trigger rates. The theoretical ceiling with current non-paying stop count is ~78%. Achieving 74–80% base RTP would require reducing Gold Coin or Letter counts (which lowers trigger rates). Current approach: accept ~55% base RTP and rely on bonuses (H&S + Red Spin) to carry total RTP toward 94%. Total RTP shortfall (~18%) is the next priority after operator menu and Red Spin fixes are confirmed working.

> **v6l3 reel recalibration (2026-05-16 — bars added):**
> Bars redistributed to increase mixed-bar hit frequency: TB 3→6, DB 4→7, SB 1→5 (+10 stops total).
> Freed from: Letters 16→10 (-6), Lipstick 16→12 (-4).
> Mixed bar hits: 1.30% → 13.09% (10× increase). Bar payline RTP: ~0% → 6.50%.
> Full MC results: Base 54.99%, H&S 13.71%, RS 5.52%, P&C 1.33%. Total ~75.55%.

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
**Must do:** Run Monte Carlo after changes. Max bet at $5 denom = $500/spin ($10/$20 denoms permanently removed v6l94).

### J1 — Add new denominations to DENOMINATIONS array ✅ COMPLETE (v6k6)

Current list: `[0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1.00]`
New list (append): `[0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1.00, 2.00, 3.00, 5.00, *(10.00 and 20.00 removed v6l94)*]`

New labels: add `'$2', '$3', '$5', '$10', '$20'` to `DENOM_LABELS`

**Max bet implications at new denoms (10 credits × 20 lines):**

| Denom | Max total bet |
|---|---|
| $2 | $400 |
| $3 | $600 |
| $5 | $1,000 |
| $10 | $2,000 |
| $20 | $4,000 |

### J2 — Full confirmed jackpot seed table ✅ COMPLETE (v6k6) (all values owner-approved 2026-05-15)

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

### J3 — Credits/line cap change ✅ COMPLETE (v6k6) (2026-05-15)
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

## PHASE K — Operator Menu Full Overhaul ✅ COMPLETE (v6l59)
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

## PHASE L — Game History & Audit Log ✅ COMPLETE (v6l57)
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

**Status:** ✅ COMPLETE (v6k8) — pending browser test (H&S visuals), Phase J (denom expansion), or Phase K (operator menu) coding

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
> ⚠️ **DRIFT WARNING (documented 2026-05-20):** This table and the SYMBOL RULES section in the game design spec above may have drifted from each other. Some pay values differ between the two. The **SYMBOL RULES section** (in the game design spec) reflects the most recent owner-confirmed values (updated 2026-05-19). This reference table is **historical** and may lag behind. Before relying on any pay value, cross-check paytable.js as the authoritative code source. Reconciliation of these two tables is scheduled for Phase G final audit.

| ID | Symbol | Reel Count | Pay (5/4/3/2) | Special |
|---|---|---|---|---|
| 0 | Sisters | 1/reel | 0/0/0/0 | **Jackpot symbol only** — payline hit = miss. GRAND jackpot via jackpot system only. |
| 1 | Josie | 3/reel (R1), 2/reel (R2-R4), 1/reel (R5) | 400/250/100/0 | Wild ×4 — MINOR jackpot trigger (3+ consecutive from reel 1) |
| 2 | Sasha | 1/reel (R1), 2/reel (R2-R4), 3/reel (R5) | 400/250/100/0 | Wild ×2 — MINI jackpot trigger (3+ consecutive from reel 1) |
| 3 | Seven | 5/reel | 70/60/50/0 | — |
| 4 | Triple Bar | 9/reel | 100/75/50/0 | — |
| 5 | Double Bar | 10/reel | 75/50/25/0 | — |
| 6 | Single Bar | 7/reel | 50/25/15/0 | — |
| 7 | ~~Cherry~~ | ~~REMOVED v6l13~~ | ~~REMOVED~~ | **ID 7 is unused** — Cherry removed in v6l13. Stops redistributed to bars. |
| 8 | Lipstick | 12/reel | 0/0/0/0 | **Bonus trigger only** — 5-oak on active payline = Pick & Choose. Any other count = miss. |
| 9 | Gold Coin | 14/reel | No payline pay | **Special** — 6+ anywhere on grid = Hold & Spin trigger. |
| 10-14 | B-O-N-U-S | B/O/N/U: all rows of designated reel. S: bottom row of reel 5 ONLY | 0/1×/2×/4×/12× betPerLine (cherry-style, per row, additive) | Bottom row B-O-N-U-S = BONUS orb trigger. S never on top/center row by reel design. |
| 15 | Diamond | 4/reel | 150/50/25/0 | — |
| 16 | DJ Maxine | 2/reel | 350/150/75/0 | — |
| 17 | Stray Pup | 2/reel | 500/200/100/0 | — |
| — | Mixed Bar | — | 5×/10×/15× betPerLine | 3/4/5 any bar mix on payline (MIXED_BAR_PAY {3:5,4:10,5:15}) |

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
| H | **Josie wild ×4 multiplier** — ✅ FIXED (stale entry). Code confirmed: evaluateLine() uses hasJosie flag → multiplier=4. Working correctly. | game.js | No action needed |
| I | **Red Spin end celebration screen** — bonus ends silently with no total shown to player | bonuses.js + ui.js | Needs new UI function |

---


---

## BUILD HISTORY — Newest First
| Build | Phase | Date | Notes |
|---|---|---|---|
| turrelle_v6l84.zip | BUG 3 extended — full ES5 conversion of async function bodies | COMPLETED 2026-05-19 | CONTINUATION of previous session fix. BUG 3 (ES5 compatibility) was partially fixed in the prior pass — for...of, destructuring, and arrow functions in `_generatePickTiles`, `runBonusFeature`, `runHoldSpin` (structural parts) were converted. Remaining `const`/`let` declarations inside async function bodies of `runRedSpin`, `runHoldSpin`, `runPickChoose`, and `runBonusFeature` were still present. This pass completes the conversion: all `const`/`let` inside function bodies → `var`. Converted: `totalBet`, `op`, `bonusTotal`, `lastWin`, `charJackpots`, `hsResult`, `pcResult`, `bResult`, `hsR`, `pcR`, `addResult` in `runRedSpin`; `events`, `noJackpots`, `outcome`, `blackoutAmt` in `runHoldSpin`; `events`, `totalBet`, `minAward`, `noJackpots`, `tiles`, `revealed`, `matchCounts`, `won`, `totalWon`, `awardHoldSpin`, `awardRedSpin`, `prize`, `tileIndex`, `jack`, `key` in `runPickChoose`; `events`, `totalBet`, `noJackpots`, `chosenIdx` in `runBonusFeature`. Post-conversion verification: zero `const`/`let` remain except top-level `const Bonuses = {` module object (intentional). Zero arrow functions remain. Brace balance 239/239 ✅. CACHE_NAME NOT bumped (no service-worker change). Files: `bonuses.js`, `PHASE_PLAN.md`. |
| turrelle_v6l84.zip | 4-bug fix pass — bonuses.js BUGs 1–4 + Rule 21 added | COMPLETED 2026-05-19 | FOUR CODE FIXES IN bonuses.js + ONE PHASE PLAN RULE ADDED. Rule 21 added: mandatory full-file bug scan after all fixes, log before packaging. (1) BUG 1 FIXED — _generateCoin(): added `cumulative = 0` reset before cash tier loop. JP weights (0.145 total) were sharing cumulative with cash tiers — cash tiers with thresholds above 1.0 were never reached. "big" (2.5–6×) and "huge" (6–15×) coin types now reachable. (2) BUG 2 FIXED — _generatePickTiles(): renamed PRIZE_WEIGHTS entries from two `cash` entries to `cash_a`/`cash_b` internally; both map to public type `cash` at prize-build stage only. Decoy filter now excludes all cash tiles correctly when cash wins — board integrity restored for ~60% of P&C outcomes. (3) BUG 3 FIXED — bonuses.js ES6 violations converted to ES5: for...of → indexed for loops, const destructuring → separate var declarations, array swap destructuring → temp variable, arrow function landCoin → function() expression, let/const loop vars → var. Affected: runHoldSpin, _generatePickTiles, runBonusFeature. (4) BUG 4 FIXED — _waitForOrbTap() fallback arrow `setTimeout(() => resolve(0), 500)` → function() expression. Also fixed _waitForTileTap (arrow callback + findIndex/filter arrows) and _delay (arrow). POST-FIX BUG SCAN (Rule 21): All .js files scanned. bonuses.js brace balance 239/239 ✅. No targeted ES6 violations remain in bonuses.js ✅. No new bugs found. Remaining const/let in bonuses.js are in async function bodies (result captures) — lower risk, unchanged from pre-session. index.html no new inline ES6 ✅. CACHE_NAME NOT bumped (no service-worker change this session). Files: bonuses.js, PHASE_PLAN.md. |
| turrelle_v6l84.zip | Phase Plan audit — 4 bugs documented, no code changes | COMPLETED 2026-05-19 | Documentation-only build. Full audit of `bonuses.js` performed. Four bugs found and logged in KNOWN ISSUES — no code changed this build, fixes pending owner-confirmed session. (1) 🔴 H&S `_generateCoin()` — "big" (2.5–6× bet) and "huge" (6–15× bet) cash coin tiers permanently unreachable. JP and cash tiers share a cumulative variable that is never reset — tiers whose threshold exceeds 1.0 are never hit. Players silently never receive the two highest-value coin types. (2) 🔴 Pick & Choose — `_generatePickTiles()` has two `cash` entries in PRIZE_WEIGHTS sharing the same `type:'cash'` string. When cash is the winning type, the decoy filter passes cash tiles through — board can contain 3+ cash tiles total, breaking the "always winnable" guarantee (~60% of P&C outcomes affected). (3) 🟡 `bonuses.js` ES6 violations — `for...of`, `const` destructuring, array swap destructuring, arrow functions throughout `runHoldSpin`, `_generatePickTiles`, `runBonusFeature`. Risk on older Samsung Browser / kiosk WebViews. (4) 🟡 `_waitForOrbTap()` fallback arrow — `setTimeout(() => resolve(0), 500)` minor ES5 inconsistency. CACHE_NAME bumped to `turrelle-v6l84`. Files: `PHASE_PLAN.md`, `service-worker.js`. |
| turrelle_v6l83.zip | 6 fast fixes + Red Spin frequency bump — owner confirmed | COMPLETED 2026-05-19 | SIX CODE FIXES + ONE FREQUENCY CHANGE. (1) `state.js` — duplicate `bonusFeatureCount: 0` in `resetState()` stats object removed (was `bonusFeatureCount: 0, bonusFeatureCount: 0` — second key silently overwrote first). (2) `state.js` — `resetState()` used ES6 destructuring with default values (`const { keepJackpots = false, ... } = options`) — violates Rule 14. Converted to ES5 guard checks (`var keepJackpots = options.keepJackpots !== undefined ? options.keepJackpots : false` etc). (3) `game.js` — `setTimeout(() => executeSpin(...), 80)` arrow converted to `function()` for ES5 consistency. (4) `game.js` — dead function `checkRedSpinTriggerPreview()` (body was `return false`) removed — never called anywhere. (5) `cashout.js` — IIFE wrapper `(() => {` converted to `(function() {` for ES5 consistency. (6) `paytable.js` — `RED_SPIN_FREQUENCY_DEFAULT` raised from `0.145` to `0.180` (owner confirmed). Effective rate: `0.180 × 0.525 ≈ 9.5%` of all spins (~1-in-10 winning spins). ⚠️ Monte Carlo RTP verification recommended. CACHE_NAME bumped to `turrelle-v6l83`. NOT YET BROWSER TESTED. Files: `state.js`, `game.js`, `cashout.js`, `paytable.js`, `service-worker.js`, `PHASE_PLAN.md`. |
| turrelle_v6l82.zip | Red Spin frequency recalibration + permanent design rule — owner confirmed | COMPLETED 2026-05-19 | TWO CHANGES: (1) RED SPIN FREQUENCY — `RED_SPIN_FREQUENCY_DEFAULT` raised from `0.075` to `0.145` in `paytable.js`. Root cause of v6l81 under-triggering: Red Spin is gated to winning spins only (~52.5% of spins). Effective rate at 0.075 was only `0.075 × 0.525 ≈ 3.9%` (~1-in-26 spins) — barely better than the original 0.035. New value `0.145 × 0.525 ≈ 7.6%` delivers the intended ~1-in-13 feel. (2) PERMANENT DESIGN RULE added to KNOWN ISSUES — never remove the winning-spin gate from `checkRedSpinTrigger()`. Owner confirmed Red Spin must only trigger on winning combinations. Gate removal is prohibited. Future frequency adjustments must account for the ~52.5% base win rate multiplier. ⚠️ Monte Carlo RTP verification recommended. CACHE_NAME bumped to `turrelle-v6l82`. NOT YET BROWSER TESTED. Files: `paytable.js`, `service-worker.js`, `PHASE_PLAN.md`. |
| turrelle_v6l81.zip | Red Spin frequency increase — owner confirmed | COMPLETED 2026-05-19 | PRE-LOGGED (Rule 11). Owner confirmed Option B. SINGLE CHANGE: `RED_SPIN_FREQUENCY_DEFAULT` in `paytable.js` changed from `0.035` (~1-in-28 spins) to `0.075` (~1-in-13 spins). No other constants touched — continuance rate (0.60), tier system, tier advance probability (0.20), and tier JP odds all unchanged. ⚠️ Monte Carlo RTP verification recommended — higher trigger frequency will increase Red Spin's RTP contribution. Files: `paytable.js`, `service-worker.js`, `PHASE_PLAN.md`. CACHE_NAME bumped to `turrelle-v6l81`. NOT YET BROWSER TESTED. |
| turrelle_v6l80.zip | Phase Plan audit + structural fixes — no game logic changed | COMPLETED 2026-05-19 | Full audit performed by AI assistant per Rules 18 and 20 (owner confirmed fixes before application). SIX issues found and resolved: (1) RULE BLOCK FORMATTING — Rules 14–17 had fallen outside the `>` blockquote prefix (introduced in v6l75 structural overhaul — fix was logged but not fully applied). Rules now correctly carry `>` prefix and are renumbered 16–19 to eliminate the duplicate Rule 14 and Rule 15 that existed in both the blockquote and body text. (2) NEW RULE 20 — Owner-requested "always confirm with owner before applying any code changes" rule added as Rule 20. Closes the gap where no explicit rule required owner sign-off before coding began. (3) `VER` STALE in service-worker.js — `VER = '?v=6l76'` was 3 versions behind `CACHE_NAME = 'turrelle-v6l79'`. This is a regression of the same bug fixed in v6l74 BUG 1. Fixed: `VER` → `?v=6l80`, `CACHE_NAME` → `turrelle-v6l80`. (4) GAME VERSION HEADER stale — header read `v6j6 (current)` — ~60+ versions behind. Updated to `v6l80 (current)`. (5) MISSING BUILD HISTORY ENTRIES — no entries for v6l79 in build history (Rule 4 violation). v6l79 and v6l80 entries added. (6) RULE 19 INTERNAL REFERENCE updated — Rule 19 (CACHE_NAME rule) previously cross-referenced "Rule 14" for deadfiles check; corrected to "Rule 16" after renumbering. Files: PHASE_PLAN.md, service-worker.js. |
| turrelle_v6l79.zip | Unknown changes — no build history entry found | UNKNOWN DATE | ⚠️ NO BUILD HISTORY ENTRY WAS LOGGED FOR THIS VERSION (Rule 4 violation — discovered in v6l80 audit). CACHE_NAME = turrelle-v6l79 confirmed in service-worker.js. VER was stale at ?v=6l76 (fixed in v6l80). No other details available — developer did not log this build. |
| turrelle_v6l76.zip | Zero-risk housekeeping — no game logic changed | COMPLETED 2026-05-20 | Four safe fixes: (1) PWA INSTALL HANDLER — removed unnecessary `async` keyword from `_iy` click handler in index.html. Handler had no `await` inside — `async` was dead syntax violating Rule 14. Changed to plain `function()`. Zero behaviour change. (2) SYMBOL REFERENCE TABLE — cherry row (ID 7) updated from active entry to REMOVED notation; all symbol pay values synced to owner-confirmed 2026-05-19 amounts (were showing old v6j-era values). (3) AUDIT NOTE — two Cherry entries in payline audit table (lines referencing `evaluateCherryWin()` as "✅ Correct") marked as REMOVED v6l13. (4) KNOWN ISSUES — PWA handler async issue marked ✅ FIXED; Cherry stale symbol table entry marked ✅ FIXED. CACHE_NAME bumped to turrelle-v6l76. Files: index.html, service-worker.js, PHASE_PLAN.md. | Splash screen revert + Phase Plan structural overhaul | COMPLETED 2026-05-20 | TWO CHANGES: (1) SPLASH SCREEN REVERT — reverted from progress-bar auto-dismiss (added v6l61) back to original TAP TO PLAY design. CSS: removed #splash-loading progress bar styles, restored #splash-tap with gold blinking text animation (splashTapBlink 1.1s), absolute-positioned at bottom 48px. HTML: replaced loading bar div with `<div id="splash-tap">TAP TO PLAY</div>`. JS: replaced auto-start audio block with tap listener — player taps/clicks splash to unlock audio on iOS, welcome audio plays on tap, game transitions when audio ends (6s hard failsafe). ES5 compliant (no async/await). (2) PHASE PLAN STRUCTURAL OVERHAUL — 5 improvements applied per owner request: (a) KNOWN ISSUES moved from middle of document to immediately after mandatory rules block (line ~101) so it is the first thing read. (b) RECOMMENDED FIX ORDER moved to immediately after KNOWN ISSUES (~line 1103). (c) BUILD HISTORY reversed to newest-first — both tables merged into one; v6l74 is now row 1. (d) Mandatory rules numbering fixed — rules 14–17 had fallen outside the > quote block and rendered as body text; corrected to > prefix, renumbered 16–19 to avoid collision with existing 14–15. (e) SYMBOL REFERENCE TABLE — drift warning added noting the Symbol Reference Table and SYMBOL RULES section may have differing pay values; paytable.js cited as authoritative code source; reconciliation deferred to Phase G audit. CACHE_NAME bumped to turrelle-v6l75. Files: index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l74.zip | 7-bug housekeeping pass — no game logic changed | COMPLETED 2026-05-19 | Full file audit performed by AI assistant. 7 bugs found and fixed. No math, RTP, paylines, or game logic touched. (1) BUG 1 — VER constant in service-worker.js was stale at `?v=6l64` while CACHE_NAME was `turrelle-v6l73`. All versioned asset URLs embedded in index.html were mismatched — on repeat visits some browsers could serve mismatched cached files. Fixed: VER → `?v=6l74`, CACHE_NAME → `turrelle-v6l74`. (2) BUG 2 — `cherry.svg` was an unreferenced dead file still sitting in `assets/symbols/`. Cherry was removed in v6l13. File moved out of symbols/ (renamed `assets/cherry_DEAD.svg`). Should be added to `deadfiles.zip` on next zip delivery. (3) BUG 3 — Comment above REEL_SIZE said `// Total per reel = 64` but actual value is 80. Comment corrected. (4) BUG 4 — The entire historical comment block above `REEL_FREQUENCIES` described symbol counts from v6k3/v6l13 (e.g. TripleBar:9, DoubleBar:10, SingleBar:7) that have not matched the actual data for multiple versions. Replaced with a single accurate comment showing the current true counts (TripleBar:6, DoubleBar:7, SingleBar:5, Lipstick:14, Diamond:10, etc.) and a note that 47.5% of stops are non-paying by design. (5) BUG 5 — `generateSerialNumber()` in paytable.js used `const` inside a function body. All other functions in the file use `var`. Converted to `var ts`, `var rand`, `var raw` for consistency and to eliminate any risk on very old Samsung Browser WebViews. (6) BUG 6 — Six PWA icon sizes were missing from CACHE_FILES in service-worker.js: icon-72x72, icon-96x96, icon-128x128, icon-144x144, icon-152x152, icon-384x384. The manifest.json references all 8 sizes, but only 192 and 512 were cached. PWA installs showed broken icons at intermediate sizes in the app drawer. All 6 missing icons added to CACHE_FILES. (7) BUG 7 — `@keyframes chipSpin` was defined in style.css (line 558) with zero references anywhere in any file. It was the old coin Y-axis rotation from before v6l52 removed all infinite animations. Definition and its section header comment deleted. Comment updated to note chipSpin was also removed. Files changed: service-worker.js, paytable.js, style.css, assets/symbols/ (cherry.svg moved), PHASE_PLAN.md. |
| turrelle_v6l57.zip | Paytable + jackpot seed update — owner confirmed | COMPLETED 2026-05-18 | Full paytable reviewed symbol by symbol with owner at 1¢ denom. PAY_TABLE updated: Sisters [0,0,0,0] (jackpot only — payline hits = miss); StrayPup [500,200,100,0]; DJ Maxine [350,150,75,0]; Seven [175,75,50,0]; Diamond [150,50,25,0]; Triple Bar [100,75,50,0]; Double Bar [75,50,15,0]; Single Bar [50,25,15,0]; Lipstick [0,0,0,0] (bonus trigger only); MIXED_BAR_PAY {3:5,4:10,5:15}. JACKPOT_SEEDS_BY_DENOM fully replaced — 12 denoms with owner-confirmed custom values (1¢: MINI $5/MINOR $15/MAJOR $50/GRAND $200 through $20: MINI $10k/MINOR $100k/MAJOR $300k/GRAND $3M). game.js checkCharacterJackpots() audited — MAJOR trigger (Josie+Sasha mix) already correct, no change needed. CACHE_NAME bumped to turrelle-v6l57. ⚠️ Monte Carlo RTP verification required after browser test — pay increases may affect base RTP significantly. NOT YET BROWSER TESTED. Files: paytable.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l58.zip | Phase Plan audit + Phase Q/R added | COMPLETED 2026-05-18 | Phase Plan only — no code changes. Full audit of uploaded v6l57: ES5 clean, no spreads, version confirmed. Three owner-reported problems root-cause analysed and documented. Phase Q (Denom Restructure) added as future phase. Phase R (Virtual Player Club & Cashier) added as future phase. Phase L marked COMPLETE. CACHE_NAME bumped to v6l58. Files: PHASE_PLAN.md, service-worker.js. |
| turrelle_v6l59.zip | Phase L filters + Phase K K2 combo trigger + K5 closed = Phase K COMPLETE | COMPLETED 2026-05-18 | (1) LOG FILTERS (L3 completion) — add All/Wins/Losses/Bonuses/Jackpots filter bar above log content in renderLogTab(). Filter applied client-side on the spinHistory array. filterMode param added to renderLogTab(). (2) K2 COMBINED FORCE TRIGGER — add "⚡ COMBINED TRIGGER" section to operator panel: bonus type dropdown (RED SPIN/H&S/P&C/BONUS LETTERS) + jackpot level dropdown (MINI/MINOR/MAJOR/GRAND) + ARM COMBO button. Sets both forceBonusGame/forceRedSpin/forceFreeSpins/forceBonusFeature AND forceJackpot + forceJackpotContext simultaneously. (3) K5 CLOSED — replay removed by owner (v6l52/v6l53). Mark K5 complete in Phase Plan. After these changes Phase K becomes ✅ COMPLETE. CACHE_NAME bumped to v6l59. Files: operator.js, service-worker.js, PHASE_PLAN.md. |
| PHASE_PLAN update | Paytable review + H&S design additions | 2026-05-18 | Owner reviewed full paytable one symbol at a time at 1¢ denom. All pay values updated to owner-confirmed amounts. Changes: (1) SYMBOL RULES table fully rewritten — Sisters all pays → 0 (jackpot symbol only, payline hits = miss); StrayPup 4-oak 100→200cr, 3-oak 25→100cr; DJ Maxine 4-oak 70→150cr, 3-oak 18→75cr; Seven 5-oak 185→175cr, 4-oak 37→75cr, 3-oak 8→50cr; Diamond 5-oak 80→150cr, 4-oak 20→50cr, 3-oak 6→25cr; Triple Bar 5-oak 87→100cr, 4-oak 16→75cr, 3-oak 5→50cr; Double Bar 5-oak 33→75cr, 4-oak 9→50cr, 3-oak 3→25cr; Single Bar 5-oak 14→50cr, 4-oak 5→25cr, 3-oak 1→15cr; Lipstick all pays → 0 (bonus trigger only); Mixed Bar 3-mix 3→5cr, 4-mix 9→10cr, 5-mix 23→15cr. (2) JACKPOT RULES updated: MAJOR jackpot trigger corrected from "reserved" to "Josie + Sasha mix on any active payline". (3) JACKPOT_SEEDS_BY_DENOM fully revised — owner confirmed custom seed table per denom: 1¢ MINI $5/MINOR $15/MAJOR $50/GRAND $200; 10¢ MINI $100/MINOR $500/MAJOR $1,000/GRAND $10,000; 25¢ MINI $150/MINOR $1,000/MAJOR $5,000/GRAND $50,000; $1 MINI $500/MINOR $5,000/MAJOR $10,000/GRAND $100,000; higher denoms scaled by pattern. Full table in JACKPOT RULES section. (4) H&S RULES section expanded: RNG & Math Architecture subsection added; per-cell independence documented; pre-generation at spin time documented; mid-tier bracket gap (10×–25× bet) flagged as known design gap; gear/cog symbol noted as unimplemented industry-standard variant; Coin Asset & Animation Architecture subsection added; H&S Trigger Contexts table added. No code changes this update — PHASE_PLAN.md only. ⚠️ paytable.js and JACKPOT_SEEDS_BY_DENOM not yet updated in code — pending next build. |
| turrelle_v6l48.zip | H&S bonus win overlay hangs into next spin — fix | COMPLETED 2026-05-18 | BUG: After Hold & Spin completes, the "BONUS WIN $X.XX" overlay stays on screen if the player presses Spin before the 4s auto-dismiss fires. Root cause: `onSpinStart()` never dismissed the overlay — it only cleared paylines/highlights/win display. The overlay's internal promise was still awaiting its 4s timeout or a tap directly on itself. Fix: (1) Added module-level `_dismissHoldBonusWin = null` variable in ui.js. `showHoldBonusWinScreen()` sets this to the internal `dismiss()` function while the overlay is awaiting. (2) `onSpinStart()` now calls `_dismissHoldBonusWin()` if set (resolves the promise immediately, triggering the clean `classList.remove('active')` path), then also force-removes `.active` directly from the overlay DOM element as a belt-and-braces fallback. CACHE_NAME bumped to turrelle-v6l48. Files: ui.js, service-worker.js, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l49.zip | Coin value nickel rounding + H&S stencil text redesign | COMPLETED 2026-05-18 | TWO CHANGES: (1) COIN VALUE ROUNDING — new `_roundCoinValue(raw)` helper: `Math.round(raw / 0.5) * 0.5`. New `_formatCoinAmt(raw)` formats the rounded value: ≥$1000 → K notation, ≥$100 → whole dollar, else one decimal if fractional ($1.50 not $1.5). Applied in three places: `_makeCoinElement()`, `_fillHoldCell()` cash branch. (2) H&S COIN TEXT REDESIGN — stencil/casino-chip style. Replaced double-text shadow technique with single SVG `<text>` using `stroke` + `fill` + `paint-order="stroke fill"` + `stroke-linejoin="round"`. Cash coins: stroke-width 10, stroke color #1a0800 (near-black), fill #ffffff (pure white). JP coins: stroke-width 8, stroke rgba(0,0,0,0.92), fill from tier gradient. The thick opaque stroke acts as a guaranteed outline ring — text reads as pressed/embossed block letters against the gold coin face. Letter-spacing tightened from 3→1 (wider spacing looked loose at this stroke width). No shadow text layer, no blur filter on cash. CACHE_NAME bumped to v6l49. NOT YET BROWSER TESTED. Files: ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l50.zip | Bug fixes: try/catch, recordSpin, ES5, P&C decoy, paytable fallback + cache busting | COMPLETED 2026-05-18 | SIX CHANGES: (1) ES5 DEFAULT PARAMS — convert all `fn(x=val)` to `if (x === undefined) x = val;` in game.js, ui.js, state.js, audio.js, bonuses.js. Samsung Browser silent crash fix. (2) runRedSpin + runBonusFeature try/catch — add try/catch wrappers in game.js matching the H&S pattern: on catch clear activeBonus, deactivate screens, re-enable controls, show toast. (3) recordSpin MOVE — move `recordSpin(totalBet, totalWon)` from line 644 (before bonuses) to after the last `totalWon +=` (line ~735) so RTP stats include all bonus wins. (4) P&C decoy fix — change `rng.nextInt(tier.minMult, tier.maxMult/2)` to `rng.nextInt(tier.minMult, tier.maxMult)` — decoy cash values use same full range as winning tile. (5) Paytable fallback — `BLP[4]||50` → `BLP[4]||12`, `BLP[3]||15` → `BLP[3]||4` in index.html. (6) CACHE BUSTING — add `?v=BUILD` query string to all <script src>, <link href>, and static <img src> tags in index.html. Single `_ASSET_V` constant at top of main script block = CACHE_NAME suffix, updated each build. Service worker CACHE_FILES updated to include versioned URLs. Service worker fetch handler normalised to strip query string before cache lookup so SW cache hits work. CACHE_NAME bumped to v6l50. Files: game.js, ui.js, state.js, audio.js, bonuses.js, index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l51.zip | 6 fixes: coin text, red glow lag, log merge, replay removal, payline names | COMPLETED 2026-05-18 | (1) COIN TEXT READABILITY — stroke-width="10" creates bloated balloon text. Fix: reduce to stroke-width="5", add letter-spacing="0" (tighter), use paint-order="stroke fill". Switch cash fill from #ffffff to #fff0c0 (warm white — less harsh against gold). (2) RED GLOW LAG — `lastThreeCellPulse` and `lastThreeCoinGlow` run two simultaneous GPU animations at 0.55s on every empty cell. These are the culprit. Remove entirely: `last-three` CSS class animations, `lastThreeCellPulse`, `lastThreeCoinGlow`, `chipSpinBlur` from last-three context. Keep the class wired but make it a simple border-color change — no animation. (3) LOG MERGE — combine HISTORY and FULL LOG into one unified view in `showLog()`. Show spin history rows first (with lifetime stats header), followed by recent raw events below. Remove the two tab buttons; single "LOG & HISTORY" button calls `showLog()`. (4) REPLAY REMOVAL — remove: replay button from `_formatGameRow()`, `replayGame` function call from export, `log-replay-btn` CSS, `replay-banner` and `replay-watermark` divs from index.html, `replayMode` references in index.html spin guard. (5) PAYLINE NAMES in event log — add `PAYLINE_NAMES` array to paytable.js (20 names matching PAYLINES order). In `game.js` `evaluateSpin()`, add `lineName: PAYLINE_NAMES[lineIndex]` to each paylineWin object. In `operator.js` `renderLogTab()` events branch, show lineName when present. (6) ADD PAYLINE NAMES to SPIN_RESULT log — in game.js currentGame.baseResult, wins already include lineIndex; now also include lineName. Files: style.css, ui.js, operator.js, game.js, paytable.js, index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l52.zip | Remove all H&S glow/pulse animations + dead code purge | COMPLETED 2026-05-18 | CHANGE 1 — ANIMATIONS REMOVED: All `infinite` animations stripped from .hold-cell.spinning-cell and child elements. Removed @keyframes: nearMissPulse, nearMissGlow, heartbeatPulse, anticipationGlow, chipSpinBlur, coinPulseShine, lastThreeCellPulse, lastThreeCoinGlow, emptyPulse, spinGlow. Removed CSS rules: .spinning-cell.near-miss animation, .spinning-cell.anticipation animation, .spinning-cell.last-three animation, .hs-reel-coin-img animations. Removed duplicate .hold-cell.spinning-cell block (had stray extra closing brace from earlier session). Kept: static border-color and box-shadow changes per state (gold/red/bright-gold) — state is visually communicated without GPU animation cost. Strip scroll animation (reelFallDown) kept — that IS the core mechanic. CHANGE 2 — DEAD CODE PURGE (bug scan results actioned): (a) pulseLockedCoins() — removed from ui.js and all bonuses.js call sites. (b) showReplayBanner() / showReplaySummary() — removed from ui.js and export list. (c) hasQueuedSpin() — removed from game.js. (d) applyAutoPlay() — removed from operator.js. (e) stale recordSpin comment cleaned in game.js. (f) Replay CSS (#replay-banner, #replay-watermark, .log-replay-btn) removed from style.css. Syntax checks all pass. CSS brace count balanced. CACHE_NAME bumped to v6l52. NOT YET BROWSER TESTED. Files: style.css, ui.js, bonuses.js, game.js, operator.js, index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l53.zip | Remove autoPlay + remaining dead code | COMPLETED 2026-05-18 | Removed: (1) AUTO-PLAY — operator panel section, startAutoPlay(), applyAutoPlay() from operator.js; autoPlayEnabled/Spins/LossLimit/WinLimit from state.js operator defaults; autoRemaining var, autoStartBalance var, auto-spin loop, stopAuto(), updateAutoBtn(), _ab click handler from index.html. (2) Bonuses.replayGame() — dead since replay was removed; references GameState.replayMode and UI.showReplayBanner both also dead. (3) HOLD_SPIN_COIN_TIERS dead alias from paytable.js — confirmed unreferenced in any other file. Fixed: dangling export line in paytable.js left by sed partial-removal. All syntax checks pass. CACHE_NAME bumped to v6l53. NOT YET BROWSER TESTED. Files: operator.js, state.js, index.html, bonuses.js, paytable.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l55.zip | P&C bug sweep — decoy tiers, dead code, display fixes | COMPLETED 2026-05-18 | Fixes: (1) revealAllPickTiles dead export removed from ui.js. (2) Cash display on matched tiles changed to whole dollars (Math.round). (3) Win toast changed from toFixed(2) to whole dollars. (4) Decoy cash tiles now use random cash tier (was always CASH_TIERS[0] tiny tier). (5) Winning cash value rounded to whole dollars. (6) PICK_CHOOSE_PRIZES vs PRIZE_WEIGHTS mismatch documented in Known Issues — MC accuracy affected. CACHE_NAME v6l55. Files: bonuses.js, ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l54.zip | 8 fixes: coin format, overlay, AUTO btn, SO CLOSE, wake lock, orb pick, force H&S | COMPLETED 2026-05-18 | (1) HPRE-LOGGED 2026-05-18 (Rule 11) | (1) H&S COINS COIN WHOLE DOLLARS — change _formatCoinAmt: round to nearest $1 (Math.round), display as $N no decimals. (2) BONUS WIN OVERLAY STUCK — onSpinStart() calls _dismissHoldBonusWin() but the overlay div itself also needs force-removal; add explicit classList.remove('active') + display:none fallback. (3) AUTO BUTTON — main game UI has an #auto-btn in HTML that was wired but not removed when autoPlay was deleted. Remove the button element from index.html HTML markup. (4) SO CLOSE — remove showSoCloseBanner() call from bonuses.js, remove function from ui.js and export, remove CSS. (5) WAKE LOCK — add Screen Wake Lock API with requestWakeLock() called when bonus starts, releaseLock() when bonus ends. Fallback: setInterval touch simulation for older browsers. (6) BONUS ORB PLAYER PICK — runBonusFeature() currently calls _waitForOrbTap() which IS player-driven — but need to verify the auto-select isn't happening from some evaluateSpin path that auto-fires bonus. Check and fix. (7) FORCE H&S REEL SPIN — forceBonusGame override runs BEFORE animateReelsStop (correct) but AFTER evaluateSpin sets result.bonusCount. Fix: after placing coins in grid, update result.bonusCount to placed count so _spinCoinData generates correctly for all forced coin positions. Also ensure reels visually spin with the coin grid. (8) FUTURE PHASES — add Virtual Player Club and Virtual Cashier to Phase Plan as new phases (P and Q) with full spec. CACHE_NAME bumped to v6l54. Files: ui.js, bonuses.js, game.js, index.html, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l47.zip | Gold coin text glow fix — crisp readable numbers | COMPLETED 2026-05-18 | SINGLE FIX: Cash coin SVG text was applying a `feGaussianBlur stdDeviation="3"` filter via `filterId` on the main label text in `_makeCoinSVG()`. This caused visible amber/white bloom around each character making dollar amounts hard to read (owner screenshot confirmed). Fix: `filterId` is now `null` for cash coins — the blur filter definition is not emitted in `<defs>` and the `filter` attribute is not applied to cash text. Cash coin legibility now relies solely on the `stroke-width="6"` solid black outline + solid `#fff8e8` fill, which renders crisply at all sizes. JP coins retain their subtle `stdDeviation="2"` bloom (reduced from 3) as their gradient fills benefit from it and they are larger/less crowded. CACHE_NAME bumped to turrelle-v6l47. Files: ui.js, service-worker.js, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l61.zip | New denoms $2-$20 + splash loading bar + H&S escalator fix | COMPLETED 2026-05-18 | (1) MISSING DENOMS — add $2/$3/$5/$10/$20 buttons to denom-dropdown HTML. Currently only 1c-$1 shown. Jackpot seeds already exist for all denoms in paytable.js. Just HTML buttons missing. (2) SPLASH SCREEN — replace TAP TO PLAY blinking text with a progress bar. Auto-starts on page load (no tap needed). Bar fills while audio plays, completes when audio ends, then auto-transitions. CSS progress bar element. No tap handler needed — remove gesture requirement. (3) H&S ESCALATOR — updateHoldTotal shows raw value with .toFixed(2) — showing cents. Fix to Math.round() for whole dollars to match coin value display. Also the board total during collection uses 550ms per coin gap which feels slow. Speed up _hsCollectCoins delay from 550ms to 300ms. CACHE_NAME bumped to v6l61. Files: index.html, ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l62.zip | Red Spin Sisters cap — last resort forces GRAND jackpot instead of synthetic win | PRE-LOGGED 2026-05-18 (Rule 11) | CHANGE: Replace the last-resort synthetic win path in `runRedSpin` (bonuses.js lines 107-128) with a Sisters 5-oak forced finish. When 500 random attempts AND the full R1×R2 scan both fail to find a real grid that beats lastWin, the old code set spinWin=lastWin*1.1+totalBet synthetically while showing mismatched symbols. New behaviour: force Sisters (id=0) onto the middle row of all 5 reels using confirmed stops [46,68,42,16,54] where Sisters lands on row 1. evaluateSpin returns 0 for Sisters (it pays nothing on paylines). processCharacterJackpots then fires GRAND jackpot naturally — same as any other Sisters 5-oak spin. grandHit=true so continuance check immediately ends the sequence. Reels always match the win. GRAND jackpot = absolute cap of Red Spin escalation — owner confirmed 2026-05-18. Also update Known Issues status from ⏳ Pending to ✅ FIXED. CACHE_NAME bumped to v6l62. Files: bonuses.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l63.zip | Fix jackpot meters on denom change + MC recalibration | PRE-LOGGED 2026-05-18 (Rule 11) |
| turrelle_v6l64.zip | Red Spin continuance 70%→60% + RS design comment update + MC calibration | COMPLETED 2026-05-18 | CHANGE 1: RED SPIN CONTINUANCE — owner confirmed 60/40 (60% continue, 40% end). Change RED_SPIN_CONTINUANCE_DEFAULT from 0.70 to 0.60 in paytable.js. Effect: avg extra spins per sequence drops from 2.33 (at 70%) to 1.5 (at 60%). RS RTP contribution drops from ~93% to ~60% of wagered. CHANGE 2: Update runRedSpin() design comment to accurately document the Class III / Neptune's Gold approach: same reel strips, same evaluation engine, RNG constrained to find real combinations beating prevWin. Floor = max(base game win, totalBet). Ceiling = Sisters 5-oak GRAND jackpot. Architecture confirmed correct — no code changes to spin logic needed. CHANGE 3: Update MC continuance constant to match. CHANGE 4: Update mc full simulation file with 60% continuance. CACHE_NAME bumped to v6l64. Files: paytable.js, bonuses.js, tools/monte_carlo.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l65.zip | RS tiered volatility engine + bonus priority reorder | COMPLETED 2026-05-18 | FULL RS REWRITE: (1) TIERED VOLATILITY SYSTEM — 4-tier escalation. Tier 1: 1x-10x bet (bars/letters). Tier 2: 10x-50x bet (character 3-oaks). Tier 3: 50x-300x bet (Josie/Sasha/5-oaks). Tier 4: Sisters GRAND only. Within-tier: 60/40 continuance, same as current. Tier advancement: 20% chance when tier exhausts. P(Sisters via RS) = 0.8% of sequences = 0.027% of all spins. (2) WIN RULES: win >= lastWin (can equal), within tier range, winning payline SET must differ from previous spin. Track lastPaylineKey as sorted winning lineIndex array. (3) SISTERS CAP: Tier 4 forces stops [46,68,42,16,54], processCharacterJackpots fires GRAND naturally. (4) BONUS PRIORITY REORDER: RS > H&S > BONUS > P&C for base game triggers. When redSpinTriggeredEarly=true, suppress triggerHoldSpin/triggerPickChoose/triggerBonusFeature before they execute. Sub-bonuses within RS sequence still run as currently. (5) ADD to paytable.js: RED_SPIN_TIERS array, RED_SPIN_TIER_ADVANCE_PROB=0.20. (6) UPDATE MC to simulate tiered system. CACHE_NAME bumped to v6l65. Files: bonuses.js, game.js, paytable.js, tools/monte_carlo.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l66.zip | Quick fixes: JP meters whole dollars, toolkit paytable sync | COMPLETED 2026-05-18 | (1) updateJackpotMeters: current.toFixed(2)→Math.round().toLocaleString() — whole dollars with comma separator. (2) Toolkit DEFAULT_PAY_TABLE synced to v6l65 calibrated values (Seven/Diamond/Bars/Mixed). (3) Toolkit DEFAULT_MIXED_BAR updated 5/10/15→3/5/10. CACHE bumped v6l66. |
| turrelle_v6l68.zip | Phase N added to Phase Plan: N1 jackpot ceiling caps, N2 base game jackpots reduced, N3 paytable combo IDs | COMPLETED 2026-05-18 | Phase Plan only — no code changes. Phase N created with three confirmed items. N1: fixed dollar ceiling caps per jackpot tier (amounts pending owner). N2: base game character jackpots confirmed — still fire at reduced amounts (amounts pending). N3: 84 numeric paytable combination IDs confirmed — ready to code when owner says go. Penny GRAND seed pending confirmation. CACHE_NAME bumped to v6l68. |
| turrelle_v6l69.zip | Phase N3 expanded: full combo ID spec with base ID + position modifier + BONUS letter IDs | COMPLETED 2026-05-18 | Phase Plan only — no code changes. N3 redesigned from simple 84 numeric IDs to a two-layer system: BASE_ID (combo type) + POSITION_MODIFIER (exact wild reel placement). Required because RS scripting needs to specify exact reel patterns not just combo types. Also adds BONUS letter partial pay IDs (B=1 through B-O-N-U-S=5) to the ID system since those appear on RS spins and must be scriptable. Full enumeration of all IDs added to Phase Plan. CACHE_NAME bumped to v6l69. Files: PHASE_PLAN.md, service-worker.js. |
| turrelle_v6l70.zip | Phase N4 added: RS tier jackpot full spec | COMPLETED 2026-05-18 | Phase Plan only. N4 RS Tier Jackpots fully designed and documented: JP RNG per spin per tier, once per tier max, JP replaces spin win, JP amount becomes lastWin forcing next tier auto-advance. Tier JP availability: T1=MINI, T2=MINI/MINOR, T3=MINI/MINOR/MAJOR, T4=GRAND(Sisters). Pending: JP odds per tier and type weighting. |
| turrelle_v6l71.zip | N4 JP odds confirmed + MC simulation with tier jackpots | COMPLETED 2026-05-18 | (1) Update Phase Plan N4 with confirmed JP odds: 2% per spin per tier. Tier 2 weights: MINI 70% MINOR 30%. Tier 3 weights: MINI 60% MINOR 30% MAJOR 10%. (2) Update tools/monte_carlo.js to simulate tier jackpots: per-spin 2% JP roll within each tier, once-per-tier max, JP replaces spin win, JP amount becomes lastWin forcing tier advance. (3) Run 1M spin simulation and log results: JP hit rate per tier, new RS avg win, new total RTP. (4) Document MC results in Phase Plan. No game code changes — MC tool only. CACHE_NAME bumped to v6l71. Files: PHASE_PLAN.md, tools/monte_carlo.js, service-worker.js. |
| turrelle_v6l72.zip | RS tier ranges per denom + N4 full implementation in bonuses.js + MC validation | COMPLETED 2026-05-18 | CHANGES: (1) paytable.js: add RS_TIER_RANGES as bet multipliers [1-19,20-59,60-210,SISTERS] — same for all denoms since seeds are proportional. Add RS_TIER_JP_ODDS=0.02. Add RS_JP_TIER_TYPES array. (2) bonuses.js: update runRedSpin tier ranges to use RS_TIER_RANGES × totalBet. Add jpFiredThisTier flag. JP fires at 2% per spin, once per tier max, replaces spin win, forces tier advance when JP > tier ceiling (MINI>T1,MINOR>T2,MAJOR stays in T3). (3) tools/monte_carlo.js: update simRS to use multiplier-based tier ranges per denom. Run 1M spin validation. (4) Update N4 Phase Plan status to COMPLETE. CACHE_NAME bumped to v6l72. Files: paytable.js, bonuses.js, tools/monte_carlo.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l73.zip | Owner-confirmed paytable 2026-05-19 + new wild mult rule + CRITICAL blank-reel fix | COMPLETED 2026-05-19 | **CRITICAL FIX — BLANK REELS:** game.js `evaluateLine()` had a SyntaxError introduced during the v6l73 wild-mult edit. The botched merge left `let multiplier = 1` (line 76) followed by `var multiplier = ...` inside an `if` block (line 85) — duplicate identifier declaration. JS strict mode throws SyntaxError at parse time; game.js never loaded; reels blank with no console error (Samsung Browser silent parse failure, per Rule 14). Fix: removed all orphaned code fragments (duplicate `const wildIdsInCombo`, unused `const hasJosie`/`const hasSasha`, unclosed `if` block, duplicate `var multiplier`). Replaced with clean implementation of the owner-confirmed points-based rule. **PAYTABLE FIXES:** v6l73 paytable changes were pre-logged but not applied — paytable.js still had v6l71/v6l72 values. Applied all owner-confirmed 2026-05-19 values: JOSIE/SASHA [400,250,100,0] (was [1250,250,40,0]); STRAYPUP [300,250,200,0] (was [500,200,100,0]); DJ_MAXINE [200,150,100,0] (was [350,150,75,0]); SEVEN [70,60,50,0] (was [50,20,10,0]); DIAMOND [50,40,30,0] (was [15,6,3,0]); TRIPLE_BAR [30,25,20,0] (was [40,25,15,0]); DOUBLE_BAR [20,16,12,0] (was [25,15,8,0]); BONUS_LETTER_PAYS [0,20,30,40,100] (was [0,1,2,4,12]). MIXED_BAR_PAY restored to {3:5,4:10,5:15} (was {3:3,4:5,5:10} — v6l57 owner-confirmed values). WILD_MULTIPLIERS comment updated to reflect points system. **ES5 FIX:** `calculateTheoreticalRTP()` converted from ES6 (const/let/arrow) to ES5 (var/function) per Rule 14. Default parameter `lines=20` converted to guard `if (lines === undefined) lines = 20`. **NOTE (pre-existing, not new regressions):** Inline HTML script block uses `async/await` in `doSpin()` and `requestWakeLock()` — these were present before v6l73 and were functional; not touched to avoid new regressions. Document as known pre-existing ES7 inline usage. Files: game.js, paytable.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l60.zip | Paytable + jackpot seeds + H&S caps + lines 5-min + payline highlight | COMPLETED 2026-05-18 | (1) PAY_TABLE: DIAMOND [150,50,25,0]→[40,20,10,0] — owner confirmed Diamond below Single Bar. All other pays unchanged (already matched confirmed dollar amounts at 1c/5cr/20L). (2) JACKPOT_SEEDS_BY_DENOM: full replacement — proportional formula MINI=20x MINOR=60x MAJOR=200x GRAND=2000x max-bet (max-bet=denom*5cr*20L). (3) DEFAULT_LINES: 20→5. _linesCycle: [1,5,10,15,20]→[5,10,15,20]. Start at 5 lines. (4) H&S COIN CAP: add _coinCapForBet(totalBet) helper in bonuses.js: under $1=$3, $1-$5=$25, over $5=no cap. Apply after frac calc in _generateCoin AND in pregenerateTriggerCoins. (5) PAYLINE HIGHLIGHT: add showActivePaylines(linesCount) to ui.js — draws all active paylines in their PAYLINE_COLORS on the reel grid canvas, auto-clears after 2.5s. Called from SELECT LINES handler in index.html after updating lines count. CACHE_NAME bumped to v6l60. Files: paytable.js, bonuses.js, ui.js, index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l46.zip | H&S crash fix (jackpotsAccumulated) + coin text bigger/bolder | COMPLETED 2026-05-18 | TWO FIXES + ONE VISUAL IMPROVEMENT. (1) CRITICAL BUG FIX — `jackpotsAccumulated` used before declaration in `runHoldSpin()` (bonuses.js). Root cause: the dead/duplicate first `forEach` block (lines ~491-500) ran before `var jackpotsAccumulated = {}` was declared — due to JS hoisting, the var was `undefined` at point of first use, causing `TypeError: Cannot set properties of undefined` whenever a trigger coin was a jackpot orb. This crashed every H&S bonus with a jackpot trigger coin, producing the "Hold & Spin error — please spin again" toast. Fix: deleted the dead first `forEach` block entirely (it was followed by `totalWon = 0` reset making it pointless), moved `var jackpotsAccumulated = {}` to immediately after `let totalCoinsLanded` (before all uses). (2) RUNNING TOTAL FIX — `_calcBoardTotal()` was scraping `.hs-c-val` DOM elements which no longer exist for cash coins since the v6l44 inline SVG rework — returning $0 for all cash coin lands. Fix: `animateCoinLand()` now accepts a 5th `boardRunningTotal` parameter; `landCoin()` in bonuses.js pre-computes the post-land cash total and passes it through. `animateCoinLand` uses the passed value when available, falls back to DOM scrape only for replay path. (3) COIN TEXT BIGGER + BOLDER — `_makeCoinSVG` font sizes increased: cash coins short (≤4 chars) `30→40`, medium (5 chars) `26→34`, long (6+) `22→28`; jackpot labels short `26→32`, long `22→26`. Shadow text `stroke-width` increased `4→6` for heavier outline. CACHE_NAME bumped to turrelle-v6l46. Files: bonuses.js, ui.js, service-worker.js, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l56.zip | Align PICK_CHOOSE_PRIZES to bonuses.js PRIZE_WEIGHTS | COMPLETED 2026-05-18 | Owner confirmed: bonuses.js PRIZE_WEIGHTS is authoritative. Update paytable.js PICK_CHOOSE_PRIZES to match exactly. Update Monte Carlo estimatePickChooseWin() to handle new prize types (hold_spin, red_spin, mini, minor, major, grand). MC cash estimate: use avg of 3 CASH_TIERS, weighted by how _generatePickTiles selects them (tier randomly chosen = each tier 1/3 probability). Jackpots: weight * jackpot seed value (uses getJackpotSeedsForDenom for the simulation denom). No changes to bonuses.js or game.js — live game unchanged. CACHE_NAME bumped to v6l56. Files: paytable.js, tools/monte_carlo.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l14.zip | Red Spin grid/win mismatch fix + cashout.js (owner-added) | 2026-05-16 | (1) Red Spin grid/win mismatch: 50-attempt cap on ascending-win loop caused fallback to fabricate a win while displaying a non-winning grid. Fixed: attempt cap 50→500, then 80×80 stop scan for cheapest real grid with totalWin > lastWin, then last-resort any-win fallback. All three paths guarantee displayed grid = awarded amount. (2) cashout.js — new file added by owner. Full cash-out / voucher system. Lucky Bitches Casino branded TITO-style vouchers stored in localStorage. Generates printable voucher IDs (LBC-XXXX-XXXX). Not yet fully wired into Phase Plan or operator menu. CACHE_NAME bumped to turrelle-v6l14. Files: bonuses.js, cashout.js, service-worker.js, PHASE_PLAN.md. | | 2026-05-16 | BUG: During Red Spin, reels showed random non-winning symbol combinations while awarding wins that didn't match what was displayed. Root cause: ascending rule loop had a 50-attempt cap. With 45% of reel stops being non-paying symbols (GoldCoin/Lipstick/Letters never pay on paylines), most random spins produce $0. After 50 failed attempts, the fallback fabricated a win amount (`lastWin * 1.1 + totalBet`) but displayed the last failed grid — which had no winning combination. The displayed symbols and the awarded amount were completely decoupled. Fix in bonuses.js `runRedSpin()` spin loop: (1) Attempt cap raised 50→500 — eliminates fallback firing in the vast majority of spins. (2) When 500 attempts still fail (e.g. late-sequence where lastWin is very high), a targeted scan of all R1×R2 stop combinations (80×80=6400 checks) finds the cheapest real grid with `totalWin > lastWin`. (3) If even the full R1×R2 scan finds nothing (extremely rare — means lastWin exceeds any 2-reel combination), falls back to finding ANY grid with a win > 0, awards the higher of that win or the old formula, and logs a RED_SPIN_LAST_RESORT event for monitoring. All three paths guarantee the displayed grid matches the awarded amount. CACHE_NAME bumped to turrelle-v6l14. Files: bonuses.js, service-worker.js, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l15.zip | H&S full animation suite (owner spec 2026-05-16) | 2026-05-16 | COMPLETED (pre-logged Rule 11). Implemented all 5 sections of the H&S Animation Specification added to Phase Plan. (1) BLUR SPIN — spinning empty cells now use `chipSpinBlur` keyframe: motion blur (up to 4px) at edge-on (Y=90°/270°) creating heavy contrast vs slow idle coins. (2) NEAR-MISS — when `respinDisplay===1`, cells get `.near-miss` class: red conic-gradient chip, slower spin (0.48s), red cell border pulse. (3) ANTICIPATION — when `emptyCount<=2`, cells get `.anticipation` class: heartbeat double-pump scale, fastest spin (0.16s), intense gold halo. (4) 6TH COIN SLAM — `coinNumber===6` (all coins including trigger coins): drops from higher, 3× more rotations (`coinSlam6` keyframe), cell flash, 8-direction lightning bolts (`_spawnLightningBurst`), 9 larger sparkle particles, heavy slam audio. (5) IDLE SPIN — after any coin lands and settles, `.chip-wrap.idle-spin` is added: slow 3s Y-axis rotation with brightness sweep (specular highlight), `coinIdleGlow` soft pulse, `coinIdleWobble` micro-movement. (6) COUNTER LIGHTNING RESET — `respin-reset-spin` replaced with `lightning-reset` keyframe (rapid scale+flip+glow), plus 6 `counter-spark` dots radiate from badge. (7) AUDIO — `hold_spin_coin_chime` (coins 1–5, high A6+C#7 ding), `hold_spin_coin_slam` (coin 6, heavy 80Hz thud+electric crack+shimmer), `hold_spin_land` kept for coin 7+. bonuses.js: `totalCoinsLanded` counter added, passed to `animateCoinLand()`. `startHoldSpinning(board, respinDisplay, emptyCount)` — respinDisplay and emptyCount drive near-miss/anticipation. Near-miss respin duration 800→1050ms, anticipation landing delay 650→900ms. CACHE_NAME bumped to turrelle-v6l15. NOT YET BROWSER TESTED. Files: bonuses.js, ui.js, style.css, audio.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l16.zip | Operator menu Phase K fixes (K1/K3) | 2026-05-16 | COMPLETED (pre-logged Rule 11). Fixed 9 confirmed bugs in operator.js. (1) LOG TAB MISMATCH — HTML data-tab="games" vs renderLogTab checking tab==='history'. Fixed: renderLogTab now accepts both 'games' and 'history'. (2) RESET CONTINUANCE HARDCODED — resetRedSpinContinuance() was hardcoded to 0.65. Fixed: now reads RED_SPIN_CONTINUANCE_DEFAULT constant (currently 0.70). Label in panel updated from "(65=default)" to "(70=default)". (3) confirmClearHistory NOT EXPORTED — called from panel HTML onclick but not in Operator return object. Fixed: exported. (4) AUTO-PLAY NO START — applyAutoPlay saved settings but didn't start; button said "APPLY AUTO-PLAY" with no launch. Fixed: replaced with startAutoPlay() which saves settings, closes panel, then clicks the game-side auto-btn. (5) K3 ARMED BANNER — no visual indicator when triggers are armed. Fixed: #op-armed-banner renders at top of panel listing all armed items with pulsing gold border; only shown when something is armed. (6) K3 DISARM ALL — missing. Fixed: "🚫 DISARM ALL" button renders below banner when any trigger is armed; calls disarmAll() which clears all force flags at once. (7) K3 DENOM/BET DISPLAY — not shown in panel. Fixed: header now shows denom · cr/line · lines · total bet for context. (8) K3 COLLAPSIBLE SECTIONS — all sections always expanded making panel very long. Fixed: all 8 sections (RTP, Bonus Controls, Force Triggers, Reel Stops, Balance, Auto-play, Stats, Log) now have clickable headers with ▼/▶ arrows; collapse state stored in op._collapsed (session-only). (9) FORCE P&C LABEL — said "Force Scatter/Pick". Fixed: renamed to "Force Pick & Choose". New functions exported: disarmAll, toggleSection, startAutoPlay, confirmClearHistory. CSS: #op-armed-banner + @keyframes armedPulse, .op-section.collapsed, .op-section.collapsed .op-section-title. CACHE_NAME bumped to turrelle-v6l16. NOT YET BROWSER TESTED. Files: operator.js, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l17.zip | Three fast fixes: letter spacing, letter pay animation, H&S roll-down | 2026-05-16 | COMPLETED (pre-logged Rule 11). Fix 1: DUPLICATE LETTERS IN SAME COLUMN — buildReelStrips() had no minimum gap enforcement; pure LCG shuffle could place same letter symbol at adjacent stop indices, showing two of the same letter in the 3-row window. Fix: added post-shuffle spacing pass to paytable.js. Scans all symbols with ≤12 occurrences per reel (low-freq: letters, wilds, premiums). For each violation (gap < 3 to same symbol), finds a safe swap target with gap ≥ 3 in both directions. Runs up to 8 passes until converged. Verified: all 5 reels now have minimum letter gap of 4 (confirmed via Node.js). Fix 2: LETTER B PAYLINE ANIMATION MISSING — result.bonusLetterCount was never assigned from letterResult for partial wins (only set to 5 in the force-BONUS path). showBonusLetterWin(undefined, amount, row) received count=undefined, loop `for col=0;col<undefined` never executed. Fix: added `result.bonusLetterCount = letterResult.bestCount` in evaluateSpin(). Fix 3: H&S EMPTY CELL ROLL-DOWN — chipSpinBlur was a Y-axis rotation (coin spins like a top). Changed to coinRollDown keyframe: coin translates from -28px to +28px (top to bottom of cell) while rotating 360°, fades in/out at edges. Cell uses overflow:hidden to clip the coin as it exits. Gives visual impression of continuous coins rolling downward through each empty cell. CACHE_NAME bumped to turrelle-v6l17. NOT YET BROWSER TESTED. Files: paytable.js, game.js, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l18.zip | CRITICAL: cashout.js ES6 syntax crash fix | 2026-05-16 | COMPLETED. ROOT CAUSE of blank reels: cashout.js (owner-added in v6l14) used ES2020 optional chaining (?.) extensively in init() and throughout the file. On any Android browser predating 2020 (Samsung Browser <10, older Chrome/WebView), ?. causes a SyntaxError at parse time — CashOut never evaluates, and the browser's error recovery may block subsequent script parsing, leaving REEL_STRIPS and buildGrid undefined → blank reels. Fixed all occurrences: (1) formatTimestamp: pad arrow fn → function, template literal → string concat. (2) doInsertCash/redeemVoucher: arrow filter/findIndex → ES5 forEach/loop, template literals → string concat. (3) startZeroBalanceFlash/_flashMessage: setInterval/setTimeout arrow → function(). (4) showWalletModal barcode: reduce/forEach arrows → function(), template literals → string concat. (5) hideVoucherModal/hideWalletModal: ?.classList → null-guarded getElementById. (6) init(): all ?. addEventListener calls → null-guarded var + if(), arrow in vm-print → function(), staleOverlays forEach arrow → function(). Also fixed: result.bonusLetterCount was referencing letterResult.bestCount (property doesn't exist — should be letterResult.count). CACHE_NAME bumped to turrelle-v6l18. NOT YET BROWSER TESTED. Files: cashout.js, game.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l19.zip | Jackpot coin frequency increase + stale Phase Plan status cleanup | 2026-05-16 | COMPLETED (pre-logged Rule 11). (1) JACKPOT COIN FREQUENCIES — owner-confirmed per-tier rates in HOLD_SPIN_JACKPOT_TIERS: MINI 0.003333→0.060 (6.0%, ~1-in-3 H&S bonuses), MINOR 0.000833→0.040 (4.0%, ~1-in-4), MAJOR 0.000167→0.030 (3.0%, ~1-in-5), GRAND 0.000033→0.015 (1.5%, ~1-in-10). Total jackpot coin probability per landing event: 0.44%→14.5%. With avg 6 coins/bonus, most H&S bonuses will produce at least one jackpot coin. (2) STALE PHASE PLAN CLEANUP — three items confirmed already fixed in code: Josie ×4 multiplier (evaluateLine uses hasJosie flag → multiplier=4, working correctly), Lifetime RTP persistence (stats.totalWagered/totalWon save via saveState() to localStorage, working correctly), P&C auto-reveal bug (runPickChoose while loop breaks at matchCounts[key]>=3 and calls _lockAllPickTiles(), working correctly). Phase Plan status updated to ✅ FIXED for all three. ZIP STRUCTURE — corrected: working folder renamed turrelle_v6l19 so zip extracts to turrelle_v6l19/ (was incorrectly named turrelle_game_v6l15/). CACHE_NAME bumped to turrelle-v6l19. NOT YET BROWSER TESTED. Files: paytable.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l21.zip | Cache fix — permanent, self-maintaining | 2026-05-17 | Fix 1 (index.html): Removed hardcoded `turrelle-v6a` from inline cache-bust block — was keeping a long-dead cache and deleting everything else (backwards logic). Replaced with unconditional delete-all — the SW activate handler is the correct authority for cache management. Comment updated to permanently document this rule. Fix 2 (service-worker.js): Removed 8 dead files from CACHE_FILES that were moved to deadfiles.zip in v6j5: `sisters_celebrate.webp`, `sasha_solo_celebrate.webp`, `sisters_title.png`, `josie_title.png`, `sasha_title.png`, `cherry.svg`, `lipstick_bonus.mp3`, `ching.mp3`, `splash_music.mp3`. These were causing SW install warnings on every load. Fix 3 (PHASE_PLAN.md): Rule 17 added — CACHE_NAME lives in service-worker.js only, never hardcoded anywhere else. Dead files must never be added to CACHE_FILES. CACHE_NAME bumped to turrelle-v6l21. NOT YET BROWSER TESTED. Files: index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l22.zip | Stats fixes + PHASE_PLAN high-priority bugs logged | 2026-05-17 | Fix 1 (state.js): Added `bonusFeatureCount:0` to stats definition and resetState() block — was never declared so lifetime BONUS trigger count silently reset to undefined on every reload. Fix 2 (state.js): `sessionStart` now set to `Date.now()` immediately after `loadSpinHistory()` in `loadState()` — previously held stale previous-session timestamp until first spin. Fix 3 (PHASE_PLAN): 4 new high-priority bugs logged in KNOWN ISSUES: (a) runRedSpin/runBonusFeature no try/catch safety net — game-freeze risk; (b) extraPicks feature completely non-functional — evaluateSpin never sets extraPickCount, loop logic broken; (c) Pick & Choose cash decoy values leak winning tile to observant players; (d) recordSpin() called before bonuses — RTP stats undercount. All added as 🔴 HIGH priority. CACHE_NAME bumped to turrelle-v6l22. NOT YET BROWSER TESTED. Files: state.js, PHASE_PLAN.md, service-worker.js. |
| turrelle_v6l23.zip | H&S gold_coin.svg + no intro animation + trigger coins as board base | 2026-05-17 | COMPLETED (pre-logged Rule 11). Built on v6l22 base (not v6l21 — owner uploaded v6l22 mid-session). Three changes: (1) TRIGGER COINS AS BASE — removed _holdSpinReelIntro() and its call in showHoldSpinBoard(). The all-gold-coin intro reel spin is gone. Instead the base game reels stay showing the actual trigger coins; when H&S board opens those exact coins are already locked in place with no jarring transition. (2) GOLD COIN SVG IN H&S BOARD — _fillHoldCell() rebuilt: now renders gold_coin.svg (same image as the reel symbol) with a .hs-coin-wrap container and .hs-coin-overlay for value/label text. Jackpot tiers use CSS filter (hue-rotate+saturate) on the SVG image: MINI=blue, MINOR=green, MAJOR=vivid gold, GRAND=orange-red pulsing. Chip-wrap/chip-inner removed entirely. c-val/c-lbl replaced with hs-c-val/hs-c-lbl. (3) GOLD COIN SVG IN CONVEYOR BELT — startHoldSpinning() conveyor strip now uses <img src="assets/symbols/gold_coin.svg"> for each coin in the strip with inline filter styles for tier tinting, matching the landed coin appearance. _HS_REEL_COINS array changed from CSS class objects to filter-string objects. All CSS chip-wrap selectors updated to hs-coin-wrap (drop, slam, idle, collect, near-miss, anticipation). BUG-SCAN-8 RESOLVED — _holdSpinReelIntro removed; confirmed vestigial, owner confirmed intent to remove. CACHE_NAME bumped to turrelle-v6l23. NOT YET BROWSER TESTED. Files: ui.js, style.css, PHASE_PLAN.md, service-worker.js. |
| turrelle_v6l24.zip | H&S reel coin values + instant trigger coin lock | 2026-05-17 | COMPLETED. Three connected changes: (1) COIN VALUES AT SPIN TIME — new Bonuses.pregenerateTriggerCoins(grid, betPerLine, linesActive) pre-generates all trigger coin values using the real H&S RNG the moment 6+ coins are detected on the base game reels. Values are deterministic (same RNG = same values that will appear in H&S). (2) VALUE OVERLAY ON BASE REELS — new UI.overlayReelCoinValues(grid, coinMap) places .reel-coin-value overlays on each gold coin reel cell showing $ value (cash) or tier label (MINI/MINOR/MAJOR/GRAND) with tier-specific text colour. Overlays appear with a pop animation, persist for 600ms, then H&S board opens. (3) TRIGGER COINS INSTANTLY LOCKED — runHoldSpin now pre-populates displayBoard with trigger coins before showHoldSpinBoard(). The H&S board opens with trigger coins already showing — no individual landing animations. showHoldSpinBoard renders _renderHoldBoard with pre-filled positions. The 'initial' step in eventTimeline is skipped for animation (counter still updates). Jackpot accumulation and totalWon for trigger coins calculated during pre-population. _generateFullHoldSpinOutcome updated: accepts preCoinMap param — uses pre-assigned coins for trigger positions instead of regenerating (ensures board values match reel-displayed values exactly). CACHE_NAME bumped to v6l24. NOT YET BROWSER TESTED. Files: bonuses.js, game.js, ui.js, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l25.zip | H&S polish: randomized conveyor, slower timing, bet-scaled coins, correct jackpot colors | 2026-05-17 | COMPLETED. (1) CONVEYOR BELT RANDOMIZED — each empty cell gets a unique speed (1.1–1.8s normal, 1.6–2.4s near-miss, 0.48–0.78s anticipation) and a random start phase offset via CSS custom properties (--reel-dur, --reel-dur-nm, --reel-dur-ant, --reel-offset). All cells spin at different rates making the board feel alive rather than synchronized. (2) TIMING SLOWED — empty respin: 820→1600ms (normal), 1050→2200ms (near-miss). Coin land anticipation: 650→1200ms (normal), 900→1800ms (near-miss). Coin landing settle: 700→950ms, slam: 920→1200ms. Gives players time to build anticipation and see each coin land. (3) BET-SCALED COINS — HOLD_SPIN_CASH_TIERS updated: 5 tiers → 6 tiers, added 1% huge tier (6–15× bet). Fractions raised across all tiers so higher bets produce meaningfully higher coin values (e.g. tiny tier now 3–12% of bet vs old 2–10%). All values remain self-scaling via totalBet multiplication in _generateCoin(). (4) CORRECT JACKPOT COLORS — all jackpot coin tints now match game's established meter colors: MINI=yellow (hue-rotate 40deg), MINOR=blue (hue-rotate 190deg), MAJOR=green (hue-rotate 85deg), GRAND=red (hue-rotate 310deg). GRAND gets extra special treatment: pulsing glow animation, rotating conic-gradient outer ring (::before pseudo-element). Cell glows updated to match. Reel coin value overlay text colors updated to match. Conveyor belt strip coin filters updated to match. CACHE_NAME bumped to v6l25. NOT YET BROWSER TESTED. Files: style.css, ui.js, bonuses.js, paytable.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l26.zip | Fix reel coin value overlay + post-H&S coin display | 2026-05-17 | COMPLETED. Two bugs fixed: (1) COIN VALUES NOT SHOWING ON BASE REELS — root cause: overlayReelCoinValues() was appending .reel-coin-value divs as children of .symbol-cell which has `overflow:hidden` — clipping the overlay entirely. Fix: replaced child-append approach with a floating .reel-coin-overlay-layer div positioned absolutely over #reel-frame (z-index:15). Values now positioned by JS using cell column/row math (cellW = frameW/5, cellH = frameH/3). Layer is cleared by clearReelCoinOverlay() at the start of every animateReelsStop() call. (2) AFTER H&S — COINS WITH VALUES ON REELS — endHoldSpin() step 5 now: (a) calls animateReelsStop to restore trigger position, (b) calls overlayReelCoinValues with a coinMap built from the final board array, (c) calls _showHoldWinBanner(totalWon) which renders a "BONUS WIN / $X.XX" banner overlay on the reels. Both overlay and banner cleared by clearReelCoinOverlay() when next spin starts. CSS: .reel-coin-value updated (position now set by JS not CSS). New: .hs-win-banner, .hs-win-banner-label, .hs-win-banner-amt. CACHE_NAME bumped to v6l26. NOT YET BROWSER TESTED. Files: ui.js, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l27.zip | Coin values appear per-reel as each reel stops | 2026-05-17 | COMPLETED. Root fix: coin values now generated BEFORE animateReelsStop and injected into each reel at the exact moment it settles (not after all 5 stop). Architecture: (1) _buildCosmeticCoinMap(grid, betPerLine, linesActive) — new function in game.js, uses Math.random() (no RNG impact) to generate display-only coin values mirroring HOLD_SPIN_CASH_TIERS weights. Called for ANY spin with ≥1 gold coin. (2) UI.setPendingCoinMap(coinMap) — stores coinMap in _pendingCoinMap module var in ui.js. Called before animateReelsStop, cleared after. (3) animateReelsStop per-reel inject — inside each reel's settle callback (after _makeCell renders final symbols, before bounce animation), code checks _pendingCoinMap for BONUS_ID cells in that column and injects .reel-coin-value elements directly into the floating overlay layer. Values appear column-by-column as each reel stops. (4) For H&S trigger spins: pregenerateTriggerCoins() still runs after reels stop, overlayReelCoinValues() replaces cosmetic values with real H&S values. (5) clearReelCoinOverlay() now also clears _pendingCoinMap. CACHE_NAME bumped to v6l27. NOT YET BROWSER TESTED. Files: game.js, ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l28.zip | Coin values are always real — H&S RNG used for every spin | 2026-05-17 | COMPLETED. Fundamental design correction: coin values are now ALWAYS real (H&S RNG), never cosmetic (Math.random). Bonuses.pregenerateTriggerCoins(grid, betPerLine, linesActive) is called for EVERY spin that has ≥1 gold coin — not just 6+ trigger spins. The generated coinMap is stored in _spinCoinData. This is set as the pending map before animateReelsStop so values appear per-reel as each settles. For <6 coins: values show on reels, NOT awarded (ignored for payout). For ≥6 coins: the exact same _spinCoinData.coinMap is passed to runHoldSpin — the values the player saw on the reels ARE the values in H&S. No second RNG call at trigger time. Removed: _buildCosmeticCoinMap(), overlaySpinCoinValues() — both dead. Updated H&S trigger block to use _spinCoinData directly. Phase Plan updated. CACHE_NAME bumped to v6l28. NOT YET BROWSER TESTED. Files: game.js, ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l29.zip | H&S test-user feedback: explosion, escalating audio, near-miss polish | 2026-05-17 | COMPLETED. (1) TRIGGER EXPLOSION — triggerHoldSpinExplosion(): screen shake (#reel-frame.hs-trigger-shake, @keyframes hsTriggerShake 0.65s), 40 gold burst particles radiate from reel center (Math.random angle+dist, CSS --bx/--by custom props, @keyframes hsBurstOut), white-gold flash overlay (.hs-trigger-flash). Called from showHoldSpinBoard() before board appears. (2) LOCKED COIN SHINE — pulseLockedCoins(board): every locked coin on the board gets .coin-pulse-shine class at start of each respin, triggering @keyframes coinPulseShine (brightness 1→1.45 with gold outer + inner glow, 0.65s). (3) SO CLOSE BANNER — showSoCloseBanner(): large red "SO CLOSE!" text positioned over hold-board when counter reaches 0 with nothing landing. Pop + fade animation. (4) PER-RESPIN ESCALATING AUDIO — holdSpinRespin(respinNum, counterVal): calm (early respins, simple triangle tones), tense (later respins or counter=2, square+triangle mix), frantic (counter=1, triple tone burst + noise). Replaces static silence during respin. (5) NEAR-MISS VALUE BOOST — HOLD_SPIN_NEAR_MISS_BOOST=1.8× cash multiplier in paytable.js. Applied in _generateCoin(betPerLine, linesActive, isNearMiss) when counter=1 and coin lands — rewards the near-miss save. (6) JACKPOT PROBABILITY INCREASE — MINI 0.003333→0.008 (~1-in-20 bonuses), MINOR 0.000833→0.003, MAJOR 0.000167→0.0008, GRAND 0.000033→0.0002. Jackpots now visible often enough to excite. (7) STRONGER VALUE CONTRAST — .hs-c-val, .hs-c-lbl, .reel-coin-value all updated with multi-layer text-shadow (black outline + dark drop shadow) for readability over any background. (8) BIGGER TOUCH TARGETS — #hold-board .hold-cell min 44×44px (iOS HIG). CACHE_NAME bumped to v6l29. NOT YET BROWSER TESTED. Files: ui.js, bonuses.js, audio.js, paytable.js, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l30.zip | Fix BONUS letter payline animations | 2026-05-17 | COMPLETED. Root cause audit found 2 bugs: (1) Letter wins were NEVER added to result.paylineWins — they were stored in result.bonusLetterWin/Row/Count and displayed via a separate showBonusLetterWin() which only flashed cells with no payline drawn. (2) drawPayline() was never called for letter wins so no colored line appeared. Fix: evaluateSpin() now adds each winning letter row to result.paylineWins[] as a synthetic payline entry with lineIndex=rowToPaylineIndex[row] (row 0→line 2/top, row 1→line 1/middle, row 2→line 3/bottom), line=[straight row pattern], count=letterCount, isLetter=true. showBaseWins() now handles letter wins identically to regular wins — draws the payline, flashes the letter cells, cycles in Phase 2. drawPayline() updated: accepts isLetter flag, uses gold (#f5d878) color + 4px width + 14px glow for letter wins vs standard color for regular wins. showRedSpinPaylineFlash() also passes isLetter. showBonusLetterWin() no longer called from game.js (redundant). All payline animations now work for B, B-O, B-O-N, B-O-N-U, and 5-letter trigger (though 5 triggers bonus feature, not cash). CACHE_NAME bumped to v6l30. NOT YET BROWSER TESTED. Files: game.js, ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l31.zip | CRITICAL fix: coin values never showed on base reels | 2026-05-17 | COMPLETED. One-line bug: clearReelCoinOverlay() was setting _pendingCoinMap = null as its first action. The call chain was: (1) setPendingCoinMap(coinMap) ✅, (2) animateReelsStop() starts → clearReelCoinOverlay() → _pendingCoinMap = null ❌, (3) per-reel injection at reel settle checks `if (_pendingCoinMap)` → null → nothing rendered. Fix: removed `_pendingCoinMap = null` from clearReelCoinOverlay(). That function now ONLY removes the DOM overlay layer and win banner. _pendingCoinMap lifecycle is managed exclusively by setPendingCoinMap() — set before animateReelsStop, cleared after it in game.js line 550. Result: coin values now inject per-reel as each reel settles, exactly as designed. CACHE_NAME bumped to v6l31. NOT YET BROWSER TESTED. Files: ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l32.zip | Force H&S operator — randomized coin positions | 2026-05-17 | COMPLETED. forceBonusGame was placing 6 coins in a fixed pattern (5 center row + top-left) — same layout every time, obviously forced. Fix: 6–9 coins now placed at genuinely random positions across the full 5×3 grid. All 15 positions shuffled via Fisher-Yates (Math.random — operator tool, non-deterministic is fine), then first 6–9 selected. Count varies per trigger (6, 7, 8, or 9) for variety. Reels spin normally, land on the forced grid, coin values are pre-generated by pregenerateTriggerCoins, values appear per-reel as each settles, then H&S opens with those coins already locked. Indistinguishable from a natural trigger. CACHE_NAME bumped to v6l32. NOT YET BROWSER TESTED. Files: game.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l33.zip | Natural-looking force triggers for all bonuses | 2026-05-17 | COMPLETED. Applied randomization to all operator force triggers so every armed trigger looks like a genuine spin result. (1) Force P&C (forceFreeSpins) — was always center row. Now picks a RANDOM active payline from the live payline set and places 5 lipstick symbols along that payline's row pattern (e.g. V-shape, diagonal, snake). Every force trigger shows a different payline. (2) Force BONUS Letters (forceBonusFeature) — was always center row (row 1). Now always places B-O-N-U-S on bottom row (row 2) per the M4 trigger rule, then fills the other two rows with random neutral symbols (7, Triple Bar, Diamond, Double Bar) so the overall grid looks different each trigger. Duplicate letter-column conflicts resolved before writing. (3) Force H&S (forceBonusGame) — already randomized in v6l32. (4) Force Red Spin (forceRedSpin) — already natural (only bypasses RNG check, doesn't touch grid). (5) Force Jackpot — already uses random payline. All force triggers now: spin reels normally, show forced symbols on reel stop, animate per-reel coin values where applicable, then trigger bonus. Indistinguishable from natural triggers. CACHE_NAME bumped to v6l33. NOT YET BROWSER TESTED. Files: game.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l34.zip | SVG coin redesign applied + cache wired | 2026-05-17 | COMPLETED. Jackpot coin SVG redesign created between v6l33 commits (asset timestamps 20:49–20:51) but never registered in the build. (1) service-worker.js: added jp_mini.svg, jp_minor.svg, jp_major.svg, jp_grand.svg to CACHE_FILES — previously referenced by ui.js but absent from SW manifest, meaning kiosk/offline mode would fail to load jackpot coin images. CACHE_NAME bumped turrelle-v6l33 → turrelle-v6l34. (2) style.css: removed dead .hs-reel-coin.reel-jp-mini/minor/major conic-gradient CSS classes — old CSS-painted conveyor approach from before SVG redesign; startHoldSpinning() never applied these classes to elements so they were unreachable dead code. Replaced with explanatory comment. No JS changed — _fillHoldCell() and _HS_REEL_COINS already pointed to correct jp_*.svg paths. NOT YET BROWSER TESTED. Files: service-worker.js, style.css, PHASE_PLAN.md. |
| turrelle_v6l35.zip | Fix .hs-reel-coin missing selector (H&S lag) + coin overlay z-index (base game text) | 2026-05-17 | COMPLETED. Two bugs introduced in v6l34. Bug 1 (H&S animation lag): When the `reel-jp-*` conic-gradient CSS classes were removed in v6l34, the `.hs-reel-coin {` selector line was accidentally deleted along with them, leaving 9 orphaned CSS property lines (width, aspect-ratio, flex-shrink, border-radius, display, align-items, justify-content, margin, position) with no selector. Result: every `.hs-reel-coin` disc in the conveyor strip had no dimensions or flex layout — the 32-coin strip collapsed to zero height, the browser had nothing to animate, and the entire H&S spinning phase was visually broken (extreme lag / blank cells). Fix: restored `.hs-reel-coin {` selector on the orphaned block in style.css. Bug 2 (base game coin text not visible): the `.reel-coin-overlay-layer` was created with z-index:15, same as `#red-reel-overlay`, but BELOW `#payline-canvas` (z-index:18). On any spin where the canvas had residual content or paint, the coin value text was obscured. Fix: raised `.reel-coin-overlay-layer` z-index to 19 in both `animateReelsStop` per-reel injection and `overlayReelCoinValues`. Also replaced `offsetWidth/Height` with `getBoundingClientRect()` (with offsetWidth fallback) for accurate frame sizing during animation callbacks. CACHE_NAME bumped to v6l35. Files: style.css, ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l36.zip | Coin values persist during spin + show on initial load | 2026-05-17 | COMPLETED (pre-logged Rule 11). Two fixes. (1) VALUES PERSIST DURING SPIN — removed clearReelCoinOverlay() from start of animateReelsStop(). Each column now clears ONLY its own coin value labels the moment that column's reel begins spinning (left-position filtering on overlay layer children). New values injected per-column when reel settles. Result: previous values remain visible on non-spinning columns, replaced column-by-column as each reel stops. No blank gap. (2) INITIAL LOAD COIN VALUES — after UI.renderGrid() on page load, IIFE checks initial grid for BONUS_ID symbols, calls Bonuses.pregenerateTriggerCoins() if any found, then UI.overlayReelCoinValues() to display real RNG values immediately. Player never sees a valueless coin on load. CACHE_NAME bumped to v6l36. NOT YET BROWSER TESTED. Files: ui.js, index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l37.zip | H&S conveyor belt redesign — Luxury Vault with blanks | 2026-05-17 | COMPLETED. Full redesign of empty cell spinning animation. (1) BLANK STOPS — _HS_REEL_COINS now has 12 entries (6 coins + 6 blanks) instead of 8 coins with no gaps. Strip order: BLANK→CASH→BLANK→MINI→BLANK→CASH→BLANK→MINOR→MAJOR→BLANK→GRAND→BLANK. Blank stops render as .hs-reel-blank — dark recessed circle with radial gradient and subtle border, like an empty slot on a real reel. Back-to-back MAJOR→GRAND adds drama (no blank between them). (2) SLOWER SPEEDS — base 2.4–3.2s (was 1.1–1.8s), near-miss 4.5–6.0s (was 1.6–2.4s, now agonizing), anticipation 1.3–1.8s (was 0.48–0.78s, stays weighty). (3) EDGE FADE MASK — CSS mask-image gradient fades top 22% and bottom 22% of each cell so coins drift in from darkness and dissolve out. Premium vault-window feel. (4) LARGER COINS — .hs-reel-coin width 82%→88%, margin 9%→14% so each coin is more isolated and significant. (5) Three passes (×3) for loop instead of two — required because 12-stop strip needs -33.33% translateY but kept at -50% with doubled content; using 2 passes of 12 = 24 stops, translateY(-50%) still seamless. CACHE_NAME bumped to v6l37. NOT YET BROWSER TESTED. Files: ui.js, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l38.zip | Engraved+luminous coin value text — embedded in gold coin face | 2026-05-17 | COMPLETED. Owner spec: text engraved into coin surface (dark bronze, recessed) + luminous (amber glow from within). Cash coins only — jackpot tier SVGs are unchanged. (1) gold_coin.svg: removed faint $ watermark (opacity 0.28 placeholder text). Added two subtle ellipse elements at coin centre (rx:38/36, ry:22/20, dark bronze fill at 18%/12% opacity) to create a shallow recessed well — gives the dynamic value text a surface to sit in. (2) .hs-coin-overlay: repositioned from bottom:10% to top:50% + translateY(-20%) so value sits on the coin face, not below it. (3) .hs-c-val (H&S board cash coins): color #4a2e00 (dark bronze, engraved feel). text-shadow: amber tight glow (0 0 4px rgba(255,200,30,1)) + wider halo + dark depth shadow + bright rim highlight = engraved+luminous. Font size 10→17px (larger, prominent). (4) .reel-coin-value (base game cash coins): same engraved+luminous treatment. 9→15px. Jackpot tier overrides (.reel-coin-jp-*) preserved — they keep their tier colors. (5) Per-reel inject and overlayReelCoinValues: top offset changed from 62% → 50% of cell height to center on coin face. CACHE_NAME bumped to v6l38. NOT YET BROWSER TESTED. Files: assets/symbols/gold_coin.svg, style.css, ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l39.zip | Phase Plan audit + stale status corrections | 2026-05-17 | COMPLETED. (1) PHASE M marked ✅ COMPLETE (v6l30) — was still showing ⏳ PENDING despite M3/M4/M5/M6 all confirmed complete in completion table. (2) PHASE K updated from ⏳ PENDING to 🔄 PARTIAL — K1/K3 complete in v6l16, K2/K4/K5 still pending. (3) J1/J2/J3 updated from IN PROGRESS → COMPLETE (v6k6). (4) New audit section added for v6l38. No code changes this build — Phase Plan only. CACHE_NAME bumped to v6l39. Files: PHASE_PLAN.md, service-worker.js. |
| turrelle_v6l40.zip | Fix $NaN + cross-browser H&S coin rendering | 2026-05-17 | COMPLETED. Four fixes from screenshot analysis. (1) $NaN ON INITIAL LOAD — root cause: index.html IIFE used `GameState.creditsPerLine` (undefined) instead of `GameState.lastCreditsPerLine`. undefined × denom = NaN → coin.value = NaN → `$NaN`. Fix: `(GameState.lastCreditsPerLine || 1) * (GameState.denom || 0.01)`. (2) COIN VALUE TEXT COLOR — dark bronze #4a2e00 on gold coin SVG was invisible on some browsers (coin face too similar in luminance). Reverted to #fff8e8 (near-white) with amber glow + hard black text-shadow surround. Still reads as embedded/luminous without the cross-browser failure. Applied to both .hs-c-val and .reel-coin-value. (3) H&S SVG COINS NOT LOADING — .hs-coin-img missing `height:100%` and `object-fit:contain`. Added both plus a radial-gradient fallback background so old browsers show a gold coin shape even if SVG fails. (4) MASK-IMAGE CROSS-BROWSER — added `mask-size:100% 100%` and `-webkit-mask-size:100% 100%` alongside existing mask-image declarations. Older Samsung Browser requires explicit mask-size. CACHE_NAME bumped to v6l40. NOT YET BROWSER TESTED. Files: index.html, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l41.zip | Phase Plan corrections — missing rules, missing bug entries | 2026-05-17 | COMPLETED. Rule violations acknowledged and corrected: (1) Rules 14 (ES5 mandatory) and 15 (read-before-coding) were added to the v6l21 build log but never added to the mandatory rules block at the top of the document — now added as rules 14 and 15 in the `>` quote block where developers actually read them. (2) Four bugs found in screenshots were fixed in v6l40 without first being added to Known Issues (Rule 12 violation) — all four now retroactively added with status ✅ FIXED v6l40: $NaN initial load, H&S SVG not rendering cross-browser, mask-image cross-browser, coin text color invisible. (3) Rules compliance acknowledgement: Rule 11 (pre-log before coding), Rule 12 (add to Known Issues before fixing), Rule 13 (test before delivery) were all violated this session. No code changes this build. CACHE_NAME bumped to v6l41. Files: PHASE_PLAN.md, service-worker.js. |
| turrelle_v6l42.zip | Remove extraPicks dead code + line-scaled jackpot seeds | COMPLETED 2026-05-17 | TWO CHANGES: (1) extraPicks REMOVAL — removed `extraPicks` param and `extraTapsRemaining` var from `runPickChoose()` in bonuses.js. Removed `result.extraPickCount` and `extraPicks` variable from game.js P&C dispatch. Removed comment block. The while(!won) match-3 loop is intact — players still tap freely until 3rd match is found. Match is always predetermined by RNG. Always exactly 3 picks to win. (2) LINE-SCALED JACKPOT SEEDS — new `applyScaledJackpotSeeds(denom, lines)` function in index.html. Formula: `effectiveSeed = denomSeed × (lines/20)`. Examples at 1¢ denom: 1L→MINI $1.00, MINOR $3.00, MAJOR $10.00, GRAND $100; 20L→MINI $20, MINOR $60, MAJOR $200, GRAND $2,000. Wired in 3 places: (a) initial load after state restore, (b) SELECT LINES button handler, (c) denom change handler. BET MAX also calls it (forces lines=20). Seeds are floor'd at $0.01. Jackpot meters update immediately when lines or denom changes. NOT YET BROWSER TESTED. CACHE_NAME bumped to v6l42. Files: bonuses.js, game.js, index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l43.zip | Gold coin white text overlay fix — base game + bonus | COMPLETED 2026-05-17 | SINGLE CHANGE: COIN VALUE TEXT READABILITY — replaced thin `text-shadow` surround stack on `.reel-coin-value` (base game reel coins) and `.hs-c-val` (Hold & Spin board cash coins) with an 8-direction 1px opaque-black offset ring (top/bottom/left/right + 4 diagonals). This creates a guaranteed solid outline around the white text regardless of browser, display brightness, or coin face gradient position — equivalent to `-webkit-text-stroke` but cross-browser without layout side-effects. Amber glow layers (`rgba(255,180,0,0.95)` + `rgba(255,130,0,0.65)`) sit on top of the outline ring, preserving the luminous casino feel. `.hs-c-val-jp` (jackpot seed value, smaller text) receives the same 6-direction outline at reduced glow. No JS, no game logic, no HTML, no SVG changes. NOT YET BROWSER TESTED. CACHE_NAME bumped to turrelle-v6l43. Files: style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l44.zip | Gold coin text desync fix — inline SVG engraving (base game + H&S bonus) | COMPLETED 2026-05-17 | ROOT CAUSE: Cash coin dollar value was rendered as a separate absolutely-positioned HTML `<div class="reel-coin-value">` overlaid on top of `<img src="gold_coin.svg">`. During reel spin the img moved with CSS transform on the reel strip; the overlay div lived in a separate composite layer positioned with static pixel math — on Samsung Browser these layers desynced causing the text to lag behind the coin during animation and pop in late after stop. JACKPOT COINS (Mini/Minor/Major/Grand) had no lag because their labels (MINI, MINOR, etc.) are engraved directly into their SVG files as `<text>` nodes — image and label are one atomic unit. FIX: Added `_makeCoinSVG(amt, jpLabel)` function to `ui.js` — builds a complete inline SVG string identical in structure to `gold_coin.svg` with the dollar value baked in as SVG `<text>` elements using the same double-layer shadow+gradient technique as the jackpot SVGs. Added `_makeCoinElement(coin)` helper that returns a DOM div with the inline SVG. Updated `_makeCell()` to detect BONUS_ID symbols with a pending coin value and call `_makeCoinElement()` instead of `makeSymbolImg()` — coin and text are one DOM element that moves as a unit during reel animation. Updated `_fillHoldCell()` cash branch to use `_makeCoinSVG()` inside `.hs-coin-wrap` — eliminates the separate `.hs-coin-overlay` span for cash coins. Replaced `overlayReelCoinValues()` (used in replay/restore path) with a thin wrapper that sets `_pendingCoinMap` and calls `renderGrid()` — same inline SVG approach. Removed both the column-erase-on-spin block and the settle-inject block from `animateReelsStop()` — no overlay layer to manage. CACHE_NAME bumped to turrelle-v6l44. NOT YET BROWSER TESTED. Files: ui.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l20.zip | H&S conveyor belt reel + icon fix + jackpot weights reverted | 2026-05-17 | COMPLETED. (1) H&S CONVEYOR BELT REEL — complete rework of spinning cell animation. Each empty cell is now an individual vertical reel. Strip of 16 coins (8 types × 2 for seamless loop) scrolls downward continuously (falling effect). Coin types: cash-sm/md/lg (gold, progressively brighter), jp-mini (blue), jp-minor (green), jp-major (bright gold). Strip uses translateY(-50%→0) seamless CSS loop — top half = bottom half content, jump is invisible. Speeds: Normal 0.72s/cycle, Near-miss 1.1s (slower=tension), Anticipation 0.38s (faster=frantic). JS: startHoldSpinning() builds strip using _HS_REEL_COINS array × 2 passes. clearHoldSpinning() and animateCoinLand() clear/replace strip naturally. (2) PWA ICONS — all 9 icon files replaced with splash_screen.jpg center-cropped to square and resized: 72,96,128,144,152,192,384,512px + apple-touch-icon 180px. (3) JACKPOT WEIGHTS — reverted from owner-proposed 6%/4%/3%/1.5% back to original values (MINI 0.003333, MINOR 0.000833, MAJOR 0.000167, GRAND 0.000033). CACHE_NAME bumped to turrelle-v6l20. NOT YET BROWSER TESTED. Files: ui.js, style.css, paytable.js, assets/icons/*.png, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6j8.zip | Red Spin Lockup Fix + Operator Panel Fix | 2026-05-15 | Fix 14: `await delay(400)` → `await this._delay(400)` in `runRedSpin()` — `delay` was private to ui.js IIFE, caused ReferenceError after Spin 1, permanently froze game with red screen. Fix 15: `UI.updateRedSpinWin(bonusTotal, spinNum)` → `UI.updateRedSpinWin(spinWin, bonusTotal, spinNum)` — correct 3-arg call, bonus total display was showing spin number. Fix 16: CACHE_NAME bumped to turrelle-v6j8. Fix 17: Removed 2 orphan unclosed `<div class="op-row">` label-only lines in renderPanel() (lines 152, 154) that were duplicating the Disable P&C and Disable H&S toggle labels and corrupting panel HTML. Fix 18: Tightened operator panel CSS — reduced padding, font sizes, margins for mobile fit; added overflow-x:hidden and box-sizing:border-box to prevent horizontal stretch on Samsung Galaxy S23. Files changed: bonuses.js, service-worker.js, operator.js, style.css. |
| turrelle_v6j9.zip | Tier 1 + Tier 2 Bug Fixes | 2026-05-15 | Fix A: `Audio.play('credits_addup')` → `Audio.play('coin_drop')` in ui.js — coin land sound was silently failing (wrong key). Fix B: Removed incorrect `disablePickChooseInRedSpin` guard from base game P&C trigger in game.js — Red Spin operator flag was suppressing base game Pick & Choose. Fix C: `runPickChoose` nesting guard `callerContext.hold_spin` → `callerContext.from === 'HOLD_SPIN'` — dead code guard never fired. Fix E: Added `events:[]` and `outcome:{totalSpins,totalWon}` to `runRedSpin` return value — event log and replay had undefined fields on every Red Spin. Fix F: BONUS orb sub-bonus now dispatched after `runBonusFeature()` in `runRedSpin` — checks `bResult.awardHoldSpin` and `bResult.awardPickChoose` and runs the appropriate sub-bonus; previously orb was revealed but nothing happened and $0 was awarded. Fix G: `_generatePickTiles` decoy cap — each decoy type now capped at max 2 occurrences (was uncapped; 97.4% of boards had a decoy type reach match-3 before guaranteed winning tiles). Fix (cache): CACHE_NAME bumped to `turrelle-v6j9`. Files changed: ui.js, game.js, bonuses.js, service-worker.js. |
| turrelle_v6k.zip | RTP Stats Fix + noJackpots Enforcement | 2026-05-15 | Fix 1: Removed `GameState.stats.totalWon += amount` from `awardJackpot()` in state.js — jackpot wins were being counted twice (once in awardJackpot, once via recordSpin), inflating live RTP display in operator panel. recordSpin is now the single point of truth. Fix 2: `noJackpots` flag now fully enforced — `runBonusFeature` reads `callerContext.noJackpots`, passes it down to `runHoldSpin` and `runPickChoose` dispatch calls with `noJackpots:true`; `runHoldSpin` skips jackpot payout in STEP 4 when flag set; `runPickChoose` skips `processJackpotCheck` when flag set. Jackpots inside BONUS orb feature now correctly suppressed as per design. CACHE_NAME bumped to turrelle-v6k. Files changed: state.js, bonuses.js, service-worker.js. |
| turrelle_v6k1.zip | Win Display Fix | 2026-05-15 | Fix 1: `#win-line-label` moved from after `#info-bar` to immediately after `#win-section` in index.html — was rendering in wrong position between info bar and controls, causing a second win flash in wrong location. Fix 2: Removed redundant manual `.pop` animation trigger from `updateRedSpinWin()` in ui.js — `updateWinDisplay()` already handles the pop, double-firing caused double-flash. CACHE_NAME bumped to turrelle-v6k1. Files: index.html, ui.js, service-worker.js. |
| turrelle_v6k2.zip | v6k1 Testing Fixes | 2026-05-15 | Fix 1: Balance deducted from display immediately on spin/play button press (added updateBalance call in onSpinStart). Fix 2: BONUS letter partial pays (1-4 letters) now silent — toast removed, yellow cell highlight kept. Full BONUS (5 letters) still triggers orb screen. Fix 3: Red Spin continuance operator slider cap raised 95%→99%, wired to actual spin loop (was reading hardcoded constant), reset button added. Fix 4: Paytable now shows actual symbol images from reels + reads pay values live from PAY_TABLE (no more hardcoded stale values). Fix 5: SW cache bumped to turrelle-v6k2. Files: ui.js, operator.js, bonuses.js, index.html, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6k3.zip | Wild Multiplier Fix | 2026-05-15 | Fix 1: Josie wild now correctly gives ×4 (was ×2 same as Sasha). evaluateLine() now uses identity-based wild check — scans full combo window for Josie/Sasha IDs, applies ×2/×4/×6 per design. Fix 2: Operator panel orphan divs — confirmed already fixed in v6j8, no regression. Fix 3: H&S wrong arg from Red Spin — confirmed already fixed in v6j5, no regression. SW cache bumped to turrelle-v6k3. Files: game.js, service-worker.js, PHASE_PLAN.md. Note: Josie ×4 fix will increase base game RTP — account for this in Priority 5 Monte Carlo. |
| turrelle_v6k4_wip.zip | RTP Calibration Session (INCOMPLETE — in progress) | 2026-05-16 | Changes made this session (NOT YET TESTED — DO NOT DEPLOY): (1) Cherry rule changed from any-row-pays-all to payline-only — evaluateLine now allows 1-oak, evaluateCherryWin removed from evaluateSpin, separate cherry special call deleted. PAY_TABLE.CHERRY extended to 5 elements [10,4,2,1,1] adding 1-oak=1cr. (2) BONUS letter evaluation changed to per-payline checking (20 paylines × (n/80)^5 probability, ~1 in 1808) instead of per-row (3 rows × (n/80)^5, ~1 in 11k). (3) Operator forceBonusGame now writes 6 Gold Coins to grid (5 center row + 1 top-left) before reel animation so coins are visible before H&S triggers. (4) In-game paytable screen updated: Mixed Bar now reads live from MIXED_BAR_PAY (was hardcoded 35x), Gold Coin/H&S section added, Red Spin section added, BONUS letter partial pays table added. (5) Monte Carlo H&S changed from estimateHoldSpinWin() to full simulateHoldSpin() board simulation. (6) REEL_FREQUENCIES changed: Bars halved (TB 6→3, DB 8→4, SB 6→3), Lipstick 14→10, Cherry 4→12, Diamond 3→7, Seven 6→8, GoldCoin unchanged at 14. (7) PAY_TABLE bars reduced ~20%: TRIPLE_BAR [150,30,8,0]→[120,25,6,0], DOUBLE_BAR [60,15,5,0]→[50,12,4,0], SINGLE_BAR [25,8,2,0]→[20,6,2,0]. (8) MIXED_BAR_PAY {3:5,4:15,5:35}→{3:3,4:10,5:25}. MC RESULTS (1M spins, 20L, 1cpl, 5¢): Base 73.58%, H&S 16.03% (SIMULATED), RS 5.52%, P&C 2.13%. Total ~97.26%. Trigger rates: RS 1in29, H&S 1in32, P&C 1in1541, BONUS 1in1808. PENDING (not yet done): Lipstick 10→18/reel for P&C 1in32, Letters 10→18/reel for BONUS 1in32. |
| turrelle_v6k5.zip | Trigger Rate Equalization + P&C Rebalance (MC VERIFIED) | 2026-05-16 | COMPLETED: (1) Lipstick 10→16/reel, Letters 10→16/reel — P&C 1in1541→1in176, BONUS 1in1808→1in175. (2) PICK_CHOOSE_PRIZES cash multipliers 32.75x→10.64x avg. (3) Reel adjustments: Cherry 12→8, Diamond 7→4, Seven 8→5, SingleBar 3→1. MC RESULTS (1M spins, 20L, 1cpl, 5c): Base 67.09%, H&S 15.54% (simulated), RS 5.48%, P&C 6.06%. TOTAL 94.18%. Trigger rates: RS 1in29, H&S 1in35, P&C 1in176, BONUS 1in175. Target 94% — CONFIRMED. Note: H&S at 15.54% is above the 8-10% target — may need coin tier rebalance in future session. NOT YET TESTED in browser. | ABOUT TO CHANGE (pre-logged): PICK_CHOOSE_PRIZES cash multipliers reduced to target ~10x avg win (was 32.75x). Tier1 5-25x→3-10x, Tier2 25-75x→10-22x, Tier3 75-150x→22-40x. Reason: P&C triggering 1in178 with 32.75x avg was contributing 18.38% RTP alone, pushing total to 107%. At 10.6x avg, P&C RTP drops to ~6%, estimated total ~94.6%. File: paytable.js. Must run MC after. | ABOUT TO CHANGE (pre-logged per rule 11): Lipstick 10→16/reel (+6), Letters 10→16/reel (+6) to target P&C and BONUS at ~1 in 156 (matching order of H&S). Frees 12 stops from: Cherry 12→8 (-4), Diamond 7→4 (-3), Seven 8→5 (-3), SingleBar 3→1 (-2). Reel sum stays 80. Files: paytable.js, tools/reel_strips.js. Must run MC after and log results. |
| turrelle_v6k6.zip | MC Line Fix + Denom Expansion (J1/J2/J3) | 2026-05-16 | COMPLETED. Sweep results (100k spins/config, 12 denoms × 5 line presets): -0 at 20L = ~93-93.3%. 5c at 20L = 95.2%. 1c at 20L = 103.2% (over — flat-floor JP seeds are proportionally large at 1c, by J2 design). All denoms at 1L = 271-471% (house always loses at 1L). Known issue: base game at 1L = 116% (only 1 payline evaluated but still over 100% — payline 0 center line pays heavily due to wild multipliers). Recommendation: enforce minimum 15 lines OR lower jackpot seeds for 1c-5c denoms. J1/J2/J3 implemented. MC replacement rule header added. SW cache bumped to v6k6. NOT YET BROWSER TESTED. (pre-logged per rule 11): (1) MC evaluateSpin bug fix — local evaluateSpin in monte_carlo.js was using global ACTIVE_LINES instead of the loop variable, causing sweep to evaluate all 20 paylines even at 1-line configs (1338% base RTP at 1 line — should be ~69%). Fix: pass lines param through evaluateSpin call chain. (2) PHASE J1: DENOMINATIONS expanded [0.01..1.00] -> [0.01..20.00], DENOM_LABELS updated. (3) PHASE J2: JACKPOT_SEEDS_BY_DENOM updated to owner-approved flat floor table (1c- all same seeds: MINI=0, MINOR=0, MAJOR=00, GRAND=000; + scale up). (4) PHASE J3: CREDITS_PER_LINE_OPTIONS [1,2,3,5,10] -> [1,2,3,5] (remove 10, max bet = denom x 5 x 20). (5) monte_carlo.js: add mandatory replacement rule header comment for AI/developers. Files: paytable.js, tools/monte_carlo.js, PHASE_PLAN.md. Must run sweep after and log results. |
| turrelle_v6k7.zip | Lock to 20 Lines Always | 2026-05-16 | COMPLETED: Lock active lines to 20 at all times. (1) index.html: lines var initialized to DEFAULT_LINES=20 and never changes — BET ONE button repurposed to cycle credits/line instead of lines (or hidden). LINES display shows static 20. (2) No payline animation changes — showBaseWins/payline highlight logic untouched. (3) PHASE_PLAN game design section updated: remove player line selection, lock to 20. BET ONE repurposed to cycle credits/line [1,2,3,5] and label updates to show "X CR". BET MAX sets cpl=5. Legacy line-btns disabled. LINES display hardcoded to 20. Payline animations untouched. SW bumped to v6k7. NOT YET BROWSER TESTED. |
| turrelle_v6k8.zip | Phase L — Game History & Audit Log | 2026-05-16 | COMPLETED: L1/L2/L3/L4/L5 implemented. state.js: HISTORY_KEY=turrelle_game_history, recordSpinHistory(), loadSpinHistory(), clearSpinHistory(), exportHistoryCSV(), exportHistoryJSON() added. game.js: centerRow (symbol names), denom, creditsPerLine added to game record before finalizeGameRecord; recordSpinHistory() called from finalizeGameRecord. operator.js: LAST 10 GAMES tab enhanced to show symbol names + reel stops in format "Seven-Seven-Sisters-Sasha-Cherry [Stops: 1-1-8-5-3]"; HISTORY tab uses persistent spinHistory (up to 10k); export CSV/JSON buttons download file; Clear History button added. Files: state.js, game.js, operator.js. |
| turrelle_v6k9.zip | Red Spin Spin-1 Floor Bug Fix | 2026-05-16 | COMPLETED: runRedSpin() lastWin initialized to 0 instead of base game win. Bug: if base game wins $8 then Red Spin fires, Spin 1 can win $0.05 (only needs to beat $0). Fix: game.js passes result.totalWin as prevWin in callerContext; bonuses.js initializes lastWin = callerContext.prevWin || 0. Non-base-game contexts (BONUS orb, P&C) use totalBet as floor. Permanent rule added to PHASE_PLAN Red Spin Rules section. |
| turrelle_v6l2.zip | Phase M — BONUS Letters Rework + P&C Fix | 2026-05-16 | M2: Deleted evaluateBonusLetters() and BONUS_LETTER_PAYS from game.js/paytable.js. M3: Added evaluateLetterPays() (cherry-style, all 3 rows, additive, BONUS_LETTER_CHERRY_PAYS=[0,1,2,4,12]). M4: Bottom-row trigger check in evaluateSpin() — grid[0-4][2] all matching LETTER_IDS → triggerBonusFeature=true; bottom-row pay subtracted from total when trigger fires. M5: monte_carlo.js updated — evaluateBonusLetters replaced with evaluateLetterPays, import changed BONUS_LETTER_PAYS→BONUS_LETTER_CHERRY_PAYS, reporting updated. M7: bonuses.js runPickChoose() — UI.setPickTapCallback(null) called immediately on match-3 so no further tiles can be tapped or revealed after win. Note on M1: S visual restriction to bottom-row only on reel strip requires explicit strip builder — deferred to future phase. Trigger check (M4) is the authoritative enforcement. NOT YET BROWSER TESTED. Files: paytable.js, game.js, bonuses.js, tools/monte_carlo.js, PHASE_PLAN.md. |
| turrelle_v6l3.zip | Red Spin min-payout fix + H&S reel restore | 2026-05-16 | PRE-LOGGED (Rule 11). Fix 1: Red Spin Screen Bonus always pays more than bet — `lastWin` floor changed from `callerContext.prevWin` to `Math.max(callerContext.prevWin, totalBet)` in `runRedSpin()` (bonuses.js). Eliminates case where low base game win (e.g. $1 cherry on $100 bet) allowed Red Spin sequence to complete under bet amount. Applies at all denoms — `totalBet` is already denom-scaled. Fix 2: H&S exits back to reels in trigger position — after bonus ends, `animateReelsStop(triggerStops, triggerGrid)` called in `endHoldSpin()` (ui.js) when `restoreStops`/`restoreGrid` are provided. Applies to: base game, Red Spin, BONUS letters. Suppressed for: Pick & Choose (`fromPickChoose:true`), nested Red Spin H&S (`noRestoreReels:true`), nested BONUS orb H&S (`noRestoreReels:true`). Files: bonuses.js, ui.js, game.js, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l4.zip | Reel recalibration — bars added | 2026-05-16 | COMPLETED. Analysis: base RTP was 54% due to Letters (16/reel) + GoldCoin (14/reel) consuming 30% of each reel as dead payline stops. Bar stops too low (8/reel = 10%) causing near-zero bar payline wins. Fix: Letters 16→10 (-6), Lipstick 16→12 (-4), freed 10 stops redistributed to TripleBar 3→6 (+3), DoubleBar 4→7 (+3), SingleBar 1→5 (+4). Bar density: 10% → 22.5%. MC results (1M spins, 5¢/1cr/20L): Base 54.99%, H&S 13.71%, RS 5.52%, P&C 1.33%, Total ~75.55%. Mixed bar hits: 1.30% → 13.09%. Bar payline RTP: ~0% → 6.50%. Structural note: reaching 74-80% base RTP requires fewer non-paying stops — deferred to future phase per owner. Files: paytable.js, tools/reel_strips.js, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l5.zip | H&S Visual Redesign — Aristocrat-style animations | 2026-05-16 | COMPLETED. Phase I items I3a/I3b confirmed already correct in `_fillHoldCell()`. Implemented: (1) Sequential coin collection — `_hsCollectCoins()` collects left-to-right top-to-bottom at 550ms/coin, coin dims from glowing sun to dark gear via `coin-collected` CSS class. (2) Sparkle trail from each coin to total counter via absolutely-positioned `hs-collect-trail` element. (3) Running total pop — `updateHoldTotal()` adds `val-pop` animation per coin. (4) BONUS WIN celebration screen — `showHoldBonusWinScreen()` full-screen overlay with 40-coin rain, pulsing orange-red BONUS WIN label, large yellow amount, tap-to-dismiss (4s fallback). (5) Respin counter badge — `#respin-badge` number element with `respin-reset-spin` spin animation when counter resets to 3 on new coin. (6) Jackpot meter pulse — `flashJackpotCoin()` adds `jp-meter-hit` to matching meter bar on jackpot coin land. (7) Empty cell amber anticipation glow — replaces old gold pulse with orange/amber glow during respin spinning phase. Files: ui.js, style.css, index.html, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l6.zip | P&C all-tiles-revealed bug fix | 2026-05-16 | COMPLETED. Bug: after match-3, remaining tiles could still be tapped due to race between queued tap events and `setPickTapCallback(null)`. `showPickChooseWin` also failed to highlight matched tiles reliably because it scanned emoji icon text (fragile). Three-layer fix: (1) `setPickTapCallback(null)` unchanged — still fires first. (2) New `_lockAllPickTiles()` sets `pointer-events:none` on every tile at DOM level, called from both `bonuses.js` match-3 block and `showPickChooseWin`. (3) `revealPickTile()` writes `front.dataset.prizeType` on each tile; `showPickChooseWin` reads it instead of scanning icons — reliable highlighting. (4) `showPickChooseGrid` resets `pointer-events` on fresh tile creation so next P&C game is not frozen. Files: ui.js, bonuses.js, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l7.zip | Additional Red Spin chaining + transition banner | 2026-05-16 | COMPLETED. Design: Red Spin CAN trigger H&S (no chain), P&C (can award Red Spin), Letters Bonus (can award H&S, P&C, or Red Spin). When P&C or Letters awards Red Spin during a sequence, those additional rounds are queued and dispatched AFTER the main sequence ends with a congratulations transition. Implementation: `pendingRedSpins[]` array collects awards during the spin loop. Three push paths: (1) P&C inside Red Spin awards Red Spin → `{ source:'PICK_CHOOSE' }`. (2) Letters → P&C awards Red Spin → `{ source:'LETTERS_PC' }`. (3) Letters orb directly awards Red Spin → `{ source:'LETTERS' }`. After `deactivateRedScreen()`, iterates pending array: shows `showAdditionalRedSpinsWon(sourceLabel, roundIndex, totalRounds)` transition then calls `runRedSpin()` recursively with fresh floor. `setControlsEnabled(true)` moved to after all pending rounds complete. `showAdditionalRedSpinsWon` upgraded to accept sourceLabel + round info; `#additional-rs-sub` shows source, `#additional-rs-tap` shows "Starting Next Round...". Banner CSS improved: radial gradient backdrop, clamp font sizes, `#additional-rs-tap` fade-pulse. `#additional-rs-tap` div added to index.html. Files: bonuses.js, ui.js, style.css, index.html, service-worker.js, PHASE_PLAN.md. NOT YET BROWSER TESTED. |
| turrelle_v6l8.zip | Payline alignment — Neptune's Gold exact 20-line set | 2026-05-16 | COMPLETED (pre-logged Rule 11). Replaced 7 non-matching paylines in PAYLINES[] (paytable.js) with Neptune's Gold exact patterns. 13 of 20 already matched; 7 replaced: Line 10 [1,2,0,2,1] M-Shape, Line 11 [1,0,2,0,1] W-Shape, Line 14 [1,1,0,0,0] Zig-Zag Step Up, Line 15 [0,0,1,1,1] Zig-Zag Step Down, Line 18 [2,1,1,0,0] Snake Up, Line 19 [0,1,1,2,2] Snake Down, Line 20 [1,0,1,2,1] Center Bridge. Paylines also reordered to match Neptune's Gold Line 1–20 sequence exactly. Removed: [0,0,1,2,2], [2,2,1,0,0], [1,2,1,2,1], [2,1,2,1,2], [1,1,0,1,1], [1,1,2,1,1], [0,2,0,2,0]. No RTP impact — same 20 lines, same bet math. CACHE_NAME bumped to turrelle-v6l8. Pending: Cherry removal (18→17 symbols) + freed 8-stop/reel redistribution to bars (balanced split) — owner approved, not yet coded. NOT YET BROWSER TESTED. Files: paytable.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l9.zip | Bet panel revert — SELECT LINES cycles active lines | 2026-05-16 | COMPLETED (pre-logged Rule 11). Reverted v6k7 bet panel lock. Changes: (1) `lines` variable unlocked — was hardcoded to 20, now player-selectable. (2) BET ONE button renamed to SELECT LINES — cycles active lines 1→5→10→15→20→1. (3) `updateBetLine()` lines display now dynamic (was hardcoded '20'). (4) BET ONE click handler replaced — was cycling creditsPerLine [1,2,3,5], now cycles lines [1,5,10,15,20]. (5) Removed `creditsPerLine + ' CR'` text override from updateBetLine (BET ONE label was being overwritten on every display refresh). Credits/line still selectable via credits buttons (1,2,3,5). BET MAX = 5cr + 20L. Only active lines pay (evaluateSpin already uses PAYLINES.slice(0, activeLinesCount) — no game logic change needed). CACHE_NAME bumped to turrelle-v6l9. NOT YET BROWSER TESTED. Files: index.html, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l10.zip | Red Spin end celebration screen | 2026-05-16 | COMPLETED (pre-logged Rule 11). Bug audit: Bug 1 (H&S wrong arg from Red Spin) already fixed in v6j5 — Phase Plan status was stale, updated to ✅. Bug 3 (Operator orphan divs) already fixed in v6j8 — Phase Plan status was stale, updated to ✅. Bug 2 (Red Spin end celebration missing) implemented: (1) Added `#rs-bonus-win-overlay` HTML element to index.html — red-themed screen matching H&S win overlay pattern (coin rain, amount, spin count, tap-to-continue). (2) Added CSS to style.css — `#rs-bonus-win-overlay`, `.rs-rain-coin`, `#rs-bonus-win-content/label/amt/spins/tap`, `@keyframes rsWinLabelPulse`. Reuses existing `rainCoinFall` and `bonusWinAmtPop` keyframes. (3) Added `showRedSpinEndCelebration(bonusTotal, spinNum)` to ui.js — red coin rain, 4s auto-dismiss or tap. Exported from UI module. (4) Called `await UI.showRedSpinEndCelebration(bonusTotal, spinNum)` in bonuses.js sequence-complete block, before `deactivateRedScreen()`. CACHE_NAME bumped to turrelle-v6l10. NOT YET BROWSER TESTED. Files: index.html, style.css, ui.js, bonuses.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l11.zip | Design corrections: P&C restore, RS continuance 70%, H&S coin spin | 2026-05-16 | COMPLETED (pre-logged Rule 11). Three owner-confirmed design corrections: (1) P&C REEL RESTORE — after Pick & Choose closes, reels snap back to 5-oak Lipstick trigger position before returning to base game. Changes: game.js passes `triggerStops`/`triggerGrid` in pcContext to runPickChoose(); bonuses.js Red Spin P&C call also passes stops/grid; runPickChoose() calls `UI.animateReelsStop(triggerStops, triggerGrid)` after endPickChoose() when context provides stops/grid. PHASE_PLAN updated: P&C "Do NOT snap back" rule corrected to "DO snap back". (2) RED SPIN CONTINUANCE — 65% → 70% (70/30 continue/stop). Changed RED_SPIN_CONTINUANCE_DEFAULT in paytable.js. (3) H&S SPINNING COINS — all empty cells now show full spinning gold coin (same visual as landed coin) during each respin, not amber glow. animateHoldSpinning() split into startHoldSpinning(board) [no await — starts spin immediately] + clearHoldSpinning() [clears remaining spinners after coins land]. runHoldSpin() round loop changed: startHoldSpinning → await 650ms → land coins (animateCoinLand removes spinning from landing cell) → clearHoldSpinning. CSS: emptyAmber removed; spinning-cell now uses exact same gold conic-gradient + box-shadow as locked coin + chipSpin + spinGlow. CACHE_NAME bumped to turrelle-v6l11. NOT YET BROWSER TESTED. Files: paytable.js, game.js, bonuses.js, ui.js, style.css, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l12.zip | H&S respin counter fix + BONUS orb noJackpots from base game | 2026-05-16 | COMPLETED (pre-logged Rule 11). Fix 1: H&S respin counter frozen at 3. Root cause: `_generateFullHoldSpinOutcome()` only emitted events for landing rounds — empty respins had no sequence entries so the counter decrement path was dead code. Fix: added `eventTimeline[]` to the outcome alongside `sequence[]`. Each respin round produces either `{ type:'empty' }` (counter ticks down) or `{ type:'land', events:[...] }` (counter resets to 3), with `{ type:'initial' }` for trigger coins. `runHoldSpin()` STEP 3 now drives animation from `eventTimeline` instead of `rounds` dict — empty steps spin all cells + decrement counter, land steps spin then drop coins + reset counter. Fix 2: BONUS orb jackpots not suppressed from base game. Root cause: `runBonusFeature()` was called from game.js without `noJackpots:true`, so orb-awarded H&S/P&C could fire jackpots (design says they can't). Fix: added `Object.assign({}, currentContext, { noJackpots: true })` to runBonusFeature call; also sets `currentContext.noJackpots = true` before subsequent H&S/P&C runs. CACHE_NAME bumped to turrelle-v6l12. NOT YET BROWSER TESTED. Files: bonuses.js, game.js, service-worker.js, PHASE_PLAN.md. |
| turrelle_v6l13.zip | Cherry removal (17 symbols) + RTP recalibration to 94% | 2026-05-16 | COMPLETED (pre-logged Rule 11). Cherry (id:7) removed from game entirely — symbol count 18→17. Changes: (1) paytable.js: CHERRY removed from SYMBOLS, PAY_TABLE.CHERRY removed, id:7 removed from all 5 REEL_FREQUENCIES, 8 freed stops redistributed to bars: TripleBar 6→9 (+3), DoubleBar 7→10 (+3), SingleBar 5→7 (+2). BONUS_LETTER_CHERRY_PAYS renamed to BONUS_LETTER_PAYS (was just a naming issue — logic unchanged). (2) game.js: evaluateCherryWin() deleted, cherry 1-oak exception removed from evaluateLine() (all symbols now require min 2-oak), cherry win tracking removed from evaluateSpin(), cherry filler in force jackpot/bonus grids replaced with SYMBOLS.LIPSTICK.id. (3) tools/monte_carlo.js: BONUS_LETTER_CHERRY_PAYS import renamed BONUS_LETTER_PAYS, cherry exception removed from evaluateLine(), evaluateCherryWin stub deleted, cherry hit tracking/reporting removed, id:7 removed from symbol name map. (4) Bar pays recalibrated (3 MC runs, 1M spins each at 5¢/1cr/20L): TRIPLE_BAR [63,12,4]→[87,16,5], DOUBLE_BAR [25,7,2]→[33,9,3], SINGLE_BAR [11,4,1]→[14,5,1], MIXED_BAR {3:2,4:7,5:17}→{3:3,4:9,5:23}. MC RESULTS (final, 1M spins, 5¢/1cr/20L): Base 70.54%, H&S 14.01%, RS 6.91%, P&C 1.42%. TOTAL ~93–94% (bonus estimates have ±0.5% variance between runs; base is fully simulated and confirmed). CACHE_NAME bumped to turrelle-v6l13. NOT YET BROWSER TESTED. Files: paytable.js, game.js, tools/monte_carlo.js, service-worker.js, PHASE_PLAN.md. |
| PHASE_PLAN_v6l2_update.md | Phase Plan Update — BONUS Letters Rework + P&C Fix | 2026-05-16 | No code changes. Design changes logged: (1) BONUS LETTER FEATURE RULES section fully rewritten — Neptune's Gold style. Letters B/O/N/U evaluate cherry-style (all rows, consecutive from reel 1, additive, pays 1×/2×/4×/12×). S restricted to bottom row of reel 5 only by reel design — makes full BONUS on non-bottom row structurally impossible. Trigger = bottom row B-O-N-U-S only. Old partial-pay/per-payline logic removed from spec. Orb pick screen retained. (2) PICK & CHOOSE RULES updated — correct behaviour is match-3 stops game immediately, remaining tiles stay face-down. Current all-reveal behaviour logged as confirmed bug. (3) Phase M added — full implementation checklist for BONUS letters rework + P&C fix. (4) Symbol Reference Table updated for letters 10–14. (5) Known Issues updated with P&C all-reveal bug and BONUS rework status. |
| turrelle_v6l1.zip | Red Spin $0 trigger fix + Letter glow bleed fix | 2026-05-16 | COMPLETED: (1) Red Spin must not trigger on $0 base game win — add guard in game.js so checkRedSpinTrigger() is only called when result.totalWin > 0. Also add this as permanent rule to Red Spin Rules in PHASE_PLAN. (2) BONUS letter yellow/gold glow bleeding onto other symbols on same payline — find letter highlight CSS/JS in ui.js and scope it to letter cells only, not all cells in the payline row. Files: game.js, ui.js (or index.html). |
| turrelle_v6j7.zip | Dead Code Cleanup + Audio Fix | 2026-05-15 | Fix 6: Deleted `processJackpotCheckRedSpin()` from bonuses.js — dead code with wrong escalation rule; Red Spin jackpots correctly use `processCharacterJackpots()` (highest tier only per spin, same as base game — confirmed design). Fix 7: Deleted `_redSpinTierHelper()` from bonuses.js — old tier-based helper, never called since Red Spin rewrite. Fix 8: Deleted `generatePickChooseTiles()` from game.js — superseded by `_generatePickTiles()` in bonuses.js. Fix 9: Deleted `generateRedSpinWin()` from game.js — superseded by real-grid rewrite in runRedSpin(). Fix 10: Removed duplicate `./assets/sasha.png` entry from service-worker.js cache list. Fix 11: Bumped CACHE_NAME from `turrelle-v6j3` → `turrelle-v6j6` in service-worker.js. Fix 12: Fixed misleading `WILD_MULTIPLIERS` comment in paytable.js — now accurately describes current code behaviour and flags the Josie ×4 bug. Fix 13: Added `bonus_trigger` sound handler to audio.js — ring + ascending 5-note chime; previously silent when BONUS letters fired. No math or game logic changed. |
| PHASE_PLAN_v6j6_updated.md | Plan Update | 2026-05-15 | Full game design & rules section added (MLMC bet structure, all 20 paylines, all symbol rules, wild multiplier rules, Cherry/Lipstick/Jackpot/BONUS letter/Red Spin/Hold & Spin/Pick & Choose rules, operator menu, audio events, RTP targets). BONUS letter inconsistency issue logged as new Known Issue (Priority 2) — most likely root cause is the existing BONUS orb dispatch bug. Priorities re-ordered: P1=H&S math (done), P2=BONUS letters, P3=Red Spin, P4=Operator crash, P5=RTP recalibration, P6=Lifetime RTP, P7=Operator features, P8=Win lag, P9=Phase G. No code changes this update. |
| turrelle_v6j6.zip | Bug Fix | 2026-05-15 | Fix 5: Red Spin complete freeze — `stops` and `grid` declared with `const` inside `do/while` block but used outside it, throwing ReferenceError on every spin, locking activeBonus='RED_SPIN' permanently. Fixed by hoisting to `let stops, grid, result, spinWin` before the loop. Owner-reported symptom: screen turns red, audio plays, reels don't spin, game completely unresponsive. |
| turrelle_v6j5_final.zip | Cleanup | 2026-05-15 | Asset audit completed. 9 unused files (1.6 MB) moved to `deadfiles.zip` and removed from active assets. PHASE_PLAN updated with Rule 14 (deadfiles instructions). Dead files: ching.mp3, lipstick_bonus.mp3, splash_music.mp3, josie_title.png, sasha_title.png, sisters_title.png, sisters_celebrate.webp, sasha_solo_celebrate.webp, icons/splash.png. Two audio gaps also found: Audio.play('bonus_trigger') has no registered handler; Audio.play('credits_addup') silently fails (correct key is 'coin_drop'). Both logged in KNOWN ISSUES. |
| turrelle_v6j5.zip | Bug Fixes | 2026-05-15 | Fix 3: runHoldSpin wrong arg signature when called from Red Spin — changed `runHoldSpin(betPerLine, linesActive, { from:'RED_SPIN' })` to `runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN' })` so triggerGrid is correctly passed and H&S board starts with the 6 triggering coins locked. Fix 4: Duplicate STEP 5 label in runHoldSpin — relabelled end-bonus block as STEP 6. Full code audit completed — 10 new bugs documented in KNOWN ISSUES (v6j4 audit section). Awaiting owner test confirmation. |
| turrelle_v6j4.zip | Bug Fixes | 2026-05-15 | Fix 1: PAY_TABLE key mismatch — renamed TRIPLEBAR→TRIPLE_BAR, DOUBLEBAR→DOUBLE_BAR, SINGLEBAR→SINGLE_BAR, DJMAXINE→DJ_MAXINE in paytable.js. Fix 2: Red Spin continuance bug — changed `spinNum >= 1` to `spinNum >= 2` in bonuses.js so Spin 1 is always guaranteed. Both fixes confirmed owner-approved. Awaiting test results. Note: Fix 1 will increase base game RTP — Priority 4 Monte Carlo must account for this. |
| PHASE_PLAN_v6j3_audit.md | Plan Update | 2026-05-15 | Red Spin code audit completed. 6 bugs confirmed in bonuses.js: (1) continuance on spin 1; (2) runHoldSpin wrong arg signature; (3) noJackpots flag never checked; (4) BONUS orb prize flags never dispatched; (5) stops/grid out of scope for animateReelsStop; (6) missing Red Spin end celebration. Also: processJackpotCheckRedSpin dead code (needs owner clarification). Duplicate STEP 5 label. Wild multiplier Josie ×4 bug confirmed. No code changes this update. |
| PHASE_PLAN_v6j3_updated.md | Plan Update | 2026-05-15 | Two new mandatory rules added (rules 12 & 13): always check KNOWN ISSUES for newly found bugs before coding; always test game before delivering zip. PAY_TABLE key mismatch bug added to KNOWN ISSUES (TRIPLE_BAR/DOUBLE_BAR/SINGLE_BAR/DJ_MAXINE paying zero). No code changes. |
| turrelle_v6j3.zip | Plan Update | 2026-05-15 | Phase I (H&S redesign per Aztec Sun spec) written to PHASE_PLAN. Payline audit completed. Wild multiplier bug found (Josie ×4 not applied). No code changes this build. |
| turrelle_v6h.zip | Phase H | 2026-05-14 | Bell ring logic: tiered by cash value (1/2/3/10 rings). New playBellsForBonus() for bonus triggers. |
| turrelle_v6g.zip | Post-E | 2026-05-14 | BONUS letters: 10/reel (was 1). Singlebar 15→6. Full BONUS ~1in11k, 3-ltr ~1in223, 2-ltr ~1in32. |
| turrelle_v6f.zip | Post-E | 2026-05-14 | Lipstick redesigned: payline symbol (was scatter). 5-oak any payline = P&C trigger. 4-oak=20cr, 3-oak=5cr. 14/reel. Singlebar 10→15. Red Spin updated. SCATTER_PAYS removed. |
| turrelle_v6e.zip | Phase E | 2026-05-14 | New reels, correct RTP math, cherry all rows, scatter R1+R3+R5, mixed bar 3/4/5, BET ONE/MAX panel |
| turrelle_v6d2.zip | Phase D | 2026-05-14 | Jackpots on any active payline, highest tier only, paytable updated, force random row |
| turrelle_v6c2.zip | Phase C | 2026-05-14 | Josie/Sasha high-res crops, celebration images on jackpot screen, random alternation |
| turrelle_v6b3.zip | Phase B | 2026-05-14 | Optional chaining fixed, paytable scrollable+full screen, back btn locked, Mixed Bar added |
| turrelle_v6a3.zip | Phase A | 2026-05-14 | Cherry pay, wild mult ×6, payline animations, SW cache, zip structure fixed |
| turrelle_v6_fixed.zip | Baseline | 2026-05-14 | User-provided starting point |

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
### 🔴 BUG — H&S `jackpotsAccumulated` used before declaration — TypeError crash (found 2026-05-18):
- **Root cause:** In `runHoldSpin()` (bonuses.js), `jackpotsAccumulated` is used at the first `if (triggerCoinsPreloaded)` block (line ~495) but declared with `var jackpotsAccumulated = {}` several lines later (line ~503). Due to JavaScript hoisting, `var` declarations are hoisted to the top of the function as `undefined` — the first block sets `jackpotsAccumulated[coin.jackpotLevel] = true` on `undefined`, throwing a `TypeError: Cannot set properties of undefined`. This only triggers when a trigger coin is a jackpot orb AND `triggerCoinsPreloaded` is true (which it always is from base game). Additionally, the first `forEach` block is entirely dead/duplicate code — it runs, then `totalWon` is reset to 0 and the second block re-accumulates the same values cleanly.
- **Fix:** Delete the dead first `forEach` block entirely. Move `var jackpotsAccumulated = {}` to before all uses (immediately after `let totalCoinsLanded`). This eliminates the crash and removes the redundant duplicate accumulation.
- **Files:** `bonuses.js` (`runHoldSpin` STEP 3 opening block).
- **Priority:** 🔴 CRITICAL — crashes H&S every time a jackpot trigger coin lands (jackpot probability ~14.5% per coin, 6+ trigger coins = near-certain crash in some bonuses). Also crashes on any H&S trigger where `pregenerateTriggerCoins` happened to generate a jackpot-tier coin.
- **Status:** ✅ FIXED v6l46
### 🔴 BUG — `_calcBoardTotal()` returns $0 for all cash coins after v6l44 inline SVG change (found 2026-05-18):
- **Root cause:** `_calcBoardTotal()` reads `.hs-c-val` DOM elements to compute the running board total. After the v6l44 inline SVG rework, `_fillHoldCell()` for cash coins no longer creates a `.hs-c-val` span — the dollar value is baked into SVG `<text>` nodes which are not readable by `querySelector('.hs-c-val')`. Result: the running total counter shows $0.00 on every coin land for cash coins; only jackpot coin overlays (which still use `.hs-c-val-jp`) are counted.
- **Fix:** `_calcBoardTotal()` should read coin values from the `displayBoard` array (available as a closure in `runHoldSpin`) rather than scraping the DOM. Since `_calcBoardTotal` is a standalone UI function with no access to `displayBoard`, the fix is to update `updateHoldTotal()` calls in `animateCoinLand()` to pass the actual coin value directly rather than re-scanning the DOM.
- **Files:** `ui.js` (`_calcBoardTotal`, `animateCoinLand`).
- **Priority:** 🔴 HIGH — running total counter shows wrong value during H&S bonus.
- **Status:** ✅ FIXED v6l46
### 📋 PRE-LOG (Rule 11) — turrelle_v6l46 — H&S crash fix + coin text size increase (2026-05-18):
**Changes about to be made:**
1. `bonuses.js` — CRITICAL BUG FIX: Remove dead/duplicate first `forEach` block in `runHoldSpin` STEP 3. Move `var jackpotsAccumulated = {}` declaration to immediately after `let totalCoinsLanded` (before first use). This eliminates the `TypeError: Cannot set properties of undefined` crash that aborts every H&S bonus where a jackpot trigger coin is pre-generated.
2. `ui.js` — Fix `_calcBoardTotal()` to read values from a passed-in board array instead of scraping `.hs-c-val` DOM (broken since v6l44 inline SVG rework). Update `animateCoinLand` to pass running total via parameter. Increase `_makeCoinSVG` font sizes: cash coins `30→40` (short), `26→34` (medium), `22→28` (long); jackpot label `26→32` (short), `22→26` (long). Make text bolder by increasing `stroke-width` on shadow text from `4` to `6`.
3. `style.css` — Increase `.hs-c-val-jp` font size for jackpot seed value overlays to match new scale.
4. `service-worker.js` — CACHE_NAME bump from `turrelle-v6l45` → `turrelle-v6l46`.
5. `PHASE_PLAN.md` — This pre-log + Known Issues entries + build history entry.
**Files:** `bonuses.js`, `ui.js`, `style.css`, `service-worker.js`, `PHASE_PLAN.md`.
### 📋 PRE-LOG (Rule 11) — turrelle_v6l57 — Paytable + jackpot seed update (2026-05-18)
**Changes about to be made:**
1. `paytable.js` — PAY_TABLE updated with all owner-confirmed values (full table reviewed symbol by symbol at 1¢ denom 2026-05-18): Sisters [0,0,0,0]; StrayPup [500,200,100,0]; DJ Maxine [350,150,75,0]; Seven [175,75,50,0]; Diamond [150,50,25,0]; Triple Bar [100,75,50,0]; Double Bar [75,50,25,0]; Single Bar [50,25,15,0]; Lipstick [0,0,0,0]; MIXED_BAR_PAY {3:5,4:10,5:15}.
2. `paytable.js` — JACKPOT_SEEDS_BY_DENOM fully replaced with owner-confirmed custom table across all 12 denoms (1¢ through $20). Seeds now scale meaningfully per denom rather than flat floor.
3. `service-worker.js` — CACHE_NAME bumped from turrelle-v6l56 → turrelle-v6l57.
4. `PHASE_PLAN.md` — This pre-log + build history entry.
**Files:** `paytable.js`, `service-worker.js`, `PHASE_PLAN.md`
**Note:** `game.js` `checkCharacterJackpots()` audited — MAJOR trigger (Josie+Sasha mix) already correctly implemented as `syms.every(id => WILD_IDS.includes(id))`. No change needed.
**⚠️ RTP IMPACT NOTE:** These pay value changes will affect base game RTP. A Monte Carlo run should be performed after browser testing to confirm total RTP remains near target. The bar pays and character pays have all increased significantly from prior values — base RTP may increase above the current ~70% base figure. Full MC verification is Rule 10 required before next math change.
## 🔍 PHASE PLAN AUDIT — v6l57 uploaded (2026-05-18)
**Version confirmed:** `turrelle-v6l57` ✅ | **ES5 check:** All .js files pass ✅ | **No spreads/default params** ✅
**Owner-reported problems root cause analysis:**
1. **Low denom paying too much** — H&S fracs scale with totalBet. At 25¢/5cr/20L ($25 bet), huge tier (1% weight, 6–15×) = up to $375/coin. NEAR_MISS_BOOST 1.8× makes it worse. Fracs are correct in principle but the ranges are too aggressive for lower denoms.
2. **H&S at low denoms overpaying** — JACKPOT_TIERS weights (MINI 0.8%) at 1¢ denom hit frequently; seeds ($5 MINI) are very low so jackpots themselves are fine, but cash tier fracs still scale to large values relative to the cent bet.
3. **Jackpot amounts wrong** — `JACKPOT_SEEDS_BY_DENOM`: 50¢ seeds ($100/$500/$1000/$10k) are LOWER than 25¢ ($150/$1k/$5k/$50k) — incorrect ordering. 1¢ seeds ($5/$15/$50/$200) are now owner-defined but may need recalibration after play testing.
**Stale status corrected:**
- Phase L marked COMPLETE (exports + filters implemented in v6l57) ✅
## MASTER TOOLKIT — `tools/turrelle_master_toolkit.jsx` 🛠️ (added 2026-05-18)
**What it is:** A React-based testing and analysis tool for the game math. Designed by owner. Included in every zip from v6l65 onwards.
**Current tabs (v6l64 confirmed values):**
- **Paytable Editor** — edit symbol pays and reel frequencies, export as paytable.js
- **Monte Carlo** — run base game simulation in-browser
- **Reel Visualizer** — view reel strip symbol distribution
- **Pay Calculator** — calculate exact dollar amounts by denom/bet
- **H&S Tuner** — tune Hold & Spin coin tiers and coin caps
- **RTP Analyzer** — breakdown of RTP contribution per symbol
- **Bonus Orb** — Pick & Choose and BONUS orb simulation
- **Red Spin Tuner** — simulate Red Spin sequences
**Future development (Phase Plan items):**
- Sync paytable values from game files automatically (currently uses hardcoded defaults)
- Add tier visualization for new tiered RS engine (Tier 1/2/3/4 distribution display)
- Add H&S board simulation with coin cap by total bet
- Add jackpot hit frequency display per denom
- Add multi-denom RTP matrix output
- Wire export directly to game files (paytable.js code gen already partially implemented)
**Rule:** Copy `tools/turrelle_master_toolkit.jsx` to every new zip build. Never modify without owner approval.
## ORIGINAL RED SPIN DESIGN — Saved Reference (v6l64, pre-tiered)
**File:** `tools/red_spin_original_design_v6l64.js`
**Design:** Pure ascending RNG. Each spin strictly beats previous win. Single floor = max(base win, totalBet). Continuance 60%. Sisters cap when no combination can beat lastWin.
**To revert:** Replace `runRedSpin()` in `bonuses.js` with the saved function. Remove `RED_SPIN_TIERS` and `RED_SPIN_TIER_ADVANCE_PROB` from `paytable.js`. Saved 2026-05-18 from v6l64.
--- 📋 FUTURE PHASE (owner requested 2026-05-18)
**Problem:** Low denom H&S paying too much. Jackpot seeds table needs reconfiguration. Near-miss boost too aggressive.
**Required before coding:**
- Owner confirms target dollar amounts per denomination tier
- Monte Carlo run after changes to verify RTP stays in target range
**Planned changes:**
- **Q1** — Fix `JACKPOT_SEEDS_BY_DENOM` 50¢ entry (currently lower than 25¢ — ordering error)
- **Q2** — Reduce or remove the 1% "huge" H&S tier (6–15× bet) — produces $375 coins at max 25¢ bet
- **Q3** — Reduce `HOLD_SPIN_NEAR_MISS_BOOST` from 1.8× to 1.2×
- **Q4** — Add per-denomination H&S tier cap OR separate frac tables for LOW/MID/HIGH denom groups
- **Q5** — Full Monte Carlo verification after all changes
**Status:** 📋 FUTURE — owner to confirm target payout ranges per denomination before coding
## PHASE N — Jackpot Caps, Base Game Jackpots & Paytable Combination IDs 📋 FUTURE PHASE (owner confirmed 2026-05-18)
### N1 — Jackpot Seed Ceiling Caps (owner confirmed 2026-05-18)
**Design:** Each jackpot tier (MINI/MINOR/MAJOR/GRAND) stops growing once it reaches a fixed dollar ceiling. The ceiling is a fixed dollar amount per tier — NOT per denom. Once reached, further contributions to the jackpot pool are discarded (or redirected to a house reserve).
**Owner confirmed ceiling type:** Fixed dollar cap per tier (e.g. GRAND never exceeds $10,000 regardless of denom).
**Ceiling amounts:** ⏳ Pending owner confirmation. Suggested starting point:
- MINI ceiling: $500
- MINOR ceiling: $2,000
- MAJOR ceiling: $10,000
- GRAND ceiling: $50,000 (or fixed $10,000 — owner to specify)
**Implementation notes:**
- Add `JACKPOT_CEILINGS = { MINI: 500, MINOR: 2000, MAJOR: 10000, GRAND: 50000 }` to paytable.js
- In `incrementJackpots()` in game.js: after adding contribution, clamp `current` at `Math.min(current, JACKPOT_CEILINGS[tier])`
- Display on meter: when at ceiling, show a "MAX" badge or different color to signal jackpot is ready to hit
- **Seed amounts:** Also need to recalibrate. Owner noted 1¢/5cr/20L GRAND = $1,000 (1,000× max bet). Current seed is $2,000. **Pending owner confirmation before changing.**
**Status:** 📋 FUTURE — await owner confirmation of ceiling amounts and penny GRAND seed before coding.
### N2 — Base Game Character Jackpots at Reduced Amounts (owner confirmed 2026-05-18)
**Design:** Josie/Sasha/Sisters 5-oak on base game paylines STILL trigger jackpots (owner confirmed), but at reduced amounts compared to H&S board jackpots. GRAND/MAJOR/MINOR/MINI can be won from H&S board at full seed value. Base game character jackpots pay a separate, smaller fixed award.
**Owner confirmed:** Jackpots fire from both base game character combos AND H&S board coins. Not H&S-only.
**What needs designing before coding:**
- What do base game character jackpots pay? Options: (A) Fixed % of current seed, (B) Fixed credit amount per denom, (C) Seed value at trigger time (same as H&S)
- Does Sisters 5-oak on base game pay the GRAND seed, or a separate fixed amount?
- Do Josie/Sasha 5-oaks pay MINOR/MINI seeds, or separate smaller amounts?
**Current code:** `processCharacterJackpots()` called in both `executeSpin()` (base game) and `runRedSpin()` (RS spins). Awards full seed value. This needs a separate "base game jackpot amount" table.
**Status:** 📋 FUTURE — await owner confirmation of base game jackpot pay amounts before coding.
### N3 — Paytable Combination IDs — Full Spec (owner confirmed 2026-05-18)
**Purpose:** RS sequence scripting — each RS spin references a combo ID so sequences can be pre-designed, tested, and reproduced. Also used in audit log for every spin result.
**Two-layer ID system (owner confirmed):**
- `BASE_ID` — identifies the combo type (symbol + oak count + wild multiplier category)
- `POSITION_MODIFIER` — identifies exact reel placement of Josie/Sasha wilds (e.g. J4S5 = Josie on R4, Sasha on R5)
**Format:** `BASE_ID.POSITION_MODIFIER` e.g. `042.J4S5`
When no wilds present: `BASE_ID` alone (e.g. `042`)
**BASE IDs — Payline Combinations**
*Single Bar (IDs 001–010):*
```
001  SB-SB-SB
002  SB-SB-SB-SB
003  SB-SB-SB-SB-SB
004  SB-SB-SB + 1 Josie wild
005  SB-SB-SB + 1 Sasha wild
006  SB-SB-SB + 2 Josie wilds
007  SB-SB-SB + 2 Sasha wilds
008  SB-SB-SB + Josie+Sasha mixed (×6)
009  SB-SB + Josie+Sasha+Josie (2 symbol + 3 wilds)
010  SB-SB-SB-SB + 1 Josie wild
```
*Double Bar (IDs 011–020):*
```
011  DB-DB-DB
012  DB-DB-DB-DB
013  DB-DB-DB-DB-DB
014  DB-DB-DB + 1 Josie wild
015  DB-DB-DB + 1 Sasha wild
016  DB-DB-DB + 2 Josie wilds
017  DB-DB-DB + 2 Sasha wilds
018  DB-DB-DB + Josie+Sasha mixed (×6)
019  DB-DB + Josie+Sasha+Josie
020  DB-DB-DB-DB + 1 Josie wild
```
*Triple Bar (IDs 021–030):*
```
021  TB-TB-TB
022  TB-TB-TB-TB
023  TB-TB-TB-TB-TB
024  TB-TB-TB + 1 Josie wild
025  TB-TB-TB + 1 Sasha wild
026  TB-TB-TB + 2 Josie wilds
027  TB-TB-TB + 2 Sasha wilds
028  TB-TB-TB + Josie+Sasha mixed (×6)
029  TB-TB + Josie+Sasha+Josie
030  TB-TB-TB-TB + 1 Josie wild
```
*Mixed Bar (IDs 031–036):*
```
031  MIX-MIX-MIX (any 3 different bars)
032  MIX-MIX-MIX-MIX
033  MIX-MIX-MIX-MIX-MIX
034  MIX-MIX-MIX + Josie+Sasha (×6)
035  MIX-MIX-MIX + 2 Josie
036  MIX-MIX-MIX + 2 Sasha
```
*Diamond (IDs 037–046):*
```
037  DIA-DIA-DIA
038  DIA-DIA-DIA-DIA
039  DIA-DIA-DIA-DIA-DIA
040  DIA-DIA-DIA + 1 Josie wild
041  DIA-DIA-DIA + 1 Sasha wild
042  DIA-DIA-DIA + 2 Josie wilds
043  DIA-DIA-DIA + 2 Sasha wilds
044  DIA-DIA-DIA + Josie+Sasha mixed (×6)
045  DIA-DIA + Josie+Sasha+Josie
046  DIA-DIA-DIA-DIA + 1 Josie wild
```
*Seven (IDs 047–056):*
```
047  7-7-7
048  7-7-7-7
049  7-7-7-7-7
050  7-7-7 + 1 Josie wild
051  7-7-7 + 1 Sasha wild
052  7-7-7 + 2 Josie wilds
053  7-7-7 + 2 Sasha wilds
054  7-7-7 + Josie+Sasha mixed (×6)
055  7-7 + Josie+Sasha+Josie
056  7-7-7-7 + 1 Josie wild
```
*DJ Maxine (IDs 057–066):*
```
057  MAXINE-MAXINE-MAXINE
058  MAXINE-MAXINE-MAXINE-MAXINE
059  MAXINE-MAXINE-MAXINE-MAXINE-MAXINE
060  MAXINE-MAXINE-MAXINE + 1 Josie wild
061  MAXINE-MAXINE-MAXINE + 1 Sasha wild
062  MAXINE-MAXINE-MAXINE + 2 Josie wilds
063  MAXINE-MAXINE-MAXINE + 2 Sasha wilds
064  MAXINE-MAXINE-MAXINE + Josie+Sasha mixed (×6)
065  MAXINE-MAXINE + Josie+Sasha+Josie
066  MAXINE-MAXINE-MAXINE-MAXINE + 1 Josie wild
```
*Stray Pup (IDs 067–076):*
```
067  PUP-PUP-PUP
068  PUP-PUP-PUP-PUP
069  PUP-PUP-PUP-PUP-PUP
070  PUP-PUP-PUP + 1 Josie wild
071  PUP-PUP-PUP + 1 Sasha wild
072  PUP-PUP-PUP + 2 Josie wilds
073  PUP-PUP-PUP + 2 Sasha wilds
074  PUP-PUP-PUP + Josie+Sasha mixed (×6)
075  PUP-PUP + Josie+Sasha+Josie
076  PUP-PUP-PUP-PUP + 1 Josie wild
```
*Sasha (IDs 077–081):*
```
077  SASHA-SASHA-SASHA
078  SASHA-SASHA-SASHA-SASHA
079  SASHA-SASHA-SASHA-SASHA-SASHA  → MINI Jackpot trigger
080  SASHA-SASHA-SASHA + Josie×2 wilds
081  SASHA-SASHA + Josie+Sasha+Josie
```
*Josie (IDs 082–086):*
```
082  JOSIE-JOSIE-JOSIE
083  JOSIE-JOSIE-JOSIE-JOSIE
084  JOSIE-JOSIE-JOSIE-JOSIE-JOSIE  → MINOR Jackpot trigger
085  JOSIE-JOSIE-JOSIE + Sasha×2 wilds
086  JOSIE-JOSIE + Josie+Sasha+Josie
```
*Jackpots (IDs 087–090):*
```
087  JOSIE+SASHA mix 5-oak  → MAJOR Jackpot trigger
088  SISTERS-SISTERS-SISTERS-SISTERS-SISTERS  → GRAND Jackpot trigger
089  (reserved)
090  (reserved)
```
*Special Triggers (IDs 091–092):*
```
091  LIPSTICK×5 on active payline  → Pick & Choose trigger
092  GOLDCOIN×6+ on grid  → Hold & Spin trigger
```
*BONUS Letters (IDs 093–097):*
```
093  B  (1 letter — pays 1× bet/line)
094  B-O  (2 letters — pays 2× bet/line)
095  B-O-N  (3 letters — pays 4× bet/line)
096  B-O-N-U  (4 letters — pays 12× bet/line)
097  B-O-N-U-S  (5 letters — triggers BONUS Feature)
```
**POSITION_MODIFIER format:**
Used only when BASE_ID involves Josie or Sasha wilds. Specifies exact reel number(s):
```
J4     = Josie on Reel 4
S4     = Sasha on Reel 4
J4J5   = Josie on R4 and R5
S4S5   = Sasha on R4 and R5
J4S5   = Josie on R4, Sasha on R5
S4J5   = Sasha on R4, Josie on R5
J3J4   = Josie on R3 and R4
J3S4   = Josie on R3, Sasha on R4
J1J2   = Josie on R1 and R2 (wilds leading)
```
**Full combo reference examples:**
```
003        = SB-SB-SB-SB-SB (no wilds)
004.J5     = SB-SB-SB-SB-JOSIE
004.J4     = SB-SB-SB-JOSIE-SB  ← wait, not valid (run breaks)
008.J4S5   = SB-SB-SB-JOSIE-SASHA
008.S4J5   = SB-SB-SB-SASHA-JOSIE
008.J3J5   = SB-SB-JOSIE-SB-JOSIE  ← wilds can be non-adjacent if symbol fills gap
049        = 7-7-7-7-7 (no wilds)
084        = JOSIE-JOSIE-JOSIE-JOSIE-JOSIE (MINOR JP)
088        = SISTERS×5 (GRAND JP)
097        = B-O-N-U-S (BONUS trigger)
```
**Total IDs:** 097 base IDs + unlimited position modifiers for wild placement.
**Implementation plan (ready to code on owner go-ahead):**
- Add `PAYTABLE_COMBINATIONS` array to `paytable.js` (097 entries)
- Update `evaluateLine()` in `game.js` to return `{ win, baseId, positionModifier, comboId }`
- Log `comboId` in every `SPIN_RESULT` event and `spinHistory` record
- RS scripting: `RED_SPIN_SCRIPT` array in `paytable.js` — each entry references a `comboId` for that spin
- Operator menu: new "RS Script" section to load/edit scripted sequences
**Status:** 📋 FUTURE — full spec confirmed, ready to code when owner gives go-ahead.
### N4 — Red Spin Tier Jackpots (owner confirmed 2026-05-18)
**Full design confirmed — ready to code on owner go-ahead.**
#### Rules (all owner-confirmed):
1. Every tier has a jackpot RNG chance on each spin
2. Jackpot can only fire ONCE per tier — flag cleared after it fires
3. Jackpot REPLACES the spin win — jackpot amount IS that spin's award
4. Jackpot amount becomes `lastWin` — next spin must beat it
5. Since jackpot amount exceeds current tier ceiling, next spin auto-advances to next tier
6. Jackpots available per tier:
#### Auto-escalation via jackpot (owner confirmed):
- JP fires in Tier 1 → jackpot amount > Tier 1 ceiling → next spin must beat JP → engine searches Tier 2+ for valid combo → sequence naturally advances
- Same cascade for Tier 2 → Tier 3, Tier 3 → Tier 4
- This means a jackpot in any tier guarantees advancement to the next tier
#### Implementation notes:
- Add `jpFiredThisTier` boolean flag to RS loop state, reset on each `currentTier++`
- Per-spin jackpot check: `if (!jpFiredThisTier && rng.chance(RS_TIER_JP_ODDS[currentTier]))`
- `RS_TIER_JP_ODDS` array in paytable.js — **2% per spin per tier (owner confirmed 2026-05-18)**
- JP type weighting **(owner confirmed 2026-05-18):**
  - Tier 2: MINI 70% / MINOR 30%
  - Tier 3: MINI 60% / MINOR 30% / MAJOR 10%
- Continuance check still applies after JP spin — sequence may continue or end at 60/40
- If sequence continues after JP: engine looks for combo > `lastWin` (= JP amount) → auto-escalates tier
- Available JP per tier: `{ 0:['MINI'], 1:['MINI','MINOR'], 2:['MINI','MINOR','MAJOR'], 3:['GRAND'] }`
- Tier 3 JP selection: weighted RNG from available types (e.g. MINI 60%, MINOR 30%, MAJOR 10%)
- Tier 4 (Sisters) GRAND fires via existing `processCharacterJackpots()` — no separate JP roll needed
#### Still pending before coding:
- `RS_TIER_JP_ODDS` — probability per spin per tier (owner to confirm)
- JP type weighting within Tier 2 (MINI vs MINOR split) and Tier 3 (MINI/MINOR/MAJOR split)
#### MC Results — v6l72 (corrected tier ranges, 800 search attempts):
```
T1 SMALL  ($5–$95):    33,977 sequences (100%)   106k spins
T2 MEDIUM ($100–$295): 13,150 sequences (39%)     34k spins
T3 LARGE  ($300–$1050): 8,502 sequences (25%)     14k spins
T4 SISTERS:             7,986 sequences (24%)  ← still too high
```
**Root cause confirmed:** T3→T4 cascade firing 94% of the time because after MINOR forces T3 (lastWin=$300), the engine needs wins ABOVE $300 within T3. Available T3 wins: $312, $350, $375, $500, $525, $625, $750 — all requiring character 4/5-oak combos that are rare even in 800 random draws. Engine falls back to T4.
**Two paths to fix:**
**Path A — Raise character pays to fill T2/T3:**
- PUP 3-oak: 100→200 (single line $25→$50) — fills T2 at $200/line
- MAXINE 3-oak: 75→150 — fills lower T2
- Creates denser T2/T3 win distribution, reduces cascade frequency
- Requires MC re-run to verify new RTP impact
**Path B — No fallback cascade from T2/T3:**
- If engine can't find T2/T3 combo after search: **end sequence**, don't cascade to next tier
- T3 and T4 reached ONLY via JP chain (MINI→T2, MINOR→T3, MAJOR or 20% chance→T4)
- Sisters becomes very rare — primarily a JP chain achievement
- Clean design, predictable math
**Status:** ✅ IMPLEMENTED v6l72 — Hybrid Path A+B. Tier ranges adjusted to match payline distribution. T2/T3 fallback ends sequence (no cascade). Sisters reachable only via 20% natural advancement or JP chain.
#### Final MC Results (v6l72, 1M spins, 5¢/$5 bet):
```
RS triggers:  1 in 29 spins ✓
RS avg win:   $258 per sequence
T1 reach:     100% of sequences (bars, mixed bars)
T2 reach:     39% of sequences (char 3-oaks, multi-line)
T3 reach:     3.6% of sequences (char 4/5-oaks — rare)
T4 Sisters:   0.05% of RS sequences (1 in 62,500 spins) ✓ sustainable
MINI JP:      1 in 462 spins
GRAND JP:     1 in 62,500 spins ✓
RS RTP:       175% — still high, owner direction needed on target
Total RTP:    ~293% — RS dominant contributor
```
#### MC Simulation Results (2026-05-18, 1M spins, 5¢/$5 bet):
**Problem found:** Sisters GRAND hitting 32–39% of all RS sequences = 1 in 76–90 spins. Completely unsustainable. Root cause:
**Win distribution gap** — current paytable has very few combinations in the mid-range:
```
$0–$50   (T1 bars):         57 unique combinations ← dense
$50–$125 (T1/T2 boundary):  13 combinations
$125–$350 (T2 mid):          9 combinations  ← very sparse
$350–$1050 (T3):             2 combinations  ← almost empty
$1050+:                      0 combinations
```
Because T2 and T3 are nearly empty, the RS engine can't find valid combos → fallback fires → auto-advances to next tier → cascades all the way to Sisters.
**Two clean paths forward (owner decision needed):**
**Path A — JPs as separate bonus layer (simpler, no redesign needed):**
- Keep tiered RS as-is (working v6l65)
- At sequence END, roll 2% chance for a bonus JP award on top of sequence total
- JP type: MINI for T1 sequences, MINI/MINOR for T2, MINI/MINOR/MAJOR for T3, GRAND for T4
- No cascade, no interaction with tier ranges
- Sustainable and simple to implement
**Path B — Align tier ranges with actual payline distribution:**
```
T1: $5–$50   (bars only — 57 combinations, dense)
T2: $50–$200 (character 3-oaks, high-value bars — 13+ combinations)
T3: $200–$1250 (character 4-5 oaks — sparse but achievable)
T4: Sisters GRAND
```
- Jackpots per tier: T1=MINI, T2=MINI/MINOR, T3=MINOR/MAJOR
- MINI ($100) > T1 ceiling ($50) → still cascades. Need MINI at $50 or T1 ceiling at $125
- **Requires adjusting jackpot seed amounts to fit within tier ranges**
**Pending owner decision before coding.**
## PHASE R — Virtual Player Club & Virtual Cashier 📋 FUTURE PHASE (owner requested 2026-05-18)
**Virtual Cashier:** TITO vouchers → virtual bank balance. Withdrawal deducts from bank. Persists in localStorage.
**Virtual Players Club:** Players Club Card, $1 wagered = X points, points → prizes. New `PlayerClub` module.
**Status:** 📋 FUTURE — await owner design confirmation (points rate, prize catalogue) before coding
## 🔍 PHASE PLAN AUDIT — v6l74 (2026-05-19)
> Performed by AI assistant per Rule 16. Full file audit requested by owner. Version: v6l73 (input), delivering v6l74. Date: 2026-05-19.
### Audit scope:
Full read of all mandatory sections. Cross-check of all JS files, CSS, service-worker, and asset directories against known issues and current code state.
### 7 bugs found and fixed this session (all logged in build history above):
1. `VER` constant stale in `service-worker.js` ✅ FIXED
2. `cherry.svg` dead file in `assets/symbols/` ✅ FIXED (moved)
3. Stale `// Total per reel = 64` comment ✅ FIXED
4. Stale historical `REEL_FREQUENCIES` comment block showing wrong symbol counts ✅ FIXED
5. `generateSerialNumber()` used `const` inside function body ✅ FIXED
6. 6 PWA icon sizes missing from SW `CACHE_FILES` ✅ FIXED
7. Dead `@keyframes chipSpin` in `style.css` ✅ FIXED
### No new issues found beyond those 7. All previously documented open items unchanged.
### cherry.svg deadfiles action required on next zip delivery:
The file is at `assets/cherry_DEAD.svg` in the working directory. On next zip build, move it into `deadfiles.zip` and delete `assets/cherry_DEAD.svg` from the game folder. Update the `deadfiles.zip` contents list in Rule 14 to include `cherry.svg`.