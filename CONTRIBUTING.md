# Contributing to pubsum

Thank you for taking the time to contribute! 🎉

## Ways to contribute

- **Report a bug** — open an issue using the Bug Report template
- **Suggest a feature** — open an issue using the Feature Request template
- **Fix a bug or add a feature** — open a pull request
- **Improve documentation** — typos, examples, clearer explanations are all welcome
- **Add a new output format** — add a file in `lib/output/` following the existing pattern

## Development setup

```bash
git clone https://github.com/s19835/pubsum
cd pubsum
npm install
npm link        # makes `pub` available globally from local source
```

Test your changes:

```bash
pub search "groundwater Jaffna" --count 5
pub search "water quality" --format docx --out /tmp/test.docx --count 5
pub search "salinity" --format markdown --count 5
pub template
pub help
```

## Project structure

```
bin/pub.js              CLI entry point & arg parser
lib/
  fetch.js              HTTP utility (get, sleep, stripTags, reconstructAbstract)
  study-area.js         Region detection, priority, ANSI/docx colours
  abstract.js           Abstract → structured sections (summary, findings, etc.)
  rank.js               dedupe(), rank(), filter()
  sources/
    openalex.js         OpenAlex API client
    crossref.js         CrossRef API client
  output/
    terminal.js         Rich terminal renderer
    markdown.js         Markdown renderer
    docx.js             Word .docx renderer
```

## Adding a new source

1. Create `lib/sources/yourservice.js` — export a `search(query, count)` function that returns an array of publication objects with the shape:

```js
{
  title, authors, journal, year,
  abstract,   // raw string
  doi,        // full URL
  isOA,       // boolean
  citations,  // number
  studyArea,  // detected by lib/study-area.js
  _source,    // 'yourservice'
}
```

2. Import and call it in `bin/pub.js` inside `cmdSearch()`.

## Adding a new output format

1. Create `lib/output/yourformat.js` — export a `render(papers, meta)` function.
2. Add a `case 'yourformat':` branch in the render section of `cmdSearch()` in `bin/pub.js`.
3. Add it to the `--format` option list in `showHelp()`.

## Pull request guidelines

- Keep PRs focused — one feature or fix per PR
- Test manually with at least `terminal` and `docx` formats before submitting
- Update `README.md` if you add a new flag, command, or format
- No new runtime dependencies without discussion first — the goal is to stay lean

## Publishing (maintainers only)

```bash
npm version patch   # or minor / major
npm publish --access public
git push origin main --tags
# Update homebrew/Formula/pubsum.rb with new url + sha256
# Push to github.com/s19835/homebrew-pubsum
```
