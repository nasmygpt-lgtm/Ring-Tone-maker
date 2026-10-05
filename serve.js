// Zero-dependency static server with SPA fallback.
// Usage: node serve.js [port]
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".map": "application/json",
};

async function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    // prevent path traversal
    let filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden");

    let st;
    try { st = await stat(filePath); } catch { st = null; }

    if (st && st.isDirectory()) { filePath = join(filePath, "index.html"); st = await stat(filePath).catch(() => null); }

    if (!st) {
      // SPA fallback: serve index.html for client routes (no file extension)
      if (!extname(urlPath)) {
        const html = await readFile(join(ROOT, "index.html"));
        return send(res, 200, html, { "Content-Type": MIME[".html"] });
      }
      return send(res, 404, "Not found");
    }

    const type = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    createReadStream(filePath).pipe(res);
  } catch (e) {
    send(res, 500, "Server error: " + e.message);
  }
});

server.listen(PORT, () => {
  console.log(`Ringtone Maker running at http://localhost:${PORT}`);
});
