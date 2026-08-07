cask "graphscope" do
  version "0.1.0"
  sha256 :no_check

  url "https://github.com/graphscope/graphscope/releases/download/v#{version}/GraphScope-#{version}-mac.dmg"
  name "GraphScope"
  desc "Open source Postman for GraphQL on macOS"
  homepage "https://github.com/graphscope/graphscope"

  depends_on macos: ">= :monterey"

  app "GraphScope.app"

  zap trash: [
    "~/Library/Application Support/GraphScope",
  ]
end
