#!/usr/bin/env node
'use strict';

// ─────────────────────────────────────────────────────────────────
//  pub  —  Academic Publication Summariser CLI
//
//  Commands:
//    pub search <query> [options]   Search & summarise publications
//    pub review --config <file>     Build review from a JSON config
//    pub template                   Print a JSON config template
//    pub help                       Show help
//
//  Examples:
//    pub search "groundwater Jaffna" --count 10
//    pub search "citizen science water" --format docx --out review.docx
//    pub search "salinity Sri Lanka"   --format markdown > review.md
//    pub search "water quality"        --min-year 2015 --only-oa
//    pub review --config my_papers.json
// ─────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const rl   = require('readline');

const openalex = require('../lib/sources/openalex');
const crossref = require('../lib/sources/crossref');
const { dedupe, rank, filter } = require('../lib/rank');
const { parse: parseAbstract }  = require('../lib/abstract');
const { sleep }                  = require('../lib/fetch');
const term                       = require('../lib/output/terminal');
const mdOutput                   = require('../lib/output/markdown');

// ── ANSI shorthands ───────────────────────────────────────────────
const R  = '\x1b[0m';
const B  = '\x1b[1m';
const DIM= '\x1b[2m';
const CY = '\x1b[36m';
const GN = '\x1b[32m';
const YL = '\x1b[33m';
const RD = '\x1b[31m';

// ── Arg parser ────────────────────────────────────────────────────
function parseArgs(argv) {
  const args  = argv.slice(2);
  const flags = {};
  const pos   = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      pos.push(a);
    }
  }

  return { command: pos[0], rest: pos.slice(1), flags };
}

// ── Interactive prompt ────────────────────────────────────────────
function prompt(question, defaultVal) {
  const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const display = defaultVal !== undefined ? `${question} ${DIM}[${defaultVal}]${R}: ` : `${question}: `;
    iface.question(display, (ans) => {
      iface.close();
      resolve(ans.trim() || defaultVal || '');
    });
  });
}

// ── Help text ─────────────────────────────────────────────────────
function showHelp() {
  term.banner('pub  —  Academic Publication Summariser', 'OpenAlex · CrossRef · No API key required');

  console.log(`${B}COMMANDS${R}
  ${CY}pub search${R} ${YL}<query>${R} ${DIM}[options]${R}
      Search publications and display summaries.

  ${CY}pub review${R} ${DIM}--config <file.json>${R}
      Build a formatted review from a hand-curated JSON config.

  ${CY}pub template${R}
      Print a JSON config template for the review command.

  ${CY}pub help${R}
      Show this help.

${B}SEARCH OPTIONS${R}
  ${DIM}--count  N${R}          Number of papers to retrieve (default: 12, max: 50)
  ${DIM}--format terminal${R}   Output to terminal ${DIM}(default)${R}
  ${DIM}--format docx${R}       Write a .docx document (use with --out)
  ${DIM}--format markdown${R}   Print Markdown to stdout
  ${DIM}--format json${R}       Print raw JSON to stdout
  ${DIM}--out    file${R}       Output file path (for docx/markdown)
  ${DIM}--by     name${R}       "Prepared by" field for the document
  ${DIM}--scope  text${R}       Subtitle / scope label for the document
  ${DIM}--extra  terms${R}      Additional search terms (comma-separated)
  ${DIM}--min-year N${R}        Only include papers published ≥ year
  ${DIM}--max-year N${R}        Only include papers published ≤ year
  ${DIM}--min-cites N${R}       Only include papers with ≥ N citations
  ${DIM}--only-oa${R}           Only include Open Access papers
  ${DIM}--area  region${R}      Filter by study area (e.g. "jaffna", "global")
  ${DIM}--verbose${R}           Show Methodology & Future Work sections
  ${DIM}--no-crossref${R}       Skip CrossRef fallback (faster, fewer results)

${B}EXAMPLES${R}
  ${GN}pub search "groundwater Jaffna" --count 10${R}
  ${GN}pub search "citizen science water" --format docx --out review.docx${R}
  ${GN}pub search "salinity Sri Lanka" --format markdown > review.md${R}
  ${GN}pub search "water quality" --min-year 2015 --only-oa --verbose${R}
  ${GN}pub review --config my_papers.json${R}
`);
}

// ── Template command ──────────────────────────────────────────────
function showTemplate() {
  const t = {
    meta: {
      title:       'Literature Review on Citizen Science Water Monitoring',
      subtitle:    'Focus: Jaffna Peninsula · Sri Lanka · Global',
      preparedBy:  'Your Name / Organisation',
      fundedBy:    'Funder Name',
      date:        'March 2026',
      outputFile:  'My_Literature_Review.docx',
      searchTerms: 'citizen science, groundwater, water quality',
    },
    executiveSummary: 'One paragraph summarising the review...',
    groups: [
      {
        label: 'A',
        title: 'Regional Studies — Jaffna Peninsula',
        intro: 'These studies focus specifically on the Jaffna region.',
        publications: [
          {
            title:     'Example Article Title',
            authors:   'Smith, J. et al.',
            journal:   'Nature Water, 1(2), pp. 3–10',
            year:      '2024',
            studyArea: 'Jaffna Peninsula',
            sections: {
              summary:     'Brief overview of what the paper is about.',
              keyFindings: 'Specific results, numbers, conclusions worth citing.',
              methodology: 'Research design and analytical approach.',
              futureWork:  'Next steps identified by the authors.',
            },
            doi:    'https://doi.org/10.xxxx/xxxxx',
            access: 'Open Access',
          },
        ],
      },
      {
        label: 'B',
        title: 'Global Reviews & Comparators',
        intro: 'Worldwide evidence for context and comparison.',
        publications: [],
      },
    ],
  };
  console.log(JSON.stringify(t, null, 2));
}

// ── Search command ────────────────────────────────────────────────
async function cmdSearch(positional, flags = {}) {
  let query = positional.join(' ');

  // Interactive if no query given
  if (!query) {
    term.banner('pub  —  Publication Summariser', 'OpenAlex · CrossRef');
    console.log(`  ${DIM}No query given — entering interactive mode.${R}\n`);
    query = await prompt(`  ${CY}Search topic${R}`, 'groundwater Jaffna');
    if (!flags.count)  flags.count  = await prompt(`  ${CY}Number of papers${R}`, '12');
    if (!flags.format) flags.format = await prompt(`  ${CY}Output format${R} ${DIM}(terminal/docx/markdown/json)${R}`, 'terminal');
    if (flags.format !== 'terminal' && !flags.out) {
      flags.out = await prompt(`  ${CY}Output file${R}`, `${query.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}_review.${flags.format === 'docx' ? 'docx' : 'md'}`);
    }
    if (!flags.by) flags.by = await prompt(`  ${CY}Prepared by${R} ${DIM}(optional)${R}`, '');
    console.log();
  }

  const count      = Math.min(Math.max(parseInt(flags.count) || 12, 3), 50);
  const format     = (flags.format || 'terminal').toLowerCase();
  const extraTerms = flags.extra ? flags.extra.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const filterOpts = {
    minYear:  flags['min-year']  ? parseInt(flags['min-year'])  : undefined,
    maxYear:  flags['max-year']  ? parseInt(flags['max-year'])  : undefined,
    minCites: flags['min-cites'] ? parseInt(flags['min-cites']) : undefined,
    onlyOA:   flags['only-oa']   ? true : undefined,
    area:     flags.area         || undefined,
  };

  if (format === 'terminal') {
    term.banner('pub  —  Publication Summariser', `Searching: "${query}"`);
  }

  // ── Fetch ──────────────────────────────────────────────────────
  if (format === 'terminal') term.spinStart(`OpenAlex: "${query}"`);
  let results = [];
  try {
    const [base, focused] = await Promise.all([
      openalex.search(query, Math.ceil(count * 0.7)),
      openalex.search(`${query} Jaffna Sri Lanka`, Math.ceil(count * 0.5)),
    ]);
    results = [...focused, ...base];
    if (format === 'terminal') term.spinStop(`OpenAlex: ${results.length} results`);
  } catch (e) {
    if (format === 'terminal') term.spinStop(`OpenAlex failed: ${e.message}`, false);
  }

  // CrossRef fallback
  if (!flags['no-crossref'] && results.length < 5) {
    if (format === 'terminal') term.spinStart('CrossRef (supplementing)...');
    try {
      const cr = await crossref.search(query, 10);
      results  = [...results, ...cr];
      if (format === 'terminal') term.spinStop(`CrossRef: +${cr.length} results`);
    } catch (e) {
      if (format === 'terminal') term.spinStop(`CrossRef failed: ${e.message}`, false);
    }
  }

  // Extra term searches
  for (const term_ of extraTerms.slice(0, 3)) {
    await sleep(700);
    if (format === 'terminal') term.spinStart(`Extra: "${term_}"`);
    try {
      const r = await openalex.search(`${query} ${term_}`, 8);
      results  = [...results, ...r];
      if (format === 'terminal') term.spinStop(`Extra "${term_}": +${r.length}`);
    } catch (e) {
      if (format === 'terminal') term.spinStop(`Extra "${term_}" failed`, false);
    }
  }

  // ── Process ────────────────────────────────────────────────────
  let papers = rank(dedupe(results)).slice(0, count);
  papers = filter(papers, filterOpts);
  papers = papers.map((p) => ({ ...p, sections: parseAbstract(p.abstract, p.title, p.year) }));

  if (format === 'terminal') term.printSummaryTable(papers);

  // ── Render ─────────────────────────────────────────────────────
  const meta = {
    title:       query,
    subtitle:    flags.scope || `Focus: Jaffna Peninsula · Sri Lanka · Global`,
    preparedBy:  flags.by    || '',
    searchTerms: [query, ...extraTerms].join(' · '),
    date:        new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  };

  if (format === 'terminal') {
    term.printPapers(papers, { verbose: !!flags.verbose });
    term.printDone({
      count:   papers.length,
      sources: 'OpenAlex · CrossRef',
    });

  } else if (format === 'json') {
    const out = JSON.stringify(papers, null, 2);
    if (flags.out) { fs.writeFileSync(flags.out, out); term.printDone({ file: flags.out, count: papers.length }); }
    else            console.log(out);

  } else if (format === 'markdown') {
    const md = mdOutput.render(papers, meta);
    if (flags.out) { fs.writeFileSync(flags.out, md); term.printDone({ file: flags.out, count: papers.length }); }
    else            console.log(md);

  } else if (format === 'docx') {
    const outFile = flags.out || `${query.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}_review.docx`;
    const outPath = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile);
    if (format === 'terminal' || true) term.spinStart('Building .docx document...');
    const docxOutput = require('../lib/output/docx');
    const { size }   = await docxOutput.write(papers, meta, outPath);
    term.spinStop('Document built');
    term.printDone({ file: path.basename(outPath), size, count: papers.length, sources: 'OpenAlex · CrossRef' });

  } else {
    term.printError(`Unknown format "${format}". Use: terminal, docx, markdown, json`);
    process.exit(1);
  }
}

// ── Review command (hand-curated JSON config) ─────────────────────
async function cmdReview(flags) {
  const cfgPath = flags.config;
  if (!cfgPath) {
    term.printError('--config <file.json> is required. Run `pub template` to see the format.');
    process.exit(1);
  }

  const resolved = path.isAbsolute(cfgPath) ? cfgPath : path.join(process.cwd(), cfgPath);
  if (!fs.existsSync(resolved)) {
    term.printError(`Config file not found: ${resolved}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(resolved, 'utf8'));

  // Flatten groups → papers
  const papers = [];
  for (const g of (config.groups || [])) {
    for (const pub of (g.publications || [])) {
      papers.push({
        title:     pub.title,
        authors:   pub.authors,
        journal:   pub.journal,
        year:      pub.year,
        studyArea: pub.studyArea || 'Global',
        doi:       pub.doi || '',
        isOA:      (pub.access || '').toLowerCase().includes('open'),
        citations: 0,
        sections:  pub.sections || {},
        _source:   'manual',
      });
    }
  }

  const meta    = config.meta || {};
  const outFile = meta.outputFile || 'Literature_Review.docx';
  const outPath = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile);

  term.banner('pub review', `Building from: ${path.basename(resolved)}`);
  term.spinStart('Building .docx document...');

  const docxOutput = require('../lib/output/docx');
  const { size }   = await docxOutput.write(papers, {
    title:      meta.title,
    subtitle:   meta.subtitle,
    preparedBy: meta.preparedBy,
    date:       meta.date,
    searchTerms: meta.searchTerms,
  }, outPath);

  term.spinStop('Document built');
  term.printDone({ file: path.basename(outPath), size, count: papers.length });
}

// ── Entry point ───────────────────────────────────────────────────
async function main() {
  const { command, rest, flags } = parseArgs(process.argv);

  switch (command) {
    case 'search':
      await cmdSearch(rest, flags);
      break;

    case 'review':
      await cmdReview(flags);
      break;

    case 'template':
      showTemplate();
      break;

    case 'help':
    case '--help':
    case '-h':
    case undefined:
      showHelp();
      break;

    default:
      // Treat unknown first arg as a search query
      await cmdSearch([command, ...rest].filter(Boolean), flags);
  }
}

main().catch((err) => {
  console.error(`\n  ${RD}✖  ${err.message}${R}\n`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
