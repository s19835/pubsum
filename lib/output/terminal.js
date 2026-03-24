'use strict';

const { ansi, priority } = require('../study-area');

// ── ANSI helpers ──────────────────────────────────────────────────
const R  = '\x1b[0m';           // reset
const B  = '\x1b[1m';           // bold
const DIM= '\x1b[2m';           // dim
const CY = '\x1b[36m';          // cyan
const GN = '\x1b[32m';          // green
const YL = '\x1b[33m';          // yellow
const RD = '\x1b[31m';          // red
const MG = '\x1b[35m';          // magenta
const BL = '\x1b[34m';          // blue
const WH = '\x1b[97m';          // bright white
const BG_NAVY  = '\x1b[48;5;17m';
const BG_TEAL  = '\x1b[48;5;30m';
const BG_DARK  = '\x1b[48;5;235m';

const W = process.stdout.columns || 80;

function line(char = '─', color = DIM) {
  return `${color}${char.repeat(W)}${R}`;
}

function pad(str, width) {
  return String(str).slice(0, width).padEnd(width);
}

// ── Banner ────────────────────────────────────────────────────────
function banner(title, subtitle = '') {
  const inner = W - 2;
  const tLine = pad(`  ${B}${WH}${title}${R}`, inner + B.length + WH.length + R.length + 2);
  const sLine = pad(`  ${DIM}${subtitle}${R}`, inner + DIM.length + R.length + 2);

  console.log();
  console.log(`${BG_NAVY}${' '.repeat(W)}${R}`);
  console.log(`${BG_NAVY}${tLine}${BG_NAVY} ${R}`);
  if (subtitle) console.log(`${BG_TEAL}${sLine}${BG_TEAL} ${R}`);
  console.log(`${BG_NAVY}${' '.repeat(W)}${R}`);
  console.log();
}

// ── Spinner (simple tick-based) ───────────────────────────────────
const SPIN = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let _spinInterval = null;
let _spinFrame    = 0;

function spinStart(label) {
  process.stdout.write(`\r${CY}${SPIN[0]}${R}  ${label}`);
  _spinFrame = 0;
  _spinInterval = setInterval(() => {
    _spinFrame = (_spinFrame + 1) % SPIN.length;
    process.stdout.write(`\r${CY}${SPIN[_spinFrame]}${R}  ${label}`);
  }, 80);
}

function spinStop(label, success = true) {
  if (_spinInterval) { clearInterval(_spinInterval); _spinInterval = null; }
  const icon = success ? `${GN}✔${R}` : `${RD}✖${R}`;
  process.stdout.write(`\r${icon}  ${label}\n`);
}

// ── Summary table ─────────────────────────────────────────────────
function printSummaryTable(papers) {
  const byArea = {};
  for (const p of papers) {
    byArea[p.studyArea] = (byArea[p.studyArea] || 0) + 1;
  }

  const sorted = Object.entries(byArea).sort(
    ([a], [b]) => priority(a) - priority(b)
  );

  console.log(`\n${B}  Geographic breakdown${R}`);
  console.log(`  ${DIM}${'─'.repeat(34)}${R}`);
  for (const [area, n] of sorted) {
    const bar = '█'.repeat(n * 2);
    console.log(`  ${ansi(area)}${pad(area, 22)}${R}  ${GN}${bar}${R}  ${B}${n}${R}`);
  }
  console.log();
}

// ── Individual paper card ─────────────────────────────────────────
function printCard(num, paper, opts = {}) {
  const { sections = {} } = paper;
  const areaColor = ansi(paper.studyArea);
  const oaBadge  = paper.isOA ? `${GN}[OA]${R}` : `${DIM}[Subscription]${R}`;

  console.log(`\n${DIM}${'─'.repeat(W)}${R}`);

  // Header row: number + title
  console.log(`${BG_DARK} ${B}${CY}[${num}]${R}${BG_DARK} ${B}${WH}${paper.title}${R}${BG_DARK} ${R}`);

  // Meta row
  const meta = [
    paper.authors,
    paper.journal ? `${DIM}${paper.journal}${R}` : '',
    paper.year    ? `${YL}${paper.year}${R}`     : '',
  ].filter(Boolean).join(`  ${DIM}·${R}  `);
  console.log(`  ${meta}`);

  // Badges row
  const citeBadge = `${MG}↑${paper.citations || 0} citations${R}`;
  console.log(`  ${areaColor}◉ ${paper.studyArea}${R}   ${citeBadge}   ${oaBadge}`);

  // Sections
  const printSection = (label, text) => {
    if (!text) return;
    const wrapped = wrapText(text, W - 20);
    console.log(`\n  ${B}${CY}${label}${R}`);
    for (const row of wrapped) console.log(`    ${row}`);
  };

  printSection('Summary',      sections.summary);
  printSection('Key Findings', sections.keyFindings);
  if (opts.verbose) {
    printSection('Methodology', sections.methodology);
    printSection('Future Work', sections.futureWork);
  }

  // DOI
  console.log(`\n  ${DIM}DOI:${R} ${BL}${paper.doi}${R}`);
}

// ── Full paper list ───────────────────────────────────────────────
function printPapers(papers, opts = {}) {
  if (!papers.length) {
    console.log(`\n  ${YL}No papers found.${R} Try broader search terms.\n`);
    return;
  }

  papers.forEach((p, i) => printCard(i + 1, p, opts));
  console.log(`\n${DIM}${'─'.repeat(W)}${R}\n`);
}

// ── Completion box ────────────────────────────────────────────────
function printDone(stats = {}) {
  const rows = [
    stats.file        ? `  File:           ${B}${stats.file}${R}` : null,
    stats.size        ? `  Size:           ${B}${stats.size}${R}` : null,
    stats.count       ? `  Publications:   ${B}${stats.count}${R}` : null,
    stats.sources     ? `  Sources:        ${DIM}${stats.sources}${R}` : null,
  ].filter(Boolean);

  const maxLen = Math.max(...rows.map((r) => r.replace(/\x1b\[[0-9;]*m/g, '').length));
  const boxW   = Math.max(maxLen + 4, 52);

  console.log(`\n${GN}╔${'═'.repeat(boxW)}╗${R}`);
  console.log(`${GN}║${R}  ${GN}${B}✔  Done${R}${' '.repeat(boxW - 9)}${GN}║${R}`);
  console.log(`${GN}╠${'═'.repeat(boxW)}╣${R}`);
  for (const row of rows) {
    const plain = row.replace(/\x1b\[[0-9;]*m/g, '');
    console.log(`${GN}║${R}${row}${' '.repeat(boxW - plain.length + 2)}${GN}║${R}`);
  }
  console.log(`${GN}╚${'═'.repeat(boxW)}╝${R}\n`);
}

function printError(msg) {
  console.error(`\n  ${RD}✖  ${msg}${R}\n`);
}

function printInfo(msg) {
  console.log(`  ${CY}ℹ${R}  ${msg}`);
}

// ── Text wrapping ─────────────────────────────────────────────────
function wrapText(text, width) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

module.exports = {
  banner, line, spinStart, spinStop,
  printSummaryTable, printCard, printPapers,
  printDone, printError, printInfo,
};
