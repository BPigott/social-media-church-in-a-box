// Minimal static server with HTTP Range support (needed for in-browser video seeking).
// Serves the out/ directory. Run: node scripts/serve.cjs [port]
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.argv[2] || 4321);
const ROOT = path.resolve(__dirname, "..", "out");
const TYPES = { ".mp4": "video/mp4", ".png": "image/png", ".html": "text/html" };

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<title>ivangel onboarding video</title>
<style>body{margin:0;background:#3a352f;display:flex;min-height:100vh;align-items:center;
justify-content:center;font-family:-apple-system,sans-serif}video{max-width:92vw;max-height:88vh;
border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)}</style></head>
<body><video src="/onboarding.mp4" controls autoplay></video></body></html>`;

http
  .createServer((req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(PAGE);
    }
    const file = path.join(ROOT, path.basename(req.url.split("?")[0]));
    fs.stat(file, (err, stat) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      const type = TYPES[path.extname(file)] || "application/octet-stream";
      const range = req.headers.range;
      if (range) {
        const [s, e] = range.replace("bytes=", "").split("-");
        const start = parseInt(s, 10);
        const end = e ? parseInt(e, 10) : stat.size - 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
          "Content-Type": type,
          "Cache-Control": "no-store",
        });
        fs.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { "Content-Length": stat.size, "Content-Type": type, "Cache-Control": "no-store" });
        fs.createReadStream(file).pipe(res);
      }
    });
  })
  .listen(PORT, () => console.log(`▶  http://localhost:${PORT}/  (serving ${ROOT})`));
