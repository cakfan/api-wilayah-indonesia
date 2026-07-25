function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}
function contrast(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function oklchToHex(L: number, C: number, H: number): string {
  const Lr = L / 100;
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);

  const l_ = Lr + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = Lr - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = Lr - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  r = linearToSrgb(Math.max(0, Math.min(1, r)));
  g = linearToSrgb(Math.max(0, Math.min(1, g)));
  bl = linearToSrgb(Math.max(0, Math.min(1, bl)));

  const toHex = (v: number) => {
    const h = Math.round(v * 255).toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return "#" + toHex(r) + toHex(g) + toHex(bl);
}

// EXACT dark mode values from src/index.ts [data-theme="dark"]
const D = {
  bg:            oklchToHex(14.1, 0.004, 286),
  bgCard:        oklchToHex(21.0, 0.006, 286),
  bgMuted:       oklchToHex(27.4, 0.005, 286),
  border:        oklchToHex(52, 0.012, 286),
  borderStrong:  oklchToHex(56, 0.015, 286),
  text:          oklchToHex(98.5, 0.001, 286),
  textMuted:     oklchToHex(87.1, 0.005, 286),
  textFaint:     oklchToHex(71.2, 0.013, 286),
  primary:       oklchToHex(98.5, 0.001, 286),
  primaryHover:  oklchToHex(87.1, 0.005, 286),
  accent:        oklchToHex(27.4, 0.005, 286),
  getBg:         oklchToHex(20, 0.04, 156),
  getBorder:     oklchToHex(50, 0.10, 154),
  getText:       oklchToHex(82, 0.14, 154),
  getBadge:      oklchToHex(28, 0.10, 155),
  postBg:        oklchToHex(20, 0.04, 255),
  postBorder:    oklchToHex(50, 0.10, 252),
  postText:      oklchToHex(80, 0.10, 252),
  postBadge:     oklchToHex(28, 0.14, 266),
  deleteBg:      oklchToHex(20, 0.04, 17),
  deleteBorder:  oklchToHex(55, 0.10, 20),
  deleteText:    oklchToHex(80, 0.10, 20),
  deleteBadge:   oklchToHex(28, 0.13, 26),
  putBg:         oklchToHex(20, 0.04, 95),
  putBorder:     oklchToHex(55, 0.12, 92),
  putText:       oklchToHex(85, 0.15, 92),
  putBadge:      oklchToHex(28, 0.11, 46),
  white:         "#ffffff",
};

console.log("=== DARK MODE HEX VALUES ===\n");
for (const [k, v] of Object.entries(D)) {
  console.log(`  ${k.padEnd(16)} ${v}`);
}

// [fg_hex, bg_hex, label, is_non_text(=true means 3:1 threshold)]
const pairs: [string, string, string, boolean][] = [
  // ── Core text on backgrounds ──
  [D.text, D.bg,          "text on bg",              false],
  [D.text, D.bgCard,      "text on bg-card",         false],
  [D.text, D.bgMuted,     "text on bg-muted",        false],

  // ── text-muted ──
  [D.textMuted, D.bg,      "text-muted on bg",       false],
  [D.textMuted, D.bgCard,  "text-muted on bg-card",  false],
  [D.textMuted, D.bgMuted, "text-muted on bg-muted", false],
  [D.textMuted, D.accent,  "text-muted on accent",   false],

  // ── text-faint ──
  [D.textFaint, D.bg,      "text-faint on bg",       false],
  [D.textFaint, D.bgCard,  "text-faint on bg-card",  false],
  [D.textFaint, D.bgMuted, "text-faint on bg-muted", false],
  [D.textFaint, D.accent,  "text-faint on accent",   false],

  // ── Header (top-bar: bg-card bg) ──
  [D.text, D.bgCard,      "header h1 on header",     false],
  [D.textMuted, D.bgCard, "header btn on header",    false],
  [D.textMuted, D.accent, "header pill on accent",   false],
  [D.text, D.bgCard,      "header link on header",   false],

  // ── Info section (bg is body bg) ──
  [D.text, D.bg,          "info title on bg",        false],
  [D.textMuted, D.bg,     "info version small",      false],
  [D.text, D.bg,          "info description on bg",  false],
  [D.text, D.bg,          "info link on bg",         false],

  // ── Opblock tag (bg is body bg) ──
  [D.text, D.bg,          "tag name on bg",          false],
  [D.textMuted, D.bg,     "tag small on bg",         false],

  // ── Opblock summary — path + description ──
  [D.getText, D.getBg,       "get path on get-bg",         false],
  [D.textMuted, D.getBg,     "get desc on get-bg",        false],
  [D.postText, D.postBg,     "post path on post-bg",      false],
  [D.textMuted, D.postBg,    "post desc on post-bg",      false],
  [D.deleteText, D.deleteBg, "delete path on delete-bg",  false],
  [D.textMuted, D.deleteBg,  "delete desc on delete-bg",  false],
  [D.putText, D.putBg,       "put path on put-bg",        false],
  [D.textMuted, D.putBg,     "put desc on put-bg",        false],

  // ── Badge: hardcoded #fff on badge bg ──
  [D.white, D.getBadge,     "#fff on get-badge",      false],
  [D.white, D.postBadge,    "#fff on post-badge",     false],
  [D.white, D.deleteBadge,  "#fff on delete-badge",   false],
  [D.white, D.putBadge,     "#fff on put-badge",      false],

  // ── Expanded body (bg-card) ──
  [D.text, D.bgCard,      "table cell on card",      false],
  [D.text, D.bgCard,      "param name on card",      false],
  [D.textMuted, D.bgCard, "param type on card",      false],
  [D.textFaint, D.bgCard, "param in on card",        false],
  [D.textMuted, D.bgCard, "table header on card",    false],
  [D.textMuted, D.bgCard, "response desc on card",   false],

  // ── Try-out / Execute / Buttons ──
  [D.textMuted, D.bgCard, "try-out btn on card",     false],
  [D.textMuted, D.border, "try-out btn border",      true],
  // execute btn: color=bg-card, bg=primary → dark on white
  [D.bgCard, D.primary,    "execute btn text on primary", false],
  [D.textMuted, D.bgCard, "cancel btn on card",      false],
  [D.textMuted, D.border, "cancel btn border",       true],
  [D.textMuted, D.bgCard, "authorize btn on card",   false],
  [D.textMuted, D.border, "authorize btn border",    true],

  // ── Models ──
  [D.text, D.bgCard,      "model title on card",     false],
  [D.textMuted, D.bgCard, "model count on card",     false],
  [D.text, D.bgCard,      "prop name on card",       false],
  [D.textMuted, D.bgCard, "prop type on card",       false],

  // ── Inputs ──
  [D.text, D.bgCard,      "input text on card",      false],
  [D.text, D.bgCard,      "select text on card",     false],

  // ── Dialog ──
  [D.text, D.bgCard,      "dialog on card",          false],

  // ── Misc ──
  [D.text, D.bgCard,      "markdown p on card",      false],
  [D.text, D.bgCard,      "error wrapper on bg",     false],

  // ── Non-text: border contrast (3:1 threshold per WCAG 1.4.11) ──
  [D.border, D.bgCard,     "[border] opblock on card",     true],
  [D.borderStrong, D.bgCard, "[border] focus ring on card", true],
  [D.getBorder, D.getBg,   "[border] get on get-bg",      true],
  [D.postBorder, D.postBg, "[border] post on post-bg",    true],
  [D.deleteBorder, D.deleteBg, "[border] delete on delete-bg", true],
  [D.putBorder, D.putBg,   "[border] put on put-bg",      true],
  [D.border, D.bgCard,     "[border] table on card",      true],
  [D.border, D.bgCard,     "[border] models on card",     true],
  [D.border, D.bgCard,     "[border] dialog on card",     true],
];

console.log("\n=== DARK MODE WCAG AUDIT ===\n");
console.log(
  "Element".padEnd(44) + "Ratio".padStart(7) + "  AA(4.5)".padStart(9) + "AA-lg(3)".padStart(9) + " AAA(7)".padStart(8) + "  Verdict"
);
console.log("─".repeat(82));

const failures: string[] = [];
const warnings: string[] = [];

for (const [fg, bg, label, isBorder] of pairs) {
  const ratio = contrast(fg, bg);
  const threshold = isBorder ? 3.0 : 4.5;
  const aaaThreshold = 7.0;
  const aaPass = ratio >= 4.5;
  const aaLgPass = ratio >= 3.0;
  const aaaPass = ratio >= aaaThreshold;
  const verdict = ratio >= threshold ? "OK" : (ratio >= (isBorder ? 2.5 : 3.0) ? "WARN" : "FAIL");

  if (verdict === "FAIL") failures.push(label);
  else if (verdict === "WARN") warnings.push(label);

  console.log(
    `${label.padEnd(44)} ${ratio.toFixed(2).padStart(7)}  ${(aaPass ? "PASS" : "FAIL").padStart(8)} ${(aaLgPass ? "PASS" : "FAIL").padStart(8)} ${(aaaPass ? "PASS" : "FAIL").padStart(8)}  ${verdict}`
  );
}

console.log(`\n═══ SUMMARY ═══`);
if (failures.length) console.log(`❌ FAIL (${failures.length}): ${failures.join(", ")}`);
if (warnings.length) console.log(`⚠️  WARN (${warnings.length}): ${warnings.join(", ")}`);
if (!failures.length && !warnings.length) console.log("✅ ALL PASS — every pair meets WCAG AA (4.5:1) or AA-large (3:1 for borders)");
