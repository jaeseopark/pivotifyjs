import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

export function loadHtml(htmlFile: string) {
    const htmlPath = path.resolve(
        fileURLToPath(import.meta.url),
        `../../test/data/${htmlFile}`
    );
    const html = fs.readFileSync(htmlPath, "utf8");
    document.body.innerHTML = html;

    return document;
}

export function loadTableFromHtml(htmlFile: string) {
    loadHtml(htmlFile);
    return document.querySelector("table") as HTMLTableElement;
}

export function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
}
