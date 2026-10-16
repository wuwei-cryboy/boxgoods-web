const fs = require("fs");
const path = require("path");

const SRC = "D:/小商品图片合集/已压缩";
const DEST = "C:/Users/Administrator/Documents/Codex/mobile-b2b/next-b2b/public/img";

const catalogRaw = fs.readFileSync(path.join(__dirname, "lib/data/catalog.json"), "utf8");
const refs = [...new Set(catalogRaw.match(/public\/img\/[^\s"'"]+/g) || [])];
const destFiles = new Set(refs.map(r => r.replace("public/img/", "")));

let copied = 0;
let unmatched = 0;

function processDir(dirName) {
    const dirPath = path.join(SRC, dirName);
    const files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith(".webp"));
    files.sort((a, b) => {
        const numA = parseInt(a.replace(/\.webp$/i, ""), 10) || 0;
        const numB = parseInt(b.replace(/\.webp$/i, ""), 10) || 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
    });

    files.forEach((f, i) => {
        const isMain = i === 0;
        const variantName = isMain ? "main" : "t" + String(i).padStart(2, "0");
        const destRel = dirName + "/" + variantName + ".webp";
        const destFile = path.join(DEST, dirName, variantName + ".webp");

        if (destFiles.has(destRel)) {
            fs.mkdirSync(path.dirname(destFile), { recursive: true });
            fs.copyFileSync(path.join(dirPath, f), destFile);
            copied++;
        } else {
            unmatched++;
        }
    });
}

const dirs = fs.readdirSync(SRC).filter(n => fs.statSync(path.join(SRC, n)).isDirectory());
dirs.forEach(processDir);

console.log("COPIED", copied);
console.log("UNMATCHED", unmatched);
console.log("EXPECTED_DEST_COUNT", destFiles.size);
