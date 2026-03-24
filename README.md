# pubsum

> Search and summarise academic publications from your terminal.
> Powered by **OpenAlex** and **CrossRef** — no API key or account required.

```
╔══════════════════════════════════════════════════════╗
║  pub  —  Academic Publication Summariser             ║
║  OpenAlex · CrossRef · No API key required           ║
╚══════════════════════════════════════════════════════╝
```

## Features

- **Search** OpenAlex & CrossRef simultaneously
- **Summarise** abstracts into Summary / Key Findings / Methodology / Future Work
- **Filter** by year, citation count, open access status, or geographic area
- **Export** to terminal (colour), `.docx`, Markdown, or JSON
- **Geographic ranking** — Jaffna Peninsula → Sri Lanka → South Asia → Global (customisable)
- **Zero config** — works out of the box, `docx` installed on first use if needed

---

## Installation

### macOS — Homebrew (recommended)

```bash
brew tap s19835/pubsum
brew install pubsum
```

### macOS / Linux / Windows — npm (Node.js ≥ 16)

```bash
npm install -g pubsum
```

### Linux — one-liner install script

```bash
curl -fsSL https://raw.githubusercontent.com/s19835/pubsum/main/scripts/install.sh | bash
```

Or manually:

```bash
# Requires Node.js ≥ 16
node --version          # check
npm install -g pubsum
pub --help
```

### Windows — npm (PowerShell or Command Prompt)

```powershell
npm install -g pubsum
pub --help
```

> **Node.js not installed?**
> Download from [nodejs.org](https://nodejs.org) (LTS) or use a version manager:
> - **macOS/Linux:** `nvm` → `nvm install --lts`
> - **Windows:** `nvm-windows` or `fnm`

### Verify installation

```bash
pub help
```

---

## Quick Start

```bash
# Search and display in the terminal
pub search "groundwater Jaffna" --count 10

# Export to Word document
pub search "citizen science water" --format docx --out review.docx

# Export to Markdown
pub search "salinity Sri Lanka" --format markdown > review.md

# Export to JSON for further processing
pub search "water quality" --format json > papers.json

# Verbose mode: include Methodology & Future Work
pub search "rainwater harvesting" --verbose

# Filter: only recent Open Access papers
pub search "arsenic groundwater" --min-year 2018 --only-oa

# Interactive mode (no arguments needed)
pub search
```

---

## Commands

| Command | Description |
|---------|-------------|
| `pub search <query> [options]` | Search publications and summarise |
| `pub review --config <file.json>` | Build a review from a hand-curated JSON config |
| `pub template` | Print a JSON config template |
| `pub help` | Show help |

---

## Search Options

| Flag | Default | Description |
|------|---------|-------------|
| `--count N` | `12` | Number of papers to retrieve (max 50) |
| `--format terminal` | `terminal` | Output format: `terminal`, `docx`, `markdown`, `json` |
| `--out file` | — | Output file path (for `docx`/`markdown`) |
| `--by "Name"` | — | "Prepared by" field for the document |
| `--scope "text"` | — | Subtitle / scope label for the document |
| `--extra "a,b"` | — | Additional search terms (comma-separated) |
| `--min-year N` | — | Only include papers published ≥ year |
| `--max-year N` | — | Only include papers published ≤ year |
| `--min-cites N` | — | Only include papers with ≥ N citations |
| `--only-oa` | — | Only include Open Access papers |
| `--area "region"` | — | Filter by study area (e.g. `jaffna`, `global`) |
| `--verbose` | — | Show Methodology & Future Work sections |
| `--no-crossref` | — | Skip CrossRef fallback (faster, fewer results) |

---

## Usage Examples

### Terminal output (default)

```bash
pub search "groundwater salinity Jaffna" --count 15 --verbose
```

### Word document

```bash
pub search "citizen science water monitoring" \
  --count 20 \
  --format docx \
  --out "Water_Monitoring_Review.docx" \
  --by "Dr. A. Researcher" \
  --scope "Focus: Jaffna Peninsula · Sri Lanka · Global"
```

### Markdown → GitHub / Notion

```bash
pub search "rainwater harvesting Sri Lanka" --format markdown > review.md
```

### JSON → pipe into other tools

```bash
pub search "water quality school" --format json | jq '.[].title'
```

### Filter & combine

```bash
# Only highly-cited Open Access papers from the last 5 years
pub search "fluoride groundwater" \
  --min-year 2019 \
  --min-cites 20 \
  --only-oa \
  --count 25
```

### Hand-curated review

```bash
# 1. Generate a template
pub template > my_papers.json

# 2. Edit my_papers.json with your publications

# 3. Build the document
pub review --config my_papers.json
```

---

## JSON Config Format (for `pub review`)

```jsonc
{
  "meta": {
    "title":       "Literature Review on Citizen Science Water Monitoring",
    "subtitle":    "Focus: Jaffna Peninsula · Sri Lanka · Global",
    "preparedBy":  "Your Name / Organisation",
    "fundedBy":    "Funder Name",          // optional
    "date":        "March 2026",
    "outputFile":  "My_Review.docx",
    "searchTerms": "citizen science, groundwater, water quality"
  },
  "executiveSummary": "One paragraph summary...",
  "groups": [
    {
      "label": "A",
      "title": "Regional Studies — Jaffna Peninsula",
      "intro": "Optional introductory paragraph.",
      "publications": [
        {
          "title":     "Article Title",
          "authors":   "Smith, J. et al.",
          "journal":   "Nature Water, 1(2), pp. 3–10",
          "year":      "2024",
          "studyArea": "Jaffna Peninsula",
          "sections": {
            "summary":     "What the paper is about.",
            "keyFindings": "Results and numbers.",
            "methodology": "How it was done.",    // optional
            "futureWork":  "Next steps."          // optional
          },
          "doi":    "https://doi.org/10.xxxx/xxxxx",
          "access": "Open Access"
        }
      ]
    }
  ]
}
```

Run `pub template` to get a ready-to-edit copy.

---

## How It Works

```
pub search "query"
     │
     ├─► OpenAlex API  (primary — best abstract coverage)
     │       └─ parallel: base query + "query Jaffna Sri Lanka"
     │
     ├─► CrossRef API  (fallback if < 5 OpenAlex results)
     │
     ├─► Deduplicate by DOI
     │
     ├─► Rank by: geographic priority × 1000 + log(citations) × 100 + OA bonus
     │       Jaffna Peninsula → Sri Lanka → South Asia → Global
     │
     ├─► Filter (year / citations / OA / area)
     │
     ├─► Parse abstract → Summary / Key Findings / Methodology / Future Work
     │
     └─► Render (terminal / docx / markdown / json)
```

---

## Geographic Priority

Publications are automatically classified and ranked:

| Priority | Region |
|----------|--------|
| 1 (highest) | Jaffna Peninsula (incl. Vanni, Kilinochchi, Mannar, Mullaitivu) |
| 2 | Sri Lanka / Northern Province |
| 3 | South / South-East Asia |
| 4 | Global |

Detection is automatic from title, abstract, and journal venue text.

---

## Platform Notes

### macOS & Linux
Works out of the box after `npm install -g pubsum`. The `pub` command is added to your PATH automatically.

### Windows
After `npm install -g pubsum`, use `pub` in **Command Prompt**, **PowerShell**, or **Windows Terminal**. npm creates a `.cmd` wrapper automatically — no extra setup needed.

```powershell
pub search "groundwater" --count 5
```

If `pub` is not found after install, ensure npm's global bin is on your PATH:
```powershell
# In PowerShell:
npm config get prefix          # e.g. C:\Users\you\AppData\Roaming\npm
# Add that folder to your PATH in System Environment Variables
```

### Node.js Version

Requires **Node.js ≥ 16**. Check with:
```bash
node --version
```

---

## Development

```bash
git clone https://github.com/s19835/pubsum
cd pubsum
npm install
npm link          # makes `pub` available globally from local source
```

### Module structure

```
bin/
  pub.js              CLI entry point
lib/
  fetch.js            HTTP utility (get, sleep, stripTags, reconstructAbstract)
  study-area.js       Region detection, priority ordering, ANSI/docx colours
  abstract.js         Abstract → structured sections parser
  rank.js             dedupe(), rank(), filter()
  sources/
    openalex.js       OpenAlex API client
    crossref.js       CrossRef API client
  output/
    terminal.js       Rich terminal renderer (banner, spinner, cards, table)
    markdown.js       Markdown renderer
    docx.js           Word .docx renderer (lazy-loads docx package)
```

### Publishing to npm

```bash
npm login
npm publish
```

---

## Homebrew Tap Setup

After publishing to GitHub at `github.com/s19835/pubsum`:

1. Create a new repo: `github.com/s19835/homebrew-pubsum`
2. Copy `homebrew/pubsum.rb` from this repo into `Formula/pubsum.rb` in the new repo
3. Update the `sha256` checksum (run `shasum -a 256 pubsum-1.0.0.tgz` on the npm tarball)
4. Users can then install via:

```bash
brew tap s19835/pubsum
brew install pubsum
```

---

## License

MIT © pubsum contributors
