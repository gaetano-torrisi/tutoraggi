// ════════════════════════════════════════════════════════════════════
//  BUILD — pre-transpilazione JSX → JS (solo per test/)
//  ---------------------------------------------------------------------
//  Concatena i file JSX nello STESSO ordine in cui erano caricati in
//  index.html e li trasforma una sola volta con esbuild (solo JSX →
//  React.createElement, nessun down-level: stessa semantica di
//  @babel/standalone, ma fatto a build-time anziché nel browser).
//
//  Risultato: app.bundle.js  →  un unico <script> al posto dei 7
//  <script type="text/babel"> + il download di @babel/standalone (~1.8MB).
//
//  USO:   node test/build.mjs          (dalla root del repo)
//         oppure  cd test && node build.mjs
//
//  Da rilanciare ogni volta che si modifica un .jsx in test/.
// ════════════════════════════════════════════════════════════════════
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));

// Stesso ordine dei <script type="text/babel"> in index.html.
const FILES = ["icons.jsx", "utils.jsx", "components.jsx", "calendar.jsx", "screens.jsx", "mobile.jsx", "app.jsx"];

// Concatena i sorgenti in un unico modulo virtuale: i file condividono
// variabili a livello globale (non usano import/export), quindi NON si
// può usare --bundle. La concatenazione preserva l'unico scope condiviso,
// identico a com'erano più <script> nella stessa pagina.
const combined = FILES.map(f => `\n/* ===== ${f} ===== */\n` + readFileSync(join(DIR, f), "utf8")).join("\n");

const result = await build({
  stdin: { contents: combined, loader: "jsx", resolveDir: DIR },
  jsx: "transform",                 // classico: React.createElement / React.Fragment
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  bundle: false,                    // nessun bundling: scope globale condiviso preservato
  minify: true,                     // riduce ulteriormente il peso
  target: "es2019",
  legalComments: "none",
  write: false,
  logLevel: "info",
});

const out = result.outputFiles[0].text;
const outPath = join(DIR, "app.bundle.js");
writeFileSync(outPath, out);
console.log(`✓ app.bundle.js scritto (${(out.length / 1024).toFixed(1)} KB) da ${FILES.length} file JSX`);
