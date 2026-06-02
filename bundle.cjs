const fs = require("fs");

const dist = "dist";
let html = fs.readFileSync(dist + "/index.html", "utf8");

const assets = fs.readdirSync(dist + "/assets");
const cssFile = assets.find((f) => f.endsWith(".css"));
const jsFile  = assets.find((f) => f.endsWith(".js"));

const css = fs.readFileSync(dist + "/assets/" + cssFile, "utf8");

// Escape </script> so the HTML parser never closes the tag prematurely.
const js = fs.readFileSync(dist + "/assets/" + jsFile, "utf8")
  .split("</script>").join("<\\/script>")
  .split("</Script>").join("<\\/Script>")
  .split("</SCRIPT>").join("<\\/SCRIPT>");

// Replace ONLY the local /assets/ CSS link — not Google Fonts or any external link.
html = html.replace(
  /<link[^>]+href=["']\/assets\/[^"']+\.css["'][^>]*>/gi,
  () => "<style>" + css + "</style>"
);

// Replace the JS module script (src="/assets/...")
html = html.replace(
  /<script[^>]+src=["']\/assets\/[^"']+\.js["'][^>]*><\/script>/gi,
  () => '<script type="module">' + js + "</script>"
);

fs.writeFileSync("accel-detection-feed-review.html", html);

const raw = fs.readFileSync("accel-detection-feed-review.html", "utf8");
const kb = (raw.length / 1024).toFixed(0);
const scriptCloseCount = (raw.match(/<\/script>/gi) || []).length;
// Count <style> blocks outside of <script> elements (JS bundles can contain HTML strings)
const htmlMinusScripts = raw.replace(/<script[\s\S]*?<\/script>/gi, "");
const styleCount       = (htmlMinusScripts.match(/<style>/gi) || []).length;
const hasFonts  = raw.includes("fonts.googleapis.com");
const hasRoot   = raw.includes('<div id="root">');

console.log("Size:", kb, "KB");
console.log("</script> tags:", scriptCloseCount, "(want 2: anti-FOUC + bundle)");
console.log("<style> blocks:", styleCount, "(want 1)");
console.log("Google Fonts kept:", hasFonts);
console.log("<div id=root>:", hasRoot);
console.log(styleCount === 1 && scriptCloseCount === 2 ? "✓ Correct" : "✗ Check output");
