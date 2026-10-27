import { rename } from "node:fs/promises";
import { join } from "node:path";

// The client build writes dist/index.html. Leaving it there makes Vercel serve
// the empty shell for `/` before the function can render. The template moves
// next to the SSR bundle, which is outside the static output directory.
const from = join("dist", "index.html");
const to = join("dist-server", "template.html");
await rename(from, to);
