'use strict';

/**
 * Parse a raw abstract string into structured sections:
 *   summary, keyFindings, methodology (optional), futureWork (optional)
 */
function parse(abstract = '', title = '', year = '') {
  if (!abstract || abstract.length < 80) {
    return {
      summary:     `${title} (${year}). Abstract not available — follow the DOI link for full text.`,
      keyFindings: 'Refer to the full publication for results and conclusions.',
    };
  }

  const sentences = abstract.match(/[^.!?]+[.!?]+/g) || [abstract];
  const n = sentences.length;

  const summary = sentences.slice(0, Math.min(2, n)).join(' ').trim();

  const findingRe = /(\d+[\.\d]*\s?%|\d+\s?fold|signific|result|found|show|demonstrat|reveal|indicate|conclud|higher|lower|increase|decrease|improve|reduc)/i;
  const findingSentences = sentences.filter((s) => findingRe.test(s));
  const keyFindings = findingSentences.length
    ? findingSentences.slice(0, 3).join(' ').trim()
    : sentences.slice(Math.max(0, n - 3)).join(' ').trim();

  const methodRe = /survey|interview|sampl|monitor|measur|collect|model|GIS|analys|questionnaire|experiment|review|systematic|data|field/i;
  const methodSentences = sentences.filter((s) => methodRe.test(s));
  const methodology = methodSentences.length
    ? methodSentences.slice(0, 2).join(' ').trim()
    : null;

  const futureRe = /recommend|future|further|should|need|propose|suggest|require|call for|policy|framework|next/i;
  const futureSentences = sentences.filter((s) => futureRe.test(s));
  const futureWork = futureSentences.length
    ? futureSentences.slice(0, 2).join(' ').trim()
    : null;

  return {
    summary,
    keyFindings: keyFindings || summary,
    ...(methodology && methodology !== summary ? { methodology } : {}),
    ...(futureWork ? { futureWork } : {}),
  };
}

module.exports = { parse };
