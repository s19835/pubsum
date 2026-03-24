'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Lazy-load the docx module (auto-installs if missing) ──────────
let _docx = null;

function loadDocx() {
  if (_docx) return _docx;

  const scriptDir = path.join(__dirname, '..', '..');
  const local     = path.join(scriptDir, 'node_modules', 'docx');

  if (fs.existsSync(local)) { _docx = require(local); return _docx; }
  try { _docx = require('docx'); return _docx; } catch (_) {}

  console.log('\n  📦  Installing docx module (one-time)...');
  execSync(`npm install --prefix "${scriptDir}" docx`, { stdio: 'inherit' });
  _docx = require(local);
  return _docx;
}

// ── Colour palette ────────────────────────────────────────────────
const C = {
  navy:  '1A3A5C',
  teal:  '117A65',
  grey:  '6C7A89',
  body:  '2C3E50',
  white: 'FFFFFF',
  light: 'EAF4F2',
};

function areaFg(area = '') {
  const a = area.toLowerCase();
  if (a.includes('jaffna'))    return '154360';
  if (a.includes('sri lanka') || a.includes('northern province')) return '1D6A39';
  if (a.includes('asia'))      return '7D6608';
  return '6C3483';
}

// ── Document element builders ─────────────────────────────────────
function makeHelpers(D) {
  const { Paragraph, TextRun, Table, TableRow, TableCell,
          AlignmentType, BorderStyle, WidthType, ShadingType, ExternalHyperlink } = D;

  const rule   = () => new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.teal, space: 1 } }, spacing: { before: 60, after: 120 } });
  const spacer = (pt = 120) => new Paragraph({ children: [], spacing: { before: pt, after: 0 } });
  const h1     = (t) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 36, color: C.navy, font: 'Calibri' })], spacing: { before: 360, after: 120 } });
  const h3     = (t) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22, color: C.navy, font: 'Calibri' })], spacing: { before: 180, after: 80 } });
  const bodyP  = (t) => new Paragraph({ children: [new TextRun({ text: t, size: 22, color: C.body, font: 'Calibri' })], spacing: { before: 60, after: 60 }, alignment: AlignmentType.JUSTIFIED });
  const italicP= (t) => new Paragraph({ children: [new TextRun({ text: t, size: 20, color: C.grey, font: 'Calibri', italics: true })], spacing: { before: 40, after: 40 } });

  const labelPara = (label, text) => new Paragraph({
    children: [
      new TextRun({ text: `${label}  `, bold: true, size: 20, color: C.teal, font: 'Calibri' }),
      new TextRun({ text, size: 21, color: C.body, font: 'Calibri' }),
    ],
    spacing: { before: 50, after: 40 },
    alignment: AlignmentType.JUSTIFIED,
  });

  const areaBadge = (area, citations) => new Paragraph({
    children: [
      new TextRun({ text: 'Study Area:  ', bold: true, size: 19, color: C.grey, font: 'Calibri' }),
      new TextRun({ text: area || 'Global', bold: true, size: 19, color: areaFg(area), font: 'Calibri' }),
      new TextRun({ text: `   ·   Cited by: ${citations || 0}`, size: 19, color: C.grey, font: 'Calibri' }),
    ],
    spacing: { before: 0, after: 50 },
  });

  const refEntry = (num, citation) => new Paragraph({
    children: [
      new TextRun({ text: `[${num}]  `, bold: true, size: 21, color: C.teal, font: 'Calibri' }),
      new TextRun({ text: citation, size: 21, color: C.body, font: 'Calibri' }),
    ],
    spacing: { before: 60, after: 60 },
    indent: { left: 480, hanging: 480 },
  });

  const pubCard = (num, pub) => {
    const border  = { style: BorderStyle.SINGLE, size: 4, color: C.teal };
    const borders = { top: border, bottom: border, left: border, right: border };
    const s = pub.sections || {};

    const kids = [
      new Paragraph({
        children: [
          new TextRun({ text: `[${num}]  `, bold: true, size: 24, color: C.teal, font: 'Calibri' }),
          new TextRun({ text: pub.title, bold: true, size: 24, color: C.navy, font: 'Calibri' }),
        ],
        spacing: { before: 40, after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${pub.authors}. ${pub.journal}${pub.journal ? ', ' : ''}${pub.year}.`, size: 20, color: C.grey, font: 'Calibri', italics: true })],
        spacing: { before: 0, after: 40 },
      }),
      areaBadge(pub.studyArea, pub.citations),
    ];

    if (s.summary)     kids.push(labelPara('Summary.',      s.summary));
    if (s.keyFindings) kids.push(labelPara('Key Findings.', s.keyFindings));
    if (s.methodology) kids.push(labelPara('Methodology.',  s.methodology));
    if (s.futureWork)  kids.push(labelPara('Future Work.',  s.futureWork));

    kids.push(new Paragraph({
      children: [
        new TextRun({ text: 'Access: ', bold: true, size: 20, color: C.grey, font: 'Calibri' }),
        new ExternalHyperlink({
          link: pub.doi,
          children: [new TextRun({ text: pub.doi, size: 20, color: '1565C0', font: 'Calibri', underline: {} })],
        }),
        new TextRun({ text: `  [${pub.isOA ? 'Open Access' : 'Subscription'}]`, size: 20, color: C.grey, font: 'Calibri' }),
      ],
      spacing: { before: 40, after: 20 },
    }));

    return new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [9026],
      rows: [new TableRow({ children: [new TableCell({
        borders,
        shading: { fill: C.light, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
        width: { size: 9026, type: WidthType.DXA },
        children: kids,
      })] })],
    });
  };

  return { rule, spacer, h1, h3, bodyP, italicP, refEntry, pubCard };
}

// ── Group papers by study area ────────────────────────────────────
function groupPapers(papers) {
  const defs = [
    { key: 'jaffna',    label: 'A — Jaffna Peninsula' },
    { key: 'sri lanka', label: 'B — Sri Lanka' },
    { key: 'asia',      label: 'C — South / South-East Asia' },
    { key: 'global',    label: 'D — Global Studies & Reviews' },
  ];

  return defs
    .map((d) => ({
      label: d.label,
      pubs: papers.filter((p) => {
        const a = (p.studyArea || '').toLowerCase();
        if (d.key === 'jaffna')    return a.includes('jaffna');
        if (d.key === 'sri lanka') return a.includes('sri lanka') && !a.includes('jaffna');
        if (d.key === 'asia')      return (a.includes('asia') || a.includes('india')) && !a.includes('sri lanka') && !a.includes('jaffna');
        return !a.includes('jaffna') && !a.includes('sri lanka') && !a.includes('asia') && !a.includes('india');
      }),
    }))
    .filter((g) => g.pubs.length > 0);
}

// ── Build and write the .docx file ───────────────────────────────
async function write(papers, meta = {}, outPath) {
  const D = loadDocx();
  const { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, BorderStyle, ShadingType } = D;
  const H = makeHelpers(D);

  const groups = groupPapers(papers);
  const total  = papers.length;
  const date   = meta.date || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const children = [];

  // Cover
  children.push(
    new Paragraph({ children: [new TextRun({ text: meta.title || 'Literature Review', size: 48, bold: true, color: C.white, font: 'Calibri' })], shading: { fill: C.navy, type: ShadingType.CLEAR }, spacing: { before: 400, after: 60 }, indent: { left: 300, right: 300 } }),
    new Paragraph({ children: [new TextRun({ text: meta.subtitle || '', size: 28, bold: true, color: C.white, font: 'Calibri' })], shading: { fill: C.teal, type: ShadingType.CLEAR }, spacing: { before: 0, after: 0 }, indent: { left: 300, right: 300 } }),
    new Paragraph({ children: [new TextRun({ text: date, size: 22, color: C.light, font: 'Calibri' })], shading: { fill: C.teal, type: ShadingType.CLEAR }, spacing: { before: 40, after: 400 }, indent: { left: 300, right: 300 } }),
    new Paragraph({ children: [new TextRun({ text: `Prepared by:  ${meta.preparedBy || ''}`, size: 20, color: C.grey, font: 'Calibri' })], spacing: { before: 200, after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: `Sources:  OpenAlex · CrossRef  |  ${total} publications`, size: 20, color: C.grey, font: 'Calibri' })], spacing: { before: 0, after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: `Search terms:  ${meta.searchTerms || meta.title || ''}`, size: 20, color: C.grey, font: 'Calibri' })], spacing: { before: 0, after: 200 } }),
    H.rule(),
  );

  // Executive summary
  children.push(
    H.h1('Executive Summary'),
    H.bodyP(`This literature review compiles ${total} peer-reviewed publications on "${meta.title || 'the topic'}". Coverage is prioritised geographically: Jaffna Peninsula → Sri Lanka → South Asia → Global. Publications are ranked by citation count within each group.`),
    H.spacer(200),
  );

  // Groups
  let counter = 0;
  for (const g of groups) {
    children.push(H.h1(g.label), H.rule());
    for (const pub of g.pubs) {
      counter++;
      children.push(H.pubCard(counter, pub), H.spacer(120));
    }
    children.push(H.spacer(200));
  }

  // Reference list
  children.push(H.h1('Consolidated Reference List'), H.rule());
  children.push(H.bodyP(`${total} publications. [OA] = Open Access.`), H.spacer(120));

  let refNum = 0;
  for (const g of groups) {
    if (groups.length > 1) children.push(H.h3(g.label), H.spacer(60));
    for (const pub of g.pubs) {
      refNum++;
      const area = pub.studyArea ? ` [${pub.studyArea}]` : '';
      const oa   = pub.isOA ? ' [OA]' : '';
      children.push(H.refEntry(refNum, `${pub.authors} (${pub.year}). ${pub.title}. ${pub.journal}.${area} ${pub.doi}${oa}`));
    }
    children.push(H.spacer(80));
  }

  children.push(H.spacer(80), H.italicP(`Review generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Sources: OpenAlex · CrossRef.`));

  // Assemble
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1260, right: 1260, bottom: 1260, left: 1260 } } },
      headers: { default: new Header({ children: [new Paragraph({
        children: [
          new TextRun({ text: `Literature Review  |  ${meta.title || ''}`, size: 18, color: C.grey, font: 'Calibri' }),
          new TextRun({ text: '\t', size: 18 }),
          new TextRun({ text: date, size: 18, color: C.teal, font: 'Calibri', bold: true }),
        ],
        tabStops: [{ type: 'right', position: 9026 }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.teal, space: 1 } },
        spacing: { after: 0 },
      })] }) },
      footers: { default: new Footer({ children: [new Paragraph({
        children: [
          new TextRun({ text: `Generated via OpenAlex & CrossRef  |  ${meta.title || ''}`, size: 18, color: C.grey, font: 'Calibri' }),
          new TextRun({ text: '\t', size: 18 }),
          new TextRun({ text: 'Page ', size: 18, color: C.grey, font: 'Calibri' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.grey, font: 'Calibri' }),
        ],
        tabStops: [{ type: 'right', position: 9026 }],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.teal, space: 1 } },
      })] }) },
      children,
    }],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);

  return { size: `${(fs.statSync(outPath).size / 1024).toFixed(1)} KB` };
}

module.exports = { write };
