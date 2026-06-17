/**
 * Load key=value pairs from .env into process.env (does not override existing env).
 */
var fs = require("fs");
var path = require("path");

module.exports = function loadDotenv() {
  var envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  var text = fs.readFileSync(envPath, "utf8");
  text.split(/\r?\n/).forEach(function (line) {
    var trimmed = String(line || "").trim();
    if (!trimmed || trimmed.charAt(0) === "#") return;
    var eq = trimmed.indexOf("=");
    if (eq <= 0) return;
    var key = trimmed.slice(0, eq).trim();
    var val = trimmed.slice(eq + 1).trim();
    if (
      (val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') ||
      (val.charAt(0) === "'" && val.charAt(val.length - 1) === "'")
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  });
};
