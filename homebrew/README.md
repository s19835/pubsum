# pubsum Homebrew Tap

This directory contains the Homebrew formula for `pubsum`.

## How to publish this tap

1. **Create the tap repository** on GitHub:
   ```
   github.com/s19835/homebrew-pubsum
   ```

2. **Copy the formula** into the tap repo:
   ```bash
   mkdir -p Formula
   cp Formula/pubsum.rb Formula/pubsum.rb
   ```

3. **Publish `pubsum` to npm first** (`npm publish` from the `pub-cli/` directory).
   Then download the tarball and get its SHA256:
   ```bash
   # Download the tarball npm just published
   curl -o pubsum-1.0.0.tgz "$(npm view pubsum dist.tarball)"

   # Get the SHA256
   shasum -a 256 pubsum-1.0.0.tgz
   ```

4. **Paste the SHA256** into `Formula/pubsum.rb` where it says `REPLACE_WITH_ACTUAL_SHA256...`.

5. **Push** the tap repo to GitHub.

6. **Test locally** before announcing:
   ```bash
   brew tap s19835/pubsum
   brew install pubsum
   pub help
   ```

## Users install with

```bash
brew tap s19835/pubsum
brew install pubsum
```

## Updating the formula for a new version

```bash
# 1. Bump version in package.json, then publish:
npm version patch   # or minor / major
npm publish

# 2. Get new tarball URL and SHA256:
curl -o pubsum-NEW_VERSION.tgz "$(npm view pubsum dist.tarball)"
shasum -a 256 pubsum-NEW_VERSION.tgz

# 3. Update Formula/pubsum.rb: url and sha256 fields.

# 4. Push to the homebrew-pubsum repo.
# Homebrew users get the update on next `brew update && brew upgrade`.
```
