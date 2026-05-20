var http = require("http");
var https = require("https");

function resolveTimeoutMs(opts) {
  if (opts && opts.timeoutMs != null) {
    var t = Number(opts.timeoutMs);
    if (Number.isFinite(t) && t >= 1000) return t;
  }
  var fromEnv = parseInt(process.env.MARG_HTTP_TIMEOUT_MS || "", 10);
  if (Number.isFinite(fromEnv) && fromEnv >= 1000) return fromEnv;
  /* Detect + plans on Marg can exceed 15s (multiple Kwik calls + DB). */
  return 120000;
}

function requestModuleForUrl(urlStr) {
  var protocol = new URL(urlStr).protocol;
  if (protocol === "http:") return http;
  if (protocol === "https:") return https;
  throw new Error('Unsupported URL protocol "' + protocol + '"; use http: or https:');
}

function defaultPortForUrl(url) {
  if (url.port) return url.port;
  return url.protocol === "https:" ? 443 : 80;
}

/**
 * POST JSON to an HTTP(S) endpoint; resolves with parsed body on 2xx, rejects otherwise.
 * @param {string} urlStr
 * @param {object} payload
 * @param {{ headers?: Record<string, string>, timeoutMs?: number }} [opts]
 */
function postJsonHttps(urlStr, payload, opts) {
  opts = opts || {};
  var timeoutMs = resolveTimeoutMs(opts);
  var extra = opts.headers && typeof opts.headers === "object" ? opts.headers : {};
  return new Promise(function (resolve, reject) {
    var url = new URL(urlStr);
    var body = JSON.stringify(payload || {});
    var headers = Object.assign(
      {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Accept: "application/json, */*",
      },
      extra,
    );
    var transport = requestModuleForUrl(urlStr);
    var req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: defaultPortForUrl(url),
        path: url.pathname + (url.search || ""),
        method: "POST",
        headers: headers,
      },
      function (res) {
        var data = "";
        res.on("data", function (chunk) {
          data += chunk;
        });
        res.on("end", function () {
          var parsed = {};
          try {
            parsed = data ? JSON.parse(data) : {};
          } catch (e) {
            return reject(new Error("Invalid JSON from upstream."));
          }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            var msg =
              (parsed &&
                (parsed.message ||
                  (parsed.error && parsed.error.message) ||
                  parsed.error)) ||
              "HTTP " + res.statusCode;
            return reject(new Error(String(msg)));
          }
          resolve(parsed);
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, function () {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.write(body);
    req.end();
  });
}

function fetchJsonHttps(urlStr, opts) {
  opts = opts || {};
  var timeoutMs = resolveTimeoutMs(opts);
  return new Promise(function (resolve, reject) {
    var url = new URL(urlStr);
    var transport = requestModuleForUrl(urlStr);
    var req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: defaultPortForUrl(url),
        path: url.pathname + (url.search || ""),
        method: "GET",
        headers: { Accept: "application/json" },
      },
      function (res) {
        var data = "";
        res.on("data", function (chunk) {
          data += chunk;
        });
        res.on("end", function () {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error("HTTP " + res.statusCode));
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, function () {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

module.exports = {
  fetchJsonHttps: fetchJsonHttps,
  postJsonHttps: postJsonHttps,
};
