import { useState, useCallback, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// SHARED CONSTANTS & DEFAULTS
// ═══════════════════════════════════════════════════════════
const REEL_SIZE = 80;
const WILD_IDS = [1, 2];
const BAR_IDS = [4, 5, 6];
const BONUS_IDS = [10, 11, 12, 13, 14];

const SYMBOL_META = {
  0:  { name: "Sisters",    emoji: "👯", color: "#ff6b35", key: "SISTERS"    },
  1:  { name: "Josie",      emoji: "🌟", color: "#ffd700", key: "JOSIE"      },
  2:  { name: "Sasha",      emoji: "💫", color: "#ffd700", key: "SASHA"      },
  3:  { name: "Seven",      emoji: "7",  color: "#ff4444", key: "SEVEN"      },
  4:  { name: "Triple Bar", emoji: "≡",  color: "#a0a0ff", key: "TRIPLE_BAR" },
  5:  { name: "Double Bar", emoji: "=",  color: "#8080dd", key: "DOUBLE_BAR" },
  6:  { name: "Single Bar", emoji: "—",  color: "#6060bb", key: "SINGLE_BAR" },
  8:  { name: "Lipstick",   emoji: "💄", color: "#ff69b4", key: "LIPSTICK"   },
  9:  { name: "Gold Coin",  emoji: "🪙", color: "#ffd700", key: "GOLD_COIN"  },
  10: { name: "Letter B",   emoji: "B",  color: "#4ecdc4", key: "LETTER_B"   },
  11: { name: "Letter O",   emoji: "O",  color: "#4ecdc4", key: "LETTER_O"   },
  12: { name: "Letter N",   emoji: "N",  color: "#4ecdc4", key: "LETTER_N"   },
  13: { name: "Letter U",   emoji: "U",  color: "#4ecdc4", key: "LETTER_U"   },
  14: { name: "Letter S",   emoji: "S",  color: "#4ecdc4", key: "LETTER_S"   },
  15: { name: "Diamond",    emoji: "💎", color: "#87ceeb", key: "DIAMOND"    },
  16: { name: "DJ Maxine",  emoji: "🎧", color: "#da70d6", key: "DJ_MAXINE"  },
  17: { name: "StrayPup",   emoji: "🐾", color: "#cd853f", key: "STRAYPUP"   },
};

// ── v6l65 calibrated values ────────────────────────────────
const DEFAULT_PAY_TABLE = {
  SISTERS:    [0,    0,    0   ],
  JOSIE:      [1250, 250,  40  ],
  SASHA:      [1250, 250,  40  ],
  STRAYPUP:   [500,  200,  100 ],
  DJ_MAXINE:  [350,  150,  80  ],
  SEVEN:      [50,   20,   10  ],  // v6l65 calibrated
  DIAMOND:    [15,    6,    3  ],  // v6l65 calibrated
  TRIPLE_BAR: [40,   25,   15  ],  // v6l65 calibrated
  DOUBLE_BAR: [25,   15,    8  ],  // v6l65 calibrated
  SINGLE_BAR: [12,    8,    4  ],  // v6l65 calibrated
  LIPSTICK:   [0,    0,    0   ],
};

const DEFAULT_HAS_OAK = {
  SISTERS:    [false, false, false],
  JOSIE:      [true,  true,  true ],
  SASHA:      [true,  true,  true ],
  STRAYPUP:   [true,  true,  true ],
  DJ_MAXINE:  [true,  true,  true ],
  SEVEN:      [true,  true,  true ],
  DIAMOND:    [true,  true,  true ],
  TRIPLE_BAR: [true,  true,  true ],
  DOUBLE_BAR: [true,  true,  true ],
  SINGLE_BAR: [true,  true,  true ],
  LIPSTICK:   [false, false, false],
};

const DEFAULT_MIXED_BAR = { 3: 3, 4: 5, 5: 10 }; // v6l65 calibrated

const DEFAULT_REEL_FREQ = {
  0: 1, 1: 2, 2: 2, 17: 2, 16: 3,
  3: 5, 4: 9, 5: 10, 6: 7, 15: 6,
  8: 13, 9: 10, bonus: 10,
};

const SYMBOL_LIST = [
  { key: "SISTERS",    id: 0,  noPaylines: true,  note: "Grand jackpot only"          },
  { key: "JOSIE",      id: 1,  noPaylines: false,  note: "Wild ×4 · MINOR trigger"    },
  { key: "SASHA",      id: 2,  noPaylines: false,  note: "Wild ×2 · MINI trigger"     },
  { key: "STRAYPUP",   id: 17, noPaylines: false,  note: "Premium character"          },
  { key: "DJ_MAXINE",  id: 16, noPaylines: false,  note: "Premium character"          },
  { key: "SEVEN",      id: 3,  noPaylines: false,  note: "Mid-tier"                   },
  { key: "DIAMOND",    id: 15, noPaylines: false,  note: "Mid-tier"                   },
  { key: "TRIPLE_BAR", id: 4,  noPaylines: false,  note: "Bar symbol"                 },
  { key: "DOUBLE_BAR", id: 5,  noPaylines: false,  note: "Bar symbol"                 },
  { key: "SINGLE_BAR", id: 6,  noPaylines: false,  note: "Bar symbol"                 },
  { key: "LIPSTICK",   id: 8,  noPaylines: true,   note: "P&C bonus trigger only"     },
];

const REEL_FIXED = [
  { id: 0,  name: "Sisters"   }, { id: 1,  name: "Josie"     },
  { id: 2,  name: "Sasha"     }, { id: 17, name: "StrayPup"  },
  { id: 16, name: "DJ Maxine" }, { id: 3,  name: "Seven"     },
  { id: 4,  name: "Triple Bar"}, { id: 5,  name: "Double Bar"},
  { id: 6,  name: "Single Bar"}, { id: 15, name: "Diamond"   },
  { id: 8,  name: "Lipstick"  }, { id: 9,  name: "Gold Coin" },
];

const PAYLINES = [
  [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],
  [0,1,2,1,0],[2,1,0,1,2],[1,0,1,0,1],
  [0,1,0,1,0],[0,1,1,1,0],[2,1,1,1,2],
  [1,2,0,2,1],[1,0,2,0,1],[0,0,1,0,0],
  [2,2,1,2,2],[1,1,0,0,0],[0,0,1,1,1],
  [1,0,0,0,1],[1,2,2,2,1],[2,1,1,0,0],
  [0,1,1,2,2],[1,0,1,2,1],
];

const DEFAULT_HS_TIERS = [
  { weight: 0.40, minFrac: 0.03, maxFrac: 0.12, label: "Tiny"   },
  { weight: 0.25, minFrac: 0.12, maxFrac: 0.35, label: "Small"  },
  { weight: 0.14, minFrac: 0.35, maxFrac: 0.85, label: "Medium" },
  { weight: 0.08, minFrac: 0.85, maxFrac: 2.50, label: "Large"  },
  { weight: 0.04, minFrac: 2.50, maxFrac: 6.00, label: "Big"    },
  { weight: 0.01, minFrac: 6.00, maxFrac: 15.0, label: "Huge"   },
];

const HS_JP_TIERS = [
  { level: "MINI",  weight: 0.008  },
  { level: "MINOR", weight: 0.003  },
  { level: "MAJOR", weight: 0.0008 },
  { level: "GRAND", weight: 0.0002 },
];

// ═══════════════════════════════════════════════════════════
// REEL ENGINE
// ═══════════════════════════════════════════════════════════
function buildStrip(reelIdx, freq) {
  const strip = [];
  const bonusId = BONUS_IDS[reelIdx];
  Object.entries(freq).forEach(([k, v]) => {
    const id = k === "bonus" ? bonusId : parseInt(k);
    for (let i = 0; i < v; i++) strip.push(id);
  });
  let seed = 0xBEEF1234 + reelIdx * 0x9E3779B9;
  const lcg = () => { seed = Math.imul(seed, 1664525) + 1013904223; return (seed >>> 0) / 0x100000000; };
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

function getGrid(strips, stops) {
  return strips.map((strip, r) => [
    strip[(stops[r] + REEL_SIZE - 1) % REEL_SIZE],
    strip[stops[r]],
    strip[(stops[r] + 1) % REEL_SIZE],
  ]);
}

function evalLine(row, payTable, mixedBar) {
  let len = 0, wilds = 0, baseId = null;
  for (let r = 0; r < 5; r++) {
    const s = row[r];
    if (WILD_IDS.includes(s)) { wilds++; len++; continue; }
    if (baseId === null) { baseId = s; len++; continue; }
    if (s === baseId || (BAR_IDS.includes(s) && BAR_IDS.includes(baseId))) { len++; continue; }
    break;
  }
  if (len < 3) return 0;
  if (BAR_IDS.includes(baseId) && wilds === 0) {
    const ids = row.slice(0, len);
    const uniqueBars = new Set(ids.filter(s => BAR_IDS.includes(s)));
    if (uniqueBars.size > 1 && mixedBar[len]) return mixedBar[len];
  }
  if (baseId === null) return 0;
  const key = SYMBOL_META[baseId]?.key;
  if (!key || !payTable[key]) return 0;
  const pays = payTable[key];
  const mult = wilds === 2 ? 6 : wilds === 1 ? 2 : 1;
  const payIdx = len === 5 ? 0 : len === 4 ? 1 : 2;
  return (pays[payIdx] || 0) * mult;
}

function evalSpin(strips, stops, lines, payTable, mixedBar) {
  const grid = getGrid(strips, stops);
  let totalCredits = 0, anyWin = false, goldCoins = 0, lipstick5oak = false;
  for (let l = 0; l < lines; l++) {
    const row = PAYLINES[l].map((rowIdx, reel) => grid[reel][rowIdx]);
    const credits = evalLine(row, payTable, mixedBar);
    if (credits > 0) { totalCredits += credits; anyWin = true; }
    if (row.every(s => s === 8)) lipstick5oak = true;
  }
  grid.forEach(col => col.forEach(s => { if (s === 9) goldCoins++; }));
  return { credits: totalCredits, anyWin, goldCoins, lipstick5oak };
}

// ═══════════════════════════════════════════════════════════
// CODE GENERATOR
// ═══════════════════════════════════════════════════════════
function genPaytableJS(pays, hasOak, mixedBar, reelFreq) {
  const buildPay = (key) => {
    const p = pays[key]; const h = hasOak[key];
    return `[${(h[0]?p[0]:0).toString().padStart(4)}, ${(h[1]?p[1]:0).toString().padStart(3)}, ${(h[2]?p[2]:0).toString().padStart(4)},   0]`;
  };
  const freqLine = (bonus_id) => {
    const f = reelFreq;
    return `{ 0:${f[0]}, 1:${f[1]}, 2:${f[2]}, 17:${f[17]}, 16:${f[16]}, 3:${f[3]}, 4:${f[4]}, 5:${f[5]}, 6:${f[6]}, 15:${f[15]}, 8:${f[8]}, 9:${f[9]}, ${bonus_id}:${f.bonus} }`;
  };
  const baseSum = [0,1,2,17,16,3,4,5,6,15,8,9].reduce((s,id) => s + (reelFreq[id]||0), 0) + (reelFreq.bonus||0);
  const today = new Date().toISOString().slice(0,10);
  return `// PAY_TABLE — v6l64 owner-confirmed ${today}
// [5-oak, 4-oak, 3-oak, 2-oak] × bet/line
const PAY_TABLE = {
  SISTERS:    ${buildPay("SISTERS")},
  JOSIE:      ${buildPay("JOSIE")},
  SASHA:      ${buildPay("SASHA")},
  STRAYPUP:   ${buildPay("STRAYPUP")},
  DJ_MAXINE:  ${buildPay("DJ_MAXINE")},
  SEVEN:      ${buildPay("SEVEN")},
  DIAMOND:    ${buildPay("DIAMOND")},
  TRIPLE_BAR: ${buildPay("TRIPLE_BAR")},
  DOUBLE_BAR: ${buildPay("DOUBLE_BAR")},
  SINGLE_BAR: ${buildPay("SINGLE_BAR")},
  LIPSTICK:   ${buildPay("LIPSTICK")},
};

const MIXED_BAR_PAY = { 3: ${mixedBar[3]}, 4: ${mixedBar[4]}, 5: ${mixedBar[5]} };

// REEL_FREQUENCIES — All reels Σ = ${baseSum} ${baseSum === 80 ? "✅" : "⚠️ NOT 80"}
const REEL_FREQUENCIES = [
  // Reel 1 — BONUS-B | Σ=${baseSum}
  ${freqLine(10)},
  // Reel 2 — BONUS-O | Σ=${baseSum}
  ${freqLine(11)},
  // Reel 3 — BONUS-N | Σ=${baseSum}
  ${freqLine(12)},
  // Reel 4 — BONUS-U | Σ=${baseSum}
  ${freqLine(13)},
  // Reel 5 — BONUS-S | Σ=${baseSum}
  ${freqLine(14)},
];`;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const clsx = (...a) => a.filter(Boolean).join(" ");

const INPUT_CLS = "bg-zinc-800 border border-zinc-600 text-amber-300 text-center rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30";
const SELECT_CLS = "bg-zinc-800 border border-zinc-600 text-amber-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400";

function StatCard({ label, value, color, big }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-center">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className={clsx("font-bold tabular-nums", big ? "text-2xl" : "text-lg")} style={{ color }}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1 — PAYTABLE EDITOR (merged from paytable_editor.jsx)
// ═══════════════════════════════════════════════════════════
function PaytableEditorTab({ pays, setPays, hasOak, setHasOak, mixedBar, setMixedBar, reelFreq, setReelFreq }) {
  const [subTab, setSubTab] = useState("pays");
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const OAK_LABELS = ["5-oak", "4-oak", "3-oak"];

  const updatePay = (key, idx, val) => {
    setPays(prev => { const n = { ...prev, [key]: [...prev[key]] }; n[key][idx] = Math.max(0, parseInt(val)||0); return n; });
  };

  const toggleOak = (key, idx) => {
    setHasOak(prev => {
      const n = { ...prev, [key]: [...prev[key]] };
      n[key][idx] = !n[key][idx];
      if (idx === 2 && !n[key][2]) { n[key][0] = false; n[key][1] = false; }
      if (idx === 0 && n[key][0])  { n[key][1] = true;  n[key][2] = true;  }
      if (idx === 1 && n[key][1])  { n[key][2] = true; }
      return n;
    });
  };

  const updateReelFreq = (id, val) => {
    setReelFreq(prev => ({ ...prev, [id]: Math.max(0, parseInt(val)||0) }));
  };

  const baseSum = [0,1,2,17,16,3,4,5,6,15,8,9].reduce((s,id) => s + (reelFreq[id]||0), 0) + (reelFreq.bonus||0);
  const totalOk = baseSum === 80;

  const generatedCode = genPaytableJS(pays, hasOak, mixedBar, reelFreq);
  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };
  const resetAll = () => {
    setPays(JSON.parse(JSON.stringify(DEFAULT_PAY_TABLE)));
    setHasOak(JSON.parse(JSON.stringify(DEFAULT_HAS_OAK)));
    setMixedBar({ ...DEFAULT_MIXED_BAR });
    setReelFreq({ ...DEFAULT_REEL_FREQ });
  };

  const oakColor = (enabled) => enabled
    ? "bg-amber-500 text-black font-bold"
    : "bg-zinc-700 text-zinc-500";

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {[{ id:"pays", label:"💰 Pays" }, { id:"reels", label:"🎰 Reel Freq" }].map(t => (
            <button key={t.id} onClick={() => setSubTab(t.id)}
              className={clsx("px-4 py-1.5 text-xs rounded-full border transition-all font-semibold",
                subTab === t.id ? "bg-amber-600/20 border-amber-500 text-amber-300" : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={resetAll} className="text-xs px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white transition-all">↺ Reset</button>
          <button onClick={() => setShowCode(s => !s)} className="text-xs px-3 py-1.5 rounded border border-amber-700/50 bg-zinc-800 text-amber-300 hover:bg-amber-900/20 transition-all">
            {showCode ? "▼ Hide Code" : "▲ Export Code"}
          </button>
        </div>
      </div>

      {/* PAY VALUES */}
      {subTab === "pays" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">Toggle 3/4/5-oak buttons to enable/disable tier, then set credit value.</p>
          <div className="overflow-x-auto rounded-lg border border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-700">
                  <th className="py-2 px-3 text-left text-zinc-400 text-xs">Symbol</th>
                  {["5-of-a-Kind","4-of-a-Kind","3-of-a-Kind"].map((h,i) => (
                    <th key={i} className="py-2 px-3 text-center text-xs" style={{ color: i===0?"#fbbf24":i===1?"#f59e0b":"#d97706" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SYMBOL_LIST.map(sym => {
                  const meta = SYMBOL_META[sym.id];
                  return (
                    <tr key={sym.key} className={clsx("border-b border-zinc-800 hover:bg-zinc-800/30", sym.noPaylines && "opacity-50")}>
                      <td className="py-2 px-3">
                        <span className="text-lg mr-1.5">{meta.emoji}</span>
                        <span className="font-semibold text-white text-xs">{meta.name}</span>
                        <span className="ml-2 text-zinc-600 text-xs hidden md:inline">{sym.note}</span>
                      </td>
                      {OAK_LABELS.map((label, i) => {
                        const active = hasOak[sym.key]?.[i];
                        return (
                          <td key={i} className="py-2 px-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => !sym.noPaylines && toggleOak(sym.key, i)}
                                className={clsx("text-xs px-2 py-0.5 rounded transition-all",
                                  sym.noPaylines ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : oakColor(active) + " cursor-pointer hover:opacity-90")}>
                                {label}
                              </button>
                              {active && !sym.noPaylines ? (
                                <input type="number" min="0" value={pays[sym.key]?.[i] ?? 0}
                                  onChange={e => updatePay(sym.key, i, e.target.value)}
                                  className={INPUT_CLS + " w-20"} />
                              ) : <span className="text-zinc-600 text-sm w-20 text-center">—</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mixed Bar */}
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-700">
            <h3 className="text-xs font-bold text-amber-400 mb-3">🍫 Mixed Bar Pay (any bar combo on payline)</h3>
            <div className="flex flex-wrap gap-4">
              {[3,4,5].map(n => (
                <div key={n} className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs">{n}-oak:</span>
                  <input type="number" min="0" value={mixedBar[n]}
                    onChange={e => setMixedBar(prev => ({ ...prev, [n]: Math.max(0, parseInt(e.target.value)||0) }))}
                    className={INPUT_CLS + " w-20"} />
                  <span className="text-zinc-600 text-xs">× betPerLine</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REEL FREQUENCIES */}
      {subTab === "reels" && (
        <div className="space-y-3">
          <div className={clsx("px-3 py-2 rounded text-xs font-bold border",
            totalOk ? "bg-green-900/20 border-green-700 text-green-400" : "bg-red-900/20 border-red-700 text-red-400")}>
            {totalOk ? `✅ Reel Σ = ${baseSum} / 80 — VALID` : `⚠️ Reel Σ = ${baseSum} / 80 — must equal 80! (${baseSum>80?"+":""}${baseSum-80})`}
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-700">
                  <th className="py-2 px-3 text-left text-zinc-400 text-xs">Symbol</th>
                  <th className="py-2 px-3 text-center text-zinc-500 text-xs">ID</th>
                  {["R1","R2","R3","R4","R5"].map(r => (
                    <th key={r} className="py-2 px-3 text-center text-amber-400 text-xs">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REEL_FIXED.map(sym => (
                  <tr key={sym.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                    <td className="py-1.5 px-3 text-zinc-300 text-xs">{SYMBOL_META[sym.id]?.emoji} {sym.name}</td>
                    <td className="py-1.5 px-3 text-zinc-600 text-xs text-center">{sym.id}</td>
                    {[0,1,2,3,4].map(r => (
                      <td key={r} className="py-1 px-2 text-center">
                        <input type="number" min="0" value={reelFreq[sym.id]||0}
                          onChange={e => updateReelFreq(sym.id, e.target.value)}
                          className={INPUT_CLS + " w-14"} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-zinc-800 bg-amber-950/10">
                  <td className="py-1.5 px-3 text-amber-400 text-xs font-semibold">BONUS Letter</td>
                  <td className="py-1.5 px-3 text-zinc-500 text-xs text-center">10–14</td>
                  {[0,1,2,3,4].map(r => (
                    <td key={r} className="py-1 px-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs text-amber-500">{"BONUS"[r]}</span>
                        <input type="number" min="0" value={reelFreq.bonus||0}
                          onChange={e => updateReelFreq("bonus", e.target.value)}
                          className={INPUT_CLS + " w-14"} />
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className={clsx("font-bold text-xs", totalOk ? "bg-green-900/10 text-green-400" : "bg-red-900/10 text-red-400")}>
                  <td className="py-2 px-3" colSpan={2}>Σ Total / 80</td>
                  {[0,1,2,3,4].map(r => <td key={r} className="py-2 px-2 text-center">{baseSum}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-600">Gold Coin (id:9) → H&S frequency. Lipstick (id:8) → P&C frequency.</p>
        </div>
      )}

      {/* Generated Code */}
      {showCode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400">Generated Code — paste into paytable.js</h3>
            <button onClick={copyCode}
              className={clsx("text-xs px-3 py-1.5 rounded border transition-all",
                copied ? "bg-green-800 border-green-600 text-green-300" : "bg-zinc-800 border-zinc-600 text-amber-300 hover:bg-amber-900/20")}>
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>
          {!totalOk && <div className="px-3 py-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-400">⚠️ Reel total is {baseSum}, not 80. Fix before deploying.</div>}
          <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-xs text-green-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
            {generatedCode}
          </pre>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2 — MONTE CARLO SIMULATOR (with live adjustable settings)
// ═══════════════════════════════════════════════════════════
function MonteCarloTab({ pays, mixedBar, reelFreq }) {
  const [spins, setSpins] = useState(100000);
  const [lines, setLines] = useState(20);
  const [denom, setDenom] = useState(0.05);
  const [credPerLine, setCredPerLine] = useState(1);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const cancelRef = useRef(false);
  const [strips, setStrips] = useState(null);

  // Rebuild strips when reelFreq changes
  useEffect(() => {
    setStrips([0,1,2,3,4].map(i => buildStrip(i, reelFreq)));
    setResults(null);
  }, [reelFreq]);

  // Rebuild payTable from current editor state
  const payTable = {};
  SYMBOL_LIST.forEach(sym => { payTable[sym.key] = pays[sym.key] || [0,0,0]; });

  const run = useCallback(() => {
    if (!strips) return;
    cancelRef.current = false;
    setRunning(true);
    setProgress(0);
    setResults(null);

    let totalBet = 0, totalWon = 0, wins = 0, hsTriggers = 0, pcTriggers = 0;
    const CHUNK = 2000;
    let done = 0;
    const payDist = {};
    const REEL_SZ = strips[0].length;

    const tick = () => {
      if (cancelRef.current) { setRunning(false); return; }
      const end = Math.min(done + CHUNK, spins);
      for (let i = done; i < end; i++) {
        const stops = strips.map(s => Math.floor(Math.random() * REEL_SZ));
        const { credits, anyWin, goldCoins, lipstick5oak } = evalSpin(strips, stops, lines, payTable, mixedBar);
        totalBet += lines;
        totalWon += credits;
        if (anyWin) wins++;
        if (goldCoins >= 6) hsTriggers++;
        if (lipstick5oak) pcTriggers++;
        const k = credits===0?"0":credits<=10?"1-10":credits<=50?"11-50":credits<=200?"51-200":"200+";
        payDist[k] = (payDist[k]||0) + 1;
      }
      done = end;
      setProgress(Math.round((done/spins)*100));
      if (done < spins) setTimeout(tick, 0);
      else { setResults({ totalBet, totalWon, wins, hsTriggers, pcTriggers, spins: done, payDist, lines }); setRunning(false); }
    };
    setTimeout(tick, 0);
  }, [spins, lines, strips, payTable, mixedBar]);

  const rtp     = results ? (results.totalWon / results.totalBet * 100).toFixed(2) : null;
  const hitRate = results ? (results.wins / results.spins * 100).toFixed(1) : null;
  const hsFreq  = results ? Math.round(results.spins / (results.hsTriggers || 1)) : null;
  const pcFreq  = results ? Math.round(results.spins / (results.pcTriggers || 1)) : null;
  const totalBet = denom * credPerLine * lines;

  const rtpColor = rtp ? (+rtp > 80 ? "#ff6b6b" : +rtp >= 65 ? "#51cf66" : "#ffd43b") : "#ffd700";

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900 border border-amber-700/30 rounded-lg p-4">
        <h3 className="text-xs font-bold text-amber-400 mb-3 uppercase tracking-wider">⚙️ Simulation Settings</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Spins</label>
            <select value={spins} onChange={e => { setSpins(+e.target.value); setResults(null); }} className={SELECT_CLS}>
              {[10000,50000,100000,500000,1000000].map(n => <option key={n} value={n}>{n.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Active Lines</label>
            <select value={lines} onChange={e => { setLines(+e.target.value); setResults(null); }} className={SELECT_CLS}>
              {[1,5,10,15,20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Denomination</label>
            <select value={denom} onChange={e => setDenom(+e.target.value)} className={SELECT_CLS}>
              {[0.01,0.02,0.05,0.10,0.25,0.50,1.00].map(d => (
                <option key={d} value={d}>{d < 1 ? `${d*100}¢` : `$${d}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Credits / Line</label>
            <select value={credPerLine} onChange={e => setCredPerLine(+e.target.value)} className={SELECT_CLS}>
              {[1,2,3,5].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="bg-zinc-800 border border-amber-600/40 rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-zinc-500">Total Bet</div>
            <div className="text-lg font-bold text-amber-400">${totalBet.toFixed(2)}</div>
          </div>
          <button
            onClick={running ? () => { cancelRef.current = true; } : run}
            className={clsx("px-6 py-2 rounded-lg text-sm font-bold border transition-all",
              running ? "bg-red-800 text-red-200 border-red-600 hover:bg-red-700"
                      : "bg-amber-600 text-black border-amber-400 hover:bg-amber-500")}>
            {running ? `⏹ Stop (${progress}%)` : "▶ Run Simulation"}
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-2">💡 Uses current Paytable Editor values — edit pays/reels, then run simulation to see impact.</p>
      </div>

      {running && (
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Base Game RTP" value={`${rtp}%`} color={rtpColor} big />
            <StatCard label="Hit Rate" value={`${hitRate}%`} color="#74c0fc" />
            <StatCard label="H&S Trigger" value={`1 in ${hsFreq?.toLocaleString()}`} color="#ffd700" />
            <StatCard label="P&C Trigger" value={`1 in ${pcFreq?.toLocaleString()}`} color="#ff69b4" />
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
            <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Win Distribution</h3>
            {["0","1-10","11-50","51-200","200+"].map(k => {
              const count = results.payDist[k] || 0;
              const pct = (count / results.spins * 100).toFixed(1);
              return (
                <div key={k} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-zinc-400 w-16 text-right">{k==="0"?"No win":k+"cr"}</span>
                  <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${Math.min(+pct,100)}%`, background: k==="0"?"#3f3f46":"#d97706" }} />
                  </div>
                  <span className="text-xs text-zinc-300 w-12 tabular-nums">{pct}%</span>
                  <span className="text-xs text-zinc-600 w-16 tabular-nums">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-zinc-600 text-right">{results.spins.toLocaleString()} spins · {results.lines} lines active · RTP target 68–74% base</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 3 — REEL VISUALIZER
// ═══════════════════════════════════════════════════════════
function ReelVisualizerTab({ reelFreq }) {
  const [selReel, setSelReel] = useState(0);
  const [highlight, setHighlight] = useState(null);

  const strips = [0,1,2,3,4].map(i => buildStrip(i, reelFreq));
  const strip = strips[selReel];
  const counts = {};
  strip.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

  let gaps = [];
  if (highlight !== null) {
    const positions = strip.reduce((a, id, i) => { if (id === +highlight) a.push(i); return a; }, []);
    for (let i = 1; i < positions.length; i++) gaps.push(positions[i] - positions[i-1]);
    if (positions.length > 1) gaps.push((REEL_SIZE - positions[positions.length-1]) + positions[0]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Reel</label>
          <div className="flex gap-1">
            {[0,1,2,3,4].map(r => (
              <button key={r} onClick={() => setSelReel(r)}
                className={clsx("px-3 py-1.5 rounded-lg text-sm font-bold border transition-all",
                  selReel===r ? "bg-amber-600 border-amber-400 text-black" : "bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-400")}>
                R{r+1}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Highlight Symbol</label>
          <select value={highlight??""} onChange={e => setHighlight(e.target.value===""?null:e.target.value)} className={SELECT_CLS}>
            <option value="">— none —</option>
            {Object.entries(counts).sort((a,b)=>+a[0]-+b[0]).map(([id]) => (
              <option key={id} value={id}>{SYMBOL_META[id]?.emoji} {SYMBOL_META[id]?.name} (id:{id})</option>
            ))}
          </select>
        </div>
      </div>

      {highlight !== null && (
        <div className="flex gap-3 flex-wrap">
          {[
            { label:"Count", value: counts[highlight]||0 },
            { label:"Frequency", value:`1 in ${(80/(counts[highlight]||1)).toFixed(1)}` },
            { label:"Min Gap", value: gaps.length?Math.min(...gaps):"—" },
            { label:"Max Gap", value: gaps.length?Math.max(...gaps):"—" },
          ].map(m => <StatCard key={m.label} label={m.label} value={m.value} color="#fbbf24" />)}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 overflow-x-auto">
        <div className="text-xs text-zinc-500 mb-2">80 stops — left-to-right, top-to-bottom</div>
        <div className="grid gap-0.5" style={{ gridTemplateColumns:"repeat(10,minmax(0,1fr))" }}>
          {strip.map((id, i) => {
            const meta = SYMBOL_META[id] || { emoji:"?", color:"#888", name:"?" };
            const isHl = highlight !== null && +id === +highlight;
            return (
              <div key={i} title={`Stop ${i}: ${meta.name} (id:${id})`}
                className={clsx("flex flex-col items-center justify-center rounded text-center transition-all cursor-default",
                  isHl ? "ring-2 ring-white scale-105 z-10" : "opacity-80 hover:opacity-100")}
                style={{ background: isHl?meta.color+"44":"#27272a", border:`1px solid ${isHl?meta.color:"#3f3f46"}`, padding:"3px", minHeight:"38px" }}>
                <span style={{ fontSize:"11px", lineHeight:1 }}>{meta.emoji}</span>
                <span className="text-zinc-600" style={{ fontSize:"8px" }}>{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Symbol Count — Reel {selReel+1}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id, cnt]) => {
            const meta = SYMBOL_META[id] || { emoji:"?", color:"#888", name:`id:${id}` };
            return (
              <div key={id} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-zinc-700 transition-all"
                onClick={() => setHighlight(highlight===id?null:id)}
                style={{ borderLeft:`3px solid ${meta.color}` }}>
                <span>{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-300 truncate">{meta.name}</div>
                  <div className="text-xs text-zinc-500">1 in {(80/cnt).toFixed(1)}</div>
                </div>
                <div className="text-sm font-bold tabular-nums ml-auto" style={{ color: meta.color }}>{cnt}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 4 — PAY CALCULATOR
// ═══════════════════════════════════════════════════════════
function PayCalculatorTab({ pays, mixedBar }) {
  const [denom, setDenom] = useState(0.05);
  const [credPerLine, setCredPerLine] = useState(1);
  const [lines, setLines] = useState(20);

  const totalBet = denom * credPerLine * lines;
  const fmt = (credits) => ({ credits, cash: (credits * credPerLine * denom).toFixed(2) });

  const rows = [
    { sym:"Josie / Sasha 🌟💫", pays: pays["JOSIE"], wild:true },
    { sym:"StrayPup 🐾",        pays: pays["STRAYPUP"] },
    { sym:"DJ Maxine 🎧",       pays: pays["DJ_MAXINE"] },
    { sym:"Seven 7️⃣",           pays: pays["SEVEN"] },
    { sym:"Diamond 💎",         pays: pays["DIAMOND"] },
    { sym:"Triple Bar ≡",       pays: pays["TRIPLE_BAR"] },
    { sym:"Double Bar =",       pays: pays["DOUBLE_BAR"] },
    { sym:"Single Bar —",       pays: pays["SINGLE_BAR"] },
    { sym:"Mixed Bar (3-oak)",  pays: [0,0,mixedBar[3]] },
    { sym:"Mixed Bar (4-oak)",  pays: [0,mixedBar[4],0] },
    { sym:"Mixed Bar (5-oak)",  pays: [mixedBar[5],0,0] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Denomination</label>
          <select value={denom} onChange={e => setDenom(+e.target.value)} className={SELECT_CLS}>
            {[0.01,0.02,0.05,0.10,0.25,0.50,1.00,2.00,5.00,10.00].map(d => (
              <option key={d} value={d}>{d<1?`${d*100}¢`:`$${d.toFixed(0)}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Credits / Line</label>
          <select value={credPerLine} onChange={e => setCredPerLine(+e.target.value)} className={SELECT_CLS}>
            {[1,2,3,5].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Lines</label>
          <select value={lines} onChange={e => setLines(+e.target.value)} className={SELECT_CLS}>
            {[1,5,10,15,20].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="bg-zinc-900 border border-amber-600/40 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-zinc-500">Total Bet</div>
          <div className="text-xl font-bold text-amber-400">${totalBet.toFixed(2)}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-700">
              <th className="py-2 px-3 text-left text-zinc-400">Symbol</th>
              <th className="py-2 px-3 text-right text-amber-400">5-oak cr</th>
              <th className="py-2 px-3 text-right text-amber-400">5-oak $</th>
              <th className="py-2 px-3 text-right text-amber-300">4-oak cr</th>
              <th className="py-2 px-3 text-right text-amber-300">4-oak $</th>
              <th className="py-2 px-3 text-right text-amber-200">3-oak cr</th>
              <th className="py-2 px-3 text-right text-amber-200">3-oak $</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                <td className="py-2 px-3 text-zinc-300">{row.sym}</td>
                {[0,1,2].map(idx => {
                  const base = row.pays?.[idx] || 0;
                  const { credits, cash } = fmt(base);
                  return [
                    <td key={`cr${idx}`} className={clsx("py-2 px-3 text-right tabular-nums", base===0?"text-zinc-700":"text-amber-300")}>
                      {base===0?"—":<span title={row.wild?`×6 wild: ${fmt(base*6).credits}cr`:""}>
                        {credits}{row.wild&&base>0?<span className="text-zinc-500 ml-1">→{fmt(base*6).credits}</span>:null}
                      </span>}
                    </td>,
                    <td key={`d${idx}`} className={clsx("py-2 px-3 text-right tabular-nums", base===0?"text-zinc-700":"text-green-400")}>
                      {base===0?"—":<span>${cash}{row.wild&&base>0?<span className="text-zinc-500 ml-1">→${fmt(base*6).cash}</span>:null}</span>}
                    </td>
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-600">Wild columns show base → ×6 (both wilds active). Cash = credits × cr/line × denom.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 5 — HOLD & SPIN TUNER
// ═══════════════════════════════════════════════════════════
function HSTunerTab() {
  const [tiers, setTiers] = useState(DEFAULT_HS_TIERS.map(t => ({ ...t })));
  const [nearMiss, setNearMiss] = useState(1.8);
  const [landProb, setLandProb] = useState(0.055);
  const [totalBet, setTotalBet] = useState(1.00);

  const totalWeight = tiers.reduce((s,t) => s+t.weight, 0);
  const jpWeight = HS_JP_TIERS.reduce((s,t) => s+t.weight, 0);
  const allWeight = totalWeight + jpWeight;
  const weightOk = Math.abs(allWeight - 1) < 0.001;

  const updateTier = (i, field, val) => setTiers(prev => prev.map((t,idx) => idx===i?{...t,[field]:+val}:t));

  const avgCoinVal = tiers.reduce((s,t) => {
    const mid = (t.minFrac + t.maxFrac)/2 * totalBet;
    return s + (t.weight/allWeight)*mid;
  }, 0);

  const avgCoinsPerHS = landProb > 0 ? (landProb*15)/(1-Math.pow(1-landProb,3)) : 6;
  const avgHSWin = avgCoinVal * avgCoinsPerHS * nearMiss * 0.9;

  const colors = ["#3b82f6","#22c55e","#eab308","#f97316","#ef4444","#a855f7"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-end">
        {[
          { label:"Total Bet ($)", val:totalBet, set:setTotalBet, min:0.01, step:0.25 },
          { label:"Near-Miss Boost", val:nearMiss, set:setNearMiss, min:1, max:5, step:0.1 },
          { label:"Coin Land Prob", val:landProb, set:setLandProb, min:0.01, max:0.5, step:0.005 },
        ].map(({ label, val, set, ...rest }) => (
          <div key={label}>
            <label className="block text-xs text-zinc-400 mb-1">{label}</label>
            <input type="number" value={val} onChange={e => set(+e.target.value)} {...rest}
              className="w-28 bg-zinc-800 border border-zinc-600 text-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Avg Coin Value"  value={`$${avgCoinVal.toFixed(3)}`} color="#ffd700" />
        <StatCard label="Avg Coins / H&S" value={avgCoinsPerHS.toFixed(1)}    color="#74c0fc" />
        <StatCard label="Avg H&S Win"     value={`$${avgHSWin.toFixed(2)}`}   color="#51cf66" />
        <StatCard label="Tier Weights Σ"  value={allWeight.toFixed(4)}        color={weightOk?"#51cf66":"#ff6b6b"} />
      </div>

      {!weightOk && (
        <div className="px-3 py-2 bg-red-900/20 border border-red-700 rounded-lg text-xs text-red-400">
          ⚠️ Cash tiers = {totalWeight.toFixed(4)} + JP {jpWeight.toFixed(4)} = {allWeight.toFixed(4)} — should equal 1.0000
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Cash Coin Tiers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Tier","Weight","Min Frac","Max Frac","Min $","Max $","Mid $"].map(h => (
                  <th key={h} className="py-2 px-3 text-center text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map((t, i) => (
                <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/40">
                  <td className="py-1.5 px-3 font-semibold text-zinc-300">{t.label} <span className="text-zinc-600 font-normal">({(t.weight/allWeight*100).toFixed(1)}%)</span></td>
                  {["weight","minFrac","maxFrac"].map(field => (
                    <td key={field} className="py-1 px-2 text-center">
                      <input type="number" min="0" step={field==="weight"?0.01:0.01} value={t[field]}
                        onChange={e => updateTier(i, field, e.target.value)}
                        className="w-20 bg-zinc-800 border border-zinc-600 text-amber-300 text-right rounded px-2 py-0.5 text-xs focus:outline-none focus:border-amber-400" />
                    </td>
                  ))}
                  <td className="py-1.5 px-3 text-center text-green-400">${(t.minFrac*totalBet).toFixed(2)}</td>
                  <td className="py-1.5 px-3 text-center text-green-400">${(t.maxFrac*totalBet).toFixed(2)}</td>
                  <td className="py-1.5 px-3 text-center text-amber-400 font-semibold">${((t.minFrac+t.maxFrac)/2*totalBet).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Coin Range at ${totalBet.toFixed(2)} Bet</h3>
        {tiers.map((t, i) => {
          const maxD = t.maxFrac * totalBet;
          const pct = Math.min((maxD / (tiers[tiers.length-1].maxFrac * totalBet))*100, 100);
          return (
            <div key={i} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-zinc-400 w-14">{t.label}</span>
              <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width:`${pct}%`, background: colors[i] }} />
              </div>
              <span className="text-xs text-zinc-300 w-28 tabular-nums">${(t.minFrac*totalBet).toFixed(2)} – ${(t.maxFrac*totalBet).toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Jackpot Tiers (read-only · edit in paytable.js)</h3>
        <div className="flex flex-wrap gap-3">
          {HS_JP_TIERS.map(t => (
            <div key={t.level} className="bg-zinc-800 rounded-lg px-4 py-2 text-center">
              <div className="text-xs text-amber-400 font-bold">{t.level}</div>
              <div className="text-sm font-bold text-zinc-300">{t.weight}</div>
              <div className="text-xs text-zinc-500">1 in {Math.round(1/t.weight).toLocaleString()} H&S</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 6 — RTP BREAKDOWN ANALYZER (new tool)
// ═══════════════════════════════════════════════════════════
function RTPAnalyzerTab({ pays, mixedBar, reelFreq }) {
  const [denom, setDenom] = useState(0.05);
  const [credPerLine, setCredPerLine] = useState(1);
  const [lines, setLines] = useState(20);

  // Build strips and calculate theoretical contribution per symbol
  const strips = [0,1,2,3,4].map(i => buildStrip(i, reelFreq));
  const totalBet = denom * credPerLine * lines;

  // Per-symbol probability on each reel
  const symProb = (id, reelIdx) => {
    const strip = strips[reelIdx];
    const cnt = strip.filter(s => s === id).length;
    return cnt / strip.length;
  };

  // Calculate theoretical 3-oak probability for a given symbol across all paylines
  const calcSymbolRTP = (symKey, symId) => {
    const symPays = pays[symKey] || [0,0,0];
    let contribution = 0;
    // For a rough analytical estimate: p(3-oak on any line)
    // All reels same freq, so p(sym on reel r) is same for each reel
    const p = symProb(symId, 0); // same across reels
    const lineCount = lines;
    // p(5-oak on 1 line) ≈ p^5 (simplified, no wild interaction)
    const p5 = Math.pow(p, 5) * lineCount * (symPays[0]||0);
    const p4 = Math.pow(p, 4) * (1-p) * 5 * lineCount * (symPays[1]||0); // simplified
    const p3 = Math.pow(p, 3) * Math.pow(1-p, 2) * 10 * lineCount * (symPays[2]||0);
    contribution = (p5 + p4 + p3) / lines; // per-credit-bet
    return { p, p5_per_line: Math.pow(p,5), p4_per_line: Math.pow(p,4)*(1-p)*5, p3_per_line: Math.pow(p,3)*Math.pow(1-p,2)*10, contribution };
  };

  const symbols = [
    { key:"JOSIE", id:1 }, { key:"SASHA", id:2 }, { key:"STRAYPUP", id:17 },
    { key:"DJ_MAXINE", id:16 }, { key:"SEVEN", id:3 }, { key:"DIAMOND", id:15 },
    { key:"TRIPLE_BAR", id:4 }, { key:"DOUBLE_BAR", id:5 }, { key:"SINGLE_BAR", id:6 },
  ];

  const rows = symbols.map(({ key, id }) => {
    const meta = SYMBOL_META[id];
    const symPays = pays[key] || [0,0,0];
    const p = symProb(id, 0);
    const stats = calcSymbolRTP(key, id);
    return { meta, key, id, p, symPays, stats };
  });

  const totalContrib = rows.reduce((s, r) => s + r.stats.contribution * lines, 0);
  const barPay = pays["TRIPLE_BAR"] || [0,0,0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Denomination</label>
          <select value={denom} onChange={e => setDenom(+e.target.value)} className={SELECT_CLS}>
            {[0.01,0.05,0.10,0.25,0.50,1.00].map(d => <option key={d} value={d}>{d<1?`${d*100}¢`:`$${d}`}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Lines</label>
          <select value={lines} onChange={e => setLines(+e.target.value)} className={SELECT_CLS}>
            {[1,5,10,15,20].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="bg-zinc-900 border border-amber-600/40 rounded-lg px-4 py-2">
          <div className="text-xs text-zinc-500">Est. Base RTP</div>
          <div className="text-xl font-bold text-amber-400">{(totalContrib*100).toFixed(1)}%</div>
          <div className="text-xs text-zinc-600">analytical approx</div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-500">
        ℹ️ Analytical RTP estimate — approximate only (simplified, excludes wilds/mixed-bar interaction). Run Monte Carlo for accurate figures.
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-700">
              <th className="py-2 px-3 text-left text-zinc-400">Symbol</th>
              <th className="py-2 px-3 text-center text-zinc-400">Freq / Reel</th>
              <th className="py-2 px-3 text-center text-zinc-400">Prob / Stop</th>
              <th className="py-2 px-3 text-center text-amber-400">5-oak Pay</th>
              <th className="py-2 px-3 text-center text-amber-300">4-oak Pay</th>
              <th className="py-2 px-3 text-center text-amber-200">3-oak Pay</th>
              <th className="py-2 px-3 text-center text-green-400">Est. RTP %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ meta, key, id, p, symPays, stats }) => {
              const freq = strips[0].filter(s=>s===id).length;
              const rtpPct = (stats.contribution * lines * 100).toFixed(2);
              const barW = Math.min(parseFloat(rtpPct) * 3, 100);
              return (
                <tr key={key} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                  <td className="py-2 px-3">
                    <span className="mr-1.5">{meta.emoji}</span>
                    <span className="text-zinc-300">{meta.name}</span>
                  </td>
                  <td className="py-2 px-3 text-center text-zinc-400">{freq} / 80</td>
                  <td className="py-2 px-3 text-center text-zinc-400">{(p*100).toFixed(1)}%</td>
                  {[0,1,2].map(i => (
                    <td key={i} className={clsx("py-2 px-3 text-center tabular-nums", symPays[i]>0?"text-amber-300":"text-zinc-700")}>
                      {symPays[i]||"—"}
                    </td>
                  ))}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width:`${barW}%` }} />
                      </div>
                      <span className="text-green-400 tabular-nums w-12 text-right">{rtpPct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-900 border-t border-zinc-600">
              <td colSpan={6} className="py-2 px-3 text-right text-zinc-400 font-bold">Estimated Base RTP (paylines only)</td>
              <td className="py-2 px-3 text-right text-amber-400 font-bold text-sm">{(totalContrib*100).toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
          <h3 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">RTP Breakdown Target</h3>
          {[
            { label:"Base paylines", value:"~68–74%", color:"#fbbf24" },
            { label:"Hold & Spin",   value:"~11%",    color:"#ffd700" },
            { label:"Red Spin",      value:"~5.5%",   color:"#ef4444" },
            { label:"Pick & Choose", value:"~9%",     color:"#ff69b4" },
            { label:"Total Target",  value:"~94%",    color:"#51cf66", bold:true },
          ].map(r => (
            <div key={r.label} className={clsx("flex justify-between py-1 text-xs", r.bold?"border-t border-zinc-700 mt-1 pt-2 font-bold":"")}>
              <span className="text-zinc-400">{r.label}</span>
              <span style={{ color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
          <h3 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Trigger Rates (approx)</h3>
          {[
            { label:"H&S (6+ coins)", prob: Math.pow(symProb(9,0)*15, 6), label2:"~1 in" },
            { label:"P&C (5-lipstick)", prob: Math.pow(symProb(8,0), 5) * lines, label2:"~1 in" },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-1.5 text-xs border-b border-zinc-800">
              <span className="text-zinc-400">{r.label}</span>
              <span className="text-amber-300 tabular-nums">{r.label2} {r.prob>0?Math.round(1/r.prob).toLocaleString():"∞"}</span>
            </div>
          ))}
          <div className="flex justify-between py-1.5 text-xs">
            <span className="text-zinc-400">BONUS letters (all 5)</span>
            <span className="text-teal-400 tabular-nums">~1 in {Math.round(1/Math.pow(symProb(10,0),5)).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
          <h3 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Volatility Indicators</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">Max base win</span>
              <span className="text-amber-300">{Math.max(...Object.values(pays).flat())*6}× betPerLine</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">Top symbol freq</span>
              <span className="text-amber-300">1 in {(80/1).toFixed(0)} per reel</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">5-oak top prob</span>
              <span className="text-amber-300">1 in {Math.round(1/Math.pow(1/80,5)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 7 — BONUS ORB ANALYZER
// Mechanics from bonuses.js / paytable.js / game.js (confirmed 2026-05-18):
//   Trigger: all 5 BONUS letters (B-O-N-U-S) on BOTTOM row of grid
//   Letter freq: 10/80 per reel → p(trigger) = (10/80)^5 ≈ 1 in 32,768 per row
//   Only bottom row counts → effective ~1 in 10,922 spins (3 rows / 1 valid)
//   Orb pick: 3 orbs, each assigned hold_spin / red_spin / pick_choose (⅓ each)
//   P&C prize weights: cash 60%, H&S 14%, RS 12%, mini 7%, minor 4%, major 2%, grand 1%
//   Cash tiers: small 5–25×, medium 25–75×, large 75–150× totalBet (equal tier prob)
//   Partial letter pays: [0,1,2,4,12] × betPerLine for 1–4 consecutive from reel 1
// ═══════════════════════════════════════════════════════════
const BONUS_LETTER_PAYS_DATA = [0, 1, 2, 4, 12]; // index = letter count (0–4)
const ORB_PRIZES = ["hold_spin", "red_spin", "pick_choose"]; // equal weight, 1/3 each
const PC_PRIZE_WEIGHTS = [
  { type:"cash",      weight:0.40, label:"Cash (small–large)" },
  { type:"cash",      weight:0.20, label:"Cash (2nd bucket)"  },
  { type:"hold_spin", weight:0.14, label:"Hold & Spin"        },
  { type:"red_spin",  weight:0.12, label:"Red Spin"           },
  { type:"mini",      weight:0.07, label:"MINI Jackpot"       },
  { type:"minor",     weight:0.04, label:"MINOR Jackpot"      },
  { type:"major",     weight:0.02, label:"MAJOR Jackpot"      },
  { type:"grand",     weight:0.01, label:"GRAND Jackpot"      },
];
const PC_CASH_TIERS = [
  { label:"Small",  minMult:5,  maxMult:25  },
  { label:"Medium", minMult:25, maxMult:75  },
  { label:"Large",  minMult:75, maxMult:150 },
];

function BonusOrbTab({ reelFreq }) {
  const [totalBet,  setTotalBet]  = useState(1.00);
  const [bonusFreq, setBonusFreq] = useState(10); // letter stops per reel (editable)
  const [simCount,  setSimCount]  = useState(20000);
  const [running,   setRunning]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [simResult, setSimResult] = useState(null);
  const cancelRef = useRef(false);

  // ── Analytical ────────────────────────────────────────────
  // p(all 5 letters on bottom row) = (freq/80)^5
  const pPerRow    = Math.pow(bonusFreq / 80, 5);
  // Only bottom row triggers → but bottom row is 1 of 3 rows
  // (S letter only appears reliably on bottom row by reel design)
  const pTrigger   = pPerRow; // per spin
  const triggerIn  = pTrigger > 0 ? Math.round(1 / pTrigger) : Infinity;

  // Orb: ⅓ each of H&S, Red Spin, P&C
  const pOrb = 1/3;

  // P&C expected cash value
  const cashWeight = PC_PRIZE_WEIGHTS.filter(p => p.type==="cash").reduce((s,p)=>s+p.weight, 0);
  const avgCashMult = PC_CASH_TIERS.reduce((s,t) => s + (t.minMult+t.maxMult)/2, 0) / PC_CASH_TIERS.length;
  const avgPCCash   = cashWeight * avgCashMult * totalBet; // when P&C is the orb result

  // Partial letter pays per spin (analytical)
  // p(exactly N consecutive letters from reel 1) on any of 3 rows
  const pLetter = bonusFreq / 80;
  const pPartialPays = [1,2,3,4].map(n => {
    // p(at least n from reel 1) on a given row = pLetter^n × (1-pLetter or end-of-reel)
    // exact: p(exactly n) = pLetter^n × (1-pLetter) for n<5, p^5 for n=5 (trigger)
    const pExact = n < 5
      ? Math.pow(pLetter, n) * (1 - pLetter)
      : Math.pow(pLetter, 5);
    const pay = BONUS_LETTER_PAYS_DATA[n]; // credits × betPerLine
    return { n, pExact, pay, expectedReturn: pExact * pay * 3 }; // ×3 rows
  });
  const partialRTP = pPartialPays.reduce((s,r)=>s+r.expectedReturn, 0); // per betPerLine unit

  // ── Monte Carlo ───────────────────────────────────────────
  // Simulate just the P&C bonus (orb outcome already assumed as P&C for P&C sim)
  function simPCSession(totalBetLocal) {
    // Roll prize type
    const roll = Math.random();
    let cum = 0, winType = PC_PRIZE_WEIGHTS[0];
    for (const p of PC_PRIZE_WEIGHTS) { cum += p.weight; if (roll < cum) { winType = p; break; } }

    if (winType.type === "cash") {
      const tier = PC_CASH_TIERS[Math.floor(Math.random() * 3)];
      const mult = tier.minMult + Math.random() * (tier.maxMult - tier.minMult);
      return { type:"cash", value: totalBetLocal * mult };
    }
    return { type: winType.type, value: 0 };
  }

  function simOrbSession(totalBetLocal) {
    // Pick orb outcome: ⅓ each
    const orbIdx = Math.floor(Math.random() * 3);
    const prize  = ORB_PRIZES[orbIdx]; // hold_spin | red_spin | pick_choose
    let cashWon = 0;
    let nestedBonus = prize;
    if (prize === "pick_choose") {
      const pc = simPCSession(totalBetLocal);
      if (pc.type === "cash") { cashWon = pc.value; nestedBonus = "cash"; }
      else nestedBonus = pc.type; // hold_spin / red_spin / jackpot
    }
    return { prize, cashWon, nestedBonus };
  }

  const runSim = useCallback(() => {
    cancelRef.current = false;
    setRunning(true); setProgress(0); setSimResult(null);
    const CHUNK = 2000;
    let done = 0;
    let totalCash = 0, orbCounts = {}, nestedCounts = {}, pcOutcomes = {};

    const tick = () => {
      if (cancelRef.current) { setRunning(false); return; }
      const end = Math.min(done + CHUNK, simCount);
      for (let i = done; i < end; i++) {
        const { prize, cashWon, nestedBonus } = simOrbSession(totalBet);
        totalCash += cashWon;
        orbCounts[prize] = (orbCounts[prize]||0) + 1;
        nestedCounts[nestedBonus] = (nestedCounts[nestedBonus]||0) + 1;
      }
      done = end;
      setProgress(Math.round(done/simCount*100));
      if (done < simCount) setTimeout(tick, 0);
      else {
        // RTP contribution = pTrigger × avgCashWon / totalBet × 100
        const avgCashPerOrb = totalCash / simCount;
        const rtpContrib = pTrigger * (avgCashPerOrb / totalBet) * 100;
        setSimResult({ avgCashPerOrb, rtpContrib, orbCounts, nestedCounts, sessions: simCount });
        setRunning(false);
      }
    };
    setTimeout(tick, 0);
  }, [simCount, totalBet, pTrigger]);

  const tealColor = "#4ecdc4";

  return (
    <div className="space-y-5">
      {/* Settings */}
      <div className="bg-zinc-900 border border-teal-900/40 rounded-lg p-4">
        <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: tealColor }}>
          🅱 B-O-N-U-S Orb Feature Parameters
        </h3>
        <div className="flex flex-wrap gap-5 items-end">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Letter Stops / Reel
              <span className="ml-2 text-zinc-600">(current: {bonusFreq}/80)</span>
            </label>
            <input type="number" min="1" max="40" step="1" value={bonusFreq}
              onChange={e => { setBonusFreq(+e.target.value); setSimResult(null); }}
              className="w-24 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-teal-500"
              style={{ color: tealColor }} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Total Bet ($)</label>
            <input type="number" min="0.01" step="0.25" value={totalBet}
              onChange={e => { setTotalBet(+e.target.value); setSimResult(null); }}
              className="w-28 bg-zinc-800 border border-zinc-600 text-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Orb Sessions to Sim</label>
            <select value={simCount} onChange={e => { setSimCount(+e.target.value); setSimResult(null); }} className={SELECT_CLS}>
              {[5000,10000,20000,50000,100000].map(n => <option key={n} value={n}>{n.toLocaleString()}</option>)}
            </select>
          </div>
          <button onClick={running ? () => { cancelRef.current = true; } : runSim}
            className={clsx("px-5 py-1.5 rounded-lg text-sm font-bold border transition-all",
              running ? "bg-zinc-700 text-zinc-200 border-zinc-500 hover:bg-zinc-600"
                      : "border-teal-600 text-black hover:opacity-90")}
            style={!running ? { background: tealColor } : {}}>
            {running ? `⏹ Stop (${progress}%)` : "▶ Simulate Orb Sessions"}
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          💡 Simulates orb sessions in isolation (⅓ H&S, ⅓ Red Spin, ⅓ P&C). Cash-only outcomes contribute directly; H&S and Red Spin RTP counted separately in their own tabs.
        </p>
      </div>

      {running && (
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-100" style={{ width:`${progress}%`, background: tealColor }} />
        </div>
      )}

      {/* Key stats — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Trigger Prob" value={`1 in ${triggerIn.toLocaleString()}`} color={tealColor} />
        <StatCard label="p(trigger) / spin" value={`${(pTrigger*100).toFixed(4)}%`} color="#99f6e4" />
        <StatCard label="Orb Prize (each)" value="1 in 3" color="#fbbf24" />
        <StatCard label="Avg P&C Cash Win" value={`$${avgPCCash.toFixed(2)}`} color="#51cf66" />
      </div>

      {/* Simulated results */}
      {simResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Avg Cash / Orb Session" value={`$${simResult.avgCashPerOrb.toFixed(2)}`}  color="#51cf66" big />
            <StatCard label="Est. RTP Contrib"        value={`~${simResult.rtpContrib.toFixed(3)}%`}    color={tealColor} big />
            <StatCard label="Sessions Simulated"      value={simResult.sessions.toLocaleString()}        color="#94a3b8" />
          </div>

          {/* Orb outcome distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Orb Outcome (simulated)</h3>
              {ORB_PRIZES.map(prize => {
                const cnt = simResult.orbCounts[prize] || 0;
                const pct = (cnt / simResult.sessions * 100).toFixed(1);
                const labels = { hold_spin:"🪙 Hold & Spin", red_spin:"🔴 Red Spin", pick_choose:"🎭 Pick & Choose" };
                const colors = { hold_spin:"#ffd700", red_spin:"#f87171", pick_choose:"#c084fc" };
                return (
                  <div key={prize} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-zinc-400 w-28">{labels[prize]}</span>
                    <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${+pct*3}%`, background:colors[prize] }} />
                    </div>
                    <span className="text-xs w-12 tabular-nums text-right" style={{ color:colors[prize] }}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Final Outcomes (incl. P&C nested)</h3>
              {Object.entries(simResult.nestedCounts).sort((a,b)=>b[1]-a[1]).map(([k, cnt]) => {
                const pct = (cnt / simResult.sessions * 100).toFixed(1);
                const colorMap = { cash:"#51cf66", hold_spin:"#ffd700", red_spin:"#f87171", pick_choose:"#c084fc", mini:"#a78bfa", minor:"#818cf8", major:"#f472b6", grand:"#ff6b35" };
                const labelMap = { cash:"💵 Cash", hold_spin:"🪙 H&S", red_spin:"🔴 Red Spin", pick_choose:"🎭 P&C", mini:"MINI JP", minor:"MINOR JP", major:"MAJOR JP", grand:"GRAND JP" };
                return (
                  <div key={k} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-zinc-400 w-20">{labelMap[k]||k}</span>
                    <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${Math.min(+pct*2,100)}%`, background:colorMap[k]||"#888" }} />
                    </div>
                    <span className="text-xs w-12 tabular-nums text-right" style={{ color:colorMap[k]||"#888" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Orb prize breakdown — always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orb */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
          <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Orb Prize Table (equal ⅓ weight)</h3>
          {ORB_PRIZES.map(p => {
            const colors = { hold_spin:"#ffd700", red_spin:"#f87171", pick_choose:"#c084fc" };
            const labels = { hold_spin:"🪙 Hold & Spin → run H&S", red_spin:"🔴 Red Spin → run RS", pick_choose:"🎭 Pick & Choose → roll PC table" };
            return (
              <div key={p} className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span style={{ color:colors[p] }}>{labels[p]}</span>
                <span className="text-zinc-400 tabular-nums">33.3%</span>
              </div>
            );
          })}
        </div>

        {/* P&C prize table */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
          <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Pick & Choose Prize Weights</h3>
          {PC_PRIZE_WEIGHTS.map((p, i) => {
            const colorMap = { cash:"#51cf66", hold_spin:"#ffd700", red_spin:"#f87171", mini:"#a78bfa", minor:"#818cf8", major:"#f472b6", grand:"#ff6b35" };
            return (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-zinc-400 w-36">{p.label}</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${p.weight*200}%`, background:colorMap[p.type]||"#888" }} />
                </div>
                <span className="text-xs tabular-nums w-10 text-right" style={{ color:colorMap[p.type]||"#888" }}>{(p.weight*100).toFixed(0)}%</span>
              </div>
            );
          })}
          <div className="mt-3 pt-2 border-t border-zinc-700">
            <div className="text-xs text-zinc-500">Cash tiers (equal prob each):</div>
            {PC_CASH_TIERS.map(t => (
              <div key={t.label} className="flex justify-between text-xs py-0.5">
                <span className="text-zinc-500">{t.label}</span>
                <span className="text-green-400">{t.minMult}–{t.maxMult}× totalBet</span>
                <span className="text-green-300">${(t.minMult*totalBet).toFixed(2)}–${(t.maxMult*totalBet).toFixed(2)}</span>
              </div>
            ))}
            <div className="text-xs text-zinc-600 mt-1">Avg cash mult: {avgCashMult.toFixed(0)}× → ${(avgCashMult*totalBet).toFixed(2)} at current bet</div>
          </div>
        </div>
      </div>

      {/* Partial letter pays */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Partial Letter Pays (B-O-N-U consecutive from reel 1)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-700">
                {["Letters","Sequence","Pay (× bet/line)","p(per row)","3-row p(per spin)","Expected RTP"].map(h => (
                  <th key={h} className="py-2 px-3 text-center text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pPartialPays.filter(r => r.pay > 0).map(({ n, pExact, pay, expectedReturn }) => (
                <tr key={n} className="border-b border-zinc-800">
                  <td className="py-2 px-3 text-center font-bold" style={{ color: tealColor }}>{n}</td>
                  <td className="py-2 px-3 text-center text-zinc-300">{"BONUS".slice(0,n)}</td>
                  <td className="py-2 px-3 text-center text-amber-300">{pay}×</td>
                  <td className="py-2 px-3 text-center text-zinc-400 tabular-nums">1 in {Math.round(1/pExact).toLocaleString()}</td>
                  <td className="py-2 px-3 text-center text-zinc-400 tabular-nums">1 in {Math.round(1/(pExact*3)).toLocaleString()}</td>
                  <td className="py-2 px-3 text-center text-green-400 tabular-nums">{(expectedReturn*100).toFixed(3)}%</td>
                </tr>
              ))}
              <tr className="bg-zinc-800/50">
                <td colSpan={5} className="py-2 px-3 text-right text-zinc-400 font-bold">Total Partial Letter RTP</td>
                <td className="py-2 px-3 text-center text-green-400 font-bold">{(partialRTP*100).toFixed(3)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-600 mt-2">Partial pays only apply to B, B-O, B-O-N, B-O-N-U (4 consecutive). All 5 (full B-O-N-U-S on bottom row) triggers orb feature — no cash pay.</p>
      </div>

      {/* Rules reference */}
      <div className="bg-zinc-900 border border-teal-900/30 rounded-lg p-4">
        <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: tealColor }}>BONUS Orb Rules (from game.js / bonuses.js)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {[
            ["Trigger",           "All 5 BONUS letters on BOTTOM row of grid"],
            ["Letter placement",  "Each letter only appears on its designated reel"],
            ["S letter",          "Only on reel 5, only on bottom row by design"],
            ["Orb selection",     "Predetermined before player picks — always wins"],
            ["Orb prizes",        "H&S / Red Spin / Pick & Choose (⅓ each)"],
            ["P&C grid",          "15 tiles, 3 matching = prize (always guaranteed)"],
            ["Jackpots in P&C",   "Available (MINI/MINOR/MAJOR/GRAND possible)"],
            ["Jackpots in RS",     "Suppressed when triggered from inside orb"],
            ["Cash floor (P&C)",  "min(prize, totalBet) — never less than totalBet"],
            ["Nesting",           "P&C can award H&S or Red Spin, which then run"],
          ].map(([k,v]) => (
            <div key={k} className="flex gap-2 py-1 border-b border-zinc-800">
              <span className="text-zinc-500 w-36 flex-shrink-0">{k}</span>
              <span style={{ color: tealColor === "#4ecdc4" ? "#99f6e4" : tealColor }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 8 — RED SPIN TUNER
// Mechanics from bonuses.js / paytable.js (confirmed 2026-05-18):
//   - Triggers on any winning spin at RED_SPIN_FREQUENCY_DEFAULT = 0.035
//   - Spin 1 always fires; spin 2+ continue at 65% each
//   - Each spin must exceed previous win (ascending rule)
//   - Floor = max(prevBaseWin, totalBet)
//   - Target RTP contribution: ~5.5%
// ═══════════════════════════════════════════════════════════
function RedSpinTunerTab({ pays, mixedBar, reelFreq }) {
  const [triggerFreq,   setTriggerFreq]   = useState(0.035);
  const [continuance,   setContinuance]   = useState(0.65);
  const [totalBet,      setTotalBet]      = useState(1.00);
  const [lines,         setLines]         = useState(20);
  const [simCount,      setSimCount]      = useState(50000);
  const [running,       setRunning]       = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [simResults,    setSimResults]    = useState(null);
  const cancelRef = useRef(false);

  // ── Analytical estimates ──────────────────────────────────
  // Expected number of spins per Red Spin session
  // Spin 1 always fires; each subsequent spin fires with prob = continuance
  // E[spins] = 1 + continuance/(1-continuance)
  const avgSpins = 1 + continuance / (1 - continuance);

  // P(exactly k spins): P(1) = (1-continuance), P(k≥2) = continuance^(k-1)*(1-continuance)
  // Distribution for display
  const spinDist = [];
  let cumP = 0;
  for (let k = 1; k <= 12; k++) {
    const p = k === 1 ? (1 - continuance) : Math.pow(continuance, k - 1) * (1 - continuance);
    cumP += p;
    spinDist.push({ spins: k, prob: p, cumProb: cumP });
    if (cumP > 0.999) break;
  }

  // Trigger rate per spin overall
  const triggerRate = triggerFreq; // fraction of ALL spins (only winning ones trigger, but we model it as flat)
  // Avg Red Spin session pays: floor = totalBet, then ascending wins.
  // Rough model: each spin pays ~2× the floor on avg (very rough without full MC)
  const estAvgFloor = totalBet;
  const estAvgWin = estAvgFloor * avgSpins * 1.8; // 1.8× floor factor (rough)
  const estRTPContrib = triggerRate * (estAvgWin / totalBet) * 100;

  // ── Monte Carlo simulation of Red Spin sessions ──────────
  // Uses actual payline evaluation with the current paytable
  const strips = [0,1,2,3,4].map(i => buildStrip(i, reelFreq));
  const payTable = {};
  SYMBOL_LIST.forEach(sym => { payTable[sym.key] = pays[sym.key] || [0,0,0]; });

  function simOneRedSpinSession(betPerLine, linesActive) {
    const totalBetLocal = betPerLine * linesActive;
    let lastWin = totalBetLocal; // floor = totalBet (base game floor)
    let sessionTotal = 0;
    let spinCount = 0;
    const MAX_SPINS = 50;

    while (true) {
      spinCount++;
      // Find a spin that beats lastWin (up to 200 attempts)
      let spinWin = 0;
      for (let attempt = 0; attempt < 200; attempt++) {
        const stops = strips.map(s => Math.floor(Math.random() * s.length));
        const { credits } = evalSpin(strips, stops, linesActive, payTable, mixedBar);
        const winCash = credits * betPerLine; // credits × betPerLine = cash-equivalent credits
        if (winCash > lastWin) { spinWin = winCash; break; }
      }
      // Fallback: if we can't beat lastWin after 200 tries, award lastWin * 1.1 (cap scenario)
      if (spinWin === 0) spinWin = lastWin * 1.1;

      sessionTotal += spinWin;
      lastWin = spinWin;

      // Spin 1 always continues; spin 2+ check continuance
      if (spinCount >= 2) {
        if (Math.random() >= continuance) break;
      }
      if (spinCount >= MAX_SPINS) break;
    }
    return { sessionTotal, spinCount };
  }

  const runSim = useCallback(() => {
    cancelRef.current = false;
    setRunning(true);
    setProgress(0);
    setSimResults(null);

    const betPerLine = totalBet / lines;
    const CHUNK = 500;
    let done = 0;
    let totalPaid = 0;
    let totalSessions = 0;
    let totalSpins = 0;
    const spinCountDist = {};
    let maxSessionWin = 0;

    const tick = () => {
      if (cancelRef.current) { setRunning(false); return; }
      const end = Math.min(done + CHUNK, simCount);
      for (let i = done; i < end; i++) {
        const { sessionTotal, spinCount } = simOneRedSpinSession(betPerLine, lines);
        totalPaid += sessionTotal;
        totalSessions++;
        totalSpins += spinCount;
        if (sessionTotal > maxSessionWin) maxSessionWin = sessionTotal;
        const k = Math.min(spinCount, 10);
        spinCountDist[k] = (spinCountDist[k] || 0) + 1;
      }
      done = end;
      setProgress(Math.round((done / simCount) * 100));
      if (done < simCount) {
        setTimeout(tick, 0);
      } else {
        const avgSessionWin = totalPaid / totalSessions;
        const avgSpinsActual = totalSpins / totalSessions;
        // RTP contribution = triggerFreq × avgSessionWin / totalBet × 100
        const rtpContrib = triggerFreq * (avgSessionWin / totalBet) * 100;
        setSimResults({ avgSessionWin, avgSpinsActual, rtpContrib, maxSessionWin, spinCountDist, totalSessions });
        setRunning(false);
      }
    };
    setTimeout(tick, 0);
  }, [simCount, totalBet, lines, triggerFreq, continuance, strips, payTable, mixedBar]);

  const rtpColor = (rtp) => rtp > 8 ? "#ff6b6b" : rtp > 4 ? "#51cf66" : "#ffd43b";

  return (
    <div className="space-y-5">
      {/* Settings */}
      <div className="bg-zinc-900 border border-red-900/40 rounded-lg p-4">
        <h3 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider">🔴 Red Spin Parameters</h3>
        <div className="flex flex-wrap gap-5 items-end">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Trigger Frequency
              <span className="ml-2 text-zinc-600">(1 in {(1/triggerFreq).toFixed(0)} winning spins)</span>
            </label>
            <input type="number" min="0.001" max="0.5" step="0.001" value={triggerFreq}
              onChange={e => { setTriggerFreq(+e.target.value); setSimResults(null); }}
              className="w-28 bg-zinc-800 border border-zinc-600 text-red-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Continuance %
              <span className="ml-2 text-zinc-600">(spin 2+)</span>
            </label>
            <input type="number" min="0.01" max="0.99" step="0.01" value={continuance}
              onChange={e => { setContinuance(+e.target.value); setSimResults(null); }}
              className="w-28 bg-zinc-800 border border-zinc-600 text-red-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Total Bet ($)</label>
            <input type="number" min="0.01" step="0.25" value={totalBet}
              onChange={e => { setTotalBet(+e.target.value); setSimResults(null); }}
              className="w-28 bg-zinc-800 border border-zinc-600 text-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Active Lines</label>
            <select value={lines} onChange={e => { setLines(+e.target.value); setSimResults(null); }} className={SELECT_CLS}>
              {[1,5,10,15,20].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Sessions to Sim</label>
            <select value={simCount} onChange={e => { setSimCount(+e.target.value); setSimResults(null); }} className={SELECT_CLS}>
              {[5000,10000,50000,100000].map(n => <option key={n} value={n}>{n.toLocaleString()}</option>)}
            </select>
          </div>
          <button onClick={running ? () => { cancelRef.current = true; } : runSim}
            className={clsx("px-5 py-1.5 rounded-lg text-sm font-bold border transition-all",
              running ? "bg-red-900 text-red-200 border-red-700 hover:bg-red-800"
                      : "bg-red-700 text-white border-red-500 hover:bg-red-600")}>
            {running ? `⏹ Stop (${progress}%)` : "▶ Simulate Sessions"}
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-2">💡 Simulates Red Spin sessions in isolation using current paytable values. Each session: spin 1 always fires, then {(continuance*100).toFixed(0)}% continuance per spin with ascending win rule.</p>
      </div>

      {running && (
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded-full transition-all duration-100" style={{ width:`${progress}%` }} />
        </div>
      )}

      {/* Analytical estimates — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Avg Spins / Session"   value={avgSpins.toFixed(2)}                         color="#f87171" />
        <StatCard label="Trigger Rate"           value={`1 in ${(1/triggerFreq).toFixed(0)}`}        color="#fca5a5" />
        <StatCard label="Est. RTP Contrib"       value={`~${estRTPContrib.toFixed(1)}%`}             color={rtpColor(estRTPContrib)} />
        <StatCard label="Continuance"            value={`${(continuance*100).toFixed(0)}%`}          color="#fbbf24" />
      </div>

      {/* Simulated results */}
      {simResults && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Sim RTP Contrib"    value={`${simResults.rtpContrib.toFixed(2)}%`}                      color={rtpColor(simResults.rtpContrib)} big />
            <StatCard label="Avg Session Win"    value={`$${simResults.avgSessionWin.toFixed(2)}`}                   color="#f87171" />
            <StatCard label="Avg Spins (actual)" value={simResults.avgSpinsActual.toFixed(2)}                        color="#fca5a5" />
            <StatCard label="Max Session Win"    value={`$${simResults.maxSessionWin.toFixed(2)}`}                   color="#fbbf24" />
          </div>

          {/* Spin count distribution */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
            <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Spin Count Distribution (simulated)</h3>
            {Object.entries(simResults.spinCountDist).sort((a,b)=>+a[0]-+b[0]).map(([k, cnt]) => {
              const pct = (cnt / simResults.totalSessions * 100).toFixed(1);
              const label = +k >= 10 ? "10+ spins" : `${k} spin${+k===1?"":"s"}`;
              return (
                <div key={k} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-zinc-400 w-16 text-right">{label}</span>
                  <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-red-700" style={{ width:`${Math.min(+pct*2.5,100)}%` }} />
                  </div>
                  <span className="text-xs text-red-300 w-12 tabular-nums">{pct}%</span>
                  <span className="text-xs text-zinc-600 w-16 tabular-nums">{cnt.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytical spin probability table — always visible */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Theoretical Spin Count Probability</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="py-2 px-3 text-left text-zinc-500">Spins</th>
                <th className="py-2 px-3 text-center text-zinc-500">P(exactly)</th>
                <th className="py-2 px-3 text-center text-zinc-500">P(at least)</th>
                <th className="py-2 px-3 text-left text-zinc-500">Bar</th>
              </tr>
            </thead>
            <tbody>
              {spinDist.map(({ spins, prob, cumProb }) => (
                <tr key={spins} className="border-b border-zinc-800">
                  <td className="py-1.5 px-3 text-zinc-300 font-semibold">{spins}</td>
                  <td className="py-1.5 px-3 text-center text-red-300 tabular-nums">{(prob*100).toFixed(2)}%</td>
                  <td className="py-1.5 px-3 text-center text-zinc-400 tabular-nums">{((1-cumProb+prob)*100).toFixed(2)}%</td>
                  <td className="py-1.5 px-3 pr-6">
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-700/70" style={{ width:`${Math.min(prob*400,100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules reference */}
      <div className="bg-zinc-900 border border-red-900/30 rounded-lg p-4">
        <h3 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider">Red Spin Rules (from bonuses.js)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-400">
          {[
            ["Trigger condition",    "Any winning spin (totalWin > 0)"],
            ["Spin 1",               "Always fires — guaranteed"],
            ["Spin 2+",              `${(continuance*100).toFixed(0)}% continue each spin`],
            ["Ascending rule",       "Each spin must beat previous win"],
            ["Floor (spin 1)",       "max(baseGameWin, totalBet)"],
            ["Cap",                  "Sisters 5-oak → GRAND jackpot"],
            ["Nested bonuses",       "H&S and P&C can trigger inside"],
            ["Target RTP",           "~5.5% of total 94% target"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 py-1 border-b border-zinc-800">
              <span className="text-zinc-500 w-36 flex-shrink-0">{k}</span>
              <span className="text-red-200">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════
const TABS = [
  { id:"editor",  label:"✏️ Paytable Editor",   short:"Editor"  },
  { id:"mc",      label:"🎲 Monte Carlo",        short:"MC"      },
  { id:"reel",    label:"🎰 Reel Visualizer",    short:"Reel"    },
  { id:"calc",    label:"💵 Pay Calculator",     short:"Calc"    },
  { id:"hs",      label:"🪙 H&S Tuner",           short:"H&S"     },
  { id:"rs",      label:"🔴 Red Spin",            short:"RS"      },
  { id:"rtp",     label:"📊 RTP Analyzer",       short:"RTP"     },
];

export default function TurrelleMasterToolkit() {
  const [tab, setTab] = useState("editor");

  // Shared state — editor values flow into simulator, calc, and RTP analyzer
  const [pays,     setPays]     = useState(JSON.parse(JSON.stringify(DEFAULT_PAY_TABLE)));
  const [hasOak,   setHasOak]   = useState(JSON.parse(JSON.stringify(DEFAULT_HAS_OAK)));
  const [mixedBar, setMixedBar] = useState({ ...DEFAULT_MIXED_BAR });
  const [reelFreq, setReelFreq] = useState({ ...DEFAULT_REEL_FREQ });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200" style={{ fontFamily:"'Courier New', monospace" }}>
      {/* ── Header ── */}
      <div style={{ background:"linear-gradient(135deg, #18181b 0%, #1c1007 60%, #18181b 100%)", borderBottom:"1px solid rgba(180,100,0,0.3)" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold tracking-widest" style={{ color:"#ffd700", letterSpacing:"0.12em" }}>
              🎰 TURRELLE SISTERS — MASTER TOOLKIT
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">v6l64 · Paytable Editor + Simulator + 5 Analysis Tools · Shared Math State</p>
          </div>
          <div className="text-xs text-zinc-600 text-right leading-relaxed">
            <div>5 reels × 80 stops · 20 lines</div>
            <div>Target RTP: 94% total</div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="max-w-6xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={clsx("px-4 py-2.5 text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all border-b-2 flex-shrink-0",
                tab===t.id
                  ? "border-amber-500 text-amber-400 bg-amber-900/10"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600")}>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Shared state indicator ── */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-1.5">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-zinc-600">
            <span className="text-amber-600">⚡ Live state:</span> Changes in Paytable Editor automatically update Monte Carlo, Pay Calculator, and RTP Analyzer.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        {tab === "editor" && (
          <PaytableEditorTab
            pays={pays} setPays={setPays}
            hasOak={hasOak} setHasOak={setHasOak}
            mixedBar={mixedBar} setMixedBar={setMixedBar}
            reelFreq={reelFreq} setReelFreq={setReelFreq}
          />
        )}
        {tab === "mc"     && <MonteCarloTab pays={pays} mixedBar={mixedBar} reelFreq={reelFreq} />}
        {tab === "reel"   && <ReelVisualizerTab reelFreq={reelFreq} />}
        {tab === "calc"   && <PayCalculatorTab pays={pays} mixedBar={mixedBar} />}
        {tab === "hs"     && <HSTunerTab />}
        {tab === "rs"     && <RedSpinTunerTab pays={pays} mixedBar={mixedBar} reelFreq={reelFreq} />}
        {tab === "rtp"    && <RTPAnalyzerTab pays={pays} mixedBar={mixedBar} reelFreq={reelFreq} />}
      </div>

      {/* ── Footer ── */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="text-xs text-zinc-700 border-t border-zinc-800 pt-3">
          Rule 10 — Run Monte Carlo after confirming values. Rule 11 — Pre-log changes in PHASE_PLAN.md before applying to code. After applying: bump CACHE_NAME to <span className="text-amber-700">turrelle-v6l64</span>.
        </div>
      </div>
    </div>
  );
}
