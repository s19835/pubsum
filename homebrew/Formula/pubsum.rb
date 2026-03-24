class Pubsum < Formula
  desc "Search and summarise academic publications from the terminal"
  homepage "https://github.com/s19835/pubsum"
  url "https://registry.npmjs.org/@decoding/pubsum/-/pubsum-1.0.0.tgz"
  sha256 "080115b27e5513eb59242423d9411457c2193bfdbf5a970949d03821e570f630"
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
