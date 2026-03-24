'use strict';

const { get, reconstructAbstract } = require('../fetch');
const { detectStudyArea }           = require('../study-area');

const FIELDS = [
  'title',
  'authorships',
  'publication_year',
  'abstract_inverted_index',
  'primary_location',
  'doi',
  'open_access',
  'cited_by_count',
].join(',');

/**
 * Search OpenAlex for academic publications.
 * @param {string} query
 * @param {number} count  max results (API cap: 25 per page)
 * @returns {Promise<Publication[]>}
 */
async function search(query, count = 20) {
  const encoded = encodeURIComponent(query);
  const url = `https://api.openalex.org/works?search=${encoded}&per-page=${Math.min(count, 25)}&select=${FIELDS}&sort=cited_by_count:desc`;

  const data = await get(url);
  return (data.results || [])
    .map((w) => {
      const authors  = (w.authorships || []).slice(0, 4).map((a) => a.author?.display_name || '').filter(Boolean);
      const src      = (w.primary_location?.source) || {};
      const abstract = reconstructAbstract(w.abstract_inverted_index);
      const doi      = (w.doi || '').replace('https://doi.org/', '');
      const venue    = src.display_name || '';

      return {
        title:     w.title || '',
        authors:   authors.length
          ? authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : '')
          : 'Unknown',
        journal:   venue,
        year:      String(w.publication_year || ''),
        abstract:  abstract.slice(0, 1200),
        doi:       doi ? `https://doi.org/${doi}` : '',
        isOA:      w.open_access?.is_oa || false,
        citations: w.cited_by_count || 0,
        studyArea: detectStudyArea(w.title || '', abstract, venue),
        _source:   'openalex',
      };
    })
    .filter((p) => p.title && p.doi);
}

module.exports = { search };
