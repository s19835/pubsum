'use strict';

const { get, sleep, stripTags } = require('../fetch');
const { detectStudyArea }        = require('../study-area');

const FIELDS = [
  'title',
  'author',
  'published',
  'abstract',
  'DOI',
  'container-title',
  'is-referenced-by-count',
].join(',');

/**
 * Search CrossRef for academic publications.
 * Adds a 1 s courtesy delay before the request.
 * @param {string} query
 * @param {number} count  max results (API cap: 20 per page)
 * @returns {Promise<Publication[]>}
 */
async function search(query, count = 10) {
  await sleep(1000); // be polite to CrossRef

  const encoded = encodeURIComponent(query);
  const url = `https://api.crossref.org/works?query=${encoded}&rows=${Math.min(count, 20)}&select=${FIELDS}&sort=is-referenced-by-count&order=desc`;

  const data = await get(url);
  return ((data.message || {}).items || [])
    .map((item) => {
      const authors  = (item.author || []).slice(0, 4).map((a) => a.family || a.name || '').filter(Boolean);
      const abstract = stripTags(item.abstract || '');
      const journal  = (item['container-title'] || [])[0] || '';
      const year     = String(((item.published || {})['date-parts'] || [['']])[0][0] || '');
      const doi      = item.DOI || '';
      const title    = (item.title || [])[0] || '';

      return {
        title,
        authors: authors.length
          ? authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : '')
          : 'Unknown',
        journal,
        year,
        abstract:  abstract.slice(0, 1200),
        doi:       doi ? `https://doi.org/${doi}` : '',
        isOA:      false,
        citations: item['is-referenced-by-count'] || 0,
        studyArea: detectStudyArea(title, abstract, journal),
        _source:   'crossref',
      };
    })
    .filter((p) => p.title && p.doi);
}

module.exports = { search };
