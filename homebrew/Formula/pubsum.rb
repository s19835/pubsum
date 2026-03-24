class Pubsum < Formula
  desc "Search and summarise academic publications from the terminal"
  homepage "https://github.com/s19835/pubsum"
  url "https://registry.npmjs.org/pubsum/-/pubsum-1.0.0.tgz"
  # Run `shasum -a 256 pubsum-1.0.0.tgz` on the downloaded tarball and paste here:
  # This sha256 is from the LOCAL build — re-generate after `npm publish`:
  #   curl -o pubsum-1.0.0.tgz "$(npm view pubsum dist.tarball)"
  #   shasum -a 256 pubsum-1.0.0.tgz
  sha256 "2f0dbec1239287a15064c02025f9246ef72dca5cbff15ba2324978b96f6dc5f5"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    output = shell_output("#{bin}/pub help")
    assert_match "pub  —  Academic Publication Summariser", output
  end
end
