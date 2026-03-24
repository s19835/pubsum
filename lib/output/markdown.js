'use strict';

/**
 * Render papers as a Markdown document.
 */
function render(papers, meta = {}) {
  const lines = [];
  const date  = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  lines.push(`# ${meta.title || 'Literature Review'}`);
  if (meta.subtitle) lines.push(`**${meta.subtitle}**`);
  lines.push('');
  if (meta.preparedBy) lines.push(`*Prepared by: ${meta.preparedBy}*`);
  lines.push(`*Generated: ${date}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push(`## Publications (${papers.length})`);
  lines.push('');

  papers.forEach((p, i) => {
    const s = p.sections || {};
    lines.push(`### [${i + 1}] ${p.title}`);
    lines.push('');
    lines.push(`**Authors:** ${p.authors}  `);
    if (p.journal) lines.push(`**Journal:** ${p.journal}  `);
    lines.push(`**Year:** ${p.year}  `);
    lines.push(`**Study Area:** ${p.studyArea}  `);
    lines.push(`**Citations:** ${p.citations || 0}  `);
    lines.push(`**Access:** ${p.isOA ? 'Open Access' : 'Subscription'}  `);
    lines.push(`**DOI:** [${p.doi}](${p.doi})`);
    lines.push('');
    if (s.summary)     lines.push(`**Summary:** ${s.summary}`, '');
    if (s.keyFindings) lines.push(`**Key Findings:** ${s.keyFindings}`, '');
    if (s.methodology) lines.push(`**Methodology:** ${s.methodology}`, '');
    if (s.futureWork)  lines.push(`**Future Work:** ${s.futureWork}`, '');
    lines.push('---');
    lines.push('');
  });

  lines.push(`*Sources: OpenAlex · CrossRef*`);
  return lines.join('\n');
}

module.exports = { render };
