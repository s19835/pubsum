'use strict';

const { priority } = require('./study-area');

/** Remove duplicates by DOI (or first 50 chars of title). */
function dedupe(papers) {
  const seen = new Set();
  return papers.filter((p) => {
    const key = (p.doi || p.title.toLowerCase().slice(0, 50)).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Score each paper and sort descending.
 * Score = study-area priority bonus + log10(citations) + abstract quality + OA bonus
 */
function rank(papers) {
  return papers
    .map((p) => ({
      ...p,
      _score:
        (5 - priority(p.studyArea)) * 1000 +
        Math.log10(Math.max(p.citations || 1, 1)) * 100 +
        ((p.abstract || '').length > 100 ? 50 : 0) +
        (p.isOA ? 20 : 0),
    }))
    .sort((a, b) => b._score - a._score);
}

/** Filter papers by one or more field predicates. All must pass. */
function filter(papers, opts = {}) {
  let out = papers;
  if (opts.minYear)  out = out.filter((p) => Number(p.year)      >= opts.minYear);
  if (opts.maxYear)  out = out.filter((p) => Number(p.year)      <= opts.maxYear);
  if (opts.minCites) out = out.filter((p) => (p.citations || 0)  >= opts.minCites);
  if (opts.onlyOA)   out = out.filter((p) => p.isOA);
  if (opts.area)     out = out.filter((p) => (p.studyArea || '').toLowerCase().includes(opts.area.toLowerCase()));
  return out;
}

module.exports = { dedupe, rank, filter };
