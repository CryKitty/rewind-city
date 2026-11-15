import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFile(path.join(root, "source", name), "utf8");
const readable = process.argv.includes("--readable");
let html = await read("shell.html"),
  css = await read("style.css");
let js = (
  await Promise.all(
    ["renderer.js", "world.js", "audio.js", "main.js"].map(read),
  )
).join("\n");
// Conservative minification: remove full-line comments and indentation only.
// This preserves shader strings and JavaScript semantics without dependencies.
if (!readable) {
  js = js
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .map((line) => line.trim())
    .join("\n");
  css = css.replace(/\s+/g, " ");
}
html = html.replace("/* STYLE */", css).replace("/* SCRIPT */", js);
await writeFile(path.join(root, "index.html"), html);
console.log(
  `Built index.html (${Buffer.byteLength(html).toLocaleString()} bytes; ${readable ? "readable" : "compact"})`,
);
