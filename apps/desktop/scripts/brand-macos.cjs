const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const APP_NAME = "GraphScope";
const APP_ID = "com.graphscope.desktop";

if (process.platform !== "darwin") process.exit(0);

let electronBin;
try {
  electronBin = require("electron");
} catch {
  process.exit(0);
}

if (typeof electronBin !== "string") process.exit(0);

const plistPath = path.resolve(electronBin, "../../Info.plist");
if (!fs.existsSync(plistPath)) process.exit(0);

function setString(key, value) {
  execFileSync("/usr/bin/plutil", ["-replace", key, "-string", value, plistPath], { stdio: "ignore" });
}

setString("CFBundleName", APP_NAME);
setString("CFBundleDisplayName", APP_NAME);
setString("CFBundleIdentifier", APP_ID);
