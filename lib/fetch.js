'use strict';

const https = require('https');
const http  = require('http');

/**
 * Simple promise-based HTTP GET that returns parsed JSON.
 * Follows redirects. Returns { _raw: string } on parse failure.
 */
function get(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const lib  = url.startsWith('https') ? https : http;
    const opts = {
      headers: {
        'User-Agent': 'PubCLI/1.0 (mailto:research@example.org)',
        'Accept': 'application/json',
        ...extraHeaders,
      },
    };

    lib.get(url, opts, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return get(res.headers.location, extraHeaders).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (_) { resolve({ _raw: data }); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Strip JATS / HTML tags from CrossRef abstracts */
function stripTags(str) {
  return (str || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Rebuild abstract from OpenAlex inverted-index format */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return '';
  const words = {};
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) words[pos] = word;
  }
  return Object.keys(words)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => words[k])
    .join(' ');
}

module.exports = { get, sleep, stripTags, reconstructAbstract };
